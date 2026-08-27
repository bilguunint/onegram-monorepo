const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const { updateDailyIncome } = require("./dailyIncomeService");

/**
 * Analytics Service for OneGram
 * Tracks gold sales, user statistics, and order data
 */

// Helper function to get month-year key from timestamp
function getMonthYearKey(timestamp) {
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Helper function to get date key (YYYY-MM-DD)
function getDateKey(timestamp) {
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Update monthly analytics
// `countOrder` is false when an existing order merely changes status: the doc
// was already counted in total_orders when it was created, and counting it
// again on the transition to success inflated the month's order total by
// exactly the number of successful orders.
async function updateMonthlyAnalytics(db, orderData, isAdd = true, countOrder = true) {
  const monthKey = getMonthYearKey(orderData.created_at);
  const monthlyRef = db.collection("analytics").doc("monthly").collection("data").doc(monthKey);
  
  const multiplier = isAdd ? 1 : -1;
  
  await db.runTransaction(async (transaction) => {
    const monthlyDoc = await transaction.get(monthlyRef);
    const currentData = monthlyDoc.exists ? monthlyDoc.data() : {
      total_gold_sold: 0,
      total_silver_sold: 0,
      total_gold_withdraws: 0,
      total_silver_withdraws: 0,
      total_revenue: 0,
      total_orders: 0,
      successful_orders: 0,
      month: monthKey,
    };

    if (orderData.admin_status === "success") {
      const quantity = (orderData.quantity || 0) * multiplier;
      const metalId = orderData.metal_id;
      
      if (metalId === 1) {
        // Gold
        currentData.total_gold_sold += quantity;
      } else if (metalId === 3) {
        // Silver
        currentData.total_silver_sold += quantity;
      }
      
      currentData.total_revenue += (orderData.amount || 0) * multiplier;
      currentData.successful_orders += 1 * multiplier;
    }
    if (countOrder) {
      currentData.total_orders += 1 * multiplier;
    }
    currentData.last_updated = admin.firestore.FieldValue.serverTimestamp();

    transaction.set(monthlyRef, currentData, { merge: true });
  });
}

// Update monthly withdrawal analytics
async function updateMonthlyWithdrawAnalytics(db, withdrawData, isAdd = true) {
  const monthKey = getMonthYearKey(withdrawData.created_at || withdrawData.verified_at);
  const monthlyRef = db.collection("analytics").doc("monthly").collection("data").doc(monthKey);
  
  const multiplier = isAdd ? 1 : -1;
  
  await db.runTransaction(async (transaction) => {
    const monthlyDoc = await transaction.get(monthlyRef);
    const currentData = monthlyDoc.exists ? monthlyDoc.data() : {
      total_gold_sold: 0,
      total_silver_sold: 0,
      total_gold_withdraws: 0,
      total_silver_withdraws: 0,
      total_revenue: 0,
      total_orders: 0,
      successful_orders: 0,
      month: monthKey,
    };

    if (withdrawData.status === "verified") {
      const quantity = (withdrawData.quantity || 0) * multiplier;
      const metalId = withdrawData.metal_id;
      
      if (metalId === 1) {
        // Gold withdrawals
        currentData.total_gold_withdraws += quantity;
      } else if (metalId === 3) {
        // Silver withdrawals
        currentData.total_silver_withdraws += quantity;
      }
    }
    
    currentData.last_updated = admin.firestore.FieldValue.serverTimestamp();
    transaction.set(monthlyRef, currentData, { merge: true });
  });
}

// Update daily user registration analytics
async function updateDailyUserAnalytics(db, userData) {
  const dateKey = getDateKey(userData.created_at || new Date());
  const dailyRef = db.collection("analytics").doc("daily_users").collection("data").doc(dateKey);
  
  await db.runTransaction(async (transaction) => {
    const dailyDoc = await transaction.get(dailyRef);
    const currentData = dailyDoc.exists ? dailyDoc.data() : {
      new_users: 0,
      date: dateKey,
    };

    currentData.new_users += 1;
    currentData.last_updated = admin.firestore.FieldValue.serverTimestamp();

    transaction.set(dailyRef, currentData, { merge: true });
  });
}

// Update overall analytics
async function updateOverallAnalytics(db) {
  const overallRef = db.collection("analytics").doc("overall");
  
  // Get users with gold balance > 0
  const usersWithGoldQuery = await db.collection("users")
    .where("balance.gold", ">", 0)
    .count()
    .get();
  
  // Get total users count
  const totalUsersQuery = await db.collection("users")
    .count()
    .get();
  
  // Get total orders count
  const totalOrdersQuery = await db.collection("orders")
    .count()
    .get();
  
  // Get successful orders count
  const successfulOrdersQuery = await db.collection("orders")
    .where("admin_status", "==", "success")
    .count()
    .get();

  // Calculate totals from successful orders
  const successfulOrdersSnapshot = await db.collection("orders")
    .where("admin_status", "==", "success")
    .get();
  
  let totalGoldSold = 0;
  let totalSilverSold = 0;
  let totalRevenue = 0;
  
  successfulOrdersSnapshot.forEach((doc) => {
    const data = doc.data();
    const quantity = data.quantity || 0;
    const metalId = data.metal_id;
    
    if (metalId === 1) {
      // Gold
      totalGoldSold += quantity;
    } else if (metalId === 3) {
      // Silver
      totalSilverSold += quantity;
    }
    
    totalRevenue += data.amount || 0;
  });

  // Calculate totals from verified withdrawals
  const verifiedWithdrawsSnapshot = await db.collection("withdraws")
    .where("status", "==", "verified")
    .get();
  
  let totalGoldWithdraws = 0;
  let totalSilverWithdraws = 0;
  
  verifiedWithdrawsSnapshot.forEach((doc) => {
    const data = doc.data();
    const quantity = data.quantity || 0;
    const metalId = data.metal_id;
    
    if (metalId === 1) {
      // Gold withdrawals
      totalGoldWithdraws += quantity;
    } else if (metalId === 3) {
      // Silver withdrawals
      totalSilverWithdraws += quantity;
    }
  });

  // Calculate total investments from investments collection
  const investmentsSnapshot = await db.collection("investments").get();
  
  let totalInvestments = 0;
  
  investmentsSnapshot.forEach((doc) => {
    const data = doc.data();
    const balance = data.balance || 0;
    totalInvestments += Number(balance);
  });

  const overallData = {
    total_users: totalUsersQuery.data().count,
    users_with_gold: usersWithGoldQuery.data().count,
    total_orders: totalOrdersQuery.data().count,
    successful_orders: successfulOrdersQuery.data().count,
    total_gold_sold_all_time: totalGoldSold,
    total_silver_sold_all_time: totalSilverSold,
    total_gold_withdraws_all_time: totalGoldWithdraws,
    total_silver_withdraws_all_time: totalSilverWithdraws,
    total_revenue_all_time: totalRevenue,
    total_investments: totalInvestments,
    last_updated: admin.firestore.FieldValue.serverTimestamp(),
  };

  await overallRef.set(overallData, { merge: true });
}

// Batch process to initialize analytics (run once)
async function initializeAnalytics(db) {
  logger.info("Starting analytics initialization...");
  
  try {
    // Process all existing orders
    const ordersSnapshot = await db.collection("orders").get();
    const ordersByMonth = {};
    
    ordersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.created_at) {
        const monthKey = getMonthYearKey(data.created_at);
        if (!ordersByMonth[monthKey]) {
          ordersByMonth[monthKey] = {
            total_gold_sold: 0,
            total_silver_sold: 0,
            total_gold_withdraws: 0,
            total_silver_withdraws: 0,
            total_revenue: 0,
            total_orders: 0,
            successful_orders: 0,
            month: monthKey,
          };
        }
        
        ordersByMonth[monthKey].total_orders += 1;
        if (data.admin_status === "success") {
          ordersByMonth[monthKey].successful_orders += 1;
          
          const quantity = data.quantity || 0;
          const metalId = data.metal_id;
          
          if (metalId === 1) {
            // Gold
            ordersByMonth[monthKey].total_gold_sold += quantity;
          } else if (metalId === 3) {
            // Silver
            ordersByMonth[monthKey].total_silver_sold += quantity;
          }
          
          ordersByMonth[monthKey].total_revenue += data.amount || 0;
        }
      }
    });
    
    // Save monthly data
    const batch = db.batch();
    Object.entries(ordersByMonth).forEach(([monthKey, data]) => {
      const monthlyRef = db.collection("analytics").doc("monthly").collection("data").doc(monthKey);
      data.last_updated = admin.firestore.FieldValue.serverTimestamp();
      batch.set(monthlyRef, data);
    });
    
    await batch.commit();
    
    // Process all existing withdrawals
    const withdrawsSnapshot = await db.collection("withdraws").get();
    
    withdrawsSnapshot.forEach((doc) => {
      const data = doc.data();
      if ((data.created_at || data.verified_at) && data.status === "verified") {
        const monthKey = getMonthYearKey(data.created_at || data.verified_at);
        if (!ordersByMonth[monthKey]) {
          ordersByMonth[monthKey] = {
            total_gold_sold: 0,
            total_silver_sold: 0,
            total_gold_withdraws: 0,
            total_silver_withdraws: 0,
            total_revenue: 0,
            total_orders: 0,
            successful_orders: 0,
            month: monthKey,
          };
        }
        
        const quantity = data.quantity || 0;
        const metalId = data.metal_id;
        
        if (metalId === 1) {
          // Gold withdrawals
          ordersByMonth[monthKey].total_gold_withdraws += quantity;
        } else if (metalId === 3) {
          // Silver withdrawals
          ordersByMonth[monthKey].total_silver_withdraws += quantity;
        }
      }
    });
    
    // Update monthly data again with withdrawal info
    const withdrawBatch = db.batch();
    Object.entries(ordersByMonth).forEach(([monthKey, data]) => {
      const monthlyRef = db.collection("analytics").doc("monthly").collection("data").doc(monthKey);
      data.last_updated = admin.firestore.FieldValue.serverTimestamp();
      withdrawBatch.set(monthlyRef, data, { merge: true });
    });
    
    await withdrawBatch.commit();
    
    // Process user registration dates
    const usersSnapshot = await db.collection("users").get();
    const usersByDate = {};
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.created_at) {
        const dateKey = getDateKey(data.created_at);
        if (!usersByDate[dateKey]) {
          usersByDate[dateKey] = {
            new_users: 0,
            date: dateKey,
          };
        }
        usersByDate[dateKey].new_users += 1;
      }
    });
    
    // Save daily user data
    const userBatch = db.batch();
    Object.entries(usersByDate).forEach(([dateKey, data]) => {
      const dailyRef = db.collection("analytics").doc("daily_users").collection("data").doc(dateKey);
      data.last_updated = admin.firestore.FieldValue.serverTimestamp();
      userBatch.set(dailyRef, data);
    });
    
    await userBatch.commit();
    
    // Update overall analytics
    await updateOverallAnalytics(db);
    
    logger.info("Analytics initialization completed successfully");
    return { success: true, message: "Analytics initialized successfully" };
  } catch (error) {
    logger.error("Error initializing analytics:", error);
    throw error;
  }
}

