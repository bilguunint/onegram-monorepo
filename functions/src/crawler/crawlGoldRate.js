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

// Helper: update summary document in rates collection for gold
async function updateGoldRatesSummary(db) {
  // Get latest two entries from rates for gold
  const latestSnap = await db
    .collection("rates")
    .where("id", "==", 1)
    .orderBy("date", "desc")
    .limit(2)
    .get();

  if (latestSnap.empty) {
    logger.warn("No gold rates found to update summary");
    return;
  }

  const docs = latestSnap.docs;
  const latestRate = Number(docs[0].data().rate) || 0;
  const prevRate = docs.length > 1 ? Number(docs[1].data().rate) || 0 : 0;
  const changes = prevRate > 0 ? Number(((latestRate - prevRate) / prevRate * 100).toFixed(2)) : 0;

  // Update latest_rates collection
  const latestRatesCol = db.collection("latest_rates");
  const goldDocRef = latestRatesCol.doc("latest_gold_rate");
  const goldDoc = await goldDocRef.get();
  
  const goldData = {
    id: 1,
    rate: latestRate,
    changes,
    name: "Алт",
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  };
  
  if (goldDoc.exists) {
    await goldDocRef.update(goldData);
    logger.info("Updated latest_gold_rate document", { latestRate, changes });
  } else {
    goldData.created_at = admin.firestore.FieldValue.serverTimestamp();
    await goldDocRef.set(goldData);
    logger.info("Created latest_gold_rate document", { latestRate, changes });
  }

  // Send notification if there's a rate change
  if (changes !== 0) {
    await sendGoldPriceNotification(latestRate, changes);
  }
}

// Helper: send push notification about gold price change
async function sendGoldPriceNotification(rate, changes) {
  try {
    const isIncrease = changes > 0;
    const emoji = isIncrease ? "📈" : "📉";
    const changeText = isIncrease ? "өслөө" : "буурлаа";
    const formattedRate = new Intl.NumberFormat('mn-MN').format(rate);
    const formattedChanges = Math.abs(changes);
    
    const title = `${emoji} Алтны үнэ ${changeText}`;
    const body = `Алтны үнэ ${formattedRate}₮ болж ${formattedChanges}% ${changeText}`;

    const message = {
      topic: "all",
      notification: {
        title: title,
        body: body,
      },
      data: {
        type: "gold_price_update",
        rate: rate.toString(),
        changes: changes.toString(),
      },
      android: {
        notification: {
          icon: "ic_notification",
          color: "#FFD700", // Gold color
        },
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: "default",
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    logger.info("Gold price notification sent successfully", { 
      messageId: response,
      rate,
      changes,
      title,
      body,
    });
  } catch (error) {
    logger.error("Error sending gold price notification", {
      error: error.message,
      rate,
      changes,
    });
  }
}

exports.crawlGoldRates = onSchedule({
  schedule: "every 1 hours", 
  timeZone: "Asia/Ulaanbaatar",
  memory: "512MiB",
  timeoutSeconds: 300,
}, async (event) => {
    const db = admin.firestore();

    const today = new Date();
    const prev = new Date(today);
    prev.setDate(prev.getDate() - 3);

    const url = `https://www.mongolbank.mn/mn/gold-and-silver-price/data?startDate=${formatDate(
      prev,
    )}&endDate=${formatDate(today)}`;

    logger.info("Gold crawl job started", { start: new Date().toISOString(), url });

    try {
      const response = await axios.post(
        url,
        {},
        {
          headers: { "Content-Type": "application/json" },
          timeout: 30000,
        },
      );

      const payload = response.data;
      const data = payload && payload.data;
      if (!Array.isArray(data)) {
        logger.error("Invalid data format from API", { payload });
        return;
      }

      // Track if new gold data was inserted during this run
      let goldInserted = false;

      for (const item of data) {
        const rateDate = item["RATE_DATE"]; // e.g. 2025-08-09
        if (!rateDate) continue;

        // GOLD (id:1)
        const goldBuyStr = item["GOLD_BUY"]; // may be like "345,678.90"
        if (goldBuyStr) {
          const goldBuy = toNumber(goldBuyStr);
          if (goldBuy !== null) {
            const goldDocRef = db.collection("rates").doc(`1_${rateDate}`);
            const goldSnap = await goldDocRef.get();
            if (!goldSnap.exists) {
              // Calculate changes by comparing with previous rate
              let changes = 0;
              const prevGoldSnap = await db
                .collection("rates")
                .where("id", "==", 1)
                .where("date", "<", admin.firestore.Timestamp.fromDate(new Date(rateDate)))
                .orderBy("date", "desc")
                .limit(1)
                .get();
              
              if (!prevGoldSnap.empty) {
                const prevRate = prevGoldSnap.docs[0].data().rate;
                changes = prevRate > 0 ? Number(((goldBuy - prevRate) / prevRate * 100).toFixed(2)) : 0;
              }

              await goldDocRef.set({
                id: 1,
                date: admin.firestore.Timestamp.fromDate(new Date(rateDate)),
                rate: goldBuy,
                changes,
                name: "Алт",
                created_at: admin.firestore.FieldValue.serverTimestamp(),
              });
              logger.info("Inserted GOLD rate", { rateDate, goldBuy, changes });
              goldInserted = true;
            } else {
              logger.debug("GOLD rate already exists", { rateDate });
            }
          } else {
            logger.warn("Invalid GOLD_BUY value", { rateDate, goldBuyStr });
          }
        }
      }

      // Update summary in latest_rates collection if new data was inserted
      if (goldInserted) {
        await updateGoldRatesSummary(db);
      }

      logger.info("Gold crawl job completed.");
    } catch (error) {
      logger.error("Error during gold crawl", {
        message: error.message,
        stack: error.stack,
        response: error.response && error.response.data,
      });
      throw error;
    }
  },
);
