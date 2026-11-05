const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { logger } = require("firebase-functions");
const { toDate, ubDayDiff } = require("../utils/ubDate");

/**
 * installmentReminderService
 * --------------------------
 * Өдөрт хоёр удаа (10:00, 20:00 УБ) идэвхтэй хуваан төлөлтүүдийг шалгаж, ЗӨВХӨН
 * удаан хугацаанд төлбөр хийгээгүй хэрэглэгчид НЭГ зөөлөн сануулга илгээнэ.
 *
 * Бодлого (2026-11-05):
 *   - Хуваариас хоцорсон эсэхийг огт дурддаггүй, "N өдрийн төлбөр хүлээгдэж
 *     байна", "цуцлагдах эрсдэлтэй" гэх мэт шаардсан өнгө аястай мэдэгдэл
 *     ИЛГЭЭХГҮЙ. Өмнөх хувилбарууд өдөрт 2 удаа сануулж, хэрэглэгчид дарамт
 *     гэж хүлээн авч plan-аа цуцалдаг байв (нэг хэрэглэгчид 126 хоногт 250
 *     сануулга очсон кейс).
 *   - Сүүлийн төлбөрөөс хойш NUDGE_DAYS (3) хоног төлөөгүй бол зөөлөн
 *     "өнөөдөр төлөх үү?" сануулга, төлөхгүй л бол NUDGE_REPEAT_DAYS (7)
 *     хоног тутамд давтана (3, 10, 17, 24 дэх хоног). QUIET_DAYS (30) хүрвэл
 *     нэг "үргэлжлүүлэх үү?" сануулга, дараа нь чимээгүй. Сард дээд тал нь 5.
 *     Хэрэглэгч төлбөр хийвэл тоолуур шинээр эхэлнэ. purchase.last_reminder_at
 *     ба last_reminder_kind талбараар хянана.
 *   - Талархал, өдөр тутмын давтагдах сануулга байхгүй.
 *
 * Бүх огнооны тооцоо УБ цагаар (utils/ubDate).
 */

// Сүүлийн төлбөрөөс хойш хэдэн хоног төлөөгүй бол эхний зөөлөн сануулга.
const NUDGE_DAYS = 3;
// Төлөхгүй л бол зөөлөн сануулгыг хэдэн хоног тутамд давтах вэ.
const NUDGE_REPEAT_DAYS = 7;
// Хэдэн хоног чимээгүй байвал хоёр дахь (сүүлийн) сануулга.
const QUIET_DAYS = 30;

// MNT дүнг "1 234 567₮" хэлбэрээр форматлана.
function formatMNT(n) {
  if (n == null || !isFinite(n)) return "0₮";
  const s = Math.round(Number(n)).toLocaleString("mn-MN");
  return `${s}₮`;
}

// Сүүлийн төлбөрийн огноо: payments[]-ийн хамгийн сүүлийн paid_at, байхгүй
// бол started_at (1 дэх өдрийн төлбөр).
function lastPaidAt(purchase) {
  const payments = Array.isArray(purchase.payments) ? purchase.payments : [];
  let last = null;
  for (const p of payments) {
    const d = toDate(p.paid_at);
    if (d && (!last || d > last)) last = d;
  }
  return last || toDate(purchase.started_at);
}

// Сүүлийн төлбөрөөс хойш өнгөрсөн бүтэн хоног (УБ). Мэдэхгүй бол null.
function daysSinceLastPayment(purchase, now = new Date()) {
  const last = lastPaidAt(purchase);
  if (!last) return null;
  return ubDayDiff(now, last);
}

/**
 * Тухайн хуваан төлөлтөд сануулга илгээх эсэхийг шийдэж, илгээх бол
 * (title, body, kind)-ийг буцаана. Илгээхгүй бол null.
 *
 *   gap = сүүлийн төлбөрөөс хойшхи хоног
 *   - gap < NUDGE_DAYS                              → null
 *   - NUDGE_DAYS ≤ gap < QUIET_DAYS:
 *       сүүлийн сануулгаас NUDGE_REPEAT_DAYS болоогүй → null
 *       эс бөгөөс                                    → "nudge"
 *   - gap ≥ QUIET_DAYS:
 *       энэ завсарлагад "quiet" аль хэдийн явсан     → null
 *       эс бөгөөс (nudge явсан ч)                    → "quiet"
 *
 * @param {object} purchase - product_purchases баримтын өгөгдөл
 * @param {Date} [now] - одоо (тестэд зориулж солих боломжтой)
 * @return {{title: string, body: string, kind: string}|null} мэдэгдэл
 */
