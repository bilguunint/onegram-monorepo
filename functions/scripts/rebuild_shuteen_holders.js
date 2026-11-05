// shuteen_holders нэгтгэлийг shuteen_orders (эх сурвалж)-оос дахин тооцоолно.
//   node scripts/rebuild_shuteen_holders.js          # зөвхөн зөрүүг харуулна
//   node scripts/rebuild_shuteen_holders.js --write  # Firestore-д бичнэ
const path = require("path");
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(require(path.join(__dirname, "..", "grammgold-firebase.json"))) });
const { tierFor } = require("../src/payment/shuteenShared");
const db = admin.firestore();
const WRITE = process.argv.includes("--write");
(async () => {
  const orders = await db.collection("shuteen_orders").get();
  const agg = {};
  for (const o of orders.docs) {
    const x = o.data();
    if (x.status === "cancelled") continue;
    if (!agg[x.buyer_uid]) agg[x.buyer_uid] = { uid: x.buyer_uid, name: x.buyer_name || "", units: 0, amount: 0, order_count: 0, first_at: null };
    const a = agg[x.buyer_uid];
    a.units += Number(x.units || 0); a.amount += Number(x.amount || 0); a.order_count += 1;
    const t = x.created_at || x.paid_at;
    if (t && (!a.first_at || t.toMillis() < a.first_at.toMillis())) a.first_at = t;
  }
  const holders = await db.collection("shuteen_holders").get();
  const existing = {}; for (const h of holders.docs) existing[h.id] = h.data();
  let changed = 0;
  const batch = db.batch();
  for (const uid of new Set([...Object.keys(agg), ...Object.keys(existing)])) {
    const want = agg[uid]; const have = existing[uid] || {};
    if (!want) {
 console.log(`ХАСАХ (захиалгагүй holder): ${uid} ${have.name || ""} units:${have.units}`); if (WRITE) batch.delete(db.collection("shuteen_holders").doc(uid)); changed++; continue;
}
    const same = Number(have.units || 0) === want.units && Number(have.amount || 0) === want.amount && Number(have.order_count || 0) === want.order_count && Number(have.tier || 0) === tierFor(want.units);
    if (same) continue;
    changed++;
    console.log(`ЗАСАХ ${uid} ${want.name}: units ${have.units}→${want.units}, amount ${have.amount}→${want.amount}, orders ${have.order_count}→${want.order_count}, tier ${have.tier}→${tierFor(want.units)}`);
    if (WRITE) {
batch.set(db.collection("shuteen_holders").doc(uid), {
      uid, name: have.name || want.name, units: want.units, amount: want.amount, order_count: want.order_count, tier: tierFor(want.units),
      ...(have.first_at ? {} : want.first_at ? { first_at: want.first_at } : {}),
      updated_at: admin.firestore.FieldValue.serverTimestamp(), rebuilt_at: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
}
  }
  const holderCount = Object.keys(agg).length;
  console.log(`\nзөрүүтэй: ${changed} | holder_count: ${holderCount}`);
  if (WRITE) {
 batch.set(db.collection("shuteen_khuur").doc("main"), { holder_count: holderCount }, { merge: true }); await batch.commit(); console.log("✅ бичигдлээ");
} else console.log("(dry-run; бичихийн тулд --write)");
  process.exit(0);
})().catch((e) => {
 console.error(e); process.exit(1);
});
