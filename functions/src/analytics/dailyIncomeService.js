const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

/**
 * Daily Income Analytics Service
 * Tracks daily revenue from successful orders
 */

// Helper function to get date key (YYYY-MM-DD)
function getDateKey(timestamp) {
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Update daily income for a specific date
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {Object} orderData - Order data
 * @param {boolean} isAdd - true to add, false to subtract
 */
async function updateDailyIncome(db, orderData, isAdd = true) {
  if (orderData.admin_status !== "success") {
    return; // Only process successful orders
  }

  const dateKey = getDateKey(orderData.created_at);
  const dailyIncomeRef = db
    .collection("analytics")
    .doc("daily_incomes")
    .collection("data")
    .doc(dateKey);

  const multiplier = isAdd ? 1 : -1;
  const amount = (orderData.amount || 0) * multiplier;

  await db.runTransaction(async (transaction) => {
    const dailyDoc = await transaction.get(dailyIncomeRef);
    const currentData = dailyDoc.exists ?
      dailyDoc.data() :
      {
        date: dateKey,
        total_amount: 0,
      };

    currentData.total_amount += amount;
    currentData.last_updated = admin.firestore.FieldValue.serverTimestamp();

    transaction.set(dailyIncomeRef, currentData, { merge: true });
  });

  logger.info(`Daily income updated for ${dateKey}: ${isAdd ? '+' : '-'}${Math.abs(amount)}`);
}

/**
 * Initialize daily income analytics from all successful orders
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @return {Promise<void>}
 */
async function initializeDailyIncome(db) {
  try {
    logger.info("Starting daily income initialization...");

    // Get all successful orders
    const ordersSnapshot = await db
      .collection("orders")
      .where("admin_status", "==", "success")
      .get();

    if (ordersSnapshot.empty) {
      logger.info("No successful orders found");
      return { success: true, message: "No orders to process" };
    }

    logger.info(`Found ${ordersSnapshot.size} successful orders`);

    // Group orders by date
    const dailyIncomes = {};

    ordersSnapshot.docs.forEach((doc) => {
      const orderData = doc.data();
      const dateKey = getDateKey(orderData.created_at);
      const amount = orderData.amount || 0;

      if (!dailyIncomes[dateKey]) {
        dailyIncomes[dateKey] = {
          date: dateKey,
          total_amount: 0,
          order_count: 0,
        };
      }

      dailyIncomes[dateKey].total_amount += amount;
      dailyIncomes[dateKey].order_count += 1;
    });

    // Write to Firestore in batches
    const batch = db.batch();
    let batchCount = 0;
    const batches = [];

    for (const [dateKey, data] of Object.entries(dailyIncomes)) {
      const dailyIncomeRef = db
        .collection("analytics")
        .doc("daily_incomes")
        .collection("data")
        .doc(dateKey);

      batch.set(
        dailyIncomeRef,
        {
          date: data.date,
          total_amount: data.total_amount,
          order_count: data.order_count,
          last_updated: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      batchCount++;

      // Firestore batch limit is 500 operations
      if (batchCount >= 500) {
        batches.push(batch.commit());
        batchCount = 0;
      }
    }

    // Commit remaining batch
    if (batchCount > 0) {
      batches.push(batch.commit());
    }

    await Promise.all(batches);

    logger.info(
      `Daily income initialization completed. Processed ${Object.keys(dailyIncomes).length} days`,
    );

    return {
      success: true,
      message: "Daily income initialized successfully",
      stats: {
        total_days: Object.keys(dailyIncomes).length,
        total_orders: ordersSnapshot.size,
      },
    };
  } catch (error) {
    logger.error("Error initializing daily income:", error);
    throw error;
  }
}

/**
 * Get daily income data
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @return {Promise<Array>}
 */
async function getDailyIncome(db, startDate, endDate) {
  try {
    let query = db
      .collection("analytics")
      .doc("daily_incomes")
      .collection("data")
      .orderBy("date", "desc");

    if (startDate) {
      query = query.where("date", ">=", startDate);
    }

    if (endDate) {
      query = query.where("date", "<=", endDate);
    }

    const snapshot = await query.limit(100).get();

    const dailyData = [];
    let totalIncome = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      dailyData.push({
        date: data.date,
        total_amount: data.total_amount,
        order_count: data.order_count || 0,
        last_updated: data.last_updated,
      });
      totalIncome += data.total_amount || 0;
    });

    return {
      success: true,
      data: dailyData,
      summary: {
        total_days: dailyData.length,
        total_income: totalIncome,
      },
    };
  } catch (error) {
    logger.error("Error getting daily income:", error);
    throw error;
  }
}

// Cloud Function: Initialize daily income (run once or on-demand)
exports.initializeDailyIncome = onRequest(
  {
    memory: "1GiB",
    timeoutSeconds: 540,
    maxInstances: 1,
  },
  async (req, res) => {
    return cors(req, res, async () => {
      try {
        const db = admin.firestore();
        const result = await initializeDailyIncome(db);
        return res.status(200).json(result);
      } catch (error) {
        logger.error("Failed to initialize daily income", error);
        return res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });
  },
);

// Cloud Function: Get daily income data
exports.getDailyIncome = onRequest(
  {
    memory: "512MiB",
    timeoutSeconds: 60,
    maxInstances: 10,
  },
  async (req, res) => {
    return cors(req, res, async () => {
      try {
        // Optional: Add authentication check here
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.split("Bearer ")[1];
          try {
            await admin.auth().verifyIdToken(token);
          } catch (error) {
            return res.status(401).json({
              success: false,
              error: "Unauthorized",
            });
          }
        }

        const db = admin.firestore();
        const { startDate, endDate } = req.query;

        const result = await getDailyIncome(db, startDate, endDate);
        return res.status(200).json(result);
      } catch (error) {
        logger.error("Failed to get daily income", error);
        return res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });
  },
);

// Export utility function for use in other modules
exports.updateDailyIncome = updateDailyIncome;
