const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

const db = admin.firestore();

module.exports = functions.https.onRequest(
  {
    memory: "512MiB",
    timeoutSeconds: 120,
  },
  async (req, res) => {
    return cors(req, res, async () => {
      try {
        if (req.method !== "POST") {
          return res.status(405).json({
            status: "failed",
            msg: "Method Not Allowed",
          });
        }

        // Get admin token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return res.status(401).json({
            status: "failed",
            msg: "Missing or invalid Authorization header",
          });
        }

        const token = authHeader.split("Bearer ")[1];
        const { userId } = req.body;

        // Validate required fields
        if (!userId) {
          return res.status(400).json({
            status: "failed",
            msg: "Missing required field: userId",
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
        const adminRole = adminData.role;
        const adminName = adminData.name || "Unknown Admin";

        // Check if admin has required role (admin or manager)
        if (!adminRole || (adminRole !== "admin" && adminRole !== "manager")) {
          return res.status(403).json({
            status: "failed",
            msg: "Insufficient permissions. Admin or Manager role required",
          });
        }

        // Check if target user exists
        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
          return res.status(404).json({
            status: "failed",
            msg: "User not found",
          });
        }

        const userData = userDoc.data();
        const userPhone = userData.phone || "Unknown";

        // Check if user has a PIN to reset
        if (!userData.pinHash) {
          return res.status(400).json({
            status: "failed",
            msg: "User does not have a PIN set",
          });
        }

        // Reset PIN by removing pinHash field
        await userRef.update({
          pinHash: admin.firestore.FieldValue.delete(),
          pinResetAt: admin.firestore.FieldValue.serverTimestamp(),
          pinResetBy: adminId,
          pinResetByName: adminName,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`PIN reset completed for user ${userId} by admin ${adminName} (${adminRole})`);

        return res.status(200).json({
          status: "success",
          msg: "PIN reset successfully",
          data: {
            userId: userId,
            userPhone: userPhone,
            resetBy: adminName,
            resetByRole: adminRole,
            resetAt: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.error("resetPin error:", error);

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
  });
