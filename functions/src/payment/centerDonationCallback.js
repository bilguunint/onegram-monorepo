const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const {
  getQPayToken,
  checkQPayPayment,
  recordCenterDonationPaid,
} = require("./centerDonationShared");

/**
 * centerDonationCallback
 * ----------------------
 * QPay calls this after the buyer pays a center-donation invoice. The URL is
 * `?pending_id={X}` referencing the reserved pending_invoices doc. The app
 * also pings it while waiting (self-heal) and the scheduled backstop reuses the
 * same crediting logic via centerDonationShared.
 *
 *  1. Looks up pending_invoices/{pending_id} (type "center_donation")
 *  2. Verifies via QPay payment/check that the invoice is PAID
 *  3. Records the donation (idempotent) — see recordCenterDonationPaid
 *
 * Idempotent: re-invocations after a successful run no-op.
 */
exports.centerDonationCallback = onRequest({
  region: "asia-northeast1",
  memory: "512MiB",
  timeoutSeconds: 120,
}, async (req, res) => {
  const db = admin.firestore();
  const pendingId = req.query && req.query.pending_id;

  logger.info("📥 Center donation callback received", {
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
    if (pendingData.type !== "center_donation") {
      return res.status(409).json({ error: "Not a center_donation invoice" });
    }

    const invoiceId = pendingData.invoice_id;

    // Idempotent: already created.
    if (pendingData.status === "processed" && pendingData.donation_id) {
      return res.status(200).json({
        success: true,
        message: "Already processed",
        donation_id: pendingData.donation_id,
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

    const { donationId } = await recordCenterDonationPaid(
      db,
      pendingRef,
      pendingData,
    );

    logger.info("✅ Center donation recorded", {
      pendingId,
      invoiceId,
      donation_id: donationId,
    });

    return res.status(200).json({
      success: true,
      message: "Center donation completed",
      pending_id: pendingId,
      donation_id: donationId,
    });
  } catch (err) {
    logger.error("❌ Center donation callback failed", {
      error: err.message,
      stack: err.stack,
      pendingId,
    });
    try {
      await db.collection("payment_callback_errors").add({
        type: "center_donation",
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
