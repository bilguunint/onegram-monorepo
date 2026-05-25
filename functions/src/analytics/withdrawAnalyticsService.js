const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

/**
 * Calculate withdraw analytics for a specific month or overall
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {number} year - Year (null for overall stats)
 * @param {number} month - Month 1-12 (null for overall stats)
 * @return {Object} Analytics data
 */
async function calculateWithdrawAnalytics(db, year = null, month = null) {
  try {
    let query = db.collection("withdraws").where("status", "==", "verified");
    
    // Filter by month if specified
    if (year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
      query = query
        .where("verified_at", ">=", admin.firestore.Timestamp.fromDate(startDate))
        .where("verified_at", "<=", admin.firestore.Timestamp.fromDate(endDate));
    }
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      logger.info("No verified withdraws found", { year, month });
      return null;
    }

    // Initialize analytics data
    const analytics = {
      period: year && month ? `${year}-${String(month).padStart(2, '0')}` : 'overall',
      year: year || null,
      month: month || null,
      total_withdraws: 0,
      
      // By metal type
      gold: {
        total_grams: 0,
        withdraw_count: 0,
        avg_quantity: 0,
      },
      silver: {
        total_grams: 0,
        withdraw_count: 0,
        avg_quantity: 0,
      },
      
      // By withdraw type
      by_withdraw_type: {
        sold_to_us: {
          count: 0,
          percentage: 0,
          total_grams_gold: 0,
          total_grams_silver: 0,
          total_price_mnt: 0,
          avg_price_per_withdraw: 0,
          avg_gold_rate: 0, // Average price per gram for gold
        },
        taken_physically: {
          count: 0,
          percentage: 0,
          total_grams_gold: 0,
          total_grams_silver: 0,
        },
        unspecified: {
          count: 0,
          percentage: 0,
          total_grams_gold: 0,
          total_grams_silver: 0,
        },
      },
      
      // Top users
      top_users_by_quantity: [],
      top_users_by_frequency: [],
      
      // Temporal data
      daily_breakdown: {},
      
      calculated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Track user statistics
    const userStats = {};
    const dailyStats = {};

    snapshot.forEach((doc) => {
      const withdraw = doc.data();
      const metalId = Number(withdraw.metal_id);
      const quantity = Number(withdraw.quantity || 0);
      const price = Number(withdraw.price || 0);
      const withdrawType = withdraw.withdraw_type || 'unspecified';
      const userId = withdraw.user_id;
      
      analytics.total_withdraws++;
      
      // By metal type
      if (metalId === 1) {
        analytics.gold.total_grams += quantity;
        analytics.gold.withdraw_count++;
      } else if (metalId === 3) {
        analytics.silver.total_grams += quantity;
        analytics.silver.withdraw_count++;
      }
      
      // By withdraw type
      const typeKey = ['sold_to_us', 'taken_physically'].includes(withdrawType) ?
        withdrawType :
        'unspecified';
      
      analytics.by_withdraw_type[typeKey].count++;
      
      if (metalId === 1) {
        analytics.by_withdraw_type[typeKey].total_grams_gold += quantity;
      } else if (metalId === 3) {
        analytics.by_withdraw_type[typeKey].total_grams_silver += quantity;
      }
      
      // Price tracking for sold_to_us
      if (typeKey === 'sold_to_us' && price > 0) {
        analytics.by_withdraw_type.sold_to_us.total_price_mnt += price;
      }
      
      // User statistics
      if (!userStats[userId]) {
        userStats[userId] = {
          user_id: userId,
          first_name: (withdraw.client && withdraw.client.first_name) || 'Unknown',
          last_name: (withdraw.client && withdraw.client.last_name) || '',
          email: (withdraw.client && withdraw.client.email) || '',
          total_quantity: 0,
          total_price: 0,
          withdraw_count: 0,
        };
      }
      userStats[userId].total_quantity += quantity;
      userStats[userId].total_price += price;
      userStats[userId].withdraw_count++;
      
      // Daily breakdown
      if (withdraw.verified_at) {
        const verifiedDate = withdraw.verified_at.toDate();
        const dateKey = verifiedDate.toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = {
            date: dateKey,
            total_withdraws: 0,
            total_grams_gold: 0,
            total_grams_silver: 0,
            sold_to_us_count: 0,
            taken_physically_count: 0,
          };
        }
        
        dailyStats[dateKey].total_withdraws++;
        
        if (metalId === 1) {
          dailyStats[dateKey].total_grams_gold += quantity;
        } else if (metalId === 3) {
          dailyStats[dateKey].total_grams_silver += quantity;
        }
        
        if (withdrawType === 'sold_to_us') {
          dailyStats[dateKey].sold_to_us_count++;
        } else if (withdrawType === 'taken_physically') {
          dailyStats[dateKey].taken_physically_count++;
        }
      }
    });

    // Calculate averages and percentages
    if (analytics.gold.withdraw_count > 0) {
      analytics.gold.avg_quantity = analytics.gold.total_grams / analytics.gold.withdraw_count;
    }
    
    if (analytics.silver.withdraw_count > 0) {
      analytics.silver.avg_quantity = analytics.silver.total_grams / analytics.silver.withdraw_count;
    }
    
    // Withdraw type percentages
    Object.keys(analytics.by_withdraw_type).forEach((type) => {
      const typeData = analytics.by_withdraw_type[type];
      typeData.percentage = analytics.total_withdraws > 0 ?
        (typeData.count / analytics.total_withdraws) * 100 :
        0;
        
      if (type === 'sold_to_us') {
        if (typeData.count > 0) {
          typeData.avg_price_per_withdraw = typeData.total_price_mnt / typeData.count;
        }
        if (typeData.total_grams_gold > 0 && typeData.total_price_mnt > 0) {
          typeData.avg_gold_rate = typeData.total_price_mnt / typeData.total_grams_gold;
        }
      }
    });
    
    // Top users by quantity
    analytics.top_users_by_quantity = Object.values(userStats)
      .sort((a, b) => b.total_quantity - a.total_quantity)
      .slice(0, 10)
      .map((user, index) => ({
        rank: index + 1,
        user_id: user.user_id,
        name: `${user.first_name} ${user.last_name}`.trim(),
        email: user.email,
        total_quantity: user.total_quantity,
        total_price: user.total_price,
        withdraw_count: user.withdraw_count,
      }));
    
    // Top users by frequency
    analytics.top_users_by_frequency = Object.values(userStats)
      .sort((a, b) => b.withdraw_count - a.withdraw_count)
      .slice(0, 10)
      .map((user, index) => ({
        rank: index + 1,
        user_id: user.user_id,
        name: `${user.first_name} ${user.last_name}`.trim(),
        email: user.email,
        withdraw_count: user.withdraw_count,
        total_quantity: user.total_quantity,
        total_price: user.total_price,
      }));
    
    // Daily breakdown (convert to array and sort)
    analytics.daily_breakdown = Object.values(dailyStats)
      .sort((a, b) => a.date.localeCompare(b.date));

    return analytics;
  } catch (error) {
    logger.error("Error calculating withdraw analytics", { 
      error: error.message,
      year,
      month,
    });
    throw error;
  }
}

