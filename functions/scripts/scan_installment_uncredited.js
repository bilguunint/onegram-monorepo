// Зөвхөн УНШИХ скан: QPay дээр төлөгдсөн боловч purchase-д хоног нь нэмэгдээгүй
// хуваан төлөлтийн нэхэмжлэхийг илрүүлнэ.
//  1-р үе (offline): purchase бүрт processed нэхэмжлэхийн нийлбэр (init-ийг оруулаад)
//     vs qpay payments[]-ийн нийлбэр. Зөрүүтэйг нэр дэвшигч болгоно.
//  2-р үе (--qpay): нэр дэвшигчдийн processed нэхэмжлэх бүрийг QPay payment/check-ээр
//     баталгаажуулж, PAID нийлбэр ≠ qpay payments нийлбэр бол тайлагнана.
//   node scripts/scan_installment_uncredited.js [--qpay] [--status active,completed,delivered]
const path = require("path");
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(require(path.join(__dirname, "..", "grammgold-firebase.json"))) });
const { getQPayToken, checkQPayPayment } = require("../src/payment/installmentShared");
const db = admin.firestore();
const QPAY = process.argv.includes("--qpay");
const sIdx = process.argv.indexOf("--status");
const STATUSES = sIdx >= 0 ? process.argv[sIdx + 1].split(",") : ["active", "completed", "delivered"];

(async () => {
  const ps = await db.collection("product_purchases").where("purchase_type", "==", "installment").get();
  const purchases = ps.docs.filter((d) => STATUSES.includes(d.data().status));
  console.log(`installment purchases: ${ps.size}, шалгах (${STATUSES.join(",")}): ${purchases.length}`);

  const invSnap = await db.collection("pending_invoices").where("type", "in", ["installment", "installment_init"]).get();
  const byPurchase = new Map();
  for (const d of invSnap.docs) {
    const x = d.data(); const pid = x.purchase_id; if (!pid) continue;
    if (!byPurchase.has(pid)) byPurchase.set(pid, []);
    byPurchase.get(pid).push({ id: d.id, ...x });
  }
  console.log(`invoices: ${invSnap.size}`);

  const candidates = [];
  for (const d of purchases) {
    const p = d.data();
    const invs = byPurchase.get(d.id) || [];
    const processed = invs.filter((i) => i.status === "processed");
    const processedSum = processed.reduce((s, i) => s + Number(i.amount || 0), 0);
    const pays = Array.isArray(p.payments) ? p.payments : [];
    const qpaySum = pays.filter((e) => (e.payment_method || "qpay") === "qpay").reduce((s, e) => s + Number(e.amount || 0), 0);
    const otherSum = pays.filter((e) => (e.payment_method || "qpay") !== "qpay").reduce((s, e) => s + Number(e.amount || 0), 0);
    const diff = processedSum - qpaySum;
    if (diff !== 0) candidates.push({ id: d.id, p, processed, pending: invs.filter((i) => i.status === "pending"), processedSum, qpaySum, otherSum, diff });
  }
  console.log(`\n1-р үе: processed нийлбэр ≠ qpay payments нийлбэр — ${candidates.length} purchase`);
  for (const c of candidates) {
    const u = c.p.user_snapshot || {};
    console.log(`  ${c.id} ${u.last_name || ""} ${u.first_name || ""} ${u.phone || ""} | ${c.p.status} paid ${c.p.paid_days}/${c.p.total_days} | processed ${c.processedSum} vs qpay-pay ${c.qpaySum} (бусад ${c.otherSum}) → зөрүү ${c.diff > 0 ? "+" : ""}${c.diff}`);
  }
  if (!QPAY) {
 console.log("\n(QPay баталгаажуулалт хийхийн тулд --qpay)"); process.exit(0);
}

  const token = await getQPayToken();
  console.log(`\n2-р үе: QPay баталгаажуулалт (${candidates.reduce((s, c) => s + c.processed.length + c.pending.length, 0)} нэхэмжлэх)`);
  const report = [];
  for (const c of candidates) {
    let paidSum = 0; const paidInv = []; const notPaidProcessed = [];
    for (const i of [...c.processed, ...c.pending]) {
      const st = await checkQPayPayment(i.invoice_id, token, 1);
      if (st === "PAID") {
 paidSum += Number(i.amount || 0); paidInv.push(i);
} else if (i.status === "processed") notPaidProcessed.push({ ...i, qpay: st });
    }
    const diff = paidSum - c.qpaySum;
    const u = c.p.user_snapshot || {};
    const line = `${c.id} ${u.last_name || ""} ${u.first_name || ""} ${u.phone || ""} | ${c.p.status} ${c.p.paid_days}/${c.p.total_days} | QPay PAID ${paidSum} vs систем ${c.qpaySum} → ${diff > 0 ? "ДУТУУ +" : diff < 0 ? "ИЛҮҮ " : "OK "}${diff}`;
    console.log("  " + line);
    if (notPaidProcessed.length) console.log(`     processed боловч QPay PAID биш: ${notPaidProcessed.map((i) => `${i.invoice_id}(${i.qpay})`).join(", ")}`);
    if (diff > 0) {
      // Аль нэхэмжлэх нь бүртгэгдээгүй вэ: payments[] дэх invoice_id-тай тулгаж, үлдсэн хоног/дүнгээр таамаглана
      const credited = new Set((c.p.payments || []).map((e) => e.invoice_id).filter(Boolean));
      const suspects = paidInv.filter((i) => !credited.has(i.invoice_id)).map((i) => `${i.invoice_id} day ${i.day_from ?? i.day_no}→${i.day_no} ${i.amount}`);
      console.log(`     PAID нэхэмжлэхүүд: ${paidInv.length} ш; дүн нь: ${paidInv.map((i) => i.amount).join("+")}`);
      report.push({ purchase: c.id, phone: u.phone, missing: diff, suspects });
    }
  }
  console.log(`\nДУТУУ бүртгэлтэй purchase: ${report.length}`);
  for (const r of report) console.log(JSON.stringify(r));
  process.exit(0);
})().catch((e) => {
 console.error("❌", e); process.exit(1);
});
