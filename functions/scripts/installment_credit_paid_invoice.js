// QPay дээр ТӨЛӨГДСӨН (PAID) боловч purchase-д хоног нь нэмэгдээгүй хуваан
// төлөлтийн нэхэмжлэхийг бүртгэнэ. Ийм тохиолдол: хэрэглэгч давхцсан өдрийн
// хоёр QR (жишээ нь 64→93 ба 64→73) хоёуланг нь төлөхөд callback "day_no хүртэл"
// гэж бодож хоёр дахийг нь алгасдаг. Нэхэмжлэхийн day_count хоногийг
// paid_days-ийн дараагаас эхлэн нэмнэ.
//   node scripts/installment_credit_paid_invoice.js <purchaseId> <invoiceId> [--days N] [--write] [--by "Админ"]
//   --days N: нэхэмжлэхийн зөвхөн N хоног нь бүртгэгдээгүй бол (давхцсан хэсэг нь өмнөх
//   нэхэмжлэхээр аль хэдийн нэмэгдсэн) зөвхөн тэр тоог нэмнэ.
const path = require("path");
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(require(path.join(__dirname, "..", "grammgold-firebase.json"))) });
const { getQPayToken, checkQPayPayment, generatePickupCode } = require("../src/payment/installmentShared");
const db = admin.firestore();
const [PID, INV] = [process.argv[2], process.argv[3]];
const WRITE = process.argv.includes("--write");
const byIdx = process.argv.indexOf("--by");
const BY = byIdx >= 0 ? process.argv[byIdx + 1] : "office";
const dIdx = process.argv.indexOf("--days");
const DAYS_OVERRIDE = dIdx >= 0 ? Number(process.argv[dIdx + 1]) : null;

(async () => {
  if (!PID || !INV) throw new Error("purchaseId, invoiceId хоёуланг өг");
  const ref = db.collection("product_purchases").doc(PID);
  const p = (await ref.get()).data();
  if (!p) throw new Error("purchase олдсонгүй");
  if (p.purchase_type !== "installment" || p.status !== "active") throw new Error(`type=${p.purchase_type} status=${p.status} — зөвхөн active installment`);

  const invSnap = await db.collection("pending_invoices").where("invoice_id", "==", INV).where("purchase_id", "==", PID).get();
  if (invSnap.empty) throw new Error("энэ purchase-д ийм invoice байхгүй");
  const inv = invSnap.docs[0].data();
  const invDays = Number(inv.day_count || (Number(inv.day_no) - Number(inv.day_from ?? inv.day_no) + 1));
  const dayCount = DAYS_OVERRIDE ?? invDays;
  if (dayCount < 1 || dayCount > invDays) throw new Error(`--days ${dayCount} нь 1..${invDays} хооронд байх ёстой`);
  const invAmount = Number(inv.amount || 0);

  const status = await checkQPayPayment(INV, await getQPayToken(), 2);
  if (status !== "PAID") throw new Error(`QPay төлөв: ${status} — PAID биш`);

  // Давхар бүртгэхээс сэргийлнэ: энэ invoice-ийн дүн аль хэдийн нэмэгдсэн бол татгалзана.
  const pays = Array.isArray(p.payments) ? p.payments : [];
  if (pays.some((e) => e.invoice_id === INV)) throw new Error("энэ invoice аль хэдийн payments[]-д байна");

  const paidDays = Number(p.paid_days || 0); const totalDays = Number(p.total_days || 0);
  const daily = Number(p.daily_payment || 0); const totalPrice = Number(p.total_price || 0);
  const paidAmount = Number(p.paid_amount || 0);
  const target = Math.min(paidDays + dayCount, totalDays);
  const entries = []; let credit = 0;
  for (let d = paidDays + 1; d <= target; d++) {
    const amt = d >= totalDays ? Math.max(totalPrice - paidAmount - credit, 0) : daily;
    credit += amt;
    entries.push({ day_no: d, amount: amt, paid_at: inv.paid_at || admin.firestore.Timestamp.now(), payment_method: "qpay", invoice_id: INV,
      note: `QPay PAID боловч бүртгэгдээгүй нэхэмжлэх (${inv.day_from}→${inv.day_no}${DAYS_OVERRIDE ? `, ${dayCount} хоног` : ""}) — гараар нөхөв`, recorded_by: BY });
  }
  console.log(`${p.user_snapshot?.last_name || ""} ${p.user_snapshot?.first_name || ""} ${p.user_snapshot?.phone || ""} | ${p.product_snapshot?.name}`);
  console.log(`invoice ${INV}: day ${inv.day_from}→${inv.day_no} (${invDays} хоног${DAYS_OVERRIDE ? `, үүнээс нөхөх ${dayCount}` : ""}), дүн ${invAmount}, QPay ${status}, fs ${inv.status}`);
  console.log(`paid_days ${paidDays}→${target} | paid_amount ${paidAmount}→${paidAmount + credit} | нэмэх хоног ${entries.length}, дүн ${credit}`);
  if (!DAYS_OVERRIDE && credit !== invAmount) console.log(`⚠ нэмэх дүн (${credit}) нэхэмжлэхийн дүнгээс (${invAmount}) зөрүүтэй`);
  if (!WRITE) {
 console.log("(dry-run; бичихийн тулд --write)"); process.exit(0);
}

  await db.runTransaction(async (tx) => {
    const cur = (await tx.get(ref)).data();
    if (Number(cur.paid_days || 0) !== paidDays) throw new Error("paid_days өөрчлөгдсөн, дахин ажиллуул");
    const upd = { paid_days: target, paid_amount: paidAmount + credit,
      payments: [...(Array.isArray(cur.payments) ? cur.payments : []), ...entries],
      updated_at: admin.firestore.FieldValue.serverTimestamp() };
    if (target >= totalDays) {
 upd.status = "completed"; upd.completed_at = admin.firestore.FieldValue.serverTimestamp(); upd.pickup_code = generatePickupCode();
}
    tx.update(ref, upd);
    tx.update(invSnap.docs[0].ref, { credited_manually_at: admin.firestore.FieldValue.serverTimestamp(), credited_by: BY });
  });
  const after = (await ref.get()).data();
  console.log(`✅ бичигдлээ: paid_days ${after.paid_days}/${after.total_days}, paid_amount ${after.paid_amount}, status ${after.status}`);
  process.exit(0);
})().catch((e) => {
 console.error("❌", e.message); process.exit(1);
});
