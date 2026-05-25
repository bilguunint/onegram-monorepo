const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

const QPAY_USERNAME = "ONE_GRAM_GOLD";
const QPAY_PASSWORD = "zElO7j40";

// Main callback processing function
async function processQPayCallback(req, db, attemptNumber = 1) {
  const orderId = req.query.orderId;
  const userId = req.query.userId;
  
  logger.info(`📥 Callback received (Attempt ${attemptNumber})`, { orderId, userId });

  if (!orderId) {
    logger.error("🚫 Missing orderId in callback", {
      queryKeys: req.query ? Object.keys(req.query) : [],
    });
    throw new Error("Missing orderId");
  }

  // Find pending invoice by orderId from pending_invoices collection
  const pendingQuery = await db.collection("pending_invoices")
    .where("order_id", "==", orderId)
    .limit(1)
    .get();

  if (pendingQuery.empty) {
    logger.error("❗️ No pending invoice found for orderId", { orderId, userId });
    throw new Error("No pending invoice found for this order");
  }

  const pendingDoc = pendingQuery.docs[0];
  const pendingData = pendingDoc.data();
  const invoice_id = pendingData.invoice_id;
  const actualUserId = pendingData.userId;

  logger.info("✅ Found pending invoice", { orderId, invoice_id, actualUserId, attemptNumber });

  const { amount } = pendingData;
  logger.info("🧾 Processing payment for", { invoice_id, orderId, actualUserId, amount, attemptNumber });

  // Get fresh QPay token
  logger.info(`🔐 Getting fresh QPay token (Attempt ${attemptNumber})...`);
  const tokenResponse = await axios.post("https://merchant.qpay.mn/v2/auth/token", {}, {
    auth: {
      username: QPAY_USERNAME,
      password: QPAY_PASSWORD,
    },
    timeout: 10000,
  });
  const token = tokenResponse.data.access_token;
  logger.info("✅ QPay token acquired");

  // Check payment status from QPay with retry mechanism
  let paymentStatus = null;
  let checkSuccess = false;
  const maxRetries = 5;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`🔄 QPay payment check attempt ${attempt}/${maxRetries} (Main Attempt ${attemptNumber})`, { invoice_id, orderId });
      
      const checkResponse = await axios.post("https://merchant.qpay.mn/v2/payment/check", {
        object_type: "INVOICE",
        object_id: invoice_id,
      }, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      });

      const rows = checkResponse.data.rows;
      logger.info("📦 QPay payment check response", { rows, attempt, mainAttempt: attemptNumber });

      if (!rows || rows.length === 0) {
        logger.warn(`❓ No payment record found on attempt ${attempt}`);
        
        if (attempt < maxRetries) {
          // Wait before retry: 2s, 4s, 8s, 16s, 32s
          const waitTime = Math.pow(2, attempt) * 1000;
          logger.info(`⏳ Waiting ${waitTime}ms before next attempt...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        } else {
          throw new Error("Payment record not found after all retries");
        }
      }

      paymentStatus = rows[0].payment_status;
      logger.info("💰 Payment status", { paymentStatus, invoice_id, orderId, attempt, mainAttempt: attemptNumber });
      
      checkSuccess = true;
      break; // Success, exit retry loop
    } catch (checkError) {
      logger.error(`❌ QPay check failed on attempt ${attempt}`, {
        error: checkError.message,
        code: checkError.code,
        invoice_id,
        orderId,
        mainAttempt: attemptNumber,
      });
      
      if (attempt < maxRetries) {
        // Wait before retry: 2s, 4s, 8s, 16s, 32s
        const waitTime = Math.pow(2, attempt) * 1000;
        logger.info(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        // Final attempt failed, log and save for manual review
        await db.collection("payment_check_failures").add({
          orderId,
          userId: actualUserId,
          invoice_id,
          error: checkError.message,
          errorCode: checkError.code || 'UNKNOWN',
          attempts: maxRetries,
          mainAttempt: attemptNumber,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          resolved: false,
        });
        
        throw checkError; // Re-throw to trigger main catch block
      }
    }
  }

  if (!checkSuccess) {
    throw new Error("Failed to check payment status after all retries");
  }

  if (paymentStatus === "PAID") {
    // Update order payment_status to "success"
    await db.collection("orders").doc(orderId).update({
      payment_status: "success",
      paid_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    logger.info("✅ Order payment_status updated to success", { orderId, invoice_id, mainAttempt: attemptNumber });
  } else {
    logger.info(`⌛️ Payment not completed yet`, { paymentStatus, invoice_id, orderId, mainAttempt: attemptNumber });
  }

  logger.info("🎉 Callback processed successfully", { invoice_id, orderId, actualUserId, paymentStatus, mainAttempt: attemptNumber });
  
  return {
    success: true,
    message: "Callback processed successfully",
    orderId,
    paymentStatus,
    attempt: attemptNumber,
  };
}

exports.qpayCallback = onRequest({
  region: "asia-northeast1", // Tokyo - Mongolia-д хамгийн ойр
  memory: "512MiB",
  timeoutSeconds: 120,
}, async (req, res) => {
  const db = admin.firestore();
  const maxMainAttempts = 3; // Retry whole callback process up to 3 times on 500 error

  // Log all incoming data for debugging
  logger.info("📥 Full callback data", { 
    method: req.method,
    headers: req.headers,
    body: req.body,
    query: req.query, 
  });

  for (let mainAttempt = 1; mainAttempt <= maxMainAttempts; mainAttempt++) {
    try {
      logger.info(`🚀 Starting callback processing - Main Attempt ${mainAttempt}/${maxMainAttempts}`);
      
      const result = await processQPayCallback(req, db, mainAttempt);
      
      return res.status(200).json(result);
    } catch (err) {
      logger.error(`❌ Error during callback - Main Attempt ${mainAttempt}/${maxMainAttempts}`, { 
        error: err.message, 
        stack: err.stack,
        orderId: req.query && req.query.orderId,
        userId: req.query && req.query.userId,
        attempt: mainAttempt,
      });
      
      // If this is not the last attempt, retry after a delay
      if (mainAttempt < maxMainAttempts) {
        const retryDelay = Math.pow(2, mainAttempt) * 2000; // 4s, 8s
        logger.info(`🔄 Retrying entire callback process in ${retryDelay}ms... (Attempt ${mainAttempt + 1}/${maxMainAttempts})`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue; // Retry
      }
      
      // This was the last attempt, save error and return 500
      logger.error(`💥 All ${maxMainAttempts} callback attempts failed`, {
        orderId: req.query && req.query.orderId,
      });
      
      // Save failed callback for manual review
      try {
        await db.collection("payment_callback_errors").add({
          orderId: req.query && req.query.orderId,
          userId: req.query && req.query.userId,
          error: err.message,
          errorStack: err.stack,
          errorCode: err.code || 'UNKNOWN',
          requestData: {
            method: req.method,
            query: req.query,
            body: req.body,
          },
          totalAttempts: maxMainAttempts,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          resolved: false,
        });
        logger.info("📝 Callback error saved for manual review", {
          orderId: req.query && req.query.orderId,
        });
      } catch (saveError) {
        logger.error("❌ Failed to save callback error", { error: saveError.message });
      }
      
      return res.status(500).json({ 
        error: "Callback processing failed after all retries",
        message: err.message,
        attempts: maxMainAttempts,
      });
    }
  }
});
