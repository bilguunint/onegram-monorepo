const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const db = admin.firestore();
const users = JSON.parse(fs.readFileSync(path.join(__dirname, "../../all_users.json"), "utf8"));

async function checkBalanceDifferences() {
  console.log(`🔍 Checking balance differences for ${users.length} users...`);
  
  let checkedCount = 0;
  let differentCount = 0;
  const differences = [];
  
  const batchSize = 50; // Smaller batch for checking
  
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, Math.min(i + batchSize, users.length));
    console.log(`⏳ Checking batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(users.length/batchSize)} (${i + 1}-${i + batch.length})`);
    
    const promises = batch.map(async (user) => {
      const uid = `user_${user.id}`;
      
      try {
        const userDoc = await db.collection("users").doc(uid).get();
        
        if (!userDoc.exists) {
          return { uid, status: 'not_found' };
        }
        
        const currentData = userDoc.data();
        const currentGold = (currentData.balance && currentData.balance.gold) || 0;
        const currentSilver = (currentData.balance && currentData.balance.silver) || 0;
        
        const newGold = user.balance_total || 0;
        const newSilver = user.balance_silver_total || 0;
        
        if (currentGold !== newGold || currentSilver !== newSilver) {
          return {
            uid,
            status: 'different',
            current: { gold: currentGold, silver: currentSilver },
            new: { gold: newGold, silver: newSilver },
          };
        }

        return { uid, status: 'same' };
      } catch (error) {
        return { uid, status: 'error', error: error.message };
      }
    });
    
    const results = await Promise.all(promises);
    
    results.forEach((result) => {
      checkedCount++;
      
      if (result.status === 'different') {
        differentCount++;
        differences.push(result);
        console.log(`🔄 ${result.uid}: Gold ${result.current.gold} → ${result.new.gold}, Silver ${result.current.silver} → ${result.new.silver}`);
      } else if (result.status === 'not_found') {
        console.log(`⚠️ User not found: ${result.uid}`);
      } else if (result.status === 'error') {
        console.log(`❌ Error checking ${result.uid}: ${result.error}`);
      }
    });
    
    // Small delay
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  
  console.log(`\n📋 Summary:`);
  console.log(`   Total checked: ${checkedCount}`);
  console.log(`   Same balances: ${checkedCount - differentCount}`);
  console.log(`   Different balances: ${differentCount}`);
  
  if (differentCount > 0) {
    console.log(`\n💡 To update these differences, run:`);
    console.log(`   UPDATE_BALANCES=true node src/index.js`);
  } else {
    console.log(`\n✅ All balances are in sync!`);
  }
  
  return differences;
}

module.exports = checkBalanceDifferences;
