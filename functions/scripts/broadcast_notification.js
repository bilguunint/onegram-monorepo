// Бүх хэрэглэгчид мэдэгдэл илгээнэ (sendCustomNotification функцтэй ижил логик,
// гэхдээ Cloud Function-ий 540с хязгааргүй). users/{uid}/notifications-д бичиж,
// FCM push илгээж, custom-notifications-д түүх бүртгэнэ.
//   node scripts/broadcast_notification.js notif.json [--send]
//   notif.json: {"title":"...","body":"...","type":"custom"}
const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(require(path.join(__dirname, "..", "grammgold-firebase.json"))) });
const db = admin.firestore();
const n = JSON.parse(fs.readFileSync(path.resolve(process.argv[2]), "utf8"));
const SEND = process.argv.includes("--send");
const type = n.type || "custom";

(async () => {
  const users = await db.collection("users").select("fcm_token", "fcm_tokens").get();
  const tokens = [];
  for (const d of users.docs) {
 const u = d.data(); const t = u.fcm_token || (Array.isArray(u.fcm_tokens) ? u.fcm_tokens[0] : null); if (t) tokens.push(t);
}
  console.log(`Гарчиг: ${n.title}\nБие: ${n.body}\nхэрэглэгч: ${users.size} | push token: ${tokens.length}`);
  if (!SEND) {
 console.log("(dry-run; илгээхийн тулд --send)"); process.exit(0);
}

  // 1) апп доторх мэдэгдэл (400-аар batch)
  let saved = 0; let batch = db.batch(); let inBatch = 0;
  for (const d of users.docs) {
    batch.set(d.ref.collection("notifications").doc(), { title: n.title, body: n.body, type, createdAt: admin.firestore.FieldValue.serverTimestamp(), read: false });
    inBatch++; saved++;
    if (inBatch === 400) {
 await batch.commit(); batch = db.batch(); inBatch = 0; if (saved % 20000 === 0) console.log(`  saved ${saved}`);
}
  }
  if (inBatch) await batch.commit();
  console.log(`апп мэдэгдэл хадгалсан: ${saved}`);

  // 2) FCM push (500-аар)
  let sent = 0; let failed = 0;
  for (let i = 0; i < tokens.length; i += 500) {
    const msgs = tokens.slice(i, i + 500).map((token) => ({
      token, notification: { title: n.title, body: n.body },
      data: { type, timestamp: new Date().toISOString() },
      android: { notification: { icon: "ic_notification", color: "#FFD700", sound: "default" }, priority: "high" },
      apns: { payload: { aps: { sound: "default", badge: 1 } } },
    }));
    const r = await admin.messaging().sendEach(msgs);
    sent += r.successCount; failed += r.failureCount;
    if ((i / 500 + 1) % 20 === 0) console.log(`  push batch ${i / 500 + 1}/${Math.ceil(tokens.length / 500)}: ${sent} sent, ${failed} failed`);
  }
  // 3) түүх
  await db.collection("custom-notifications").add({
    title: n.title, body: n.body, type, targetType: "all", targetUserIds: null,
    totalUsers: users.size, savedToDb: saved, fcmSent: sent, fcmFailed: failed, noFcmToken: users.size - tokens.length,
    sentVia: "scripts/broadcast_notification.js", createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`✅ push: ${sent} амжилттай, ${failed} амжаагүй (хуучирсан token) | token-гүй: ${users.size - tokens.length} | custom-notifications бүртгэгдлээ`);
  process.exit(0);
})().catch((e) => {
 console.error("❌", e); process.exit(1);
});
