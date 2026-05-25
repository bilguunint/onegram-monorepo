const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const db = admin.firestore();
const users = JSON.parse(fs.readFileSync(path.join(__dirname, "../../all_users.json"), "utf8"));

async function updateBalancesOnly() {
  console.log(`🔄 Updating balances for ${users.length} users...`);
  
  let updatedCount = 0;
  let errorCount = 0;
  const batchSize = 100; // Process in smaller batches for better performance
  
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, Math.min(i + batchSize, users.length));
    console.log(`⏳ Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(users.length/batchSize)} (${i + 1}-${i + batch.length})`);
    
    // Process batch in parallel for speed
    const promises = batch.map(async (user) => {
      const uid = `user_${user.id}`;
      
      try {
        // Check if user exists first
        const userRef = db.collection("users").doc(uid);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
          console.log(`⚠️ User not found: ${uid}`);
          return false;
        }
        
        // Update only balance fields
        await userRef.update({
          "balance.gold": user.balance_total || 0,
          "balance.silver": user.balance_silver_total || 0,
        });
        
        return true;
      } catch (error) {
        console.error(`❌ Error updating ${uid}:`, error.message);
        return false;
      }
    });
    
    // Wait for all promises in this batch
    const results = await Promise.all(promises);
    const batchUpdated = results.filter((r) => r === true).length;
    const batchErrors = results.filter((r) => r === false).length;
    
    updatedCount += batchUpdated;
    errorCount += batchErrors;
    
    console.log(`✅ Batch completed: ${batchUpdated} updated, ${batchErrors} errors`);
    
    // Small delay to avoid overwhelming Firestore
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  
  console.log(`\n🎉 Balance update finished!`);
  console.log(`📊 Summary:`);
  console.log(`   Total processed: ${users.length}`);
  console.log(`   Successfully updated: ${updatedCount}`);
  console.log(`   Errors: ${errorCount}`);
}

module.exports = updateBalancesOnly;
