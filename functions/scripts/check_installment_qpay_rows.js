// Зөвхөн УНШИХ: purchase-ийн invoice бүрд QPay payment/check-ийн БҮХ мөрийг
// (давхар төлбөр илрүүлэх) хэвлэнэ.  node scripts/check_installment_qpay_rows.js <purchaseId>
const path = require("path");
const admin = require("firebase-admin");
const axios = require("axios");
admin.initializeApp({ credential: admin.credential.cert(require(path.join(__dirname, "..", "grammgold-firebase.json"))) });
const { getQPayToken } = require("../src/payment/installmentShared");
const db = admin.firestore();
(async () => {
  const token = await getQPayToken();
  const inv = await db.collection("pending_invoices").where("purchase_id", "==", process.argv[2]).get();
  let totalPaid = 0; let totalRows = 0;
  const out = [];
  for (const i of inv.docs) {
    const v = i.data();
    const r = await axios.post("https://merchant.qpay.mn/v2/payment/check",
      { object_type: "INVOICE", object_id: v.invoice_id, offset: { page_number: 1, page_limit: 100 } },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 });
    const rows = (r.data && r.data.rows) || [];
    const paid = rows.filter((z) => z.payment_status === "PAID");
    const sum = paid.reduce((s, z) => s + Number(z.payment_amount || 0), 0);
    totalPaid += sum; totalRows += paid.length;
    out.push({ c: (v.createdAt || v.created_at)?.toDate?.().toISOString().slice(0, 16) || "", day: `${v.day_from ?? "init"}→${v.day_no ?? "1"}`, amt: v.amount, count: r.data.count, paidRows: paid.length, sum,
      detail: rows.map((z) => `${z.payment_status} ${z.payment_amount} ${z.payment_date} ${z.payment_id}`).join(" | ") });
  }
  out.sort((a, b) => (a.c > b.c ? 1 : -1));
  for (const o of out) console.log(`${o.c}  ${o.day.padEnd(7)} ${String(o.amt).padStart(8)}  qpay rows:${o.count} PAID:${o.paidRows} sum:${o.sum}  ${o.detail}`);
  console.log("\nНИЙТ PAID мөр:", totalRows, "НИЙТ PAID дүн:", totalPaid);
  process.exit(0);
})().catch((e) => {
 console.error(e.response ? e.response.data : e); process.exit(1);
});
