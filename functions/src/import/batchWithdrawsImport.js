const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const db = admin.firestore();
const withdraws = JSON.parse(fs.readFileSync(path.join(__dirname, "../../all_withdraws.json"), "utf8"));
const BATCH_SIZE = 500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function importBatch(startIndex, endIndex) {
  const batchWithdraws = withdraws.slice(startIndex, endIndex);

  for (const withdraw of batchWithdraws) {
    try {
      // Transform data according to requirements
      const withdrawData = {
        client: {
          email: withdraw.client_email || null,
          first_name: withdraw.client_first_name || "",
          last_name: withdraw.client_last_name || "",
          phone: withdraw.client_phone || "",
        },
        // Add phone at root level for SMS functionality
        phone: withdraw.client_phone || "",
        created_at: admin.firestore.Timestamp.fromDate(new Date(withdraw.created_at)),
        id: withdraw.id.toString(),
        metal_id: Number(withdraw.metal_id) || 1, // Ensure Number type
        notes: null,
        quantity: Number(withdraw.quantity) || 0, // Ensure Number type
        status: withdraw.admin_status === "success" ? "verified" : "pending", // Use "verified" not "success"
        updated_at: admin.firestore.Timestamp.fromDate(new Date(withdraw.created_at)),
        user_id: `user_${withdraw.user_id}`,
        verificationCode: withdraw.secret_code || "",
        verificationCodeExpiresAt: null,
        verificationCodeUsed: withdraw.admin_status === "success",
        verified_at: withdraw.admin_status === "success" ? 
          admin.firestore.Timestamp.fromDate(new Date(withdraw.created_at)) : null,
        verified_by_name: withdraw.admin_status === "success" ? "System Import" : null,
        verified_by_uid: withdraw.admin_status === "success" ? "system" : null,
      };

      // Create document with custom ID
      await db.collection("withdraws").doc(withdraw.id.toString()).set(withdrawData);

      console.log(`✅ Imported withdraw: ${withdraw.id} for user ${withdrawData.user_id}`);
    } catch (err) {
      console.error(`❌ Error processing withdraw ${withdraw.id}:`, err.message);
    }
  }
}

async function runWithdrawImport() {
  const total = withdraws.length;
  console.log(`🔁 Importing ${total} withdraws...`);

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const start = i;
    const end = Math.min(i + BATCH_SIZE, total);
    console.log(`⏳ Processing batch ${start} to ${end - 1}...`);

    await importBatch(start, end);
    await sleep(2000); // 2 second delay between batches
  }

  console.log("🎉 Withdraw import finished.");
}

module.exports = runWithdrawImport;
