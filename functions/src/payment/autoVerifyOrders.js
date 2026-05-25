const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });

const QPAY_USERNAME = "ONE_GRAM_GOLD";
const QPAY_PASSWORD = "zElO7j40";
const CHECKPOINT_DOC = "system_config/autoVerifyCheckpoint";

/**
 * QPay-с шинэ access token авах
 */
async function getQPayToken() {
  const tokenResponse = await axios.post("https://merchant.qpay.mn/v2/auth/token", {}, {
    auth: {
      username: QPAY_USERNAME,
      password: QPAY_PASSWORD,
    },
    timeout: 10000,
  });
  return tokenResponse.data.access_token;
}

/**
 * QPay API-аар invoice-н төлбөрийн статусыг шалгах
 * /v2/payment/check endpoint ашиглана
 * @param {string} token - QPay access token
 * @param {string} invoiceId - Invoice ID
 * @return {object|null} payment info эсвэл null
 */
async function checkQPayPaymentStatus(token, invoiceId) {
  const response = await axios.post("https://merchant.qpay.mn/v2/payment/check", {
    object_type: "INVOICE",
    object_id: invoiceId,
  }, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    timeout: 10000,
  });

  const rows = response.data.rows;
  if (!rows || rows.length === 0) {
    return null;
  }

  return {
    payment_status: rows[0].payment_status,
    payment_id: rows[0].payment_id || null,
    payment_date: rows[0].payment_date || null,
    paid_by: rows[0].paid_by || null,
  };
}

/**
 * pending_invoices-с шалгаж, QPay API-аар PAID болсон
 * захиалгуудыг автоматаар success болгоно.
 *
 * @param {Date|null} sinceDate - энэ огноос хойших invoice шалгана. null бол checkpoint-с авна.
 * @return {object} summary
 */
