const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { addQty } = require("../utils/money");

const db = admin.firestore();

module.exports = functions.https.onRequest(
    
    {
    memory: "512MiB",
    timeoutSeconds: 120,
  }, async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: "failed",
        msg: "Missing or invalid Authorization header",
      });
    }

    const token = authHeader.split('Bearer ')[1];
    const { investmentId, attachFile, closeDate } = req.body;

    // Validate required fields
    if (!investmentId || !attachFile || !closeDate) {
      return res.status(400).json({
        status: "failed",
        msg: "Missing required fields: investmentId, attachFile, closeDate",
      });
    }

    // Validate closeDate format
    let closeDateTimestamp;
    try {
      closeDateTimestamp = admin.firestore.Timestamp.fromDate(new Date(closeDate));
    } catch (dateError) {
      return res.status(400).json({
        status: "failed",
        msg: "Invalid closeDate format",
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

    // Run transaction to ensure atomicity
    const result = await db.runTransaction(async (transaction) => {
      // ALL READS FIRST - Define references
      const investmentRef = db.collection("investments").doc(investmentId);
      
      // Read investment document
      const investmentDoc = await transaction.get(investmentRef);

      // Validate investment exists
      if (!investmentDoc.exists) {
        throw new Error("Investment not found");
      }

      const investmentData = investmentDoc.data();
      
      // Check if investment is already closed
      if (investmentData.status === "closed") {
        throw new Error("Investment is already closed");
      }

      const investmentBalance = investmentData.balance || 0;
      const userId = investmentData.userId;

      if (!userId) {
        throw new Error("Investment document does not have userId field");
      }

      // Read user document
      const userRef = db.collection("users").doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      const userData = userDoc.data();
      const currentGoldBalance = (userData.balance && userData.balance.gold) || 0;

      // Calculate new balance (rounded to 6 decimals to avoid IEEE float drift)
      const newGoldBalance = addQty(currentGoldBalance, investmentBalance);

      // ALL WRITES AFTER - Update investment document
      transaction.update(investmentRef, {
        status: "closed",
        closedDate: closeDateTimestamp,
        attachedFile: attachFile,
        balance: 0,
        closedBy: adminName,
        closedById: adminId,
        closedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update user's gold balance
      transaction.update(userRef, {
        "balance.gold": newGoldBalance,
      });

      console.log(`Closed investment ${investmentId}: balance ${investmentBalance} transferred to user ${userId}`);

      return {
        userId: userId,
        investmentBalance: investmentBalance,
        previousGoldBalance: currentGoldBalance,
        newGoldBalance: newGoldBalance,
        adminName: adminName,
      };
    });

    console.log(`Investment ${investmentId} closed successfully by admin ${adminName}`);

    return res.status(200).json({
      status: "success",
      msg: "Investment closed successfully",
      data: {
        investmentId: investmentId,
        userId: result.userId,
        investmentBalance: result.investmentBalance,
        previousGoldBalance: result.previousGoldBalance,
        newGoldBalance: result.newGoldBalance,
        closedBy: result.adminName,
        closeDate: closeDate,
        attachedFile: attachFile,
      },
    });
  } catch (error) {
    console.error("closeInvestment error:", error);

    // Handle specific transaction errors
    if (error.message === "Investment not found") {
      return res.status(404).json({
        status: "failed",
        msg: "Investment not found",
      });
    }

    if (error.message === "Investment is already closed") {
      return res.status(400).json({
        status: "failed",
        msg: "Investment is already closed",
      });
    }

    if (error.message === "User not found") {
      return res.status(404).json({
        status: "failed",
        msg: "User not found",
      });
    }

    if (error.message.includes("does not have userId")) {
      return res.status(400).json({
        status: "failed",
        msg: error.message,
      });
    }

    return res.status(500).json({
      status: "failed",
      msg: "Internal server error",
    });
  }
});
