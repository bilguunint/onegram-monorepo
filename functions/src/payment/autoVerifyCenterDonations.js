const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const {
  getQPayToken,
  checkQPayPayment,
  recordCenterDonationPaid,
} = require("./centerDonationShared");
const { recordTreeOrderPaid } = require("./treeOrderShared");
const { recordShuteenOrderPaid } = require("./shuteenShared");

const {
  SWEEP_DAYS,
  LAST_CHECK_FIELD,
  SWEEP_QPAY_ATTEMPTS,
  sweepStart,
  dueForRecheck,
} = require("../utils/verifySweep");

const CHECKPOINT_DOC = "system_config/autoVerifyCenterCheckpoint";

/**
 * autoVerifyCenterDonations
 * -------------------------
 * Safety net for the center-donation flow. QPay calls centerDonationCallback
 * after payment, but if that webhook never fires (and the user already left
 * the payment screen so the app's self-heal poll stopped), the donation would
 * be left unrecorded even though the buyer paid.
 *
 * Mirrors autoVerifyInstallments: sweeps still-"pending" `pending_invoices`,
 * asks QPay whether they were actually PAID, and applies the same idempotent
 * crediting via the shared recordCenterDonationPaid helper. Queries by
 * createdAt range only (no composite index).
 *
 * Өмнө нь `createdAt`-checkpoint ашигладаг байв — нэхэмжлэхийг зөвхөн үүссэнийх
 * нь дараах эхний ажиллалтад хараад checkpoint-оо урагшлуулдаг тул хожим
 * төлсөн төлбөр цонхны ард үлдэж хэзээ ч дахин шалгагддаггүй байсан. Одоо
 * сүүлийн SWEEP_DAYS хоногийг эргэлдэх цонхоор дахин хардаг.
 *
 * @param {number|null} lookbackDays - хэдэн хоногоор ухарч шалгах. null →
 *   SWEEP_DAYS. Утга өгвөл давтамжийн хязгаарлалтыг алгасаж бүгдийг шалгана.
 * @return {object} run summary
 */
