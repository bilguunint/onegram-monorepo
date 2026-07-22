const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const {
  getQPayToken,
  checkQPayPayment,
  recordTreeOrderPaid,
} = require("./treeOrderShared");

/**
 * treeOrderCallback
 * -----------------
 * QPay calls this after the buyer pays a tree-planting invoice. The URL is
 * `?pending_id={X}` referencing the reserved pending_invoices doc. The app
 * also pings it while waiting (self-heal), and the scheduled backstop reuses
 * the same crediting logic via treeOrderShared.
 *
 * Idempotent: re-invocations after a successful run no-op.
 */
exports.treeOrderCallback = onRequest({
  region: "asia-northeast1",
  memory: "512MiB",
  timeoutSeconds: 120,
}, async (req, res) => {
  const db = admin.firestore();
  const pendingId = req.query && req.query.pending_id;

  logger.info("📥 Tree order callback received", {
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
    if (pendingData.type !== "tree_order") {
      return res.status(409).json({ error: "Not a tree_order invoice" });
    }

    const invoiceId = pendingData.invoice_id;

    // Idempotent: already created.
    if (pendingData.status === "processed" && pendingData.tree_order_id) {
      return res.status(200).json({
        success: true,
        message: "Already processed",
        tree_order_id: pendingData.tree_order_id,
      });
    }

    // Verify with QPay.
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

    const { orderId } = await recordTreeOrderPaid(db, pendingRef, pendingData);

    logger.info("✅ Tree order recorded", {
      pendingId,
      invoiceId,
      tree_order_id: orderId,
    });

    return res.status(200).json({
      success: true,
      message: "Tree order completed",
      pending_id: pendingId,
      tree_order_id: orderId,
    });
  } catch (err) {
    logger.error("❌ Tree order callback failed", {
      error: err.message,
      stack: err.stack,
      pendingId,
    });
    try {
      await db.collection("payment_callback_errors").add({
        type: "tree_order",
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