// Cloud Function: Initialize analytics (run once)
exports.initializeAnalytics = onRequest({
  memory: "1GiB",
  timeoutSeconds: 540,
  maxInstances: 1,
}, async (req, res) => {
  return cors(req, res, async () => {
    const db = admin.firestore();
    try {
      const result = await initializeAnalytics(db);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in initializeAnalytics:", error);
      res.status(500).json({ error: error.message });
    }
  });
});

// Cloud Function: Get analytics data
exports.getAnalytics = onRequest({
  memory: "512MiB",
  timeoutSeconds: 60,
  maxInstances: 10,
}, async (req, res) => {
  return cors(req, res, async () => {
    const db = admin.firestore();
    try {
      const { type = "overall", month, limit = 12 } = req.query;
      
      if (type === "overall") {
        const overallDoc = await db.collection("analytics").doc("overall").get();
        const data = overallDoc.exists ? overallDoc.data() : {};
        res.status(200).json(data);
      } else if (type === "monthly") {
        const query = db.collection("analytics").doc("monthly").collection("data");
        if (month) {
          const monthDoc = await query.doc(month).get();
          const data = monthDoc.exists ? monthDoc.data() : {};
          res.status(200).json(data);
        } else {
          const snapshot = await query.orderBy("month", "desc").limit(parseInt(limit)).get();
          const data = [];
          snapshot.forEach((doc) => data.push(doc.data()));
          res.status(200).json(data);
        }
      } else if (type === "daily_users") {
        const snapshot = await db.collection("analytics")
          .doc("daily_users")
          .collection("data")
          .orderBy("date", "desc")
          .limit(parseInt(limit))
          .get();
        
        const data = [];
        snapshot.forEach((doc) => data.push(doc.data()));
        res.status(200).json(data);
      } else {
        res.status(400).json({ error: "Invalid type parameter" });
      }
    } catch (error) {
      logger.error("Error in getAnalytics:", error);
      res.status(500).json({ error: error.message });
    }
  });
});

