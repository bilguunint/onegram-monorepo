// Зөвхөн УНШИХ: сүүлийн N хоногийн pending төлөвтэй хуваан төлөлтийн invoice-уудыг
// QPay payment/check-ээр тулгаж, QPay дээр PAID боловч Firestore-д кредитлэгдээгүйг олно.
//   node scripts/sweep_installment_unpaid_invoices.js [хоног=45]
const path = require("path");
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(require(path.join(__dirname, "..", "grammgold-firebase.json"))) });
const { getQPayToken, checkQPayPayment } = require("../src/payment/installmentShared");
const db = admin.firestore();
const DAYS = Number(process.argv[2] || 45);
const fmt = (t) => (t && t.toDate ? t.toDate().toISOString().slice(0, 16).replace("T", " ") : "");
(async () => {
  const since = admin.firestore.Timestamp.fromMillis(Date.now() - DAYS * 86400000);
  const snap = await db.collection("pending_invoices").where("createdAt", ">=", since).get();
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    .filter((v) => (v.type === "installment" || v.type === "installment_init") && v.status === "pending");
  console.log(`сүүлийн ${DAYS} хоног: pending_invoices ${snap.size}, үүнээс хуваан төлөлтийн pending: ${rows.length}`);
  const token = await getQPayToken();
  const paid = [];
  let i = 0;
  for (const v of rows) {
    i++;
    if (i % 100 === 0) console.log(`  ... ${i}/${rows.length}`);
    const st = await checkQPayPayment(v.invoice_id, token, 1);
    if (st === "PAID") paid.push({ ...v, qpay: st });
  }
  console.log(`\nQPay дээр PAID боловч Firestore-д pending: ${paid.length}`);
  for (const v of paid) {
    let name = ""; let phone = ""; let pd = "";
    if (v.purchase_id) {
      const p = (await db.collection("product_purchases").doc(v.purchase_id).get()).data();
      if (p) {
 name = `${p.user_snapshot?.last_name || ""} ${p.user_snapshot?.first_name || ""}`.trim(); phone = p.user_snapshot?.phone || ""; pd = `paid ${p.paid_days}/${p.total_days} ${p.status}`;
}
    }
    console.log(`  ${fmt(v.createdAt)}  ${v.type.padEnd(16)} day ${v.day_from ?? "-"}→${v.day_no ?? "-"}  ${String(v.amount).padStart(9)}₮  ${name} ${phone}  purchase:${v.purchase_id || "-"} (${pd})  user:${v.user_id || v.userId || ""}  inv:${v.invoice_id}  pending:${v.id}`);
  }
  process.exit(0);
})().catch((e) => {
 console.error(e); process.exit(1);
});