function buildMessage(purchase, now = new Date()) {
  const gap = daysSinceLastPayment(purchase, now);
  if (gap == null || gap < NUDGE_DAYS) return null;

  const last = lastPaidAt(purchase);
  const reminded = toDate(purchase.last_reminder_at);
  const remindedThisGap = !!(reminded && last && reminded > last);
  const remindedKind = remindedThisGap ? purchase.last_reminder_kind : null;

  const productName =
    (purchase.product_snapshot && purchase.product_snapshot.name) || "Бараа";
  // Ердийн хуваан төлөлт: хоног ба өдрийн төгрөг. Алтан эдлэл: грамм.
  const isGold = purchase.purchase_type === "gold_installment";
  const progress = isGold ?
    `${Number(purchase.paid_grams || 0)}/${Number(purchase.total_grams || 0)} гр төлөгдсөн` :
    `${Number(purchase.paid_days || 0)}/${Number(purchase.total_days || 0)} өдөр төлөгдсөн`;
  const todayAmount = isGold ?
    `${Number(purchase.daily_grams || 0)} гр` :
    formatMNT(Number(purchase.daily_payment || 0));

  if (gap >= QUIET_DAYS) {
    if (remindedKind === "quiet") return null;
    return {
      title: "Хуваан төлөлтөө үргэлжлүүлэх үү?",
      body:
        `${productName} — сүүлийн төлбөрөөс хойш ${gap} хоног өнгөрчээ. ` +
        `${progress}. Өөрт тохирох үедээ ` +
        `(өдрийн төлбөр ${todayAmount}) үргэлжлүүлээрэй.`,
      kind: "quiet",
    };
  }

  if (remindedThisGap && ubDayDiff(now, reminded) < NUDGE_REPEAT_DAYS) {
    return null;
  }
  return {
    title: "Өнөөдрийн хуваан төлөлтөө хийх үү?",
    body:
      `${productName} — ${progress}. ` +
      `Өнөөдөр ${todayAmount} төлөөд үргэлжлүүлж болно.`,
    kind: "nudge",
  };
}

// Идэвхтэй хуваан төлөлт бүрийг шалгаж, сануулга хэрэгтэй хэрэглэгчид
// in-app notification баримт үүсгэж, FCM мессеж илгээж, purchase дээр
// last_reminder_at тэмдэглэнэ (дахин сануулахгүйн тулд).
async function sendInstallmentReminders() {
  const db = admin.firestore();
  const startedAt = Date.now();
  const now = new Date();
  logger.info("▶️  Installment reminder run start");

  const snap = await db
    .collection("product_purchases")
    .where("status", "==", "active")
    .where("purchase_type", "in", ["installment", "gold_installment"])
    .get();

  logger.info(`Active installment purchases: ${snap.size}`);

  const FIRESTORE_BATCH = 400;
  const FCM_BATCH = 500;

  const fcmMessages = [];
  let currentBatch = db.batch();
  let pendingWrites = 0;
  let savedCount = 0;
  const stats = {
    nudge: 0,
    quiet: 0,
    skippedOnTrack: 0,
    skippedNoUser: 0,
  };

  for (let i = 0; i < snap.docs.length; i++) {
    const purchase = snap.docs[i].data();
    const userId = purchase.user_id;
    if (!userId) {
      stats.skippedNoUser++;
      continue;
    }

    const msg = buildMessage(purchase, now);
    // Саяхан төлсөн, эсвэл энэ завсарлагад аль хэдийн сануулсан — юу ч илгээхгүй.
    if (!msg) {
      stats.skippedOnTrack++;
      continue;
    }
    stats[msg.kind]++;

    // In-app notification doc (баярлалаа болон сануулга хоёуланд нь — ингэснээр
    // хэрэглэгчийн мэдэгдлийн жагсаалтад бичлэг үлдэнэ).
    const notifRef = db
      .collection("users")
      .doc(userId)
      .collection("notifications")
      .doc();
    currentBatch.set(notifRef, {
      title: msg.title,
      body: msg.body,
      type: "installment_reminder",
      kind: msg.kind,
      purchase_id: snap.docs[i].id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
    });
    // Энэ завсарлагад дахин сануулахгүй.
    currentBatch.update(snap.docs[i].ref, {
      last_reminder_at: admin.firestore.FieldValue.serverTimestamp(),
      last_reminder_kind: msg.kind,
    });
    pendingWrites += 2;
    savedCount++;

    if (pendingWrites >= FIRESTORE_BATCH) {
      await currentBatch.commit();
      currentBatch = db.batch();
      pendingWrites = 0;
    }

    // FCM token-г уншина (мэдэгдэл авах хэрэглэгч бүрт 1 баримт).
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

  // FCM-ийг 500-аар бүлэглэж илгээнэ (sendEach-ийн хязгаар).
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

// 10:00 Asia/Ulaanbaatar — өдөрт нэг удаа.
const installmentReminderMorning = onSchedule(
  {
    schedule: "0 10 * * *",
    timeZone: "Asia/Ulaanbaatar",
    memory: "512MiB",
    timeoutSeconds: 540,
    maxInstances: 1,
  },
  async () => sendInstallmentReminders(),
);

// 20:00 Asia/Ulaanbaatar — ижил логик. Өглөө сануулсан бол last_reminder_at
// тэмдэглэгдсэн тул орой юу ч илгээхгүй; зөвхөн өглөөний ажиллалт алдаж
// амжаагүй үед нөхөж ажиллана. (Устгахын оронд үлдээсэн: deploy дээр функц
// устгах интерактив баталгаажуулалт шаардагддаг.)
const installmentReminderEvening = onSchedule(
  {
    schedule: "0 20 * * *",
    timeZone: "Asia/Ulaanbaatar",
    memory: "512MiB",
    timeoutSeconds: 540,
    maxInstances: 1,
  },
  async () => sendInstallmentReminders(),
);

// Гар аргаар ажиллуулах (admin/тест): POST/GET
const installmentReminderManual = onRequest(
  {
    region: "asia-northeast1",
    memory: "512MiB",
    timeoutSeconds: 540,
  },
  async (req, res) => {
    try {
      const result = await sendInstallmentReminders();
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
  // Тест / судалгаанд ашиглах цэвэр функцууд.
  buildMessage,
  lastPaidAt,
  daysSinceLastPayment,
  NUDGE_DAYS,
  NUDGE_REPEAT_DAYS,
  QUIET_DAYS,
};
