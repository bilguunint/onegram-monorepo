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

const CHECKPOINT_DOC = "system_config/autoVerifyCenterCheckpoint";

/**
 * autoVerifyCenterDonations
 * -------------------------
 * Safety net for the center-donation flow. QPay calls centerDonationCallback
 * after payment, but if that webhook never fires (and the user already left
 * the payment screen so the app's self-heal poll stopped), the donation would
 * be left unrecorded even though the buyer paid.
 *
 * Mirrors autoVerifyInstallments: scans recently-created `pending_invoices`
 * that are still "pending", asks QPay whether they were actually PAID, and
 * applies the same idempotent crediting via the shared recordCenterDonationPaid
 * helper. Queries by createdAt range + checkpoint only (no composite index).
 *
 * @param {Date|null} sinceDate - check invoices created since this date;
 *   null → resume from the stored checkpoint.
 * @return {object} run summary
 */
async function runAutoVerifyCenterDonations(sinceDate = null) {
  const db = admin.firestore();
  const checkpointRef = db.doc(CHECKPOINT_DOC);
  const checkpointSnap = await checkpointRef.get();

  let lastCheckedAt;
  if (sinceDate) {
    lastCheckedAt = admin.firestore.Timestamp.fromDate(sinceDate);
  } else if (checkpointSnap.exists && checkpointSnap.data().lastCheckedAt) {
    lastCheckedAt = checkpointSnap.data().lastCheckedAt;
  } else {
    lastCheckedAt = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    );
  }
  const now = admin.firestore.Timestamp.now();

  logger.info("AutoVerifyCenter started", {
    lastCheckedAt: lastCheckedAt.toDate().toISOString(),
    now: now.toDate().toISOString(),
  });

  const pendingSnap = await db
    .collection("pending_invoices")
    .where("createdAt", ">=", lastCheckedAt)
    .where("createdAt", "<=", now)
    .get();

  const empty = {
    checked: 0,
    autoVerified: 0,
    alreadyProcessed: 0,
    notPaid: 0,
    errors: 0,
  };

  if (pendingSnap.empty) {
    await checkpointRef.set(
      {
        lastCheckedAt: now,
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

  let checked = 0;
  let autoVerified = 0;
  let alreadyProcessed = 0;
  let notPaid = 0;
  let errors = 0;
  const autoVerifiedIds = [];

  for (const doc of pendingSnap.docs) {
    const data = doc.data();
    if (data.type !== "center_donation") continue;

    checked++;

    if (data.status !== "pending") {
      alreadyProcessed++;
      continue;
    }

    const invoiceId = data.invoice_id;
    if (!invoiceId) {
      logger.warn("AutoVerifyCenter: pending invoice missing invoice_id", {
        docId: doc.id,
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

      const { donationId } = await recordCenterDonationPaid(db, doc.ref, data);
      autoVerified++;
      autoVerifiedIds.push(doc.id);
      logger.info("AutoVerifyCenter: donation credited", {
        docId: doc.id,
        invoiceId,
        donation_id: donationId,
      });

      // Gentle pacing against QPay rate limits.
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (err) {
      errors++;
      logger.error("AutoVerifyCenter: Error processing invoice", {
        docId: doc.id,
        invoiceId,
        error: err.message,
      });
    }
  }

  await checkpointRef.set(
    {
      lastCheckedAt: now,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastRunStats: { checked, autoVerified, alreadyProcessed, notPaid, errors },
    },
    { merge: true },
  );

  await db.collection("auto_verify_center_logs").add({
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

  const summary = {
    checked,
    autoVerified,
    alreadyProcessed,
    notPaid,
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
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const result = await runAutoVerifyCenterDonations(sevenDaysAgo);
      return res.status(200).json({ success: true, ...result });
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
