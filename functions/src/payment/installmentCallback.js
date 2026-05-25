const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

const QPAY_USERNAME = "ONE_GRAM_GOLD";
const QPAY_PASSWORD = "zElO7j40";

// 6-digit pickup code (zero-padded, "000000"-"999999"). Shown to the user
// after they finish paying; admin enters it to mark delivered.
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

// Apply a paid installment DAY to the purchase doc atomically.
// Idempotent — if paid_days already covers this day, returns without
// making changes.
async function applyPaidDay(db, purchaseId, dayNo, amount) {
  const purchaseRef = db.collection("product_purchases").doc(purchaseId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(purchaseRef);
    if (!snap.exists) {
      throw new Error(`Purchase ${purchaseId} not found`);
    }
    const data = snap.data() || {};
    const paidDays = Number(data.paid_days || 0);
    const totalDays = Number(data.total_days || 0);

    if (paidDays >= dayNo) {
      logger.info("Idempotent skip — day already credited", {
        purchaseId,
        dayNo,
        paidDays,
      });
      return { changed: false, reason: "already_paid" };
    }

    const newPaidDays = paidDays + 1;
    const newPaidAmount =
      Number(data.paid_amount || 0) + Number(amount || 0);

    const paymentEntry = {
      day_no: dayNo,
      amount: Number(amount || 0),
      paid_at: admin.firestore.Timestamp.now(),
      payment_method: "qpay",
    };
    const payments = Array.isArray(data.payments) ?
      [...data.payments, paymentEntry] :
      [paymentEntry];

    const update = {
      paid_days: newPaidDays,
      paid_amount: newPaidAmount,
      payments,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (newPaidDays >= totalDays) {
      update.status = "completed";
      update.completed_at = admin.firestore.FieldValue.serverTimestamp();
      update.pickup_code = generatePickupCode();
    }

    tx.update(purchaseRef, update);

    return {
      changed: true,
      newPaidDays,
      newPaidAmount,
      completed: newPaidDays >= totalDays,
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

    // Apply the day to the purchase doc atomically
    const result = await applyPaidDay(db, purchaseId, dayNo, amount);

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
