const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const {
  getQPayToken,
  checkQPayPayment,
  applyPaidInvoice,
} = require("./installmentShared");

/**
 * installmentCallback
 * -------------------
 * QPay calls this URL after the user pays an installment invoice. The URL
 * is configured per-invoice (createInstallmentPayment sets it) and includes
 * `purchase_id` + `day_no` as query parameters. The function:
 *
 *  1. Looks up the still-pending invoices for (purchase_id, day_no)
 *  2. Calls QPay payment/check on each until one comes back PAID
 *  3. On PAID: atomically credits the invoice's day_count days after the
 *     current paid_days (paid_amount += the days credited, appends payment
 *     records, optionally marks the purchase as `completed`) and marks that
 *     pending invoice `processed` in the same transaction.
 *
 * Idempotent: re-invocations for an already-processed invoice are no-ops.
 * Days are credited by COUNT, not "up to day_no", so paying two overlapping
 * QRs credits both payments.
 */
exports.installmentCallback = onRequest({
  region: "asia-northeast1",
  memory: "512MiB",
  timeoutSeconds: 120,
}, async (req, res) => {
  const db = admin.firestore();
  const purchaseId = req.query && req.query.purchase_id;
  const dayNoRaw = req.query && req.query.day_no;
  const dayNo = parseInt(dayNoRaw, 10);

  logger.info("📥 Installment callback received", {
    method: req.method,
    purchaseId,
    dayNoRaw,
    body: req.body,
  });

  if (!purchaseId || !Number.isFinite(dayNo) || dayNo < 1) {
    logger.error("Missing or invalid purchase_id/day_no", {
      purchaseId,
      dayNoRaw,
    });
    return res
      .status(400)
      .json({ error: "Missing or invalid purchase_id/day_no" });
  }

  try {
    // Find the pending invoices for this purchase + day.
    //
    // ЧУХАЛ: энэ хайлт өмнө нь `limit(1)`-тэй, төлвийн шүүлтгүй байсан. Нэг
    // (purchase_id, day_no) хосон дээр олон нэхэмжлэх үүсэх нь энгийн үзэгдэл
    // (өгөгдөл дээр 87 давхардал, 76 нь processed+pending холимог) — хуучин
    // боловсруулагдсан баримт эхэлж таарвал түүний нэхэмжлэхийг шалгаад
    // "төлөгдөөгүй" гэж дүгнэн, бодит төлбөрийг чимээгүй алддаг байв.
    const pendingSnap = await db
      .collection("pending_invoices")
      .where("purchase_id", "==", purchaseId)
      .where("day_no", "==", dayNo)
      .where("type", "==", "installment")
      .get();

    if (pendingSnap.empty) {
      logger.error("No pending installment invoice found", {
        purchaseId,
        dayNo,
      });
      return res
        .status(404)
        .json({ error: "Pending installment invoice not found" });
    }

    // Зөвхөн хүлээгдэж буйг нь авч, хамгийн сүүлд үүссэнээс нь эхэлж үзнэ
    // (хэрэглэгчийн хамгийн сүүлд нээсэн QR).
    const candidates = pendingSnap.docs
      .filter((d) => (d.data() || {}).status === "pending")
      .sort((a, b) => {
        const ta = (a.data().createdAt && a.data().createdAt.toMillis()) || 0;
        const tb = (b.data().createdAt && b.data().createdAt.toMillis()) || 0;
        return tb - ta;
      });

    if (candidates.length === 0) {
      // Бүгд боловсруулагдсан — QPay давтан дуудсан байна. Идемпотент хариу.
      logger.info("Installment day already credited — idempotent ack", {
        purchaseId,
        dayNo,
      });
      return res.status(200).json({
        success: true,
        message: "Already processed",
        purchase_id: purchaseId,
        day_no: dayNo,
      });
    }

    // Verify payment status with QPay. Олон нэр дэвшигч байвал төлөгдсөнийг нь
    // олох хүртэл нэг нэгээр шалгана — аль нэг нь төлөгдсөн байхад бусдад нь
    // "төлөгдөөгүй" гэж дүгнэхгүй.
    const token = await getQPayToken();
    let pendingDoc = null;
    let invoiceId = null;
    let paymentStatus = null;

    for (const candidate of candidates) {
      const data = candidate.data() || {};
      const status = await checkQPayPayment(data.invoice_id, token);
      logger.info("QPay payment status", {
        invoiceId: data.invoice_id,
        paymentStatus: status,
      });
      if (status === "PAID") {
        pendingDoc = candidate;
        invoiceId = data.invoice_id;
        paymentStatus = status;
        break;
      }
      if (paymentStatus === null) {
        // Хариу буцаах зорилгоор эхний нэхэмжлэхийн мэдээллийг санана.
        invoiceId = data.invoice_id;
        paymentStatus = status;
      }
    }

    if (!pendingDoc) {
      // Not paid yet — leave as pending so QPay can call us again later
      return res.status(200).json({
        success: true,
        message: "Payment not completed yet",
        paymentStatus,
        invoice_id: invoiceId,
      });
    }

    // Нэхэмжлэхийн day_count хоногийг paid_days-ийн дараагаас нэмж, нэхэмжлэхийг
    // нэг транзакцид processed болгоно (давхцсан QR хоёуланг нь төлсөн ч
    // мөнгө алдагдахгүй; давтан дуудлага идемпотент).
    const result = await applyPaidInvoice(db, pendingDoc.ref);

    logger.info("✅ Installment payment recorded", {
      purchaseId,
      dayNo,
      invoiceId,
      result,
    });

    return res.status(200).json({
      success: true,
      message: "Installment day credited",
      purchase_id: purchaseId,
      day_no: dayNo,
      invoice_id: invoiceId,
      result,
    });
  } catch (err) {
    logger.error("❌ Installment callback failed", {
      error: err.message,
      stack: err.stack,
      purchaseId,
      dayNo,
    });
    try {
      await db.collection("payment_callback_errors").add({
        type: "installment",
        purchase_id: purchaseId,
        day_no: dayNo,
        error: err.message,
        errorStack: err.stack,
        requestData: {
          method: req.method,
          query: req.query,
          body: req.body,
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        resolved: false,
      });
    } catch (saveErr) {
      logger.error("Failed to save callback error", { error: saveErr.message });
    }
    return res.status(500).json({ error: err.message });
  }
});
