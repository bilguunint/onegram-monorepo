// Зөвхөн УНШИХ: утсаар хэрэглэгчийн шүтээн хуурын эзэмшлийг (shuteen_orders + shuteen_holders) хэвлэнэ.
//   node scripts/check_shuteen_by_phone.js 99998085
const path = require("path");
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(require(path.join(__dirname, "..", "grammgold-firebase.json"))) });
const db = admin.firestore();
const PHONE = process.argv[2];
const fmt = (t) => (t && t.toDate ? t.toDate().toISOString().replace("T", " ").slice(0, 16) : "");
(async () => {
  let us = await db.collection("users").where("phone", "==", PHONE).get();
  if (us.empty) us = await db.collection("users").where("phone", "==", "+976" + PHONE).get();
  console.log("users:", us.size);
  for (const u of us.docs) {
    const d = u.data();
    console.log("USER", u.id, d.first_name, d.last_name, d.phone, d.email || "");
    const h = await db.collection("shuteen_holders").doc(u.id).get();
    console.log("shuteen_holders:", h.exists ? JSON.stringify({ units: h.data().units, amount: h.data().amount, order_count: h.data().order_count, tier: h.data().tier, first_at: fmt(h.data().first_at) }) : "байхгүй");
    const os = await db.collection("shuteen_orders").where("buyer_uid", "==", u.id).get();
    let units = 0; let amount = 0;
    console.log("shuteen_orders:", os.size);
    for (const o of os.docs) {
      const x = o.data();
      units += Number(x.units || 0); amount += Number(x.amount || 0);
      console.log(`   ${o.id}  units:${x.units}  amount:${x.amount}  status:${x.status || ""}  cert:${x.certificate_no || x.certificate_seq || ""}  ${fmt(x.created_at || x.paid_at)}  buyback:${fmt(x.buyback_date)}`);
    }
    console.log("НИЙТ units:", units, "дүн:", amount);
    const pend = await db.collection("pending_invoices").where("user_id", "==", u.id).where("type", "==", "shuteen").get().catch(() => ({ size: "?", docs: [] }));
    console.log("shuteen pending_invoices:", pend.size);
    for (const p of pend.docs) {
 const v = p.data(); console.log(`   ${v.status}  units:${v.units}  amount:${v.amount}  ${fmt(v.createdAt || v.created_at)}  ${v.invoice_id}`);
}
  }
  process.exit(0);
})().catch((e) => {
 console.error(e); process.exit(1);
});