// Cloud Function: Triggered when an order is created
exports.onOrderCreated = onDocumentCreated({
  document: "orders/{orderId}",
  memory: "512MiB",
  timeoutSeconds: 120,
}, async (event) => {
  const db = admin.firestore();
  const orderData = event.data.data();
  
  try {
    // Update monthly analytics
    await updateMonthlyAnalytics(db, orderData, true);
    
    // Update daily income analytics if order is successful
    if (orderData.admin_status === "success") {
      await updateDailyIncome(db, orderData, true);
    }
    
    // Update overall analytics
    await updateOverallAnalytics(db);
    
    logger.info(`Analytics updated for new order: ${event.params.orderId}`);
  } catch (error) {
    logger.error("Error updating analytics on order creation:", error);
  }
});

// Cloud Function: Triggered when an order is updated
exports.onOrderUpdated = onDocumentUpdated({
  document: "orders/{orderId}",
  memory: "512MiB",
  timeoutSeconds: 120,
}, async (event) => {
  const db = admin.firestore();
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();
  
  try {
    // If admin_status changed from non-success to success
    if (beforeData.admin_status !== "success" && afterData.admin_status === "success") {
      await updateMonthlyAnalytics(db, afterData, true, false);
      // Update daily income when order becomes successful
      await updateDailyIncome(db, afterData, true);
    } else if (beforeData.admin_status === "success" && afterData.admin_status !== "success") {
      // If admin_status changed from success to non-success
      await updateMonthlyAnalytics(db, beforeData, false, false);
      // Subtract from daily income when order status reverted
      await updateDailyIncome(db, beforeData, false);
    }
    
    // Update overall analytics
    await updateOverallAnalytics(db);
    
    logger.info(`Analytics updated for order update: ${event.params.orderId}`);
  } catch (error) {
    logger.error("Error updating analytics on order update:", error);
  }
});