async function runAutoVerifyOrders(sinceDate = null) {
  const db = admin.firestore();

  // 1. lastCheckedAt checkpoint-г авах
  const checkpointRef = db.doc(CHECKPOINT_DOC);
  const checkpointSnap = await checkpointRef.get();

  let lastCheckedAt;
  let isInitialRun = false;
  if (sinceDate) {
    // Manual дуудлага — sinceDate-с хойш шалгана
    lastCheckedAt = admin.firestore.Timestamp.fromDate(sinceDate);
    isInitialRun = true;
  } else if (checkpointSnap.exists && checkpointSnap.data().lastCheckedAt) {
    lastCheckedAt = checkpointSnap.data().lastCheckedAt;
  } else {
    // checkpoint байхгүй бол сүүлийн 7 хоног
    lastCheckedAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    isInitialRun = true;
  }

  const now = admin.firestore.Timestamp.now();

  logger.info("AutoVerify started", {
    isInitialRun,
    lastCheckedAt: lastCheckedAt ? lastCheckedAt.toDate().toISOString() : "ALL",
    now: now.toDate().toISOString(),
  });

  // 2. pending_invoices авах
  const pendingSnap = await db.collection("pending_invoices")
    .where("createdAt", ">=", lastCheckedAt)
    .where("createdAt", "<=", now)
    .get();

  if (pendingSnap.empty) {
    logger.info("AutoVerify: No pending invoices in range, updating checkpoint");
    await checkpointRef.set({ lastCheckedAt: now, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return { checked: 0, autoVerified: 0, alreadySuccess: 0, notPaid: 0, errors: 0 };
  }

  logger.info(`AutoVerify: Found ${pendingSnap.size} pending invoices to check`);

  // QPay API дуудлагын тоог хязгаарлахгүй — бүгдийг шалгана

  // 3. QPay token авах — бүх invoice-г шалгахад нэг token ашиглана
  let qpayToken;
  try {
    qpayToken = await getQPayToken();
    logger.info("AutoVerify: QPay token acquired");
  } catch (err) {
    logger.error("AutoVerify: Failed to get QPay token, aborting", { error: err.message });
    throw err;
  }

  let checked = 0;
  let autoVerified = 0;
  let alreadySuccess = 0;
  let notPaid = 0;
  let errors = 0;
  const autoVerifiedOrderIds = [];

  for (const doc of pendingSnap.docs) {
    const invoiceData = doc.data();
    const { order_id, invoice_id, userId, amount } = invoiceData;

    checked++;

    // Явцын log — 50 invoice тутамд
    if (checked % 50 === 0) {
      logger.info(`AutoVerify: Progress ${checked}/${pendingSnap.size}`, {
        autoVerified, alreadySuccess, notPaid, errors,
      });
    }

    if (!order_id || !invoice_id) {
      logger.warn("AutoVerify: Skipping invoice with missing order_id or invoice_id", { docId: doc.id });
      errors++;
      continue;
    }

    try {
      // 4. Order-н одоогийн статусыг шалгах
      const orderRef = db.collection("orders").doc(String(order_id));
      const orderSnap = await orderRef.get();

      if (!orderSnap.exists) {
        logger.warn("AutoVerify: Order not found", { order_id });
        errors++;
        continue;
      }

      const orderData = orderSnap.data();

      // Аль хэдийн success болсон бол алгасна (QPay дуудахгүй → хурдан)
      if (orderData.payment_status === "success") {
        alreadySuccess++;
        continue;
      }

      // 5. QPay API-аар invoice-н төлбөрийн статусыг шууд шалгах
      let qpayResult;
      try {
        qpayResult = await checkQPayPaymentStatus(qpayToken, invoice_id);
      } catch (apiErr) {
        // Token хугацаа дууссан бол шинэ token авч дахин оролдох
        if (apiErr.response && apiErr.response.status === 401) {
          logger.info("AutoVerify: QPay token expired, refreshing...");
          try {
            qpayToken = await getQPayToken();
            qpayResult = await checkQPayPaymentStatus(qpayToken, invoice_id);
          } catch (retryErr) {
            logger.error("AutoVerify: QPay API retry failed", {
              order_id, invoice_id, error: retryErr.message,
            });
            errors++;
            continue;
          }
        } else {
          logger.error("AutoVerify: QPay API check failed", {
            order_id, invoice_id, error: apiErr.message,
          });
          errors++;
          continue;
        }
      }

      // QPay-д төлбөр бүртгэлгүй байвал алгасна
      if (!qpayResult) {
        notPaid++;
        continue;
      }

      // ЗӨВХӨН "PAID" статустай бол л update хийнэ
      if (qpayResult.payment_status !== "PAID") {
        notPaid++;
        continue;
      }

      // 6. Transaction ашиглан order-г update хийх (race condition-с хамгаална)
      await db.runTransaction(async (tx) => {
        const freshOrderSnap = await tx.get(orderRef);
        if (!freshOrderSnap.exists) {
          throw new Error("Order not found in transaction");
        }
        const freshOrder = freshOrderSnap.data();

        // Transaction дотор дахин шалгах
        if (freshOrder.payment_status === "success") {
          return;
        }

        tx.update(orderRef, {
          payment_status: "success",
          paid_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          auto_verified: true,
          auto_verified_at: admin.firestore.FieldValue.serverTimestamp(),
          auto_verified_source: "scheduledAutoVerify",
          auto_verified_qpay_payment_id: qpayResult.payment_id,
        });
      });

      autoVerified++;
      autoVerifiedOrderIds.push(String(order_id));

      logger.info("AutoVerify: Order auto-verified", {
        order_id,
        invoice_id,
        userId,
        amount,
        qpay_payment_id: qpayResult.payment_id,
      });

      // 7. auto_verified_orders collection-д бүртгэх (audit trail)
      await db.collection("auto_verified_orders").doc(String(order_id)).set({
        order_id,
        invoice_id,
        userId,
        amount,
        qpay_payment_id: qpayResult.payment_id,
        qpay_payment_status: qpayResult.payment_status,
        qpay_payment_date: qpayResult.payment_date,
        qpay_paid_by: qpayResult.paid_by,
        previous_order_status: orderData.payment_status,
        verified_at: admin.firestore.FieldValue.serverTimestamp(),
        source: "scheduledAutoVerify",
      });

      // QPay API rate limit-с хамгаалах — invoice хоорондох богино зай
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (err) {
      errors++;
      logger.error("AutoVerify: Error processing invoice", {
        order_id,
        invoice_id,
        error: err.message,
      });
    }
  }

  // 8. Checkpoint-г шинэчлэх
  await checkpointRef.set({
    lastCheckedAt: now,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastRunStats: { checked, autoVerified, alreadySuccess, notPaid, errors },
  }, { merge: true });

  // 9. auto_verify_logs collection-д ажиллалтын бүртгэл хадгалах
  await db.collection("auto_verify_logs").add({
    ran_at: admin.firestore.FieldValue.serverTimestamp(),
    range_from: lastCheckedAt,
    range_to: now,
    checked,
    autoVerified,
    alreadySuccess,
    notPaid,
    errors,
    autoVerifiedOrderIds,
  });

  const summary = { checked, autoVerified, alreadySuccess, notPaid, errors, autoVerifiedOrderIds };
  logger.info("AutoVerify completed", summary);

  return summary;
}

/**
 * Manual init — сүүлийн 7 хоногийн pending invoices шалгах (HTTP)
 */
exports.initAutoVerifyOrders = onRequest({
  memory: "1GiB",
  timeoutSeconds: 540,
  maxInstances: 1,
}, async (req, res) => {
  return cors(req, res, async () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const result = await runAutoVerifyOrders(sevenDaysAgo);
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      logger.error("initAutoVerifyOrders failed", { error: err.message, stack: err.stack });
      return res.status(500).json({ success: false, error: err.message });
    }
  });
});

/**
 * 30 минут тутамд ажиллах scheduled function (үргэлж checkpoint-с хойш)
 */
exports.scheduledAutoVerifyOrders = onSchedule({
  schedule: "every 30 minutes",
  timeZone: "Asia/Ulaanbaatar",
  memory: "1GiB",
  timeoutSeconds: 540,
}, async () => {
  try {
    const result = await runAutoVerifyOrders();
    logger.info("Scheduled auto-verify completed", result);
  } catch (err) {
    logger.error("Scheduled auto-verify failed", {
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }
});
