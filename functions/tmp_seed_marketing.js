// Marketing demo: user_3380-д сүүлийн 7 хоногт тархсан, баталгаажсан
// зохиомол худалдан авалтууд үүсгэж нийт 14.5гр алт олгоно.
// Ажиллуулах: cd functions && node tmp_seed_marketing.js
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(require("./grammgold-firebase.json")) });
const { roundQty, addQty } = require("./src/utils/money");

const USER_ID = "user_3380";
const DESCRIPTION = "Marketing аянд зориулсан зохиомол худалдан авалт";
// [хэд хоногийн өмнө, цаг, грамм] — нийлбэр 14.5гр
const PURCHASES = [
  [7, 11, 0.1],
  [6, 10, 0.5],
  [6, 18, 1.0],
  [5, 14, 0.5],
  [4, 9, 2.0],
  [4, 19, 1.0],
  [3, 12, 1.5],
  [2, 16, 2.4],
  [1, 11, 3.0],
  [0, 9, 2.5],
];

async function main() {
  const db = admin.firestore();

  const total = roundQty(PURCHASES.reduce((s, [, , q]) => s + q, 0));
  if (total !== 14.5) throw new Error(`Нийлбэр 14.5 биш байна: ${total}`);

  // Өнөөдрийн алтны ханш (metal id 1)
  const rateSnap = await db.collection("latest_rates").where("id", "==", 1).limit(1).get();
  if (rateSnap.empty) throw new Error("latest_rates дээр алтны ханш олдсонгүй");
  const price = Number(rateSnap.docs[0].data().rate);
  if (!Number.isFinite(price) || price <= 0) throw new Error(`Ханш буруу: ${price}`);

  // Хэрэглэгч
  const userRef = db.collection("users").doc(USER_ID);
  const userSnap = await userRef.get();
  if (!userSnap.exists) throw new Error(`${USER_ID} хэрэглэгч олдсонгүй`);
  const u = userSnap.data();
  const client = {
    phone: u.phone || u.client_phone || null,
    email: u.email || u.client_email || null,
    first_name: u.first_name || u.client_first_name || null,
    last_name: u.last_name || u.client_last_name || null,
  };
  const currentGold = Number((u.balance || {}).gold || 0);

  const batch = db.batch();
  const seedTag = `DEMO-MKT-${Date.now()}`;
  const created = [];

  PURCHASES.forEach(([daysAgo, hour, qty], i) => {
    const orderRef = db.collection("orders").doc();
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, 5 + i * 7, 0, 0);
    const createdAt = admin.firestore.Timestamp.fromDate(d);
    const verifiedAt = admin.firestore.Timestamp.fromMillis(d.getTime() + 10 * 60 * 1000);

    // createOrder-ийн дүнгийн томьёо: суурь + 5% шимтгэл, дээр нь 20% татвар
    const baseAmount = qty * price;
    const subtotal = baseAmount + baseAmount * 0.05;
    const amount = Math.round(subtotal + subtotal * 0.20);

    batch.set(orderRef, {
      id: orderRef.id,
      user_id: USER_ID,
      invoice_id: `${seedTag}-${i + 1}`,
      amount,
      price,
      quantity: roundQty(qty),
      metal_id: 1,
      payment_status: "success",
      admin_status: "success",
      type: "deposit",
      prod_type: "ingot",
      created_at: createdAt,
      client,
      qpay_description: `${seedTag}-${i + 1}`,
      description: DESCRIPTION,
      is_demo: true,
      verified_at: verifiedAt,
      verified_by_name: "marketing-demo-seed",
    });
    created.push({ id: orderRef.id, date: d.toISOString().slice(0, 16), qty, amount });
  });

  // Balance: одоогийн үлдэгдэл дээр 14.5гр нэмнэ (verifyOrder-той ижил rounding)
  batch.update(userRef, {
    "balance.gold": addQty(currentGold, total),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Audit
  const auditRef = db.collection("order_admin_logs").doc();
  batch.set(auditRef, {
    order_id: seedTag,
    action: "verify",
    admin_uid: "script",
    admin_name: "marketing-demo-seed",
    at: admin.firestore.FieldValue.serverTimestamp(),
    note: `${USER_ID}-д marketing demo: ${PURCHASES.length} захиалга, нийт ${total}гр (is_demo:true)`,
  });

  await batch.commit();

  console.log(`Ханш: ${price}₮/гр`);
  created.forEach((o) => console.log(`  ${o.date}  ${o.qty}гр  ${o.amount}₮  (${o.id})`));
  console.log(`Нийт: ${total}гр | Balance: ${currentGold} → ${addQty(currentGold, total)}гр`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
