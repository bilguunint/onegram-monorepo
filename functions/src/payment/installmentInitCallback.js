const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const {
  getQPayToken,
  checkQPayPayment,
  createPurchaseFromInit,
} = require("./installmentShared");

/**
 * installmentInitCallback
 * -----------------------
 * QPay calls this URL after the user pays the FIRST month of a brand-new
 * installment plan. Until this callback runs the `product_purchases` doc
 * does not exist — this prevents "test" / abandoned plans from polluting
 * the dataset.
 *
 * On a PAID confirmation it atomically:
 *   1. Creates the `product_purchases` doc with status="active", months=N,
 *      paid_months=1, paid_amount=monthly_payment, and the first month's
 *      payment record
 *   2. Computes next_due_date = started_at + 1 month
 *   3. Marks the `pending_invoices` doc as processed and stores
 *      `purchase_id` for cross-reference
 *
 * Idempotent: re-invocations after a successful run no-op.
 */
exports.installmentInitCallback = onRequest({
  region: "asia-northeast1",
  memory: "512MiB",
  timeoutSeconds: 120,
}, async (req, res) => {
  const db = admin.firestore();
  const pendingId = req.query && req.query.pending_id;

  logger.info("📥 Installment-init callback received", {
    method: req.method,
    pendingId,
    body: req.body,
  });

  if (!pendingId) {
    logger.error("Missing pending_id");
    return res.status(400).json({ error: "Missing pending_id" });
  }

  try {
    const pendingRef = db.collection("pending_invoices").doc(pendingId);
    const pendingSnap = await pendingRef.get();
    if (!pendingSnap.exists) {
      logger.error("Pending invoice not found", { pendingId });
      return res.status(404).json({ error: "Pending invoice not found" });
    }
    const pendingData = pendingSnap.data() || {};
    if (pendingData.type !== "installment_init") {
      return res
        .status(409)
        .json({ error: "Not an installment_init invoice" });
    }

    const invoiceId = pendingData.invoice_id;

    // Idempotent: if we've already created the purchase, just acknowledge.
    if (pendingData.status === "processed" && pendingData.purchase_id) {
      logger.info("Already processed — idempotent skip", {
        pendingId,
        purchase_id: pendingData.purchase_id,
      });
      return res.status(200).json({
        success: true,
        message: "Already processed",
        purchase_id: pendingData.purchase_id,
      });
    }

    // Verify payment status with QPay
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

    // Create the product_purchases doc + mark pending processed (atomic,
    // idempotent — shared with the auto-verify cron).
    const { purchaseId } = await createPurchaseFromInit(
      db,
      pendingRef,
      pendingData,
    );

    logger.info("✅ Installment plan created on first payment", {
      pendingId,
      invoiceId,
      purchase_id: purchaseId,
    });

    return res.status(200).json({
      success: true,
      message: "Installment started",
      pending_id: pendingId,
      invoice_id: invoiceId,
      purchase_id: purchaseId,
    });
  } catch (err) {
    logger.error("❌ Installment-init callback failed", {
      error: err.message,
      stack: err.stack,
      pendingId,
    });
    try {
      await db.collection("payment_callback_errors").add({
        type: "installment_init",
        pending_id: pendingId,
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
