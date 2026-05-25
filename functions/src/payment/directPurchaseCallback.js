const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

const QPAY_USERNAME = "ONE_GRAM_GOLD";
const QPAY_PASSWORD = "zElO7j40";

function generatePickupCode() {
  return Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
}

// Fetch a fresh QPay access token.
async function getQPayToken() {
  const resp = await axios.post(
    "https://merchant.qpay.mn/v2/auth/token",
    {},
    {
      auth: { username: QPAY_USERNAME, password: QPAY_PASSWORD },
      timeout: 10000,
    },
  );
  return resp.data.access_token;
}

// Call QPay payment/check with retries. Returns the QPay payment status
// string (e.g. "PAID") or null when no payment record exists.
async function checkQPayPayment(invoiceId, token, attempts = 5) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const resp = await axios.post(
        "https://merchant.qpay.mn/v2/payment/check",
        { object_type: "INVOICE", object_id: invoiceId },
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      );
      const rows = resp.data && resp.data.rows;
      if (rows && rows.length > 0) {
        return rows[0].payment_status;
      }
      logger.warn("QPay returned no rows", { invoiceId, attempt: i });
    } catch (err) {
      logger.error("QPay payment/check failed", {
        invoiceId,
        attempt: i,
        message: err.message,
      });
    }
    if (i < attempts) {
      const waitMs = Math.pow(2, i) * 1000;
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  return null;
}

/**
 * directPurchaseCallback
 * ----------------------
 * QPay calls this URL after the user pays a direct-buy invoice (full price,
 * one-shot). The URL is `?pending_id={X}` where X is the Firestore id of
 * the pending_invoices doc we reserved up front.
 *
 *  1. Looks up `pending_invoices/{pending_id}`
 *  2. Verifies with QPay payment/check that the invoice is PAID
 *  3. Atomically creates the `product_purchases` doc with
 *     status="completed", purchase_type="direct", paid_amount=total,
 *     paid_months=1, months=1
 *  4. Marks the pending invoice processed and stores `purchase_id` for
 *     cross-reference
 *
 * Idempotent: re-invocations after a successful run no-op.
 */
exports.directPurchaseCallback = onRequest({
  region: "asia-northeast1",
  memory: "512MiB",
  timeoutSeconds: 120,
}, async (req, res) => {
  const db = admin.firestore();
  const pendingId = req.query && req.query.pending_id;

  logger.info("📥 Direct purchase callback received", {
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
    if (pendingData.type !== "direct_purchase") {
      return res.status(409).json({ error: "Not a direct_purchase invoice" });
    }

    const invoiceId = pendingData.invoice_id;
    const amount = Number(pendingData.amount || 0);

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

    // Create the product_purchases doc atomically. We do this inside a
    // transaction so a parallel callback (e.g. QPay retry) can't double-write.
    const purchaseRef = db.collection("product_purchases").doc();
    const now = admin.firestore.Timestamp.now();
    await db.runTransaction(async (tx) => {
      const cur = await tx.get(pendingRef);
      const curData = cur.data() || {};
      if (curData.status === "processed" && curData.purchase_id) {
        return;
      }
      tx.set(purchaseRef, {
        product_id: pendingData.product_id,
        product_snapshot: pendingData.product_snapshot || {},
        user_id: pendingData.user_id,
        user_snapshot: pendingData.user_snapshot || {},
        total_price: amount,
        monthly_payment: amount,
        months: 1,
        paid_amount: amount,
        paid_months: 1,
        next_due_date: null,
        status: "completed",
        started_at: now,
        completed_at: now,
        pickup_code: generatePickupCode(),
        purchase_type: "direct",
        payments: [
          {
            month_no: 1,
            amount,
            paid_at: now,
            payment_method: "qpay",
            invoice_id: invoiceId,
          },
        ],
      });
      tx.update(pendingRef, {
        status: "processed",
        purchase_id: purchaseRef.id,
        paid_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    logger.info("✅ Direct purchase recorded", {
      pendingId,
      invoiceId,
      purchase_id: purchaseRef.id,
      amount,
    });

    return res.status(200).json({
      success: true,
      message: "Direct purchase completed",
      pending_id: pendingId,
      invoice_id: invoiceId,
      purchase_id: purchaseRef.id,
    });
  } catch (err) {
    logger.error("❌ Direct purchase callback failed", {
      error: err.message,
      stack: err.stack,
      pendingId,
    });
    try {
      await db.collection("payment_callback_errors").add({
        type: "direct_purchase",
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
