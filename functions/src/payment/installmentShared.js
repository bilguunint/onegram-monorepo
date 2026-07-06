/**
 * installmentShared
 * -----------------
 * Shared QPay + Firestore logic for the installment (хуваан төлөлт) flow.
 *
 * Both the realtime QPay callbacks (installmentCallback, installmentInitCallback)
 * and the safety-net cron (autoVerifyInstallments) import from here so the
 * crediting logic lives in exactly one place and can never drift apart.
 *
 * Every operation is idempotent — re-running it for an already-credited day or
 * an already-created plan is a no-op.
 */
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

const QPAY_USERNAME = "LISTLY_AGENT";
const QPAY_PASSWORD = "nbIqiJvG";

// 6-digit pickup code (zero-padded, "000000"-"999999"). Shown to the user
// after they finish paying; admin enters it to mark delivered.
function generatePickupCode() {
  return Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
}

// Fetch a fresh QPay access token (LISTLY_AGENT merchant).
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

// Credit all installment days UP TO (and including) `toDay` on an existing
// purchase doc atomically. Supports both single-day payments (toDay =
// paid_days + 1) and multi-day bundles (toDay = paid_days + N).
//
// Idempotent and double-credit safe: it only credits the days that exceed
// the current paid_days, and derives each day's amount from the purchase doc
// (daily_payment, with the final day taking the rounding remainder) rather
// than trusting a passed-in amount. Used for the 2nd…Nth day
// (type="installment"), where the product_purchases doc already exists.
async function applyPaidUpToDay(db, purchaseId, toDay) {
  const purchaseRef = db.collection("product_purchases").doc(purchaseId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(purchaseRef);
    if (!snap.exists) {
      throw new Error(`Purchase ${purchaseId} not found`);
    }
    const data = snap.data() || {};
    const paidDays = Number(data.paid_days || 0);
    const totalDays = Number(data.total_days || 0);
    const daily = Number(data.daily_payment || 0);
    const totalPrice = Number(data.total_price || 0);
    const paidAmount = Number(data.paid_amount || 0);

    // Never credit past the final day.
    const target = Math.min(Number(toDay), totalDays);

    if (paidDays >= target) {
      logger.info("Idempotent skip — days already credited", {
        purchaseId,
        toDay,
        target,
        paidDays,
      });
      return { changed: false, reason: "already_paid" };
    }

    // Credit each not-yet-paid day from paidDays+1 … target. The final day
    // takes whatever is left so the sum equals total_price exactly.
    const entries = [];
    let creditAmount = 0;
    for (let d = paidDays + 1; d <= target; d++) {
      const isLast = d >= totalDays;
      const amt = isLast ?
        Math.max(totalPrice - paidAmount - creditAmount, 0) :
        daily;
      creditAmount += amt;
      entries.push({
        day_no: d,
        amount: amt,
        paid_at: admin.firestore.Timestamp.now(),
        payment_method: "qpay",
      });
    }

    const newPaidDays = target;
    const newPaidAmount = paidAmount + creditAmount;
    const payments = Array.isArray(data.payments) ?
      [...data.payments, ...entries] :
      [...entries];

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
      creditedDays: entries.length,
      creditAmount,
      newPaidDays,
      newPaidAmount,
      completed: newPaidDays >= totalDays,
    };
  });
}

// Create the product_purchases doc from a paid installment_init invoice,
// atomically marking the pending invoice processed. Idempotent — if the plan
// was already created, returns the existing purchase_id without creating a
// duplicate. Used for the FIRST day (type="installment_init"), where the
// product_purchases doc does not exist yet. Returns { purchaseId, created }.
async function createPurchaseFromInit(db, pendingRef, pendingData) {
  const invoiceId = pendingData.invoice_id;
  const dailyPayment = Number(pendingData.daily_payment || 0);
  const totalPrice = Number(pendingData.total_price || 0);
  const months = Number(pendingData.months || 0);
  const totalDays = Number(pendingData.total_days || 0);
  const firstAmount = Number(pendingData.amount || dailyPayment);

  // Idempotent: if we've already created the purchase, just return it.
  if (pendingData.status === "processed" && pendingData.purchase_id) {
    return { purchaseId: pendingData.purchase_id, created: false };
  }

  const purchaseRef = db.collection("product_purchases").doc();
  const now = admin.firestore.Timestamp.now();
  const nowDate = now.toDate();

  // For a 1-day plan, the very first payment IS the full plan — go straight
  // to completed status. For multi-day plans, leave active with paid_days=1
  // and deadline = started_at + total_days days.
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

  let resultId = purchaseRef.id;
  await db.runTransaction(async (tx) => {
    const cur = await tx.get(pendingRef);
    const curData = cur.data() || {};
    if (curData.status === "processed" && curData.purchase_id) {
      resultId = curData.purchase_id;
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

  return { purchaseId: resultId, created: resultId === purchaseRef.id };
}

module.exports = {
  QPAY_USERNAME,
  QPAY_PASSWORD,
  generatePickupCode,
  getQPayToken,
  checkQPayPayment,
  applyPaidUpToDay,
  createPurchaseFromInit,
};
