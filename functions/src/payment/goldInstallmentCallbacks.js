/**
 * Алтан эдлэлийн хуваан төлөлтийн QPay callback-ууд.
 *   goldInstallmentInitCallback ?pending_id=   — эхний төлбөр → purchase үүснэ
 *   goldInstallmentCallback     ?purchase_id=  — дараагийн төлбөр → грамм нэмэгдэнэ
 * Хоёулаа QPay-аас PAID гэдгийг давхар шалгаж, идемпотент ажиллана.
 * Аюулгүйн тор: autoVerifyInstallments мөн эдгээр төрлийг sweep хийнэ.
 */
const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const { getQPayToken, checkQPayPayment } = require("./installmentShared");
const G = require("./goldInstallmentShared");

const opts = { region: "asia-northeast1", memory: "512MiB", timeoutSeconds: 120 };

async function logCallbackError(db, type, req, err, extra) {
  try {
    await db.collection("payment_callback_errors").add({
      type,
      ...extra,
      error: err.message,
      errorStack: err.stack,
      requestData: { method: req.method, query: req.query, body: req.body },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      resolved: false,
    });
  } catch (e) {
    logger.error("Failed to save callback error", { error: e.message });
  }
}

exports.goldInstallmentInitCallback = onRequest(opts, async (req, res) => {
  const db = admin.firestore();
  const pendingId = req.query && req.query.pending_id;
  logger.info("📥 Gold installment init callback", { pendingId, body: req.body });
  if (!pendingId) return res.status(400).json({ error: "Missing pending_id" });
  try {
    const pendingRef = db.collection("pending_invoices").doc(pendingId);
    const snap = await pendingRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Pending invoice not found" });
    const data = snap.data() || {};
    if (data.type !== G.INVOICE_TYPE_INIT) return res.status(409).json({ error: "Wrong invoice type" });
    if (data.status === "processed" && data.purchase_id) {
      return res.status(200).json({ success: true, message: "Already processed", purchase_id: data.purchase_id });
    }
    const status = await checkQPayPayment(data.invoice_id, await getQPayToken());
    if (status !== "PAID") {
      return res.status(200).json({ success: true, message: "Payment not completed yet", paymentStatus: status });
    }
    const { purchaseId } = await G.createGoldPurchaseFromInit(db, pendingRef, data);
    logger.info("✅ Gold installment started", { pendingId, purchaseId });
    return res.status(200).json({ success: true, purchase_id: purchaseId });
  } catch (err) {
    logger.error("❌ Gold installment init callback failed", { error: err.message, pendingId });
    await logCallbackError(db, G.INVOICE_TYPE_INIT, req, err, { pending_id: pendingId });
    return res.status(500).json({ error: err.message });
  }
});

exports.goldInstallmentCallback = onRequest(opts, async (req, res) => {
  const db = admin.firestore();
  const purchaseId = req.query && req.query.purchase_id;
  logger.info("📥 Gold installment callback", { purchaseId, body: req.body });
  if (!purchaseId) return res.status(400).json({ error: "Missing purchase_id" });
  try {
    // Энэ purchase-ийн ХҮЛЭЭГДЭЖ БУЙ нэхэмжлэхүүдийг сүүлд үүссэнээс нь эхэлж
    // шалгаж, PAID болсон бүрийг бүртгэнэ (хэрэглэгч хэд хэдэн QR нээж бүгдийг
    // төлсөн ч алдагдахгүй).
    const pendingSnap = await db.collection("pending_invoices")
      .where("purchase_id", "==", purchaseId)
      .where("type", "==", G.INVOICE_TYPE)
      .where("status", "==", "pending")
      .get();
    if (pendingSnap.empty) {
      return res.status(200).json({ success: true, message: "No pending invoices" });
    }
    const token = await getQPayToken();
    const docs = pendingSnap.docs.sort((a, b) =>
      ((b.data().createdAt && b.data().createdAt.toMillis()) || 0) -
      ((a.data().createdAt && a.data().createdAt.toMillis()) || 0));
    const results = [];
    for (const d of docs) {
      const status = await checkQPayPayment(d.data().invoice_id, token);
      if (status !== "PAID") continue;
      results.push({ invoice_id: d.data().invoice_id, ...(await G.applyPaidGoldInvoice(db, d.ref)) });
    }
    logger.info("✅ Gold installment callback done", { purchaseId, credited: results.length });
    return res.status(200).json({ success: true, credited: results });
  } catch (err) {
    logger.error("❌ Gold installment callback failed", { error: err.message, purchaseId });
    await logCallbackError(db, G.INVOICE_TYPE, req, err, { purchase_id: purchaseId });
    return res.status(500).json({ error: err.message });
  }
});