/**
 * Save analytics to Firestore
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {Object} analytics - Analytics data
 * @param {number} year - Year (null for overall stats)
 * @param {number} month - Month 1-12 (null for overall stats)
 * @return {string|null} Document ID or null
 */
async function saveWithdrawAnalytics(db, analytics, year = null, month = null) {
  try {
    if (!analytics) {
      logger.warn("No analytics to save", { year, month });
      return null;
    }

    const docId = year && month ?
      `${year}_${String(month).padStart(2, '0')}` :
      'overall';
    
    const analyticsRef = db.collection("withdraw_analytics").doc(docId);
    
    await analyticsRef.set(analytics, { merge: true });
    
    logger.info("Withdraw analytics saved", {
      doc_id: docId,
      total_withdraws: analytics.total_withdraws,
    });
    
    return docId;
  } catch (error) {
    logger.error("Error saving withdraw analytics", { error: error.message });
    throw error;
  }
}

/**
 * HTTP endpoint to manually trigger analytics calculation
 */
exports.calculateWithdrawAnalytics = onRequest({
  memory: "1GiB",
  timeoutSeconds: 300,
}, async (req, res) => {
  return cors(req, res, async () => {
    const db = admin.firestore();
    
    try {
      // Auth check (optional - require admin)
      const authHeader = req.headers.authorization || "";
      if (authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
          const decoded = await admin.auth().verifyIdToken(token);
          const adminDoc = await db.collection("admins").doc(decoded.uid).get();
          
          if (!adminDoc.exists) {
            const q = await db.collection("admins").where("uid", "==", decoded.uid).limit(1).get();
            if (q.empty) {
              return res.status(403).json({ error: "Forbidden: Admin access required" });
            }
          }
        } catch (e) {
          return res.status(401).json({ error: "Unauthorized: Invalid token" });
        }
      }

      const { year, month, type } = req.query;
      
      const results = [];

      if (type === 'overall' || !type) {
        // Calculate overall analytics
        logger.info("Calculating overall withdraw analytics");
        const overallAnalytics = await calculateWithdrawAnalytics(db);
        if (overallAnalytics) {
          await saveWithdrawAnalytics(db, overallAnalytics);
          results.push({ period: 'overall', status: 'saved' });
        }
      }

      if (type === 'monthly' || !type) {
        // Calculate monthly analytics
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
        
        logger.info("Calculating monthly withdraw analytics", { year: targetYear, month: targetMonth });
        const monthlyAnalytics = await calculateWithdrawAnalytics(db, targetYear, targetMonth);
        if (monthlyAnalytics) {
          await saveWithdrawAnalytics(db, monthlyAnalytics, targetYear, targetMonth);
          results.push({
            period: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
            status: 'saved',
          });
        }
      }

      if (type === 'all_months') {
        // Calculate for all months that have data
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        
        // Get the earliest verified withdraw to know how far back to go
        const earliestWithdraw = await db.collection("withdraws")
          .where("status", "==", "verified")
          .orderBy("verified_at", "asc")
          .limit(1)
          .get();
        
        let startYear = currentYear;
        let startMonth = 1;
        
        if (!earliestWithdraw.empty) {
          const earliestDate = earliestWithdraw.docs[0].data().verified_at.toDate();
          startYear = earliestDate.getFullYear();
          startMonth = earliestDate.getMonth() + 1;
        }
        
        // Calculate for each month from start to current
        for (let y = startYear; y <= currentYear; y++) {
          const monthStart = (y === startYear) ? startMonth : 1;
          const monthEnd = (y === currentYear) ? currentMonth : 12;
          
          for (let m = monthStart; m <= monthEnd; m++) {
            logger.info("Calculating analytics for month", { year: y, month: m });
            const monthlyAnalytics = await calculateWithdrawAnalytics(db, y, m);
            if (monthlyAnalytics) {
              await saveWithdrawAnalytics(db, monthlyAnalytics, y, m);
              results.push({
                period: `${y}-${String(m).padStart(2, '0')}`,
                status: 'saved',
              });
            }
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: "Withdraw analytics calculated and saved",
        results: results,
      });
    } catch (error) {
      logger.error("Error in calculateWithdrawAnalytics endpoint", { error: error.message });
      return res.status(500).json({
        error: error.message || "Failed to calculate analytics",
      });
    }
  });
});

