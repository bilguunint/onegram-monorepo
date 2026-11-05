// Нэг хэрэглэгчид апп доторх мэдэгдэл бичиж FCM push илгээнэ.
//   node scripts/notify_user.js <uid> notif.json [--send]
//   notif.json: {"title":"...","body":"...","type":"installment"}
const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(require(path.join(__dirname, "..", "grammgold-firebase.json"))) });
const db = admin.firestore();
const UID = process.argv[2];
const n = JSON.parse(fs.readFileSync(path.resolve(process.argv[3]), "utf8"));
const SEND = process.argv.includes("--send");
const type = n.type || "custom";

(async () => {
  const uref = db.collection("users").doc(UID);
  const u = (await uref.get()).data();
  if (!u) throw new Error("хэрэглэгч олдсонгүй");
  const token = u.fcm_token || (Array.isArray(u.fcm_tokens) ? u.fcm_tokens[0] : null);
  console.log(`${u.last_name || ""} ${u.first_name || ""} ${u.phone || ""} | token: ${token ? "бий" : "байхгүй"}\nГарчиг: ${n.title}\nБие: ${n.body}`);
  if (!SEND) {
 console.log("(dry-run; илгээхийн тулд --send)"); process.exit(0);
}
  await uref.collection("notifications").add({ title: n.title, body: n.body, type, createdAt: admin.firestore.FieldValue.serverTimestamp(), read: false, ...(n.data || {}) });
  let push = "token-гүй";
  if (token) {
    try {
      await admin.messaging().send({ token, notification: { title: n.title, body: n.body },
        data: { type, timestamp: new Date().toISOString(), ...(n.data || {}) },
        android: { notification: { icon: "ic_notification", color: "#FFD700", sound: "default" }, priority: "high" },
        apns: { payload: { aps: { sound: "default", badge: 1 } } } });
      push = "амжилттай";
    } catch (e) {
 push = "амжаагүй: " + e.message;
}
  }
  await db.collection("custom-notifications").add({ title: n.title, body: n.body, type, targetType: "user", targetUserIds: [UID], totalUsers: 1, savedToDb: 1,
    fcmSent: push === "амжилттай" ? 1 : 0, fcmFailed: push.startsWith("амжаагүй") ? 1 : 0, noFcmToken: token ? 0 : 1, sentVia: "scripts/notify_user.js", createdAt: admin.firestore.FieldValue.serverTimestamp() });
  console.log(`✅ апп мэдэгдэл хадгалсан | push: ${push}`);
  process.exit(0);
})().catch((e) => {
 console.error("❌", e.message); process.exit(1);
});
