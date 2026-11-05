/**
 * directPurchaseShared
 * --------------------
 * Шууд худалдан авалтын (direct purchase) QPay урсгалын дундын Firestore
 * логик.
 *
 * Бусад урсгалуудын (installmentShared, centerDonationShared, treeOrderShared,
 * shuteenShared) нэгэн адил бүртгэх үйлдлийг нэг газар төвлөрүүлснээр
 * бодит цагийн callback (directPurchaseCallback) болон аюулгүйн тор
 * (autoVerifyOrders) хоёр яг ижил логик ажиллуулна.
 *
 * Бүх үйлдэл идемпотент — аль хэдийн бүртгэгдсэн худалдан авалтыг дахин
 * үүсгэхгүй.
 */
const admin = require("firebase-admin");

// 6-digit pickup code (zero-padded, "000000"-"999999"). Shown to the user
// after payment; admin enters it to mark delivered.
function generatePickupCode() {
  return Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
}

/**
 * Төлөгдсөн direct_purchase нэхэмжлэхээс product_purchases баримт үүсгэж,
 * нэхэмжлэхийг processed болгоно — бүгдийг нэг транзакцаар.
 *
 * Идемпотент: аль хэдийн боловсруулагдсан бол шинээр үүсгэлгүй одоо байгаа
 * purchase_id-г буцаана (QPay-ийн давтан дуудлага, эсвэл callback + cron
 * зэрэг ажиллахад давхар бичихээс хамгаална).
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {FirebaseFirestore.DocumentReference} pendingRef - pending_invoices баримт
 * @param {object} pendingData - тухайн баримтын өгөгдөл
 * @return {Promise<{purchaseId: string, created: boolean}>} үр дүн
 */
async function recordDirectPurchasePaid(db, pendingRef, pendingData) {
  const invoiceId = pendingData.invoice_id;
  const amount = Number(pendingData.amount || 0);

  // Идемпотент: аль хэдийн үүсгэсэн бол шууд буцаана.
  if (pendingData.status === "processed" && pendingData.purchase_id) {
    return { purchaseId: pendingData.purchase_id, created: false };
  }

  const purchaseRef = db.collection("product_purchases").doc();
  const now = admin.firestore.Timestamp.now();

  let resultId = purchaseRef.id;
  await db.runTransaction(async (tx) => {
    const cur = await tx.get(pendingRef);
    const curData = cur.data() || {};
    if (curData.status === "processed" && curData.purchase_id) {
      resultId = curData.purchase_id;
      return;
    }
    tx.set(purchaseRef, {
      product_id: pendingData.product_id,
      product_snapshot: pendingData.product_snapshot || {},
      user_id: pendingData.user_id,
      user_snapshot: pendingData.user_snapshot || {},
      total_price: amount,
      monthly_payment: amount,
      months: 1,
      paid_amount: amount,
      paid_months: 1,
      next_due_date: null,
      status: "completed",
      started_at: now,
      completed_at: now,
      pickup_code: generatePickupCode(),
      purchase_type: "direct",
      payments: [
        {
          month_no: 1,
          amount,
          paid_at: now,
          payment_method: "qpay",
          invoice_id: invoiceId,
        },
      ],
    });
    tx.update(pendingRef, {
      status: "processed",
      purchase_id: purchaseRef.id,
      paid_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return { purchaseId: resultId, created: resultId === purchaseRef.id };
}

module.exports = {
  generatePickupCode,
  recordDirectPurchasePaid,
};
