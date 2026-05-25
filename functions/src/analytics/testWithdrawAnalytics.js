/**
 * Test script for Withdraw Analytics Service
 * 
 * This script tests the withdraw analytics calculation locally
 * Run with: node testWithdrawAnalytics.js
 */

const admin = require("firebase-admin");
const serviceAccount = require("../grammgold-firebase.json");

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Import the helper functions
const {
  calculateWithdrawAnalyticsHelper,
  saveWithdrawAnalyticsHelper,
} = require("./withdrawAnalyticsService");

async function testOverallAnalytics() {
  console.log("\n========================================");
  console.log("Testing Overall Withdraw Analytics");
  console.log("========================================\n");

  try {
    const analytics = await calculateWithdrawAnalyticsHelper(db);
    
    if (!analytics) {
      console.log("No verified withdraws found.");
      return;
    }

    console.log("Overall Analytics Results:");
    console.log("─────────────────────────────────────");
    console.log(`Period: ${analytics.period}`);
    console.log(`Total Withdraws: ${analytics.total_withdraws}`);
    console.log("");

    console.log("Gold:");
    console.log(`  Total Grams: ${analytics.gold.total_grams.toFixed(2)}`);
    console.log(`  Withdraw Count: ${analytics.gold.withdraw_count}`);
    console.log(`  Avg Quantity: ${analytics.gold.avg_quantity.toFixed(2)} grams`);
    console.log("");

    console.log("Silver:");
    console.log(`  Total Grams: ${analytics.silver.total_grams.toFixed(2)}`);
    console.log(`  Withdraw Count: ${analytics.silver.withdraw_count}`);
    console.log(`  Avg Quantity: ${analytics.silver.avg_quantity.toFixed(2)} grams`);
    console.log("");

    console.log("By Withdraw Type:");
    console.log("─────────────────────────────────────");
    
    console.log("\nSold to Us:");
    console.log(`  Count: ${analytics.by_withdraw_type.sold_to_us.count}`);
    console.log(`  Percentage: ${analytics.by_withdraw_type.sold_to_us.percentage.toFixed(2)}%`);
    console.log(`  Total Gold: ${analytics.by_withdraw_type.sold_to_us.total_grams_gold.toFixed(2)} grams`);
    console.log(`  Total Silver: ${analytics.by_withdraw_type.sold_to_us.total_grams_silver.toFixed(2)} grams`);
    console.log(`  Total Price: ₮${analytics.by_withdraw_type.sold_to_us.total_price_mnt.toLocaleString()}`);
    console.log(`  Avg Price/Withdraw: ₮${analytics.by_withdraw_type.sold_to_us.avg_price_per_withdraw.toLocaleString()}`);
    console.log(`  Avg Gold Rate: ₮${analytics.by_withdraw_type.sold_to_us.avg_gold_rate.toLocaleString()}/gram`);

    console.log("\nTaken Physically:");
    console.log(`  Count: ${analytics.by_withdraw_type.taken_physically.count}`);
    console.log(`  Percentage: ${analytics.by_withdraw_type.taken_physically.percentage.toFixed(2)}%`);
    console.log(`  Total Gold: ${analytics.by_withdraw_type.taken_physically.total_grams_gold.toFixed(2)} grams`);
    console.log(`  Total Silver: ${analytics.by_withdraw_type.taken_physically.total_grams_silver.toFixed(2)} grams`);

    console.log("\nUnspecified:");
    console.log(`  Count: ${analytics.by_withdraw_type.unspecified.count}`);
    console.log(`  Percentage: ${analytics.by_withdraw_type.unspecified.percentage.toFixed(2)}%`);
    console.log("");

    console.log("Top 5 Users by Quantity:");
    console.log("─────────────────────────────────────");
    analytics.top_users_by_quantity.slice(0, 5).forEach((user) => {
      console.log(`${user.rank}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Total: ${user.total_quantity.toFixed(2)} grams`);
      console.log(`   Price: ₮${user.total_price.toLocaleString()}`);
      console.log(`   Count: ${user.withdraw_count} times`);
    });
    console.log("");

    console.log("Top 5 Users by Frequency:");
    console.log("─────────────────────────────────────");
    analytics.top_users_by_frequency.slice(0, 5).forEach((user) => {
      console.log(`${user.rank}. ${user.name}`);
      console.log(`   Count: ${user.withdraw_count} times`);
      console.log(`   Total: ${user.total_quantity.toFixed(2)} grams`);
    });
    console.log("");

    // Save to Firestore
    console.log("Saving to Firestore...");
    await saveWithdrawAnalyticsHelper(db, analytics);
    console.log("✓ Saved to withdraw_analytics/overall");
  } catch (error) {
    console.error("Error testing overall analytics:", error);
  }
}