async function runAutoVerifyCenterDonations(lookbackDays = null) {
  const db = admin.firestore();
  const checkpointRef = db.doc(CHECKPOINT_DOC);

  const forceAll = lookbackDays !== null;
  const windowStart = sweepStart(forceAll ? lookbackDays : SWEEP_DAYS);
  const windowStartTs = admin.firestore.Timestamp.fromDate(windowStart);
  const now = admin.firestore.Timestamp.now();
  const nowMs = now.toMillis();

  logger.info("AutoVerifyCenter started", {
    forceAll,
    windowStart: windowStart.toISOString(),
    now: now.toDate().toISOString(),
  });

  const pendingSnap = await db
    .collection("pending_invoices")
    .where("createdAt", ">=", windowStartTs)
    .get();

  const empty = {
    scanned: 0,
    checked: 0,
    autoVerified: 0,
    alreadyProcessed: 0,
    notPaid: 0,
    throttled: 0,
    errors: 0,
  };

  if (pendingSnap.empty) {
    await checkpointRef.set(
      {
        lastRunAt: now,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return empty;
  }

  let token;
  try {
    token = await getQPayToken();
  } catch (err) {
    logger.error("AutoVerifyCenter: Failed to get QPay token, aborting", {
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
    if (
      data.type !== "center_donation" &&
      data.type !== "tree_order" &&
      data.type !== "shuteen_order"
    ) {
      continue;
    }

    scanned++;

    if (data.status !== "pending") {
      alreadyProcessed++;
      continue;
    }

    // Насны дагуух давтамжийн хязгаар — цонхон дахь бүх нэхэмжлэхийг
    // ажиллалт болгонд QPay-аас асуухгүй.
    if (!forceAll && !dueForRecheck(data.createdAt, data[LAST_CHECK_FIELD], nowMs)) {
      throttled++;
      continue;
    }

    checked++;

    const invoiceId = data.invoice_id;
    if (!invoiceId) {
      logger.warn("AutoVerifyCenter: pending invoice missing invoice_id", {
        docId: doc.id,
      });
      errors++;
      continue;
    }

    try {
      const paymentStatus = await checkQPayPayment(invoiceId, token, SWEEP_QPAY_ATTEMPTS);
      if (paymentStatus !== "PAID") {
        notPaid++;
        // Хэзээ шалгаснаа тэмдэглэнэ — дараагийн ажиллалтууд давтамжийн
        // дүрмээр сийрэгжинэ, гэхдээ цонхоос гарах хүртэл шалгасаар байна.
        await doc.ref.update({ [LAST_CHECK_FIELD]: now });
        continue;
      }

      if (data.type === "shuteen_order") {
        const { orderId } = await recordShuteenOrderPaid(db, doc.ref, data);
        logger.info("AutoVerifyCenter: shuteen order credited", {
          docId: doc.id,
          invoiceId,
          shuteen_order_id: orderId,
        });
      } else if (data.type === "tree_order") {
        const { orderId } = await recordTreeOrderPaid(db, doc.ref, data);
        logger.info("AutoVerifyCenter: tree order credited", {
          docId: doc.id,
          invoiceId,
          tree_order_id: orderId,
        });
      } else {
        const { donationId } = await recordCenterDonationPaid(db, doc.ref, data);
        logger.info("AutoVerifyCenter: donation credited", {
          docId: doc.id,
          invoiceId,
          donation_id: donationId,
        });
      }
      autoVerified++;
      autoVerifiedIds.push(doc.id);

      // Gentle pacing against QPay rate limits.
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (err) {
      errors++;
      logger.error("AutoVerifyCenter: Error processing invoice", {
        docId: doc.id,
        invoiceId,
        error: err.message,
      });
      try {
        await doc.ref.update({ [LAST_CHECK_FIELD]: now });
      } catch (stampErr) {
        logger.warn("AutoVerifyCenter: failed to stamp last check", {
          docId: doc.id,
          error: stampErr.message,
        });
      }
    }
  }

  await checkpointRef.set(
    {
      lastRunAt: now,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastRunStats: {
        scanned, checked, autoVerified, alreadyProcessed, notPaid, throttled, errors,
      },
    },
    { merge: true },
  );

  await db.collection("auto_verify_center_logs").add({
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
    scanned,
    checked,
    autoVerified,
    alreadyProcessed,
    notPaid,
    throttled,
    errors,
    autoVerifiedIds,
  };
  logger.info("AutoVerifyCenter completed", summary);
  return summary;
}

/** Manual re-check of the last 7 days (HTTP). */
exports.initAutoVerifyCenterDonations = onRequest({
  region: "asia-northeast1",
  memory: "512MiB",
  timeoutSeconds: 540,
  maxInstances: 1,
}, async (req, res) => {
  return cors(req, res, async () => {
    try {
      const days = Math.max(1, Math.floor(Number(req.query && req.query.days) || 7));
      const result = await runAutoVerifyCenterDonations(days);
      return res.status(200).json({ success: true, days, ...result });
    } catch (err) {
      logger.error("initAutoVerifyCenterDonations failed", {
        error: err.message,
        stack: err.stack,
      });
      return res.status(500).json({ success: false, error: err.message });
    }
  });
});

/** Every 30 minutes — resume from checkpoint and credit any missed payments. */
exports.scheduledAutoVerifyCenterDonations = onSchedule({
  schedule: "every 30 minutes",
  timeZone: "Asia/Ulaanbaatar",
  region: "asia-northeast1",
  memory: "512MiB",
  timeoutSeconds: 540,
}, async () => {
  try {
    const result = await runAutoVerifyCenterDonations();
    logger.info("Scheduled auto-verify center donations completed", result);
  } catch (err) {
    logger.error("Scheduled auto-verify center donations failed", {
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }
});
