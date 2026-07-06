const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const {
  getQPayToken,
  checkQPayPayment,
  applyPaidUpToDay,
} = require("./installmentShared");

/**
 * installmentCallback
 * -------------------
 * QPay calls this URL after the user pays an installment invoice. The URL
 * is configured per-invoice (createInstallmentPayment sets it) and includes
 * `purchase_id` + `month_no` as query parameters. The function:
 *
 *  1. Looks up the pending invoice by (purchase_id, month_no)
 *  2. Calls QPay payment/check to verify the payment status
 *  3. On PAID: atomically updates the purchase doc (paid_months++,
 *     paid_amount+=monthly, appends payment record, optionally marks the
 *     purchase as `completed`)
 *  4. Marks the pending invoice as `processed`
 *
 * Idempotent: re-invocations for already-processed months are no-ops.
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
    // Find the pending invoice for this purchase + day.
    const pendingSnap = await db
      .collection("pending_invoices")
      .where("purchase_id", "==", purchaseId)
      .where("day_no", "==", dayNo)
      .where("type", "==", "installment")
      .limit(1)
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

    const pendingDoc = pendingSnap.docs[0];
    const pendingData = pendingDoc.data() || {};
    const invoiceId = pendingData.invoice_id;

    // Verify payment status with QPay
    const token = await getQPayToken();
    const paymentStatus = await checkQPayPayment(invoiceId, token);
    logger.info("QPay payment status", { invoiceId, paymentStatus });

    if (paymentStatus !== "PAID") {
      // Not paid yet — leave as pending so QPay can call us again later
      return res.status(200).json({
        success: true,
        message: "Payment not completed yet",
        paymentStatus,
        invoice_id: invoiceId,
      });
    }

    // Credit every day up to dayNo (single day, or a multi-day bundle whose
    // callback URL carries the bundle's last day) — idempotent.
    const result = await applyPaidUpToDay(db, purchaseId, dayNo);

    // Mark the pending invoice as processed (also idempotent)
    await pendingDoc.ref.update({
      status: "processed",
      paid_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

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
