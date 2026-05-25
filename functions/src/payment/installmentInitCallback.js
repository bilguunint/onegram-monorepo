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
    const dailyPayment = Number(pendingData.daily_payment || 0);
    const totalPrice = Number(pendingData.total_price || 0);
    const months = Number(pendingData.months || 0);
    const totalDays = Number(pendingData.total_days || 0);
    const firstAmount = Number(pendingData.amount || dailyPayment);

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

    // Build the product_purchases doc atomically.
    const purchaseRef = db.collection("product_purchases").doc();
    const now = admin.firestore.Timestamp.now();
    const nowDate = now.toDate();

    // For a 1-day plan, the very first payment IS the full plan — go
    // straight to completed status. For multi-day plans, leave active with
    // paid_days=1 and deadline = started_at + total_days days.
    const isFullyPaid = totalDays <= 1;
    const deadline = isFullyPaid ?
      null :
      admin.firestore.Timestamp.fromDate(
        new Date(
          nowDate.getFullYear(),
          nowDate.getMonth(),
          nowDate.getDate() + totalDays,
        ),
      );

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
        total_price: totalPrice,
        daily_payment: dailyPayment,
        months,
        total_days: totalDays,
        paid_amount: firstAmount,
        paid_days: 1,
        deadline,
        status: isFullyPaid ? "completed" : "active",
        started_at: now,
        ...(isFullyPaid ?
          { completed_at: now, pickup_code: generatePickupCode() } :
          {}),
        purchase_type: "installment",
        payments: [
          {
            day_no: 1,
            amount: firstAmount,
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

    logger.info("✅ Installment plan created on first payment", {
      pendingId,
      invoiceId,
      purchase_id: purchaseRef.id,
      months,
      total_days: totalDays,
      daily_payment: dailyPayment,
      total_price: totalPrice,
    });

    return res.status(200).json({
      success: true,
      message: "Installment started",
      pending_id: pendingId,
      invoice_id: invoiceId,
      purchase_id: purchaseRef.id,
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
