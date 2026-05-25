/**
 * Analytics Management Script
 * Use this script to test and manage the analytics system
 */

// Example usage:
// 1. Initialize analytics (run once): 
//    POST /initializeAnalytics

// 2. Get overall analytics:
//    GET /getAnalytics?type=overall

// 3. Get monthly analytics:
//    GET /getAnalytics?type=monthly&limit=12

// 4. Get specific month:
//    GET /getAnalytics?type=monthly&month=2025-08

// 5. Get daily user registrations:
//    GET /getAnalytics?type=daily_users&limit=30

// 6. Refresh analytics manually:
//    POST /refreshAnalytics

const testAnalytics = {
  
  // Test function to call analytics endpoints
  async testEndpoints() {
    const baseUrl = "https://your-project-region-your-project.cloudfunctions.net";
    
    try {
      // 1. Get overall analytics
      console.log("Testing overall analytics...");
      const overallResponse = await fetch(`${baseUrl}/getAnalytics?type=overall`);
      const overallData = await overallResponse.json();
      console.log("Overall Analytics:", overallData);
      
      // 2. Get monthly analytics
      console.log("\nTesting monthly analytics...");
      const monthlyResponse = await fetch(`${baseUrl}/getAnalytics?type=monthly&limit=6`);
      const monthlyData = await monthlyResponse.json();
      console.log("Monthly Analytics:", monthlyData);
      
      // 3. Get daily user registrations
      console.log("\nTesting daily user analytics...");
      const dailyResponse = await fetch(`${baseUrl}/getAnalytics?type=daily_users&limit=7`);
      const dailyData = await dailyResponse.json();
      console.log("Daily User Analytics:", dailyData);
    } catch (error) {
      console.error("Error testing endpoints:", error);
    }
  },
  
  // Sample analytics data structure
  sampleData: {
    overall: {
      total_users: 1250,
      users_with_gold: 450,
      total_orders: 2850,
      successful_orders: 2340,
      total_gold_sold_all_time: 1580.5,
      total_revenue_all_time: 2450000000,
      last_updated: "2025-08-12T10:30:00Z",
    },
    
    monthly: [
      {
        month: "2025-08",
        total_gold_sold: 125.5,
        total_revenue: 195000000,
        total_orders: 180,
        successful_orders: 165,
        last_updated: "2025-08-12T10:30:00Z",
      },
      {
        month: "2025-07",
        total_gold_sold: 210.3,
        total_revenue: 325000000,
        total_orders: 250,
        successful_orders: 230,
        last_updated: "2025-08-01T00:00:00Z",
      },
    ],
    
    daily_users: [
      {
        date: "2025-08-12",
        new_users: 15,
        last_updated: "2025-08-12T10:30:00Z",
      },
      {
        date: "2025-08-11",
        new_users: 23,
        last_updated: "2025-08-11T23:59:59Z",
      },
    ],
  },
};

// Analytics queries you might want to run in Firestore console:

/*
// Get all successful orders for manual verification
db.collection("orders")
  .where("admin_status", "==", "success")
  .get()
  .then(snapshot => {
    let totalGold = 0;
    let totalRevenue = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      totalGold += data.quantity || 0;
      totalRevenue += data.amount || 0;
    });
    console.log("Total Gold Sold:", totalGold);
    console.log("Total Revenue:", totalRevenue);
  });

// Get users with gold balance > 0
db.collection("users")
  .where("balance.gold", ">", 0)
  .get()
  .then(snapshot => {
    console.log("Users with gold:", snapshot.size);
  });

// Get monthly breakdown
db.collection("analytics")
  .doc("monthly")
  .collection("data")
  .orderBy("month", "desc")
  .limit(12)
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => {
      console.log(doc.id, doc.data());
    });
  });
*/

module.exports = testAnalytics;
