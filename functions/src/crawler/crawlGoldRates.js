/*
// DEPRECATED: This file has been replaced by crawlGoldRate.js
// Keeping for reference only - this code is no longer active

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

function formatDate(date) {
  return new Date(date).toISOString().split("T")[0];
}

function toNumber(val) {
  if (val === null || val === undefined) return null;
  const n = Number(String(val).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

// Helper: update summary document in rates collection for given metalId
async function updateRatesSummary(db, metalId) {
  // Get latest two entries from metal_rates for this metal
  const latestSnap = await db
    .collection("metal_rates")
    .where("metal_id", "==", metalId)
    .orderBy("date", "desc")
    .limit(2)
    .get();

  if (latestSnap.empty) {
    logger.warn("No metal_rates found to update summary", { metalId });
    return;
  }

  const docs = latestSnap.docs;
  const latestRate = Number(docs[0].data().rate) || 0;
  const prevRate = docs.length > 1 ? Number(docs[1].data().rate) || 0 : 0;
  const changes = Number((latestRate - prevRate).toFixed(2));

  // Try update rates doc by metal_id; if not found and metalId=1, fallback to existing type:'gold'
  const ratesCol = db.collection("rates");
  let rateDocSnap = await ratesCol.where("metal_id", "==", metalId).limit(1).get();

  if (rateDocSnap.empty && metalId === 1) {
    // backward compatibility
    rateDocSnap = await ratesCol.where("type", "==", "gold").limit(1).get();
  }

  if (!rateDocSnap.empty) {
    const ref = rateDocSnap.docs[0].ref;
    await ref.update({
      metal_id: metalId,
      rate: latestRate,
      changes,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    logger.info("Updated rates summary", { metalId, latestRate, prevRate, changes });
  } else {
    await ratesCol.add({
      metal_id: metalId,
      rate: latestRate,
      changes,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    logger.info("Created rates summary", { metalId, latestRate, changes });
  }
}

exports.crawlGoldRates = onSchedule(
  { schedule: "every 1 hours", timeZone: "Asia/Ulaanbaatar" },
  async (event) => {
    const db = admin.firestore();

    const today = new Date();
    const prev = new Date(today);
    prev.setDate(prev.getDate() - 3);

    const url = `https://www.mongolbank.mn/mn/gold-and-silver-price/data?startDate=${formatDate(
      prev,
    )}&endDate=${formatDate(today)}`;

    logger.info("Cron job started", { start: new Date().toISOString(), url });

    try {
      const response = await axios.post(
        url,
        {},
        {
          headers: { "Content-Type": "application/json" },
          timeout: 20000,
        },
      );

      const payload = response.data;
      const data = payload && payload.data;
      if (!Array.isArray(data)) {
        logger.error("Invalid data format from API", { payload });
        return;
      }

      // Track which metalIds got new data inserted during this run
      const inserted = { 1: false, 2: false };

      for (const item of data) {
        const rateDate = item["RATE_DATE"]; // e.g. 2025-08-09
        if (!rateDate) continue;

        // GOLD (metal_id:1)
        const goldBuyStr = item["GOLD_BUY"]; // may be like "345,678.90"
        if (goldBuyStr) {
          const goldBuy = toNumber(goldBuyStr);
          if (goldBuy !== null) {
            const goldDocRef = db.collection("metal_rates").doc(`1_${rateDate}`);
            const goldSnap = await goldDocRef.get();
            if (!goldSnap.exists) {
              await goldDocRef.set({
                metal_id: 1,
                date: admin.firestore.Timestamp.fromDate(new Date(rateDate)),
                rate: goldBuy,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
              });
              logger.info("Inserted GOLD rate", { rateDate, goldBuy });
              inserted[1] = true;
            } else {
              logger.debug("GOLD rate already exists", { rateDate });
            }
          } else {
            logger.warn("Invalid GOLD_BUY value", { rateDate, goldBuyStr });
          }
        }

        // USD rate (metal_id:2) — replace this with actual USD source in future
        // For now, if API provides SILVER_BUY and you want USD instead, integrate the USD API.
        const usdStr = item["USD_RATE"] || item["SILVER_BUY"]; // fallback if using existing field
        if (usdStr) {
          const usdRate = toNumber(usdStr);
          if (usdRate !== null) {
            const usdDocRef = db.collection("metal_rates").doc(`2_${rateDate}`);
            const usdSnap = await usdDocRef.get();
            if (!usdSnap.exists) {
              await usdDocRef.set({
                metal_id: 2,
                date: admin.firestore.Timestamp.fromDate(new Date(rateDate)),
                rate: usdRate,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
              });
              logger.info("Inserted USD rate (metal_id:2)", { rateDate, usdRate });
              inserted[2] = true;
            } else {
              logger.debug("USD rate already exists", { rateDate });
            }
          } else {
            logger.warn("Invalid USD value", { rateDate, usdStr });
          }
        }
      }

      // Update summaries in rates collection based on newly inserted data
      if (inserted[1]) {
        await updateRatesSummary(db, 1);
      }
      if (inserted[2]) {
        await updateRatesSummary(db, 2);
      }

      logger.info("Crawl job completed.");
    } catch (error) {
      logger.error("Error during crawl", {
        message: error.message,
        stack: error.stack,
        response: error.response && error.response.data,
      });
      throw error;
    }
  },
);
*/
