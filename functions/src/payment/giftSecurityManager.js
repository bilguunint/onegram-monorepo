const admin = require("firebase-admin");

/**
 * Rate limiting middleware for gift operations
 * Prevents abuse by limiting number of operations per user per time window
 */
class GiftSecurityManager {
  constructor() {
    this.db = admin.firestore();
    // Rate limiting: max 5 gift operations per minute per user
    this.rateLimit = {
      maxOperations: 5,
      windowMs: 60 * 1000, // 1 minute
    };
  }

  /**
   * Check rate limiting for gift operations
   * @param {string} userUid - User ID
   * @param {string} operation - Operation type (create, accept, cancel)
   * @return {Promise<boolean>} - Returns true if operation is allowed
   */
  async checkRateLimit(userUid, operation) {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.rateLimit.windowMs);
    
    const rateLimitRef = this.db.collection("rate_limits").doc(userUid);
    
    return this.db.runTransaction(async (tx) => {
      const rateLimitSnap = await tx.get(rateLimitRef);
      
      let operations = [];
      if (rateLimitSnap.exists) {
        operations = rateLimitSnap.data().operations || [];
      }
      
      // Filter operations within current window
      operations = operations.filter((op) => new Date(op.timestamp) > windowStart);
      
      // Check if user has exceeded rate limit
      if (operations.length >= this.rateLimit.maxOperations) {
        throw new Error("Rate limit exceeded. Please wait before making another gift operation.");
      }
      
      // Add current operation
      operations.push({
        operation: operation,
        timestamp: now.toISOString(),
      });
      
      // Update rate limit document
      tx.set(rateLimitRef, {
        operations: operations,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      
      return true;
    });
  }

  /**
   * Validate gift amount and limits
   * @param {number} amount - Gift amount
   * @param {string} metalId - Metal type
   * @param {number} userBalance - User's current balance
   * @return {void} - Throws error if validation fails
   */
  validateGiftLimits(amount, metalId, userBalance) {
    // Minimum gift amount
    const minAmount = metalId === "gold" ? 0.001 : 0.1;
    if (amount < minAmount) {
      throw new Error(`Minimum gift amount is ${minAmount} ${metalId}`);
    }
    
    // Maximum gift amount (daily limit)
    const maxAmount = metalId === "gold" ? 10 : 1000;
    if (amount > maxAmount) {
      throw new Error(`Maximum daily gift amount is ${maxAmount} ${metalId}`);
    }
    
    // User balance check with safety margin
    if (amount > userBalance * 0.95) {
      throw new Error("Cannot gift more than 95% of your balance");
    }
  }

  /**
   * Check for suspicious activity patterns
   * @param {string} userUid - User ID
   * @param {string} receiverPhone - Receiver phone number
   * @return {Promise<void>} - Throws error if suspicious activity detected
   */
  async checkSuspiciousActivity(userUid, receiverPhone) {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Check gifts to same receiver in last 24 hours
    const recentGiftsQuery = this.db.collection("gift_orders")
      .where("sender.uid", "==", userUid)
      .where("receiver.phone", "==", receiverPhone)
      .where("created_at", ">=", last24Hours);
    
    const recentGiftsSnap = await recentGiftsQuery.get();
    
    if (recentGiftsSnap.size >= 3) {
      throw new Error("Too many gifts to same receiver in 24 hours. Please contact support if this is legitimate.");
    }
    
    // Check total number of gifts by user in last hour
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const hourlyGiftsQuery = this.db.collection("gift_orders")
      .where("sender.uid", "==", userUid)
      .where("created_at", ">=", lastHour);
    
    const hourlyGiftsSnap = await hourlyGiftsQuery.get();
    
    if (hourlyGiftsSnap.size >= 10) {
      throw new Error("Too many gifts in the last hour. Please wait before creating more gifts.");
    }
  }

  /**
   * Log security events for monitoring
   * @param {string} eventType - Type of security event
   * @param {string} userUid - User ID
   * @param {Object} details - Event details
   * @return {Promise<void>}
   */
  async logSecurityEvent(eventType, userUid, details) {
    const securityLogRef = this.db.collection("security_logs").doc();
    
    await securityLogRef.set({
      event_type: eventType,
      user_uid: userUid,
      details: details,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip_address: details.ip_address || null,
      user_agent: details.user_agent || null,
    });
  }
}

module.exports = GiftSecurityManager;
