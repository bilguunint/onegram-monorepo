// Сугалааны JSON дэх хэрэглэгч бүрт: (1) апп доторх мэдэгдэл + FCM push,
// (2) утсанд SMS, (3) и-мэйл байвал SendGrid и-мэйл илгээнэ.
// Илгээсэн суваг бүрийг JSON-д `notified` талбарт тэмдэглэж, дахин ажиллуулахад
// аль хэдийн илгээсэн хэрэглэгчийг алгасна (зөвхөн шинэ/дутуу нь явна).
//   node scripts/lottery_notify.js ../docs/lottery_gold_3g_2026-10-13_v2.json            # dry-run (юу ч илгээхгүй)
//   node scripts/lottery_notify.js ../docs/lottery_gold_3g_2026-10-13_v2.json --send     # бодитоор илгээнэ
//   ... --send --only-user <uid>   # нэг хэрэглэгч дээр туршихад
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const admin = require("firebase-admin");
// .env-ийг уншина (dotenv багцгүй)
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
admin.initializeApp({ credential: admin.credential.cert(require(path.join(__dirname, "..", "grammgold-firebase.json"))) });
const { sendSMS } = require("../src/services/smsService");
const db = admin.firestore();

const FILE = path.resolve(process.argv[2]);
const SEND = process.argv.includes("--send");
const onlyIdx = process.argv.indexOf("--only-user");
const ONLY = onlyIdx >= 0 ? process.argv[onlyIdx + 1] : null;

const TITLE = "Сугалааны дугаар";
const msgFor = (code) => `Таны 3гр алтан хуримтлал сугалаат аяны сугалааны дугаар: ${code}`;

async function sendEmail(to, code) {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) throw new Error("SENDGRID_API_KEY байхгүй (.env)");
  await axios.post("https://api.sendgrid.com/v3/mail/send", {
    personalizations: [{ to: [{ email: String(to).toLowerCase() }] }],
    from: { email: process.env.SENDGRID_FROM_EMAIL || "no-reply@onegram.mn", name: "Ikh Khaadiin Chuluu" },
    subject: "3гр алтан хуримтлал сугалаат аян — таны сугалааны дугаар",
    content: [{ type: "text/plain", value: msgFor(code) }],
  }, { headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" }, timeout: 10000 });
}

async function sendInApp(uid, code) {
  const ref = db.collection("users").doc(uid).collection("notifications").doc();
  await ref.set({ title: TITLE, body: msgFor(code), type: "lottery", createdAt: admin.firestore.FieldValue.serverTimestamp(), read: false });
  const u = (await db.collection("users").doc(uid).get()).data() || {};
  const token = u.fcm_token || (Array.isArray(u.fcm_tokens) ? u.fcm_tokens[0] : null);
  if (!token) return "no_token";
  try {
    await admin.messaging().send({
      token, notification: { title: TITLE, body: msgFor(code) },
      data: { type: "lottery", timestamp: new Date().toISOString() },
      android: { notification: { icon: "ic_notification", color: "#FFD700", sound: "default" }, priority: "high" },
      apns: { payload: { aps: { sound: "default", badge: 1 } } },
    });
    return "sent";
  } catch (e) {
 return "failed:" + (e.code || e.message);
}
}

(async () => {
  const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
  const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || ""));
  const isPhone = (s) => /^\d{8}$/.test(String(s || "").replace(/\D/g, "").replace(/^976/, ""));
  let todo = 0; let done = 0;
  const stat = { app: 0, push: 0, sms: 0, email: 0, skip: 0 };
  const save = () => fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  for (const t of data.tickets) {
    if (ONLY && t.user_id !== ONLY) continue;
    t.notified = t.notified || {};
    const n = t.notified;
    const need = {
      app: !n.app,
      sms: !n.sms && isPhone(t.phone),
      email: !n.email && isEmail(t.email),
    };
    if (!need.app && !need.sms && !need.email) {
 stat.skip++; continue;
}
    todo++;
    if (!SEND) {
      console.log(`[dry] ${t.ticket_number} ${t.name} | app:${need.app ? "✓" : "-"} sms:${need.sms ? t.phone : "-"} email:${need.email ? t.email : "-"}`);
      continue;
    }
    try {
      if (need.app) {
 const r = await sendInApp(t.user_id, t.ticket_number); n.app = new Date().toISOString(); n.push = r; stat.app++; if (r === "sent") stat.push++;
}
      if (need.sms) {
 const ok = await sendSMS(t.phone, msgFor(t.ticket_number)); if (ok) {
 n.sms = new Date().toISOString(); stat.sms++;
} else n.sms_error = "send failed";
}
      if (need.email) {
 try {
 await sendEmail(t.email, t.ticket_number); n.email = new Date().toISOString(); stat.email++;
} catch (e) {
 n.email_error = e.response?.data?.errors?.[0]?.message || e.message;
}
}
    } catch (e) {
 n.error = e.message; console.error("алдаа", t.user_id, e.message);
}
    done++;
    if (done % 25 === 0) {
 save(); console.log(`... ${done}/${todo}`);
}
  }
  if (SEND) save();
  console.log(`\nнийт: ${data.tickets.length} | илгээх шаардлагатай: ${todo} | аль хэдийн илгээсэн (алгассан): ${stat.skip}`);
  if (SEND) console.log(`илгээсэн — апп: ${stat.app}, push: ${stat.push}, sms: ${stat.sms}, email: ${stat.email} | JSON шинэчлэгдлээ`);
  else console.log("(dry-run; илгээхийн тулд --send)");
  process.exit(0);
})().catch((e) => {
 console.error(e); process.exit(1);
});
