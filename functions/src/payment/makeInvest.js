const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { roundQty, addQty, subQty } = require("../utils/money");

const db = admin.firestore();

module.exports = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Get token from Authorization header instead of body
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: "failed",
        msg: "Missing or invalid Authorization header",
      });
    }

    const token = authHeader.split('Bearer ')[1];
    const { userId, quantity, endDate } = req.body; // Remove token from body

    // Validate required fields (token нь header-оос авч байгаа учир body-оос хасах)
    if (!userId || !quantity || !endDate) {
      return res.status(400).json({
        status: "failed",
        msg: "Missing required fields: userId, quantity, endDate",
      });
    }

    // Validate quantity is a positive number
    const investAmount = roundQty(quantity);
    if (!investAmount || investAmount <= 0) {
      return res.status(400).json({
        status: "failed",
        msg: "Quantity must be a positive number",
      });
    }

    // Verify admin token
    let adminDecoded;
    try {
      adminDecoded = await admin.auth().verifyIdToken(token);
      console.log("Admin token verified:", { adminId: adminDecoded.uid });
    } catch (tokenError) {
      console.log("Admin token verification failed:", tokenError.message);
      return res.status(401).json({
        status: "failed",
        msg: "Invalid admin token",
      });
    }

    const adminId = adminDecoded.uid;

    // Get admin info from admins collection
    const adminDoc = await db.collection("admins").doc(adminId).get();
    if (!adminDoc.exists) {
      return res.status(403).json({
        status: "failed",
        msg: "Admin not found",
      });
    }

    const adminData = adminDoc.data();
    const adminName = adminData.name || "Unknown Admin";

    // Validate endDate format
    let endDateTimestamp;
    try {
      endDateTimestamp = admin.firestore.Timestamp.fromDate(new Date(endDate));
    } catch (dateError) {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid endDate format",
      });
    }

    // Run transaction to ensure atomicity
    const result = await db.runTransaction(async (transaction) => {
      // ALL READS FIRST - Define references
      const userRef = db.collection("users").doc(userId);
      const investmentRef = db.collection("investments").doc(userId);
      
      // Read all documents first
      const userDoc = await transaction.get(userRef);
      const investmentDoc = await transaction.get(investmentRef);

      // Validate user exists
      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      const userData = userDoc.data();
      const currentGoldBalance = (userData.balance && userData.balance.gold) || 0;

      // Extract user information for investment document
      const userInfo = {
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        phone: userData.phone || "",
        email: userData.email || "",
      };

      // Check if user has sufficient gold balance
      if (currentGoldBalance < investAmount) {
        throw new Error(`Insufficient gold balance. Current: ${currentGoldBalance}, Required: ${investAmount}`);
      }

      // Calculate new balance (rounded to 6 decimals to avoid IEEE float drift)
      const newGoldBalance = subQty(currentGoldBalance, investAmount);

      // ALL WRITES AFTER - Update user's gold balance
      transaction.update(userRef, {
        "balance.gold": newGoldBalance,
      });

      if (investmentDoc.exists) {
        // Add to existing investment
        const currentInvestment = investmentDoc.data();
        const newInvestmentBalance = addQty(currentInvestment.balance || 0, investAmount);

        transaction.update(investmentRef, {
          balance: newInvestmentBalance,
          endDate: endDateTimestamp,
          verifiedAdmin: adminName,
          verifiedId: adminId,
          user: userInfo,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`Updated existing investment for ${userId}: ${currentInvestment.balance} + ${investAmount} = ${newInvestmentBalance}`);
      } else {
        // Create new investment document
        transaction.set(investmentRef, {
          balance: investAmount,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          endDate: endDateTimestamp,
          userId: userId,
          user: userInfo,
          verifiedAdmin: adminName,
          verifiedId: adminId,
        });

        console.log(`Created new investment for ${userId}: ${investAmount}`);
      }

      return {
        previousGoldBalance: currentGoldBalance,
        newGoldBalance: newGoldBalance,
        investmentAmount: investAmount,
        adminName: adminName,
      };
    });

    console.log(`Investment completed for user ${userId} by admin ${adminName}`);

    return res.status(200).json({
      status: "success",
      msg: "Investment created successfully",
      data: {
        userId: userId,
        investmentAmount: investAmount,
        previousGoldBalance: result.previousGoldBalance,
        newGoldBalance: result.newGoldBalance,
        endDate: endDate,
        verifiedBy: result.adminName,
      },
    });
  } catch (error) {
    console.error("makeInvest error:", error);

    // Handle specific transaction errors
    if (error.message.includes("Insufficient gold balance")) {
      return res.status(400).json({
        status: "failed",
        msg: error.message,
      });
    }

    if (error.message === "User not found") {
      return res.status(404).json({
        status: "failed",
        msg: "User not found",
      });
    }

    return res.status(500).json({
      status: "failed",
      msg: "Internal server error",
    });
  }
});
