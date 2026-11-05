const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });

const QPAY_USERNAME = "ONE_GRAM_GOLD";
const QPAY_PASSWORD = "zElO7j40";
const { recordDirectPurchasePaid } = require("./directPurchaseShared");
const {
  SWEEP_DAYS,
  LAST_CHECK_FIELD,
  sweepStart,
  dueForRecheck,
} = require("../utils/verifySweep");

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
 * Өмнө нь `createdAt`-checkpoint ашигладаг байв — нэхэмжлэхийг зөвхөн үүссэнийх
 * нь дараах эхний ажиллалтад хараад checkpoint-оо урагшлуулдаг тул QR-аа
 * хадгалаад хожим төлсөн хүний төлбөр цонхны ард үлдэж хэзээ ч дахин
 * шалгагддаггүй байсан. Одоо сүүлийн SWEEP_DAYS хоногийн нэхэмжлэхүүдийг
 * эргэлдэх цонхоор дахин хардаг (давтамжийн дүрэм ../utils/verifySweep дотор).
 *
 * @param {number|null} lookbackDays - хэдэн хоногоор ухарч шалгах. null →
 *   SWEEP_DAYS. Утга өгвөл давтамжийн хязгаарлалтыг алгасаж бүгдийг шалгана.
 * @return {object} summary
 */
