const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const {
  getQPayToken,
  checkQPayPayment,
  applyPaidInvoice,
  createPurchaseFromInit,
} = require("./installmentShared");
const G = require("./goldInstallmentShared");
const {
  SWEEP_DAYS,
  LAST_CHECK_FIELD,
  SWEEP_QPAY_ATTEMPTS,
  sweepStart,
  dueForRecheck,
} = require("../utils/verifySweep");

const STATE_DOC = "system_config/autoVerifyInstallmentCheckpoint";

/**
 * autoVerifyInstallments
 * ----------------------
 * Safety net for the installment (хуваан төлөлт) flow. QPay calls
 * installmentInitCallback / installmentCallback after each payment, but if
 * that webhook never fires (network blip, transient error) the user's
 * payment is left uncredited:
 *   - installment_init: the product_purchases doc is never created
 *   - installment:      paid_days never increments
 *
 * Энэ нь өмнө нь `createdAt`-checkpoint ашигладаг байсан — нэхэмжлэхийг зөвхөн
 * үүссэнийх нь дараах эхний ажиллалтад хардаг тул QR-аа хадгалаад хожим төлсөн
 * хүний төлбөр цонхны ард үлдэж алга болдог байв. Одоо сүүлийн SWEEP_DAYS
 * хоногийн ХҮЛЭЭГДЭЖ БУЙ нэхэмжлэхүүдийг эргэлдэх цонхоор дахин хардаг
 * (давтамжийн дүрэм нь ../utils/verifySweep дотор).
 *
 * @param {number|null} lookbackDays - энэ хэдэн хоногоор ухарч шалгана.
 *   null → SWEEP_DAYS. Утга өгсөн үед давтамжийн хязгаарлалтыг алгасаж
 *   цонхон дахь БҮХ хүлээгдэж буй нэхэмжлэхийг шалгана (гар ажиллагаа).
 * @return {object} run summary
 */
