// Зөвхөн УНШИХ оношилгоо: утасны дугаараар хэрэглэгчийн хуваан төлөлтийн
// purchase, payments[] болон pending_invoices-ийг татаж, invoice бүрийг QPay
// payment/check-ээр тулгана. Firestore-д юу ч бичихгүй.
//   node scripts/check_installment_by_phone.js 88885179
const path = require("path");
const admin = require("firebase-admin");
admin.initializeApp({
  credential: admin.credential.cert(require(path.join(__dirname, "..", "grammgold-firebase.json"))),
});
const { getQPayToken, checkQPayPayment } = require("../src/payment/installmentShared");
const db = admin.firestore();
const PHONE = process.argv[2];
const fmt = (t) => (t && t.toDate ? t.toDate().toISOString().replace("T", " ").slice(0, 19) : String(t ?? ""));

(async () => {
  let us = await db.collection("users").where("phone", "==", PHONE).get();
  if (us.empty) us = await db.collection("users").where("phone", "==", "+976" + PHONE).get();
  if (us.empty) us = await db.collection("users").where("phone_number", "==", PHONE).get();
  console.log("users:", us.size);
  const token = await getQPayToken();
  for (const u of us.docs) {
    const d = u.data();
    console.log("USER", u.id, d.first_name, d.last_name, d.phone, d.email);
    const ps = await db.collection("product_purchases").where("user_id", "==", u.id).get();
    console.log("purchases:", ps.size);
    for (const p of ps.docs) {
      const x = p.data();
      console.log("\n== PURCHASE", p.id, "| type:", x.purchase_type || x.type, "| status:", x.status, "| product:", x.product_name || x.product_id);
      console.log("   total_price", x.total_price, "daily", x.daily_payment, "total_days", x.total_days,
        "paid_days", x.paid_days, "paid_amount", x.paid_amount, "created", fmt(x.created_at));
      const pays = Array.isArray(x.payments) ? x.payments : [];
      let sum = 0;
      console.log("   payments[] count:", pays.length);
      for (const e of pays) {
        sum += Number(e.amount || 0);
        console.log(`     day ${String(e.day_no).padStart(2)}  ${String(e.amount).padStart(8)}  ${fmt(e.paid_at)}  ${e.payment_method || ""}  ${e.invoice_id || ""}`);
      }
      console.log("   payments sum:", sum, "| day_no давхардал:", pays.length - new Set(pays.map((e) => e.day_no)).size);
      const inv = await db.collection("pending_invoices").where("purchase_id", "==", p.id).get();
      console.log("   pending_invoices:", inv.size);
      const rows = [];
      for (const i of inv.docs) {
        const v = i.data();
        const q = await checkQPayPayment(v.invoice_id, token, 1);
        rows.push({ created: fmt(v.createdAt || v.created_at), day_from: v.day_from, day_no: v.day_no,
          amount: v.amount, status: v.status, invoice: v.invoice_id, qpay: q || "NO_ROWS" });
      }
      rows.sort((a, b) => (a.created > b.created ? 1 : -1));
      for (const r of rows) {
        console.log(`     ${r.created}  day ${String(r.day_from ?? r.day_no).padStart(2)}→${String(r.day_no).padStart(2)}  ${String(r.amount).padStart(8)}  fs:${String(r.status).padEnd(8)} qpay:${r.qpay}  ${r.invoice}`);
      }
      const paid = rows.filter((r) => r.qpay === "PAID");
      console.log("   QPay PAID invoices:", paid.length, "| PAID дүн:", paid.reduce((s, r) => s + Number(r.amount || 0), 0),
        "| PAID хоног:", paid.reduce((s, r) => s + (Number(r.day_no) - Number(r.day_from ?? r.day_no) + 1), 0));
    }
  }
  process.exit(0);
})().catch((e) => {
 console.error(e); process.exit(1);
});
