// Мөнгөн эдлэлийн идэвхтэй ТӨГРӨГИЙН хуваан төлөлтийг ЛАН руу хөрвүүлэх хэрэгсэл.
// Анхдагч нь зөвхөн урьдчилсан тооцоо (юу ч бичихгүй).
//   node scripts/convert_installments_to_lan.js                  # бүгдийн урьдчилсан тооцоо
//   node scripts/convert_installments_to_lan.js --id <purchaseId> # нэгийг
//   node scripts/convert_installments_to_lan.js --id <id> --write --by "Админ"   # нэгийг хөрвүүлэх
//   node scripts/convert_installments_to_lan.js --revert <purchaseId>            # буцаах
// Хэрэглэгч өөрөө аппаас зөвшөөрч шилждэг тул --write-ийг зөвхөн хэрэглэгчийн
// хүсэлтээр (утсаар г.м.) нэг бүрчлэн ашиглана.
const path = require("path");
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(require(path.join(__dirname, "..", "grammgold-firebase.json"))) });
const C = require("../src/payment/installmentConversion");
const db = admin.firestore();
const arg = (k) => {
 const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : null;
};
const WRITE = process.argv.includes("--write");
const f = (n) => Math.round(n).toLocaleString("en-US");

(async () => {
  const rv = arg("--revert");
  if (rv) {
 console.log(await C.revertConversion(db, rv)); process.exit(0);
}
  const one = arg("--id");
  if (one && WRITE) {
    const r = await C.convertInstallmentToLan(db, one, { by: arg("--by") || "admin-script", consent: { accepted: true, channel: "admin_on_user_request" } });
    console.log(r.converted ? `✅ хөрвүүллээ: ${r.paid_lan}/${r.total_lan} лан, үлдэгдэл ${f(r.old_remaining_amount)} → ${f(r.new_remaining_amount)}₮` : `❌ ${C.REASON_TEXT[r.reason] || r.reason}`);
    process.exit(0);
  }
  const snap = one ? { docs: [await db.collection("product_purchases").doc(one).get()] } :
    await db.collection("product_purchases").where("status", "==", "active").get();
  let n = 0; let oldRem = 0; let newRem = 0; const skipped = {};
  for (const d of snap.docs) {
    const x = d.data() || {};
    if ((x.purchase_type || "installment") !== "installment") continue;
    const p = await C.previewConversion(db, d.id);
    if (!p.eligible) {
 if (p.reason !== "NOT_SILVER_PRODUCT") skipped[p.reason] = (skipped[p.reason] || 0) + 1; continue;
}
    n++; oldRem += p.old_remaining_amount; newRem += p.new_remaining_amount;
    if (one || n <= 12) console.log(`${d.id} ${(x.user_snapshot?.phone || "").padEnd(9)} ${p.product_name.padEnd(30)} ${String(p.progress_percent).padStart(6)}% → ${String(p.paid_lan).padStart(6)}/${p.total_lan} лан | ${f(p.old_remaining_amount).padStart(11)} → ${f(p.new_remaining_amount).padStart(11)}₮`);
  }
  if (!one) console.log(`... нийт шилжих боломжтой: ${n} | үлдэгдэл ${f(oldRem)} → ${f(newRem)}₮ (зөрүү ${f(oldRem - newRem)}₮) | алгассан: ${JSON.stringify(skipped)}`);
  process.exit(0);
})().catch((e) => {
 console.error("❌", e); process.exit(1);
});
