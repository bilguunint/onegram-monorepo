const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const {
  getQPayToken,
  checkQPayPayment,
  recordShuteenOrderPaid,
} = require("./shuteenShared");

/**
 * shuteenOrderCallback
 * --------------------
 * QPay нэгжийн invoice төлөгдсөний дараа дуудна (`?pending_id=X`).
 * Апп хүлээж байхдаа мөн энэ URL-ийг 5 секунд тутам дуудна (self-heal),
 * scheduled backstop ижил бүртгэлийн логикийг shuteenShared-аас ашиглана.
 *
 * Idempotent: нэг удаа амжилттай ажилласны дараа дахин дуудахад no-op.
 */
exports.shuteenOrderCallback = onRequest({
  region: "asia-northeast1",
  memory: "512MiB",
  timeoutSeconds: 120,
}, async (req, res) => {
  const db = admin.firestore();
  const pendingId = req.query && req.query.pending_id;

  logger.info("📥 Shuteen order callback received", {
    method: req.method,
    pendingId,
  });

  if (!pendingId) {
    return res.status(400).json({ error: "Missing pending_id" });
  }

  try {
    const pendingRef = db.collection("pending_invoices").doc(pendingId);
    const pendingSnap = await pendingRef.get();
    if (!pendingSnap.exists) {
      return res.status(404).json({ error: "Pending invoice not found" });
    }
    const pendingData = pendingSnap.data() || {};
    if (pendingData.type !== "shuteen_order") {
      return res.status(409).json({ error: "Not a shuteen_order invoice" });
    }

    const invoiceId = pendingData.invoice_id;

    if (pendingData.status === "processed" && pendingData.shuteen_order_id) {
      return res.status(200).json({
        success: true,
        message: "Already processed",
        shuteen_order_id: pendingData.shuteen_order_id,
      });
    }

    const token = await getQPayToken();
    const paymentStatus = await checkQPayPayment(invoiceId, token);
    logger.info("QPay payment status", { invoiceId, paymentStatus });

    if (paymentStatus !== "PAID") {
      return res.status(200).json({
        success: true,
        message: "Payment not completed yet",
        paymentStatus,
        invoice_id: invoiceId,
      });
    }

    const { orderId } = await recordShuteenOrderPaid(db, pendingRef, pendingData);

    logger.info("✅ Shuteen order recorded", {
      pendingId,
      invoiceId,
      shuteen_order_id: orderId,
    });

    return res.status(200).json({
      success: true,
      message: "Shuteen order completed",
      pending_id: pendingId,
      shuteen_order_id: orderId,
    });
  } catch (err) {
    logger.error("❌ Shuteen order callback failed", {
      error: err.message,
      stack: err.stack,
      pendingId,
    });
    try {
      await db.collection("payment_callback_errors").add({
        type: "shuteen_order",
        pending_id: pendingId,
        error: err.message,
        errorStack: err.stack,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        resolved: false,
      });
    } catch (saveErr) {
      logger.error("Failed to save callback error", { error: saveErr.message });
    }
    return res.status(500).json({ error: err.message });
  }
});
