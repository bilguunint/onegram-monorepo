const admin = require("firebase-admin");

const db = admin.firestore();

async function batchUpdateInvestments() {
  console.log("🔄 Starting batch update of investments with user info...");
  
  let updatedCount = 0;
  let errorCount = 0;
  let notFoundCount = 0;
  
  try {
    // Get all investment documents
    const investmentsSnapshot = await db.collection("investments").get();
    
    if (investmentsSnapshot.empty) {
      console.log("No investments found to update");
      return;
    }
    
    console.log(`Found ${investmentsSnapshot.size} investment documents to process`);
    
    // Process each investment document
    for (const investmentDoc of investmentsSnapshot.docs) {
      const investmentId = investmentDoc.id;
      const investmentData = investmentDoc.data();
      
      try {
        // Skip if already has user object
        if (investmentData.user && investmentData.user.first_name) {
          console.log(`⏭️  Investment ${investmentId} already has user info, skipping`);
          continue;
        }
        
        const userId = investmentData.userId;
        if (!userId) {
          console.log(`⚠️  Investment ${investmentId} missing userId field`);
          errorCount++;
          continue;
        }
        
        // Get user document
        const userDoc = await db.collection("users").doc(userId).get();
        
        if (!userDoc.exists) {
          console.log(`⚠️  User ${userId} not found for investment ${investmentId}`);
          notFoundCount++;
          continue;
        }
        
        const userData = userDoc.data();
        
        // Extract user info
        const userInfo = {
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          email: userData.email || null,
          phone: userData.phone || "",
        };
        
        // Update investment document with user info
        await db.collection("investments").doc(investmentId).update({
          user: userInfo,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        updatedCount++;
        console.log(`✅ Updated investment ${investmentId} for user ${userId} (${userInfo.first_name} ${userInfo.last_name})`);
        
        // Small delay to avoid overwhelming Firestore
        if (updatedCount % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`❌ Error processing investment ${investmentId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Batch update completed!`);
    console.log(`📊 Summary:`);
    console.log(`   Total processed: ${investmentsSnapshot.size}`);
    console.log(`   Successfully updated: ${updatedCount}`);
    console.log(`   Users not found: ${notFoundCount}`);
    console.log(`   Errors: ${errorCount}`);
  } catch (error) {
    console.error("❌ Failed to batch update investments:", error);
    throw error;
  }
}

module.exports = batchUpdateInvestments;
