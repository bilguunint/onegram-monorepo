const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { updateMonthlyWithdrawAnalytics, updateOverallAnalytics } = require("./analyticsService");

/**
 * Trigger when a new withdraw document is created
 */
exports.onWithdrawCreated = onDocumentCreated(
  {
    document: "withdraws/{withdrawId}",
    memory: "256MiB",
    timeoutSeconds: 120,
  },
  async (event) => {
    try {
      const withdrawData = event.data && event.data.data() ? event.data.data() : null;
      
      if (!withdrawData) {
        console.log("No withdraw data found");
        return null;
      }

      // Only process if status is verified
      if (withdrawData.status === "verified") {
        console.log(`Processing new verified withdraw: ${event.params.withdrawId}`);
        
        // Update analytics
        await updateMonthlyWithdrawAnalytics(withdrawData);
        await updateOverallAnalytics();
        
        console.log("Analytics updated for new verified withdraw");
      }
      
      return null;
    } catch (error) {
      console.error("Error processing withdraw creation:", error);
      throw error;
    }
  },
);

/**
 * Trigger when a withdraw document is updated
 */
exports.onWithdrawUpdated = onDocumentUpdated(
  {
    document: "withdraws/{withdrawId}",
    memory: "256MiB", 
    timeoutSeconds: 120,
  },
  async (event) => {
    try {
      const beforeData = event.data && event.data.before && event.data.before.data() ? event.data.before.data() : null;
      const afterData = event.data && event.data.after && event.data.after.data() ? event.data.after.data() : null;
      
      if (!beforeData || !afterData) {
        console.log("No withdraw data found in update");
        return null;
      }

      // Check if status changed to verified
      const statusChanged = beforeData.status !== afterData.status;
      const nowVerified = afterData.status === "verified";
      
      if (statusChanged && nowVerified) {
        console.log(`Processing withdraw status change to verified: ${event.params.withdrawId}`);
        
        // Update analytics
        await updateMonthlyWithdrawAnalytics(afterData);
        await updateOverallAnalytics();
        
        console.log("Analytics updated for verified withdraw");
      }
      
      return null;
    } catch (error) {
      console.error("Error processing withdraw update:", error);
      throw error;
    }
  },
);
