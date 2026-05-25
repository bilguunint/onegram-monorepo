const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { logger } = require("firebase-functions");

// Convert any Firestore-ish timestamp shape into a JS Date, or null.
function tsToDate(t) {
  if (!t) return null;
  if (typeof t.toDate === "function") return t.toDate();
  if (typeof t === "string") {
    const d = new Date(t);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof t.seconds === "number") return new Date(t.seconds * 1000);
  return null;
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// True when the purchase has at least one `payments[]` entry whose paid_at
// falls on today's calendar date (local server time).
function paidToday(purchase) {
  const payments = Array.isArray(purchase.payments) ? purchase.payments : [];
  const today = startOfDay(new Date()).getTime();
  for (const p of payments) {
    const d = tsToDate(p.paid_at);
    if (d && startOfDay(d).getTime() === today) return true;
  }
  return false;
}

// Number of days the user *should* have paid by today (1-based, capped at
// total_days). null when started_at is unknown.
function expectedPaidDays(purchase) {
  const start = tsToDate(purchase.started_at);
  if (!start) return null;
  const elapsed = Math.floor(
    (startOfDay(new Date()).getTime() - startOfDay(start).getTime()) /
      86400000,
  );
  const total = Number(purchase.total_days || 0);
  return Math.min(total, Math.max(0, elapsed) + 1);
}

// Format MNT amount as "1 234 567₮" (no decimals).
function formatMNT(n) {
  if (n == null || !isFinite(n)) return "0₮";
  const s = Math.round(Number(n)).toLocaleString("mn-MN");
  return `${s}₮`;
}

// Pick the next-day's invoice amount. The final day adjusts to the
// remaining residual so the sum equals total_price exactly — matches the
// behaviour in createInstallmentPayment.js.
function nextInvoiceAmount(purchase) {
  const paidDays = Number(purchase.paid_days || 0);
  const totalDays = Number(purchase.total_days || 0);
  const dailyPayment = Number(purchase.daily_payment || 0);
  const totalPrice = Number(purchase.total_price || 0);
  const paidAmount = Number(purchase.paid_amount || 0);
  if (paidDays + 1 >= totalDays) {
    return Math.max(0, totalPrice - paidAmount);
  }
  return dailyPayment;
}

// Build a (title, body) pair tailored to slot + payment state. Three cases:
//   1. Paid today           → thank-you
//   2. Not paid, behind     → urgent reminder with day-count
//   3. Not paid, on track   → gentle reminder with daily amount
function buildMessage(slot, purchase) {
  const productName =
    (purchase.product_snapshot && purchase.product_snapshot.name) || "Бараа";
  const paidDays = Number(purchase.paid_days || 0);
  const totalDays = Number(purchase.total_days || 0);
  const expected = expectedPaidDays(purchase) || paidDays;
  const behind = Math.max(0, expected - paidDays);
  const amount = nextInvoiceAmount(purchase);

  if (paidToday(purchase)) {
    return {
      title: slot === "morning" ?
        "✅ Өнөөдрийн төлбөр төлөгдсөн" :
        "🙌 Өнөөдрийн төлбөр амжилттай",
      body:
        `${productName} — ${paidDays}/${totalDays} өдөр төллөө. ` +
        "Ийм л үргэлжлүүлээрэй!",
      kind: "thanks",
    };
  }

  if (behind > 0) {
    return {
      title: `⚠️ Хуваан төлөлт ${behind} өдөр хоцорсон`,
      body:
        `${productName}-ийн төлбөр хоцорчээ. Plan-аа тасрахаас сэргийлэхийн ` +
        `тулд өнөөдөр ${formatMNT(amount)} төлнө үү.`,
      kind: "overdue",
    };
  }

  return {
    title: slot === "morning" ?
      "💰 Өнөөдрийн төлбөрөө хийе" :
      "🌙 Өдөр дуусахын өмнө сануулга",
    body:
      `${productName} — өнөөдөр ${formatMNT(amount)} төлнө. ` +
      `${paidDays + 1}/${totalDays} өдөр.`,
    kind: "reminder",
  };
}

// Send reminders for one slot (morning | evening). Touches every active
// installment purchase exactly once, saves an in-app notification doc per
// user, and fires the matching FCM message when a token is available.
async function sendInstallmentReminders(slot) {
  const db = admin.firestore();
  const startedAt = Date.now();

  logger.info(`▶️  Installment reminder run start [slot=${slot}]`);

  const snap = await db
    .collection("product_purchases")
    .where("status", "==", "active")
    .where("purchase_type", "==", "installment")
    .get();

  logger.info(`Active installment purchases: ${snap.size}`);

  const FIRESTORE_BATCH = 400;
  const FCM_BATCH = 500;

  const fcmMessages = [];
  let currentBatch = db.batch();
  let pendingWrites = 0;
  let savedCount = 0;
  const stats = { thanks: 0, reminder: 0, overdue: 0, skippedNoUser: 0 };

  for (let i = 0; i < snap.docs.length; i++) {
    const purchase = snap.docs[i].data();
    const userId = purchase.user_id;
    if (!userId) {
      stats.skippedNoUser++;
      continue;
    }

    const msg = buildMessage(slot, purchase);
    stats[msg.kind]++;

    // In-app notification doc (always — both for paid-today thanks and the
    // unpaid reminders so the user has a record in their notification list).
    const notifRef = db
      .collection("users")
      .doc(userId)
      .collection("notifications")
      .doc();
    currentBatch.set(notifRef, {
      title: msg.title,
      body: msg.body,
      type: "installment_reminder",
      slot,
      kind: msg.kind,
      purchase_id: snap.docs[i].id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
    });
    pendingWrites++;
    savedCount++;

    if (pendingWrites >= FIRESTORE_BATCH) {
      await currentBatch.commit();
      currentBatch = db.batch();
      pendingWrites = 0;
    }

    // Fetch FCM token (cheap — 1 doc lookup per purchase; could be optimised
    // by batching but installment volume is low for now).
    try {
      const userDoc = await db.collection("users").doc(userId).get();
      if (userDoc.exists) {
        const u = userDoc.data() || {};
        const fcmToken = u.fcm_token ||
          (Array.isArray(u.fcm_tokens) ? u.fcm_tokens[0] : null);
        if (fcmToken) {
          fcmMessages.push({
            token: fcmToken,
            notification: { title: msg.title, body: msg.body },
            data: {
              type: "installment_reminder",
              slot,
              kind: msg.kind,
              purchase_id: snap.docs[i].id,
            },
            android: {
              notification: {
                icon: "ic_notification",
                color: "#FFD700",
                sound: "default",
              },
              priority: "high",
            },
            apns: {
              payload: { aps: { sound: "default", badge: 1 } },
            },
          });
        }
      }
    } catch (err) {
      logger.warn("Failed to load user for FCM token", {
        userId,
        error: err.message,
      });
    }
  }

  if (pendingWrites > 0) {
    await currentBatch.commit();
  }

  // Fan out FCM in chunks of 500 (FCM sendEach limit).
  let fcmSent = 0;
  let fcmFailed = 0;
  for (let i = 0; i < fcmMessages.length; i += FCM_BATCH) {
    const chunk = fcmMessages.slice(i, i + FCM_BATCH);
    try {
      const resp = await admin.messaging().sendEach(chunk);
      fcmSent += resp.successCount;
      fcmFailed += resp.failureCount;
    } catch (err) {
      logger.error("FCM batch send failed", { error: err.message });
      fcmFailed += chunk.length;
    }
  }

  const result = {
    success: true,
    slot,
    totalActive: snap.size,
    saved: savedCount,
    fcmSent,
    fcmFailed,
    breakdown: stats,
    durationMs: Date.now() - startedAt,
  };
  logger.info("✅ Installment reminder run complete", result);
  return result;
}

// 10:00 Asia/Ulaanbaatar
const installmentReminderMorning = onSchedule(
  {
    schedule: "0 10 * * *",
    timeZone: "Asia/Ulaanbaatar",
    memory: "512MiB",
    timeoutSeconds: 540,
    maxInstances: 1,
  },
  async () => sendInstallmentReminders("morning"),
);

// 20:00 Asia/Ulaanbaatar
const installmentReminderEvening = onSchedule(
  {
    schedule: "0 20 * * *",
    timeZone: "Asia/Ulaanbaatar",
    memory: "512MiB",
    timeoutSeconds: 540,
    maxInstances: 1,
  },
  async () => sendInstallmentReminders("evening"),
);

// Manual trigger for ad-hoc/admin testing: POST/GET ?slot=morning|evening
const installmentReminderManual = onRequest(
  {
    region: "asia-northeast1",
    memory: "512MiB",
    timeoutSeconds: 540,
  },
  async (req, res) => {
    const slot = (req.query && req.query.slot) === "evening" ?
      "evening" :
      "morning";
    try {
      const result = await sendInstallmentReminders(slot);
      res.status(200).json(result);
    } catch (err) {
      logger.error("Manual installment reminder failed", { error: err.message });
      res.status(500).json({ error: err.message });
    }
  },
);

module.exports = {
  installmentReminderMorning,
  installmentReminderEvening,
  installmentReminderManual,
  sendInstallmentReminders,
};