async function runAutoVerifyOrders(lookbackDays = null) {
  const db = admin.firestore();

  const checkpointRef = db.doc(CHECKPOINT_DOC);
  const forceAll = lookbackDays !== null;
  const windowStart = sweepStart(forceAll ? lookbackDays : SWEEP_DAYS);
  const windowStartTs = admin.firestore.Timestamp.fromDate(windowStart);
  const now = admin.firestore.Timestamp.now();
  const nowMs = now.toMillis();

  logger.info("AutoVerify started", {
    forceAll,
    windowStart: windowStart.toISOString(),
    now: now.toDate().toISOString(),
  });

  // 2. pending_invoices авах — createdAt мужаар (composite index шаардахгүй),
  // төрөл/төлөв доорх давталтад шүүгдэнэ.
  const pendingSnap = await db.collection("pending_invoices")
    .where("createdAt", ">=", windowStartTs)
    .get();

  if (pendingSnap.empty) {
    logger.info("AutoVerify: No pending invoices in sweep window");
    await checkpointRef.set({ lastRunAt: now, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return { scanned: 0, checked: 0, autoVerified: 0, alreadySuccess: 0, notPaid: 0, throttled: 0, errors: 0 };
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

  // QPay шалгалт — token хугацаа дуусвал нэг удаа шинэчилж дахин оролдоно.
  // Захиалга болон шууд худалдан авалтын аль аль салаа үүнийг ашиглана.
  const checkWithRefresh = async (invoiceId) => {
    try {
      return await checkQPayPaymentStatus(qpayToken, invoiceId);
    } catch (apiErr) {
      if (apiErr.response && apiErr.response.status === 401) {
        logger.info("AutoVerify: QPay token expired, refreshing...");
        qpayToken = await getQPayToken();
        return await checkQPayPaymentStatus(qpayToken, invoiceId);
      }
      throw apiErr;
    }
  };

  let scanned = 0;
  let checked = 0;
  let autoVerified = 0;
  let alreadySuccess = 0;
  let notPaid = 0;
  let throttled = 0;
  let errors = 0;
  const autoVerifiedOrderIds = [];

  for (const doc of pendingSnap.docs) {
    const invoiceData = doc.data();
    const { order_id, invoice_id, userId, amount } = invoiceData;

    // Энэ cron нь ONE_GRAM_GOLD merchant-ийн хоёр урсгалыг хариуцна:
    // (а) энгийн захиалга — `type` талбаргүй, `order_id`-тай
    // (б) шууд худалдан авалт — type === "direct_purchase"
    // Хуваан төлөлт / хандив / мод / шүтээн нь LISTLY_AGENT merchant дээр,
    // өөрсдийн cron-тойгоо.
    const isDirect = invoiceData.type === "direct_purchase";
    if (!isDirect && (invoiceData.type || !order_id)) {
      continue;
    }

    scanned++;

    // Аль хэдийн хаагдсан — QPay ч, order ч уншихгүй.
    if (invoiceData.status !== "pending") {
      alreadySuccess++;
      continue;
    }

    // Насны дагуух давтамжийн хязгаар — цонхон дахь бүх нэхэмжлэхийг
    // ажиллалт болгонд дахин шалгахгүй.
    if (!forceAll && !dueForRecheck(invoiceData.createdAt, invoiceData[LAST_CHECK_FIELD], nowMs)) {
      throttled++;
      continue;
    }

    checked++;

    // Явцын log — 50 invoice тутамд
    if (checked % 50 === 0) {
      logger.info(`AutoVerify: Progress ${checked}/${pendingSnap.size}`, {
        autoVerified, alreadySuccess, notPaid, errors,
      });
    }

    if (!invoice_id) {
      logger.warn("AutoVerify: Skipping invoice with missing invoice_id", { docId: doc.id });
      errors++;
      continue;
    }

    try {
      // 4а. Шууд худалдан авалт — `orders` баримтгүй, pending_invoices өөрөө
      // эх сурвалж. Өмнө нь энэ урсгалд аюулгүйн тор ОГТ байгаагүй: callback
      // ирэхгүй бол төлбөр нь бүртгэлгүй үлддэг байв.
      if (isDirect) {
        const directResult = await checkWithRefresh(invoice_id);
        if (!directResult || directResult.payment_status !== "PAID") {
          notPaid++;
          await doc.ref.update({ [LAST_CHECK_FIELD]: now });
          continue;
        }
        const fullSnap = await doc.ref.get();
        const { purchaseId, created } = await recordDirectPurchasePaid(
          db,
          doc.ref,
          fullSnap.data() || {},
        );
        autoVerified++;
        logger.info("AutoVerify: direct purchase auto-verified", {
          docId: doc.id,
          invoice_id,
          purchase_id: purchaseId,
          created,
          qpay_payment_id: directResult.payment_id,
        });
        await db.collection("auto_verified_orders").doc(doc.id).set({
          pending_id: doc.id,
          type: "direct_purchase",
          invoice_id,
          purchase_id: purchaseId,
          userId: invoiceData.user_id || userId || null,
          amount,
          qpay_payment_id: directResult.payment_id,
          qpay_payment_status: directResult.payment_status,
          qpay_payment_date: directResult.payment_date,
          verified_at: admin.firestore.FieldValue.serverTimestamp(),
          source: "scheduledAutoVerify",
        });
        await new Promise((resolve) => setTimeout(resolve, 200));
        continue;
      }

      // 4б. Order-н одоогийн статусыг шалгах
      const orderRef = db.collection("orders").doc(String(order_id));
      const orderSnap = await orderRef.get();

      if (!orderSnap.exists) {
        logger.warn("AutoVerify: Order not found", { order_id });
        errors++;
        continue;
      }

      const orderData = orderSnap.data();

      // Аль хэдийн success болсон бол алгасна (QPay дуудахгүй → хурдан).
      // Захиалгын callback нь pending_invoices-ийг хаадаггүй тул эдгээр
      // баримт мөнхөд "pending" хэвээр үлдэж, sweep бүрт дахин уншигддаг —
      // эндээс нь хааж өгнө.
      if (orderData.payment_status === "success") {
        alreadySuccess++;
        await doc.ref.update({
          status: "processed",
          [LAST_CHECK_FIELD]: now,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        continue;
      }

      // 5. QPay API-аар invoice-н төлбөрийн статусыг шууд шалгах.
      // Алдаа гарвал доорх гадаад catch нь errors++ хийж, дахин шалгах
      // хугацааг тэмдэглэнэ.
      const qpayResult = await checkWithRefresh(invoice_id);

      // QPay-д төлбөр бүртгэлгүй, эсвэл PAID биш бол одоохондоо алгасна.
      // Хэзээ шалгаснаа тэмдэглэнэ — дараагийн ажиллалтууд давтамжийн
      // дүрмээр сийрэгжинэ, гэхдээ цонхоос гарах хүртэл дахин шалгагдсаар
      // байх тул хожим төлсөн ч баригдана.
      if (!qpayResult || qpayResult.payment_status !== "PAID") {
        notPaid++;
        await doc.ref.update({ [LAST_CHECK_FIELD]: now });
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

      await doc.ref.update({
        status: "processed",
        [LAST_CHECK_FIELD]: now,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
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
      try {
        await doc.ref.update({ [LAST_CHECK_FIELD]: now });
      } catch (stampErr) {
        logger.warn("AutoVerify: failed to stamp last check", {
          docId: doc.id,
          error: stampErr.message,
        });
      }
    }
  }

  // 8. Ажиллалтын төлөвийг шинэчлэх
  await checkpointRef.set({
    lastRunAt: now,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastRunStats: { scanned, checked, autoVerified, alreadySuccess, notPaid, throttled, errors },
  }, { merge: true });

  // 9. auto_verify_logs collection-д ажиллалтын бүртгэл хадгалах
  await db.collection("auto_verify_logs").add({
    ran_at: admin.firestore.FieldValue.serverTimestamp(),
    range_from: windowStartTs,
    range_to: now,
    scanned,
    checked,
    autoVerified,
    alreadySuccess,
    notPaid,
    throttled,
    errors,
    autoVerifiedOrderIds,
  });

  const summary = { scanned, checked, autoVerified, alreadySuccess, notPaid, throttled, errors, autoVerifiedOrderIds };
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
      const days = Math.max(1, Math.floor(Number(req.query && req.query.days) || 7));
      const result = await runAutoVerifyOrders(days);
      return res.status(200).json({ success: true, days, ...result });
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
