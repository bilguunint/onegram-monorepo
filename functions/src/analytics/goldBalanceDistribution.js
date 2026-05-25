const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

/**
 * Хэрэглэгчдийн balance.gold-г багцлан тоолж,
 * gold_balance_distribution collection-д хадгална.
 *
 * Жишээ: 0.1гр → 234 хүн, 100гр → 4 хүн гэх мэт.
 */
async function calculateGoldBalanceDistribution() {
  const db = admin.firestore();

  logger.info("GoldBalanceDistribution: Starting calculation...");

  // Бүх users-г авах
  const usersSnap = await db.collection("users").get();

  logger.info(`GoldBalanceDistribution: Found ${usersSnap.size} users`);

  // balance.gold бүрээр хэрэглэгчдийг тоолох
  const distribution = {}; // { "0.1": 234, "100": 4, ... }
  let totalUsers = 0;
  let usersWithGold = 0;
  let usersWithoutGold = 0;
  let totalGoldInSystem = 0;

  for (const doc of usersSnap.docs) {
    totalUsers++;
    const data = doc.data();
    const goldBalance = data.balance && typeof data.balance.gold === "number" ?
      data.balance.gold :
      0;

    if (goldBalance <= 0) {
      usersWithoutGold++;
      continue;
    }

    usersWithGold++;
    totalGoldInSystem += goldBalance;

    // 6 оронтой нарийвчлал ашиглан key үүсгэх
    const key = parseFloat(goldBalance.toFixed(6)).toString();

    if (!distribution[key]) {
      distribution[key] = 0;
    }
    distribution[key]++;
  }

  // Ихээс бага руу эрэмбэлсэн array болгох
  const sortedDistribution = Object.entries(distribution)
    .map(([gold, count]) => ({ gold: parseFloat(gold), count }))
    .sort((a, b) => b.gold - a.gold);

  const result = {
    calculated_at: admin.firestore.FieldValue.serverTimestamp(),
    totalUsers,
    usersWithGold,
    usersWithoutGold,
    totalGoldInSystem: parseFloat(totalGoldInSystem.toFixed(6)),
    uniqueBalanceCount: sortedDistribution.length,
    distribution: sortedDistribution,
  };

  // Өнөөдрийн огноогоор document хадгалах
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  await db.collection("gold_balance_distribution").doc(dateKey).set(result);

  // latest document-д бас хадгалах (хамгийн сүүлийн мэдээллийг хурдан авахад)
  await db.collection("gold_balance_distribution").doc("latest").set(result);

  logger.info("GoldBalanceDistribution: Completed", {
    dateKey,
    totalUsers,
    usersWithGold,
    usersWithoutGold,
    totalGoldInSystem: result.totalGoldInSystem,
    uniqueBalanceCount: sortedDistribution.length,
  });

  return result;
}

/**
 * Гараар ажиллуулах init function (HTTP)
 */
exports.initGoldBalanceDistribution = onRequest({
  memory: "1GiB",
  timeoutSeconds: 540,
  maxInstances: 1,
}, async (req, res) => {
  return cors(req, res, async () => {
    try {
      const result = await calculateGoldBalanceDistribution();
      return res.status(200).json({
        success: true,
        ...result,
        calculated_at: new Date().toISOString(),
      });
    } catch (err) {
      logger.error("initGoldBalanceDistribution failed", { error: err.message, stack: err.stack });
      return res.status(500).json({ success: false, error: err.message });
    }
  });
});

/**
 * 24 цагт нэг автоматаар ажиллах (өглөө 08:00 MNT)
 */
exports.scheduledGoldBalanceDistribution = onSchedule({
  schedule: "0 0 * * *", // 00:00 UTC = 08:00 MNT
  timeZone: "UTC",
  memory: "1GiB",
  timeoutSeconds: 540,
}, async () => {
  try {
    const result = await calculateGoldBalanceDistribution();
    logger.info("Scheduled gold balance distribution completed", {
      usersWithGold: result.usersWithGold,
      totalGoldInSystem: result.totalGoldInSystem,
    });
  } catch (err) {
    logger.error("Scheduled gold balance distribution failed", {
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }
});
