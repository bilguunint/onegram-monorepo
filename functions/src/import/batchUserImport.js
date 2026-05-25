const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const db = admin.firestore();
const users = JSON.parse(fs.readFileSync(path.join(__dirname, "../../all_users.json"), "utf8"));
const BATCH_SIZE = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function userExists(uid) {
  try {
    await admin.auth().getUser(uid);
    return true;
  } catch (err) {
    if (err.code === "auth/user-not-found") return false;
    throw err; // бусад алдаанд унана
  }
}

async function importBatch(startIndex, endIndex) {
  const batchUsers = users.slice(startIndex, endIndex);

  for (const user of batchUsers) {
    const uid = `user_${user.id}`;
    const phone = user.phone ? `+976${user.phone}` : undefined;
    const email = user.email || undefined;

    try {
      const exists = await userExists(uid);
      
      // Firebase Auth-д байхгүй бол үүсгэх
      if (!exists) {
        await admin.auth().createUser({
          uid,
          phoneNumber: phone,
          email: email,
          emailVerified: false,
          disabled: false,
        });
        console.log(`🆕 Created Firebase Auth user: ${uid}`);
      } else {
        console.log(`ℹ️ Firebase Auth user exists: ${uid}`);
      }

      // Firestore document үргэлж үүсгэх (Auth байгаа эсэхээс үл хамааран)
      await db.collection("users").doc(uid).set({
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        email: user.email,
        invest_total: user.invest_total,
        registration_number: user.registration_number,
        created_at: new Date(user.created_at),
        balance: {
          gold: user.balance_total || 0,
          silver: user.balance_silver_total || 0,
        },
      });

      // Create investment document if user has investment
      if (user.invest_total && user.invest_total > 0) {
        const now = admin.firestore.Timestamp.now();
        const endDate = admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000), // 3 months from now
        );

        await db.collection("investments").doc(uid).set({
          balance: user.invest_total,
          createdAt: now,
          endDate: endDate,
          userId: uid,
        });

        console.log(`💰 Created investment for ${uid}: ${user.invest_total}`);
      }

      console.log(`✅ Processed user: ${uid}`);
    } catch (err) {
      console.error(`❌ Error processing ${uid}:`, err.message);
    }
  }
}

async function runImport() {
  const total = users.length;
  console.log(`🔁 Importing/updating all users and investments...`);

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const start = i;
    const end = Math.min(i + BATCH_SIZE, total);
    console.log(`⏳ Processing batch ${start} to ${end - 1}...`);

    await importBatch(start, end);
    await sleep(3000);
  }

  console.log("🎉 Import/update finished.");
}

module.exports = runImport;