async function runAutoVerifyInstallments(lookbackDays = null) {
  const db = admin.firestore();

  const forceAll = lookbackDays !== null;
  const windowStart = sweepStart(forceAll ? lookbackDays : SWEEP_DAYS);
  const windowStartTs = admin.firestore.Timestamp.fromDate(windowStart);
  const now = admin.firestore.Timestamp.now();
  const nowMs = now.toMillis();

  logger.info("AutoVerifyInstallments started", {
    forceAll,
    windowStart: windowStart.toISOString(),
    now: now.toDate().toISOString(),
  });

  // Query by createdAt range only (no composite index needed) — type/status
  // are filtered in the loop below. Зөвхөн хэрэгтэй талбаруудыг сонгоно:
  // 1000+ баримтын `qpay_invoice` блобыг татахгүй.
  const pendingSnap = await db.collection("pending_invoices")
    .where("createdAt", ">=", windowStartTs)
    .select("type", "status", "invoice_id", "purchase_id", "day_no", "createdAt", LAST_CHECK_FIELD)
    .get();

  const empty = {
    scanned: 0, checked: 0, autoVerified: 0,
    alreadyProcessed: 0, notPaid: 0, throttled: 0, errors: 0,
  };

  if (pendingSnap.empty) {
    logger.info("AutoVerifyInstallments: No invoices in sweep window");
    await db.doc(STATE_DOC).set({
      lastRunAt: now,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return empty;
  }

  let token;
  try {
    token = await getQPayToken();
    logger.info("AutoVerifyInstallments: QPay token acquired");
  } catch (err) {
    logger.error("AutoVerifyInstallments: Failed to get QPay token, aborting", {
      error: err.message,
    });
    throw err;
  }

  let scanned = 0;
  let checked = 0;
  let autoVerified = 0;
  let alreadyProcessed = 0;
  let notPaid = 0;
  let throttled = 0;
  let errors = 0;
  const autoVerifiedIds = [];

  for (const doc of pendingSnap.docs) {
    const data = doc.data();
    const type = data.type;

    // Only the installment flows (ердийн + алтан эдлэл) — direct-order
    // invoices are handled by autoVerifyOrders.
    const isGold = type === G.INVOICE_TYPE || type === G.INVOICE_TYPE_INIT;
    if (type !== "installment" && type !== "installment_init" && !isGold) {
      continue;
    }

    scanned++;

    // Already credited by the realtime callback — skip without a QPay call.
    if (data.status !== "pending") {
      alreadyProcessed++;
      continue;
    }

    // Насны дагуух давтамжийн хязгаар — цонхон дахь хуучин нэхэмжлэх бүрийг
    // ажиллалт болгонд QPay-аас асуухгүй.
    if (!forceAll && !dueForRecheck(data.createdAt, data[LAST_CHECK_FIELD], nowMs)) {
      throttled++;
      continue;
    }

    const invoiceId = data.invoice_id;
    if (!invoiceId) {
      logger.warn("AutoVerifyInstallments: pending invoice missing invoice_id", {
        docId: doc.id,
        type,
      });
      errors++;
      continue;
    }

    checked++;

    try {
      const paymentStatus = await checkQPayPayment(invoiceId, token, SWEEP_QPAY_ATTEMPTS);

      if (paymentStatus !== "PAID") {
        notPaid++;
        // Хэзээ шалгаснаа тэмдэглэнэ — дараагийн ажиллалтууд давтамжийн
        // дүрмээр сийрэгжинэ.
        await doc.ref.update({ [LAST_CHECK_FIELD]: now });
        continue;
      }

      if (isGold) {
        // Алтан эдлэл: init бол purchase үүсгэнэ, дараагийнх бол грамм нэмнэ.
        const fullSnap = await doc.ref.get();
        const full = fullSnap.data() || {};
        const result = type === G.INVOICE_TYPE_INIT ?
          await G.createGoldPurchaseFromInit(db, doc.ref, full) :
          await G.applyPaidGoldInvoice(db, doc.ref, {
            invoiceFields: {
              [LAST_CHECK_FIELD]: now,
              auto_verified: true,
              auto_verified_at: admin.firestore.FieldValue.serverTimestamp(),
              auto_verified_source: "scheduledAutoVerifyInstallments",
            },
          });
        autoVerified++;
        autoVerifiedIds.push(doc.id);
        logger.info("AutoVerifyInstallments: gold invoice credited", { docId: doc.id, invoiceId, type, result });
        await db.collection("auto_verified_installments").doc(doc.id).set({
          pending_id: doc.id,
          type,
          invoice_id: invoiceId,
          purchase_id: full.purchase_id || (result && result.purchaseId) || null,
          result,
          verified_at: admin.firestore.FieldValue.serverTimestamp(),
          source: "scheduledAutoVerifyInstallments",
        });
      } else if (type === "installment_init") {
        // First day — create the purchase doc (idempotent). Projection-оос
        // болж бүтэн баримт хэрэгтэй (product/user snapshot г.м.).
        const fullSnap = await doc.ref.get();
        const { purchaseId, created } = await createPurchaseFromInit(
          db,
          doc.ref,
          fullSnap.data() || {},
        );
        autoVerified++;
        autoVerifiedIds.push(doc.id);
        logger.info("AutoVerifyInstallments: init credited", {
          docId: doc.id,
          invoiceId,
          purchase_id: purchaseId,
          created,
        });
        await db.collection("auto_verified_installments").doc(doc.id).set({
          pending_id: doc.id,
          type,
          invoice_id: invoiceId,
          purchase_id: purchaseId,
          created,
          verified_at: admin.firestore.FieldValue.serverTimestamp(),
          source: "scheduledAutoVerifyInstallments",
        });
      } else {
        // 2nd…Nth day — credit the day on the existing purchase (idempotent).
        const purchaseId = data.purchase_id;
        const dayNo = Number(data.day_no);
        if (!purchaseId || !Number.isFinite(dayNo) || dayNo < 1) {
          logger.warn("AutoVerifyInstallments: invalid purchase_id/day_no", {
            docId: doc.id,
            purchaseId,
            dayNo: data.day_no,
          });
          errors++;
          continue;
        }
        const result = await applyPaidInvoice(db, doc.ref, {
          invoiceFields: {
            [LAST_CHECK_FIELD]: now,
            auto_verified: true,
            auto_verified_at: admin.firestore.FieldValue.serverTimestamp(),
            auto_verified_source: "scheduledAutoVerifyInstallments",
          },
        });
        autoVerified++;
        autoVerifiedIds.push(doc.id);
        logger.info("AutoVerifyInstallments: day credited", {
          docId: doc.id,
          invoiceId,
          purchase_id: purchaseId,
          dayNo,
          result,
        });
        await db.collection("auto_verified_installments").doc(doc.id).set({
          pending_id: doc.id,
          type,
          invoice_id: invoiceId,
          purchase_id: purchaseId,
          day_no: dayNo,
          result,
          verified_at: admin.firestore.FieldValue.serverTimestamp(),
          source: "scheduledAutoVerifyInstallments",
        });
      }

      // Gentle pacing against QPay rate limits.
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (err) {
      errors++;
      logger.error("AutoVerifyInstallments: Error processing invoice", {
        docId: doc.id,
        invoiceId,
        type,
        error: err.message,
      });
      // Алдаа гарсан ч тэмдэглэнэ — нэг эвдэрсэн нэхэмжлэх ажиллалт болгонд
      // дахин дахин оролдож бусдыг саатуулахгүй.
      try {
        await doc.ref.update({ [LAST_CHECK_FIELD]: now });
      } catch (stampErr) {
        logger.warn("AutoVerifyInstallments: failed to stamp last check", {
          docId: doc.id,
          error: stampErr.message,
        });
      }
    }
  }

  await db.doc(STATE_DOC).set({
    lastRunAt: now,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastRunStats: {
      scanned, checked, autoVerified, alreadyProcessed, notPaid, throttled, errors,
    },
  }, { merge: true });

  await db.collection("auto_verify_installment_logs").add({
    ran_at: admin.firestore.FieldValue.serverTimestamp(),
    range_from: windowStartTs,
    range_to: now,
    scanned,
    checked,
    autoVerified,
    alreadyProcessed,
    notPaid,
    throttled,
    errors,
    autoVerifiedIds,
  });

  const summary = {
    scanned, checked, autoVerified, alreadyProcessed,
    notPaid, throttled, errors, autoVerifiedIds,
  };
  logger.info("AutoVerifyInstallments completed", summary);
  return summary;
}

/**
 * Manual init — re-check the last 7 days of installment invoices (HTTP).
 * Давтамжийн хязгаарлалтыг алгасаж бүгдийг шалгана.
 */
exports.initAutoVerifyInstallments = onRequest({
  region: "asia-northeast1",
  memory: "1GiB",
  timeoutSeconds: 540,
  maxInstances: 1,
}, async (req, res) => {
  return cors(req, res, async () => {
    try {
      const days = Math.max(1, Math.floor(Number(req.query && req.query.days) || 7));
      const result = await runAutoVerifyInstallments(days);
      return res.status(200).json({ success: true, days, ...result });
    } catch (err) {
      logger.error("initAutoVerifyInstallments failed", {
        error: err.message,
        stack: err.stack,
      });
      return res.status(500).json({ success: false, error: err.message });
    }
  });
});

/**
 * Every 30 minutes — sweep the rolling window and credit any missed payments.
 */
exports.scheduledAutoVerifyInstallments = onSchedule({
  schedule: "every 30 minutes",
  timeZone: "Asia/Ulaanbaatar",
  region: "asia-northeast1",
  memory: "1GiB",
  timeoutSeconds: 540,
}, async () => {
  try {
    const result = await runAutoVerifyInstallments();
    logger.info("Scheduled auto-verify installments completed", result);
  } catch (err) {
    logger.error("Scheduled auto-verify installments failed", {
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }
});