// Cloud Function: Triggered when a user is created
exports.onUserCreated = onDocumentCreated({
  document: "users/{userId}",
  memory: "512MiB",
  timeoutSeconds: 120,
}, async (event) => {
  const db = admin.firestore();
  const userData = event.data.data();
  
  try {
    // Update daily user analytics
    await updateDailyUserAnalytics(db, userData);
    
    // Update overall analytics
    await updateOverallAnalytics(db);
    
    logger.info(`Analytics updated for new user: ${event.params.userId}`);
  } catch (error) {
    logger.error("Error updating analytics on user creation:", error);
  }
});

// Manual refresh function
exports.refreshAnalytics = onRequest({
  memory: "1GiB",
  timeoutSeconds: 540,
  maxInstances: 1,
}, async (req, res) => {
  return cors(req, res, async () => {
    const db = admin.firestore();
    try {
      await updateOverallAnalytics(db);
      res.status(200).json({ success: true, message: "Analytics refreshed successfully" });
    } catch (error) {
      logger.error("Error refreshing analytics:", error);
      res.status(500).json({ error: error.message });
    }
  });
});

// Export utility functions for other modules
exports.updateMonthlyWithdrawAnalytics = updateMonthlyWithdrawAnalytics;
exports.updateOverallAnalytics = updateOverallAnalytics;
