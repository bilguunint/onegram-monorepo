const admin = require("firebase-admin");
const axios = require("axios");

const db = admin.firestore();

const QPAY_USERNAME = "ONE_GRAM_GOLD";
const QPAY_PASSWORD = "zElO7j40";

async function getQPayToken() {
  try {
    const tokenResponse = await axios.post("https://merchant.qpay.mn/v2/auth/token", {}, {
      auth: {
        username: QPAY_USERNAME,
        password: QPAY_PASSWORD,
      },
      timeout: 10000,
    });
    return tokenResponse.data.access_token;
  } catch (error) {
    console.error("❌ Failed to get QPay token:", error.message);
    throw error;
  }
}

async function getAllQPayPayments(token, startDate, endDate) {
  try {
    console.log(`🔍 Fetching QPay payments from ${startDate} to ${endDate}`);
    
    const payload = {
      object_type: "INVOICE",
      object_id: "ONE_GRAM_GOLD_INVOICE",
      start_date: startDate,
      end_date: endDate,
      offset: {
        page_number: 1,
        page_limit: 1000,
      },
    };

    const response = await axios.post(
      "https://merchant.qpay.mn/v2/payment/list",
      payload,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    console.log("\n📦 QPay Response Data:");
    console.log("=".repeat(60));
    console.log(JSON.stringify(response.data, null, 2));
    console.log("=".repeat(60));

    const count = response.data.count || 0;
    const rows = response.data.rows || [];
    
    console.log(`\n✅ Found ${count} payment(s)`);
    
    return rows;
  } catch (error) {
    console.error("❌ Failed to get payment list:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

async function savePaymentsToFirestore(payments) {
  console.log(`\n💾 Saving ${payments.length} payment(s) to Firestore...`);
  
  let savedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (const payment of payments) {
    try {
      const paymentId = payment.payment_id;
      const paymentRef = db.collection("qpay_payments").doc(paymentId);
      
      const paymentDoc = await paymentRef.get();
      
      const paymentData = {
        payment_id: payment.payment_id,
        payment_date: payment.payment_date,
        payment_status: payment.payment_status,
        payment_fee: payment.payment_fee || 0,
        payment_amount: payment.payment_amount,
        payment_currency: payment.payment_currency || "MNT",
        payment_wallet: payment.payment_wallet || null,
        payment_name: payment.payment_name || null,
        payment_description: payment.payment_description || null,
        qr_code: payment.qr_code || null,
        paid_by: payment.paid_by || null,
        object_type: payment.object_type,
        object_id: payment.object_id,
        saved_at: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (paymentDoc.exists) {
        // Update existing
        await paymentRef.update(paymentData);
        updatedCount++;
        console.log(`   ✅ Updated payment: ${paymentId}`);
      } else {
        // Create new
        await paymentRef.set(paymentData);
        savedCount++;
        console.log(`   ✅ Saved new payment: ${paymentId}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`   ❌ Failed to save payment ${payment.payment_id}:`, error.message);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 SAVE SUMMARY");
  console.log("=".repeat(60));
  console.log(`New payments saved: ${savedCount}`);
  console.log(`Existing payments updated: ${updatedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total processed: ${savedCount + updatedCount + errorCount}`);
  console.log("=".repeat(60));
}

async function runGetPayments() {
  console.log("🔍 Starting QPay payments fetch...");
  console.log("=".repeat(60));

  try {
    // Get QPay token
    console.log("🔐 Getting QPay token...");
    const token = await getQPayToken();
    console.log("✅ QPay token acquired");

    // Set date range - last 14 days, split into 7-day chunks
    const endDate = new Date();
    const totalStartDate = new Date();
    totalStartDate.setDate(totalStartDate.getDate() - 14);

    console.log(`📅 Total date range: ${totalStartDate.toISOString()} to ${endDate.toISOString()}`);
    console.log(`📦 Fetching in 7-day chunks to avoid timeout...`);

    let allPayments = [];
    let currentStart = new Date(totalStartDate);
    let chunkNumber = 1;

    // Split into 7-day chunks
    while (currentStart < endDate) {
      const currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + 7);
      
      // Don't go beyond the end date
      if (currentEnd > endDate) {
        currentEnd.setTime(endDate.getTime());
      }

      const startDateStr = currentStart.toISOString().replace('T', ' ').substring(0, 19);
      const endDateStr = currentEnd.toISOString().replace('T', ' ').substring(0, 19);

      console.log(`\n� Chunk ${chunkNumber}: ${startDateStr} to ${endDateStr}`);

      try {
        // Get payments for this chunk
        const payments = await getAllQPayPayments(token, startDateStr, endDateStr);
        allPayments = allPayments.concat(payments);
        console.log(`   ✅ Chunk ${chunkNumber}: Found ${payments.length} payment(s)`);
        
        // Small delay between requests to avoid rate limiting
        if (currentEnd < endDate) {
          console.log(`   ⏳ Waiting 2 seconds before next chunk...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`   ❌ Chunk ${chunkNumber} failed:`, error.message);
        // Continue with next chunk even if one fails
      }

      // Move to next chunk
      currentStart = new Date(currentEnd);
      chunkNumber++;
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`📊 TOTAL PAYMENTS FOUND: ${allPayments.length}`);
    console.log(`${"=".repeat(60)}`);

    if (allPayments.length === 0) {
      console.log("\n⚠️  No payments found for the specified date range");
      return;
    }

    // Save all payments to Firestore
    await savePaymentsToFirestore(allPayments);

    console.log("\n🎉 QPay payments fetch and save completed successfully!");
  } catch (error) {
    console.error("\n❌ Error during QPay payments fetch:", error.message);
    console.error(error.stack);
  }
}

module.exports = runGetPayments;
