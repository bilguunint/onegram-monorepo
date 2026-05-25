const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

const QPAY_USERNAME = "ONE_GRAM_GOLD";
const QPAY_PASSWORD = "zElO7j40";

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

// Apply a paid installment month to the purchase doc atomically.
// Idempotent — if paid_months already covers this month, returns without
// making changes.
async function applyPaidMonth(db, purchaseId, monthNo, amount) {
  const purchaseRef = db.collection("product_purchases").doc(purchaseId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(purchaseRef);
    if (!snap.exists) {
      throw new Error(`Purchase ${purchaseId} not found`);
    }
    const data = snap.data() || {};
    const paidMonths = Number(data.paid_months || 0);
    const months = Number(data.months || 0);

    if (paidMonths >= monthNo) {
      logger.info("Idempotent skip — month already credited", {
        purchaseId,
        monthNo,
        paidMonths,
      });
      return { changed: false, reason: "already_paid" };
    }

    const newPaidMonths = paidMonths + 1;
    const newPaidAmount =
      Number(data.paid_amount || 0) + Number(amount || 0);

    // Append payment record
    const paymentEntry = {
      month_no: monthNo,
      amount: Number(amount || 0),
      paid_at: admin.firestore.Timestamp.now(),
      payment_method: "qpay",
    };
    const payments = Array.isArray(data.payments) ?
      [...data.payments, paymentEntry] :
      [paymentEntry];

    // Compute next_due_date or null if last month
    let nextDue = null;
    if (newPaidMonths < months) {
      const start = data.started_at && data.started_at.toDate ?
        data.started_at.toDate() :
        new Date();
      nextDue = admin.firestore.Timestamp.fromDate(
        new Date(start.getFullYear(), start.getMonth() + newPaidMonths + 1, start.getDate()),
      );
    }

    const update = {
      paid_months: newPaidMonths,
      paid_amount: newPaidAmount,
      next_due_date: nextDue,
      payments,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (newPaidMonths >= months) {
      update.status = "completed";
      update.completed_at = admin.firestore.FieldValue.serverTimestamp();
    }

    tx.update(purchaseRef, update);

    return {
      changed: true,
      newPaidMonths,
      newPaidAmount,
      completed: newPaidMonths >= months,
    };
  });
}

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
  const monthNoRaw = req.query && req.query.month_no;
  const monthNo = parseInt(monthNoRaw, 10);

  logger.info("📥 Installment callback received", {
    method: req.method,
    purchaseId,
    monthNoRaw,
    body: req.body,
  });

  if (!purchaseId || !Number.isFinite(monthNo) || monthNo < 1) {
    logger.error("Missing or invalid purchase_id/month_no", {
      purchaseId,
      monthNoRaw,
    });
    return res
      .status(400)
      .json({ error: "Missing or invalid purchase_id/month_no" });
  }

  try {
    // Find the pending invoice for this purchase + month.
    const pendingSnap = await db
      .collection("pending_invoices")
      .where("purchase_id", "==", purchaseId)
      .where("month_no", "==", monthNo)
      .where("type", "==", "installment")
      .limit(1)
      .get();

    if (pendingSnap.empty) {
      logger.error("No pending installment invoice found", {
        purchaseId,
        monthNo,
      });
      return res
        .status(404)
        .json({ error: "Pending installment invoice not found" });
    }

    const pendingDoc = pendingSnap.docs[0];
    const pendingData = pendingDoc.data() || {};
    const invoiceId = pendingData.invoice_id;
    const amount = Number(pendingData.amount || 0);

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

    // Apply the month to the purchase doc atomically
    const result = await applyPaidMonth(db, purchaseId, monthNo, amount);

    // Mark the pending invoice as processed (also idempotent)
    await pendingDoc.ref.update({
      status: "processed",
      paid_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info("✅ Installment payment recorded", {
      purchaseId,
      monthNo,
      invoiceId,
      result,
    });

    return res.status(200).json({
      success: true,
      message: "Installment month credited",
      purchase_id: purchaseId,
      month_no: monthNo,
      invoice_id: invoiceId,
      result,
    });
  } catch (err) {
    logger.error("❌ Installment callback failed", {
      error: err.message,
      stack: err.stack,
      purchaseId,
      monthNo,
    });
    // Record the error for later inspection
    try {
      await db.collection("payment_callback_errors").add({
        type: "installment",
        purchase_id: purchaseId,
        month_no: monthNo,
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
