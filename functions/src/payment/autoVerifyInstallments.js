const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const {
  getQPayToken,
  checkQPayPayment,
  applyPaidUpToDay,
  createPurchaseFromInit,
} = require("./installmentShared");

const CHECKPOINT_DOC = "system_config/autoVerifyInstallmentCheckpoint";

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
 * This mirrors autoVerifyOrders: every 30 minutes it scans recently-created
 * `pending_invoices` that are still "pending", asks QPay whether they were
 * actually PAID, and applies the same idempotent crediting the callbacks
 * would have done — using the shared installmentShared helpers so the logic
 * can never drift from the realtime callbacks.
 *
 * @param {Date|null} sinceDate - check invoices created since this date.
 *   null → resume from the stored checkpoint.
 * @return {object} run summary
 */
async function runAutoVerifyInstallments(sinceDate = null) {
  const db = admin.firestore();

  const checkpointRef = db.doc(CHECKPOINT_DOC);
  const checkpointSnap = await checkpointRef.get();

  let lastCheckedAt;
  let isInitialRun = false;
  if (sinceDate) {
    lastCheckedAt = admin.firestore.Timestamp.fromDate(sinceDate);
    isInitialRun = true;
  } else if (checkpointSnap.exists && checkpointSnap.data().lastCheckedAt) {
    lastCheckedAt = checkpointSnap.data().lastCheckedAt;
  } else {
    // No checkpoint yet — look back over the last 7 days on first run.
    lastCheckedAt = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    );
    isInitialRun = true;
  }

  const now = admin.firestore.Timestamp.now();

  logger.info("AutoVerifyInstallments started", {
    isInitialRun,
    lastCheckedAt: lastCheckedAt.toDate().toISOString(),
    now: now.toDate().toISOString(),
  });

  // Query by createdAt range only (no composite index needed) — type/status
  // are filtered in the loop below, exactly like autoVerifyOrders.
  const pendingSnap = await db.collection("pending_invoices")
    .where("createdAt", ">=", lastCheckedAt)
    .where("createdAt", "<=", now)
    .get();

  const empty = { checked: 0, autoVerified: 0, alreadyProcessed: 0, notPaid: 0, errors: 0 };

  if (pendingSnap.empty) {
    logger.info("AutoVerifyInstallments: No pending invoices in range");
    await checkpointRef.set({
      lastCheckedAt: now,
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

  let checked = 0;
  let autoVerified = 0;
  let alreadyProcessed = 0;
  let notPaid = 0;
  let errors = 0;
  const autoVerifiedIds = [];

  for (const doc of pendingSnap.docs) {
    const data = doc.data();
    const type = data.type;

    // Only the installment flow — direct-order invoices are handled by
    // autoVerifyOrders.
    if (type !== "installment" && type !== "installment_init") {
      continue;
    }

    checked++;

    // Already credited by the realtime callback — skip without a QPay call.
    if (data.status !== "pending") {
      alreadyProcessed++;
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

    try {
      const paymentStatus = await checkQPayPayment(invoiceId, token);

      if (paymentStatus !== "PAID") {
        notPaid++;
        continue;
      }

      if (type === "installment_init") {
        // First day — create the purchase doc (idempotent).
        const { purchaseId, created } = await createPurchaseFromInit(
          db,
          doc.ref,
          data,
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
        const result = await applyPaidUpToDay(db, purchaseId, dayNo);
        await doc.ref.update({
          status: "processed",
          paid_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          auto_verified: true,
          auto_verified_at: admin.firestore.FieldValue.serverTimestamp(),
          auto_verified_source: "scheduledAutoVerifyInstallments",
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
    }
  }

  await checkpointRef.set({
    lastCheckedAt: now,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastRunStats: { checked, autoVerified, alreadyProcessed, notPaid, errors },
  }, { merge: true });

  await db.collection("auto_verify_installment_logs").add({
    ran_at: admin.firestore.FieldValue.serverTimestamp(),
    range_from: lastCheckedAt,
    range_to: now,
    checked,
    autoVerified,
    alreadyProcessed,
    notPaid,
    errors,
    autoVerifiedIds,
  });

  const summary = { checked, autoVerified, alreadyProcessed, notPaid, errors, autoVerifiedIds };
  logger.info("AutoVerifyInstallments completed", summary);
  return summary;
}

/**
 * Manual init — re-check the last 7 days of installment invoices (HTTP).
 */
exports.initAutoVerifyInstallments = onRequest({
  region: "asia-northeast1",
  memory: "1GiB",
  timeoutSeconds: 540,
  maxInstances: 1,
}, async (req, res) => {
  return cors(req, res, async () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const result = await runAutoVerifyInstallments(sevenDaysAgo);
      return res.status(200).json({ success: true, ...result });
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
 * Every 30 minutes — resume from checkpoint and credit any missed payments.
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