/**
 * Scheduled function to automatically calculate analytics daily
 * Runs every day at 2 AM (Mongolia time - UTC+8)
 */
exports.scheduledWithdrawAnalytics = onSchedule({
  schedule: "0 2 * * *", // Every day at 2 AM
  timeZone: "Asia/Ulaanbaatar",
  memory: "1GiB",
  timeoutSeconds: 300,
}, async (event) => {
  const db = admin.firestore();
  
  try {
    logger.info("Starting scheduled withdraw analytics calculation");
    
    // Calculate overall analytics
    const overallAnalytics = await calculateWithdrawAnalytics(db);
    if (overallAnalytics) {
      await saveWithdrawAnalytics(db, overallAnalytics);
    }
    
    // Calculate current month analytics
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const monthlyAnalytics = await calculateWithdrawAnalytics(db, currentYear, currentMonth);
    if (monthlyAnalytics) {
      await saveWithdrawAnalytics(db, monthlyAnalytics, currentYear, currentMonth);
    }
    
    // Calculate previous month analytics (in case of late verifications)
    const prevDate = new Date(now);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth() + 1;
    
    const prevMonthAnalytics = await calculateWithdrawAnalytics(db, prevYear, prevMonth);
    if (prevMonthAnalytics) {
      await saveWithdrawAnalytics(db, prevMonthAnalytics, prevYear, prevMonth);
    }
    
    logger.info("Scheduled withdraw analytics calculation completed");
  } catch (error) {
    logger.error("Error in scheduled withdraw analytics", { error: error.message });
    throw error;
  }
});

// Export helper functions for testing
exports.calculateWithdrawAnalyticsHelper = calculateWithdrawAnalytics;
exports.saveWithdrawAnalyticsHelper = saveWithdrawAnalytics;
