// Зөвхөн УНШИХ бүрэн скан: хуваан төлөлтийн БҮХ нэхэмжлэхийг (бүх purchase, бүх
// төлөв) QPay payment/check-ээр шалгаж, purchase бүрийн QPay PAID нийлбэрийг
// системд бүртгэгдсэн QPay төлбөртэй тулгана. Үр дүнг кэш файлд хадгалдаг тул
// тасарвал дахин ажиллуулахад үргэлжилнэ.
//   node scripts/scan_installment_qpay_full.js <cacheDir> [--concurrency 4]
const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(require(path.join(__dirname, "..", "grammgold-firebase.json"))) });
const axios = require("axios");
const { getQPayToken } = require("../src/payment/installmentShared");
const db = admin.firestore();
const DIR = process.argv[2];
if (!DIR) throw new Error("cacheDir өг");
const cIdx = process.argv.indexOf("--concurrency");
const CONC = cIdx >= 0 ? Number(process.argv[cIdx + 1]) : 4;
const CACHE = path.join(DIR, "qpay_cache.json");
const REPORT = path.join(DIR, "qpay_full_report.json");
const log = (...a) => {
 console.log(new Date().toISOString().slice(11, 19), ...a);
};

async function check(invoiceId, token) {
  for (let i = 1; i <= 3; i++) {
    try {
      const r = await axios.post("https://merchant.qpay.mn/v2/payment/check",
        { object_type: "INVOICE", object_id: invoiceId, offset: { page_number: 1, page_limit: 50 } },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 });
      const rows = (r.data && r.data.rows) || [];
      const paid = rows.filter((x) => x.payment_status === "PAID");
      return { status: rows.length ? rows[0].payment_status : "NO_ROWS", paid_amount: paid.reduce((s, x) => s + Number(x.payment_amount || 0), 0),
        paid_count: paid.length, payment_ids: paid.map((x) => x.payment_id), payment_date: paid[0] && (paid[0].payment_date || paid[0].paid_date || null) };
    } catch (e) {
      const code = e.response && e.response.status;
      if (code === 401) throw Object.assign(new Error("401"), { reauth: true });
      if (i === 3) return { status: "ERROR", error: (e.response && JSON.stringify(e.response.data)) || e.message };
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
}

(async () => {
  const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : {};
  const invSnap = await db.collection("pending_invoices").where("type", "in", ["installment", "installment_init"])
    .select("invoice_id", "purchase_id", "status", "amount", "day_from", "day_no", "day_count", "type", "createdAt", "userId", "paid_at").get();
  const invoices = invSnap.docs.map((d) => {
 const x = d.data(); return { doc_id: d.id, ...x, createdAt: x.createdAt && x.createdAt.toDate ? x.createdAt.toDate().toISOString() : null, paid_at: x.paid_at && x.paid_at.toDate ? x.paid_at.toDate().toISOString() : null };
});
  const todo = invoices.filter((i) => i.invoice_id && !cache[i.invoice_id]);
  log(`нэхэмжлэх: ${invoices.length}, кэшлэгдсэн: ${invoices.length - todo.length}, шалгах: ${todo.length}, concurrency ${CONC}`);

  // Токен: QPay шинэ токен авахад хуучин нь хүчингүй болдог тул сэргээлтийг нэг
  // promise-оор цуваална; бусад урсгал тэр promise-ийг хүлээнэ.
  let token = await getQPayToken(); let tokenAt = Date.now(); let refreshing = null;
  const refresh = (bad) => {
    if (!refreshing) {
 refreshing = getQPayToken().then((t) => {
 token = t; tokenAt = Date.now(); refreshing = null; return t;
}).catch((e) => {
 refreshing = null; throw e;
});
}
    return refreshing;
  };
  let done = 0; let idx = 0; let errors = 0;
  const save = () => fs.writeFileSync(CACHE, JSON.stringify(cache));
  async function worker() {
    while (idx < todo.length) {
      const i = todo[idx++];
      if (Date.now() - tokenAt > 20 * 60 * 1000) await refresh();
      let r = null;
      for (let a = 0; a < 6 && !r; a++) {
        const t = token;
        try {
 r = await check(i.invoice_id, t);
} catch (e) {
 if (!e.reauth) throw e; if (token === t) await refresh(); await new Promise((z) => setTimeout(z, 500 * (a + 1)));
}
      }
      if (!r) r = { status: "ERROR", error: "401 x6" };
      if (r.status === "ERROR") errors++; else cache[i.invoice_id] = r;
      done++;
      if (done % 250 === 0) {
 save(); log(`${done}/${todo.length} (алдаа ${errors})`);
}
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  save();
  log(`QPay шалгалт дууслаа: ${done}, алдаа ${errors}`);

  // Тулгалт
  const ps = await db.collection("product_purchases").where("purchase_type", "==", "installment").get();
  const byP = new Map();
  for (const i of invoices) {
 if (!i.purchase_id) continue; if (!byP.has(i.purchase_id)) byP.set(i.purchase_id, []); byP.get(i.purchase_id).push(i);
}
  const report = { generated_at: new Date().toISOString(), purchases: ps.size, invoices: invoices.length, unchecked: errors, findings: [] };
  const totals = { PAID: 0, other: 0 };
  for (const d of ps.docs) {
    const p = d.data(); const u = p.user_snapshot || {};
    const invs = byP.get(d.id) || [];
    const paidInv = []; const paidNotProcessed = []; const processedNotPaid = [];
    for (const i of invs) {
      const r = cache[i.invoice_id]; if (!r) continue;
      if (r.status === "PAID") {
 totals.PAID++; paidInv.push(i); if (i.status !== "processed") paidNotProcessed.push(i);
} else {
 totals.other++; if (i.status === "processed") processedNotPaid.push({ ...i, qpay: r.status });
}
    }
    const paidSum = paidInv.reduce((s, i) => s + Number(cache[i.invoice_id].paid_amount || Number(i.amount || 0)), 0);
    const pays = Array.isArray(p.payments) ? p.payments : [];
    const sysQpay = pays.filter((e) => (e.payment_method || "qpay") === "qpay").reduce((s, e) => s + Number(e.amount || 0), 0);
    const sysOther = pays.filter((e) => (e.payment_method || "qpay") !== "qpay").reduce((s, e) => s + Number(e.amount || 0), 0);
    const diff = paidSum - sysQpay;
    if (diff !== 0 || paidNotProcessed.length || processedNotPaid.length) {
      report.findings.push({ purchase: d.id, status: p.status, user: `${u.last_name || ""} ${u.first_name || ""}`.trim(), phone: u.phone || "", paid_days: p.paid_days, total_days: p.total_days, daily: p.daily_payment,
        qpay_paid_sum: paidSum, system_qpay_sum: sysQpay, system_other_sum: sysOther, diff,
        paid_not_processed: paidNotProcessed.map((i) => ({ invoice: i.invoice_id, day: `${i.day_from ?? i.day_no}→${i.day_no}`, amount: i.amount, fs_status: i.status, created: i.createdAt })),
        processed_not_paid: processedNotPaid.map((i) => ({ invoice: i.invoice_id, day: `${i.day_from ?? i.day_no}→${i.day_no}`, amount: i.amount, qpay: i.qpay, created: i.createdAt })) });
    }
  }
  report.findings.sort((a, b) => b.diff - a.diff);
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 1));
  log(`QPay PAID нэхэмжлэх: ${totals.PAID}, бусад: ${totals.other}`);
  log(`Зөрүүтэй purchase: ${report.findings.length} (дутуу ${report.findings.filter((f) => f.diff > 0).length}, илүү ${report.findings.filter((f) => f.diff < 0).length})`);
  for (const f of report.findings) log(`  ${f.purchase} ${f.user} ${f.phone} | ${f.status} ${f.paid_days}/${f.total_days} | QPay ${f.qpay_paid_sum} vs систем ${f.system_qpay_sum} → ${f.diff > 0 ? "ДУТУУ +" : f.diff < 0 ? "ИЛҮҮ " : ""}${f.diff} | PAID-боловч-боловсруулаагүй ${f.paid_not_processed.length}, processed-боловч-PAID-биш ${f.processed_not_paid.length}`);
  log(`тайлан: ${REPORT}`);
  process.exit(0);
})().catch((e) => {
 console.error("❌", e); process.exit(1);
});
