const admin = require("firebase-admin");

const db = admin.firestore();

async function runCheckInvoices() {
  console.log("🔍 Starting invoice check against qpay_payments collection...");
  console.log("=".repeat(60));

  try {
    // Get pending invoices from 2026 only
    const year2026Start = new Date("2026-01-01T00:00:00Z");
    const timestamp2026 = admin.firestore.Timestamp.fromDate(year2026Start);
    
    console.log("📋 Fetching pending invoices from 2026...");
    const pendingInvoicesSnapshot = await db.collection("pending_invoices")
      .where("createdAt", ">=", timestamp2026)
      .get();
    
    console.log(`✅ Found ${pendingInvoicesSnapshot.size} pending invoices from 2026`);

    let checkedCount = 0;
    let successInOrdersCount = 0;
    let mismatchCount = 0;
    let notFoundInQPayCount = 0;

    console.log("\n🔄 Checking invoices...");
    console.log("-".repeat(60));

    for (const doc of pendingInvoicesSnapshot.docs) {
      const invoiceData = doc.data();
      const { order_id, invoice_id, userId, amount, createdAt } = invoiceData;

      checkedCount++;
      
      // Format createdAt for display
      let createdAtDisplay = 'N/A';
      if (createdAt) {
        const createdDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
        createdAtDisplay = createdDate.toISOString();
      }
      
      console.log(`\n[${checkedCount}/${pendingInvoicesSnapshot.size}] Checking invoice: ${invoice_id}`);
      console.log(`   Created: ${createdAtDisplay}`);
      console.log(`   Order ID: ${order_id}`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Amount: ${amount}`);

      // Check if invoice_id exists in qpay_payments collection (as object_id)
      console.log(`   🔍 Searching qpay_payments collection...`);
      const qpayPaymentsSnapshot = await db.collection("qpay_payments")
        .where("object_id", "==", invoice_id)
        .get();

      if (qpayPaymentsSnapshot.empty) {
        notFoundInQPayCount++;
        console.log(`   ⚠️  Invoice not found in qpay_payments collection`);
        continue;
      }

      // Found in qpay_payments, get payment details
      const qpayPaymentDoc = qpayPaymentsSnapshot.docs[0];
      const qpayPaymentData = qpayPaymentDoc.data();
      const qpayPaymentStatus = qpayPaymentData.payment_status;

      console.log(`   ✅ Found in qpay_payments: ${qpayPaymentDoc.id}`);
      console.log(`   💰 QPay payment_status: ${qpayPaymentStatus}`);

      // Get order from orders collection
      const orderDoc = await db.collection("orders").doc(order_id).get();

      if (!orderDoc.exists) {
        console.log(`   ⚠️  Order not found in orders collection`);
        continue;
      }

      const orderData = orderDoc.data();
      const orderPaymentStatus = orderData.payment_status;

      console.log(`   📦 Order payment_status: ${orderPaymentStatus}`);

      // If order is already success, skip
      if (orderPaymentStatus === "success") {
        successInOrdersCount++;
        console.log(`   ✅ Order already marked as success, all good!`);
        continue;
      }

      // Check for mismatch: pending in orders but PAID in QPay
      if (qpayPaymentStatus === "PAID") {
        mismatchCount++;
        console.log(`   🚨 MISMATCH FOUND! Order is pending but payment is PAID in QPay`);
        console.log(`   ═══════════════════════════════════════════════════════════`);
        console.log(`   📌 Order ID: ${order_id}`);
        console.log(`   📌 Invoice ID: ${invoice_id}`);
        console.log(`   📌 User ID: ${userId}`);
        console.log(`   📌 Amount: ${amount}`);
        console.log(`   📌 QPay Payment ID: ${qpayPaymentData.payment_id}`);
        console.log(`   ═══════════════════════════════════════════════════════════`);

        const mismatchData = {
          order_id,
          invoice_id,
          userId,
          amount,
          orderPaymentStatus,
          qpayPaymentStatus,
          qpay_payment_id: qpayPaymentData.payment_id,
          qpay_payment_date: qpayPaymentData.payment_date,
          qpay_paid_by: qpayPaymentData.paid_by || null,
          detected_at: admin.firestore.FieldValue.serverTimestamp(),
          resolved: false,
          source: "checkInvoices_qpay_payments_collection",
        };

        // Save to mismatch_orders collection
        const mismatchRef = db.collection("mismatch_orders").doc(order_id);
        await mismatchRef.set(mismatchData, { merge: true });
        console.log(`   💾 Saved to mismatch_orders collection`);
      } else {
        console.log(`   ✅ Status match - both pending`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 CHECK SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total invoices checked: ${checkedCount}`);
    console.log(`Orders already success: ${successInOrdersCount}`);
    console.log(`Not found in qpay_payments: ${notFoundInQPayCount}`);
    console.log(`Mismatches found (pending → PAID): ${mismatchCount}`);
    console.log("=".repeat(60));

    console.log("\n🎉 Invoice check completed!");
  } catch (error) {
    console.error("\n❌ Error during invoice check:", error.message);
    console.error(error.stack);
  }
}

module.exports = runCheckInvoices;