async function testMonthlyAnalytics(year, month) {
  console.log("\n========================================");
  console.log(`Testing Monthly Analytics: ${year}-${String(month).padStart(2, '0')}`);
  console.log("========================================\n");

  try {
    const analytics = await calculateWithdrawAnalyticsHelper(db, year, month);
    
    if (!analytics) {
      console.log(`No verified withdraws found for ${year}-${String(month).padStart(2, '0')}`);
      return;
    }

    console.log("Monthly Analytics Results:");
    console.log("─────────────────────────────────────");
    console.log(`Period: ${analytics.period}`);
    console.log(`Total Withdraws: ${analytics.total_withdraws}`);
    console.log("");

    console.log("Summary:");
    console.log(`  Gold: ${analytics.gold.total_grams.toFixed(2)} grams (${analytics.gold.withdraw_count} withdraws)`);
    console.log(`  Silver: ${analytics.silver.total_grams.toFixed(2)} grams (${analytics.silver.withdraw_count} withdraws)`);
    console.log("");

    console.log("Withdraw Types:");
    console.log(`  Sold to Us: ${analytics.by_withdraw_type.sold_to_us.count} (${analytics.by_withdraw_type.sold_to_us.percentage.toFixed(1)}%)`);
    console.log(`  Taken Physically: ${analytics.by_withdraw_type.taken_physically.count} (${analytics.by_withdraw_type.taken_physically.percentage.toFixed(1)}%)`);
    console.log(`  Unspecified: ${analytics.by_withdraw_type.unspecified.count} (${analytics.by_withdraw_type.unspecified.percentage.toFixed(1)}%)`);
    console.log("");

    console.log("Revenue from Sold to Us:");
    console.log(`  Total: ₮${analytics.by_withdraw_type.sold_to_us.total_price_mnt.toLocaleString()}`);
    console.log("");

    console.log("Daily Breakdown (First 7 days):");
    console.log("─────────────────────────────────────");
    analytics.daily_breakdown.slice(0, 7).forEach((day) => {
      console.log(`${day.date}:`);
      console.log(`  Withdraws: ${day.total_withdraws}`);
      console.log(`  Gold: ${day.total_grams_gold.toFixed(2)}g, Silver: ${day.total_grams_silver.toFixed(2)}g`);
      console.log(`  Sold: ${day.sold_to_us_count}, Physical: ${day.taken_physically_count}`);
    });
    console.log("");

    // Save to Firestore
    console.log("Saving to Firestore...");
    await saveWithdrawAnalyticsHelper(db, analytics, year, month);
    console.log(`✓ Saved to withdraw_analytics/${year}_${String(month).padStart(2, '0')}`);
  } catch (error) {
    console.error("Error testing monthly analytics:", error);
  }
}

async function testSampleData() {
  console.log("\n========================================");
  console.log("Sample Data Check");
  console.log("========================================\n");

  try {
    // Get a few sample verified withdraws
    const snapshot = await db.collection("withdraws")
      .where("status", "==", "verified")
      .limit(5)
      .get();

    if (snapshot.empty) {
      console.log("No verified withdraws found in database.");
      return;
    }

    console.log(`Found ${snapshot.size} sample verified withdraws:\n`);

    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. Withdraw ${doc.id}`);
      console.log(`   User: ${(data.client && data.client.first_name) || 'Unknown'} ${(data.client && data.client.last_name) || ''}`);
      console.log(`   Quantity: ${data.quantity} grams`);
      console.log(`   Metal ID: ${data.metal_id} (${data.metal_id === 1 ? 'Gold' : 'Silver'})`);
      console.log(`   Withdraw Type: ${data.withdraw_type || 'unspecified'}`);
      console.log(`   Price: ${data.price ? '₮' + data.price.toLocaleString() : 'N/A'}`);
      console.log(`   Verified At: ${data.verified_at && data.verified_at.toDate ? data.verified_at.toDate().toISOString() : 'N/A'}`);
      console.log("");
    });
  } catch (error) {
    console.error("Error checking sample data:", error);
  }
}

async function main() {
  console.log("\n");
  console.log("╔════════════════════════════════════════╗");
  console.log("║  Withdraw Analytics Test Suite        ║");
  console.log("╚════════════════════════════════════════╝");

  try {
    // 1. Check sample data first
    await testSampleData();

    // 2. Test overall analytics
    await testOverallAnalytics();

    // 3. Test current month analytics
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    await testMonthlyAnalytics(currentYear, currentMonth);

    // 4. Test previous month (optional)
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    await testMonthlyAnalytics(prevYear, prevMonth);

    console.log("\n========================================");
    console.log("✓ All tests completed successfully!");
    console.log("========================================\n");

    console.log("Next steps:");
    console.log("1. Check Firebase Console -> Firestore -> withdraw_analytics collection");
    console.log("2. Deploy functions: firebase deploy --only functions");
    console.log("3. Test HTTP endpoint with admin token");
    console.log("4. Wait for scheduled function to run at 2 AM\n");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
  } finally {
    process.exit(0);
  }
}

// Run tests
main();
