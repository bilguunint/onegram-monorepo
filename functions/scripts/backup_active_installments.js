// Идэвхтэй хуваан төлөлтүүдийн БҮРЭН нөөц хуулбар (зөвхөн уншина + нөөц бичнэ).
//  1) Локал JSON: <outDir>/active_installments.json (+ холбогдох pending нэхэмжлэх,
//     цуцлах хүсэлт, бараа, тохиргоо)
//  2) Firestore: backups/{backupId}/product_purchases/{id} — баримт бүрийн яг хуулбар
// Timestamp-уудыг {__ts: ISO, s, ns} хэлбэрээр хадгалдаг тул сэргээх боломжтой.
//   node scripts/backup_active_installments.js <outDir> [--firestore]
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(require(path.join(__dirname, "..", "grammgold-firebase.json"))) });
const db = admin.firestore();
const OUT = process.argv[2];
const TO_FS = process.argv.includes("--firestore");
if (!OUT) throw new Error("outDir өг");

const enc = (v) => {
  if (v === null || v === undefined) return v;
  if (v instanceof admin.firestore.Timestamp) return { __ts: v.toDate().toISOString(), s: v.seconds, ns: v.nanoseconds };
  if (Array.isArray(v)) return v.map(enc);
  if (typeof v === "object") {
    const o = {};
    for (const k of Object.keys(v)) o[k] = enc(v[k]);
    return o;
  }
  return v;
};

(async () => {
  const now = new Date();
  const backupId = `installments_${now.toISOString().replace(/[:.]/g, "-")}`;
  const snap = await db.collection("product_purchases").where("status", "==", "active").get();
  const purchases = snap.docs.filter((d) => (d.data().purchase_type || "installment") !== "direct");
  const ids = new Set(purchases.map((d) => d.id));

  // Холбогдох нэхэмжлэхүүд (QR зураг/blob-гүй), цуцлах хүсэлтүүд
  const invSnap = await db.collection("pending_invoices").where("type", "in", ["installment", "gold_installment"])
    .select("type", "invoice_id", "purchase_id", "status", "amount", "day_no", "day_from", "day_to", "day_count", "grams", "unit", "userId", "createdAt", "paid_at", "credited_days", "credited_from", "credited_to", "credited_amount").get();
  const invoices = invSnap.docs.filter((d) => ids.has(d.data().purchase_id));
  const crSnap = await db.collection("installment_cancel_requests").get();
  const cancelRequests = crSnap.docs.filter((d) => ids.has(d.data().purchase_id));
  const prodSnap = await db.collection("products").get();
  const cfg = {};
  for (const id of ["installments", "silver_jewelry", "gold_jewelry"]) {
    const d = await db.doc(`system_config/${id}`).get();
    if (d.exists) cfg[id] = enc(d.data());
  }

  const stats = { count: purchases.length, by_type: {}, total_price: 0, paid_amount: 0, paid_days: 0, payments: 0 };
  for (const d of purchases) {
    const x = d.data();
    const t = x.purchase_type || "installment";
    stats.by_type[t] = (stats.by_type[t] || 0) + 1;
    stats.total_price += Number(x.total_price || 0);
    stats.paid_amount += Number(x.paid_amount || 0);
    stats.paid_days += Number(x.paid_days || 0);
    stats.payments += Array.isArray(x.payments) ? x.payments.length : 0;
  }

  const payload = {
    backup_id: backupId,
    created_at: now.toISOString(),
    project: "grammgold",
    note: "Мөнгөн эдлэлийг лан руу шилжүүлэхийн өмнөх идэвхтэй хуваан төлөлтүүдийн бүрэн хуулбар",
    stats,
    system_config: cfg,
    products: prodSnap.docs.map((d) => ({ id: d.id, data: enc(d.data()) })),
    product_purchases: purchases.map((d) => ({ id: d.id, data: enc(d.data()) })),
    pending_invoices: invoices.map((d) => ({ id: d.id, data: enc(d.data()) })),
    installment_cancel_requests: cancelRequests.map((d) => ({ id: d.id, data: enc(d.data()) })),
  };
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, `${backupId}.json`);
  const json = JSON.stringify(payload);
  fs.writeFileSync(file, json);
  const sha = crypto.createHash("sha256").update(json).digest("hex");
  fs.writeFileSync(file + ".sha256", `${sha}  ${path.basename(file)}\n`);
  console.log(`локал: ${file} (${(json.length / 1048576).toFixed(1)} MB) sha256 ${sha.slice(0, 16)}…`);
  console.log(`хуваан төлөлт ${stats.count} ${JSON.stringify(stats.by_type)} | гэрээний үнэ ${stats.total_price.toLocaleString()} | төлсөн ${stats.paid_amount.toLocaleString()} | төлбөрийн бичлэг ${stats.payments} | нэхэмжлэх ${invoices.length} | цуцлах хүсэлт ${cancelRequests.length} | бараа ${prodSnap.size}`);

  if (TO_FS) {
    const root = db.collection("backups").doc(backupId);
    await root.set({ created_at: admin.firestore.FieldValue.serverTimestamp(), note: payload.note, stats, sha256_local: sha, system_config: cfg });
    let batch = db.batch(); let n = 0; let total = 0;
    for (const d of purchases) {
      batch.set(root.collection("product_purchases").doc(d.id), d.data()); // яг хуулбар (Timestamp хэвээр)
      n++; total++;
      if (n === 200) {
 await batch.commit(); batch = db.batch(); n = 0;
}
    }
    for (const d of prodSnap.docs) {
 batch.set(root.collection("products").doc(d.id), d.data()); n++; if (n === 200) {
 await batch.commit(); batch = db.batch(); n = 0;
}
}
    if (n) await batch.commit();
    const chk = await root.collection("product_purchases").count().get();
    console.log(`Firestore: backups/${backupId}/product_purchases — ${chk.data().count}/${total} баримт`);
  }
  process.exit(0);
})().catch((e) => {
 console.error("❌", e); process.exit(1);
});
