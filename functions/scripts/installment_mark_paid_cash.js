// Хуваан төлөлтийн үлдсэн бүх хоногийг компани дээр бэлнээр төлсөн гэж бүртгэж,
// purchase-ийг completed (100%) болгоно. Төлөгдөөгүй pending invoice-уудыг
// cancelled болгоно (QPay-аар давхар төлөгдөхөөс сэргийлнэ).
//   node scripts/installment_mark_paid_cash.js <purchaseId> [--write] [--by "Админы нэр"]
const path = require("path");
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(require(path.join(__dirname, "..", "grammgold-firebase.json"))) });
const { generatePickupCode } = require("../src/payment/installmentShared");
const db = admin.firestore();
const ID = process.argv[2];
const WRITE = process.argv.includes("--write");
const byIdx = process.argv.indexOf("--by");
const BY = byIdx >= 0 ? process.argv[byIdx + 1] : "office";

(async () => {
  const ref = db.collection("product_purchases").doc(ID);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("purchase олдсонгүй");
  const p = snap.data();
  const paidDays = Number(p.paid_days || 0); const totalDays = Number(p.total_days || 0);
  const daily = Number(p.daily_payment || 0); const totalPrice = Number(p.total_price || 0);
  const paidAmount = Number(p.paid_amount || 0);
  if (p.purchase_type !== "installment" || p.status !== "active") throw new Error(`type=${p.purchase_type} status=${p.status} — зөвхөн active installment`);
  if (paidDays >= totalDays) throw new Error("аль хэдийн бүрэн төлөгдсөн");

  const entries = []; let credit = 0;
  for (let d = paidDays + 1; d <= totalDays; d++) {
    const amt = d >= totalDays ? Math.max(totalPrice - paidAmount - credit, 0) : daily;
    credit += amt;
    entries.push({ day_no: d, amount: amt, paid_at: admin.firestore.Timestamp.now(), payment_method: "cash", note: "Компани дээр бэлнээр төлсөн", recorded_by: BY });
  }
  const inv = await db.collection("pending_invoices").where("purchase_id", "==", ID).where("status", "==", "pending").get();
  console.log(`${p.user_snapshot?.last_name || ""} ${p.user_snapshot?.first_name || ""} ${p.user_snapshot?.phone || ""} | ${p.product_snapshot?.name}`);
  console.log(`paid_days ${paidDays}→${totalDays} | paid_amount ${paidAmount}→${paidAmount + credit} (total_price ${totalPrice}) | нэмэх хоног: ${entries.length}, дүн: ${credit}`);
  console.log(`cancelled болгох pending invoice: ${inv.size}`);
  if (!WRITE) {
 console.log("(dry-run; бичихийн тулд --write)"); process.exit(0);
}

  await db.runTransaction(async (tx) => {
    const cur = (await tx.get(ref)).data();
    if (Number(cur.paid_days || 0) !== paidDays) throw new Error("paid_days өөрчлөгдсөн, дахин ажиллуул");
    tx.update(ref, {
      paid_days: totalDays, paid_amount: paidAmount + credit,
      payments: [...(Array.isArray(cur.payments) ? cur.payments : []), ...entries],
      status: "completed", completed_at: admin.firestore.FieldValue.serverTimestamp(),
      pickup_code: generatePickupCode(),
      completed_note: `Үлдсэн ${entries.length} хоног (${credit}₮) компани дээр бэлнээр төлөгдөв`,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    for (const d of inv.docs) tx.update(d.ref, { status: "cancelled", cancel_reason: "paid_in_cash_at_office", updated_at: admin.firestore.FieldValue.serverTimestamp() });
  });
  const after = (await ref.get()).data();
  console.log(`✅ бичигдлээ: paid_days ${after.paid_days}/${after.total_days}, paid_amount ${after.paid_amount}, status ${after.status}, pickup_code ${after.pickup_code}`);
  process.exit(0);
})().catch((e) => {
 console.error("❌", e.message); process.exit(1);
});
