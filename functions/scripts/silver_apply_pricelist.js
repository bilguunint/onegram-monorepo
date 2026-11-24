// Мөнгөн эдлэлийн үнийн жагсаалтыг (2026-11-23) system-д оруулна:
//  - system_config/silver_jewelry: металл 1 лан, хайрцаг, нэмэгдэл, НӨАТ
//  - жагсаалттай таарсан бараа бүр: product_kind=silver_jewelry, total_lan,
//    labor_per_lan, tagsh_price, price (томьёогоор), price_before_lan (хуучин үнэ)
// Идэвхтэй ТӨГРӨГИЙН хуваан төлөлтүүдэд нөлөөлөхгүй (гэрээ нь өөр дээрээ үнэтэй).
//   node scripts/silver_apply_pricelist.js [--write] [--by "Админ"]
const path = require("path");
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(require(path.join(__dirname, "..", "grammgold-firebase.json"))) });
const { silverFullPriceExact } = require("../src/payment/goldInstallmentShared");
const db = admin.firestore();
const WRITE = process.argv.includes("--write");
const byIdx = process.argv.indexOf("--by");
const BY = byIdx >= 0 ? process.argv[byIdx + 1] : "script";

const CFG = { price_per_lan: 250000, box_price: 45000, markup_percent: 10, vat_percent: 10, min_step_lan: 0.1 };
// [жагсаалтын нэр, product id, лан, ажлын хөлс/лан, тагш, жагсаалтын НӨАТ-тай дүн]
const ROWS = [
  ["ААВЫН АЯГА", "2YXURuSthQ1WHtrnucdT", 15, 75000, 330000, 6352500],
  ["ИДЭР АЯГА", "eo09MLS41u19d0mhzIed", 12, 75000, 330000, 5172750],
  ["ЭЭЖИЙН АЯГА", "LVBKClln9UaO2209IQDm", 9, 75000, 260000, 3908300],
  ["ЦАЙНЫ АЯГА", "gkjnfCi6g106j7XnxVqU", 8, 75000, 260000, 3515050],
  ["СЭВРЭЙ ХУНДАГА", "Fhl6ncs6YT5gHiq9O5qD", 3, 75000, 100000, 1355200],
  ["7-Н ЛАН АЯГА", "x7SilSuKVLNdRRYX5wJt", 7, 75000, 45000, 2861650],
  ["6-Н ЛАН АЯГА", "3Yq02MWWPlA12kl7cLJn", 6, 75000, 45000, 2468400],
  ["5-Н ЛАН АЯГА", "bjSFQUxbX0aDTTjl3plV", 5, 75000, 45000, 2075150],
  ["4-Н ЛАН АЯГА", "N8lUlD8T7ZINbOou80bZ", 4, 75000, 45000, 1681900],
  ["3-Н ЛАН АЯГА", "IEBnAD3oLQczuS2c5pRl", 3, 75000, 45000, 1288650],
  ["2-Н ЛАН АЯГА", "X1N7rE8RGTmUbMs5EKsd", 2, 75000, 45000, 895400],
  ["ШИНЭ ХОСЫН ХУРИМ АЯГА", "yf7a34CfPlkdpDMrJQen", 16, 120000, 660000, 8016250],
  ["ТУМБААШ АЯГА", "j3nwyWesQ7ZbPTaFArzU", 13.5, 120000, 330000, 6497700],
  ["ХҮҮХДИЙН АЯГА", "utpfIvu1co93t5tigVFv", 10, 120000, 330000, 4930750],
  ["УВС АЯГА", "Mj4AH5CBNLhOkTG7Y6hF", 13.5, 120000, 330000, 6497700],
  ["БАДАР ААВ", "FNv12a9FIrQaOkMhdiNu", 6, 120000, 330000, 3139950],
  ["БАДАР ЭЭЖ", "WWIevEBpCETLwCc2wSTZ", 4, 120000, 330000, 2244550],
  ["ААВЫН БАДАР ЁРООЛТОЙ", "w0ET6mywiV9t0s5Jj132", 8, 120000, 330000, 4035350],
  ["ПЯЛ АЯГА", "N8HjtWuRvf3HLB4FuE2E", 2.2, 120000, 330000, 1438690],
  ["НАРАН ТАМГАТ ХУЛ", "yVbd3uawac5Izr3hjMk1", 32.5, 120000, 500000, 15209700],
  ["АЛТАН УНАГАТ ХУЛ", "rVUBKxmCsLkGby0S6B7G", 27.5, 120000, 500000, 12971200],
  ["КОФЕ АЯГА", "292pp6YVuuVCFHerf7LD", 2.2, 120000, 220000, 1305590],
];
const f = (n) => Math.round(n).toLocaleString("en-US");

(async () => {
  let ok = true;
  const updates = [];
  for (const [listName, id, lan, labor, tagsh, want] of ROWS) {
    const snap = await db.collection("products").doc(id).get();
    if (!snap.exists) {
 console.log("❌ бараа олдсонгүй", listName, id); ok = false; continue;
}
    const p = snap.data();
    const price = Math.round(silverFullPriceExact(CFG, { total_lan: lan, labor_per_lan: labor, tagsh_price: tagsh }));
    if (price !== want) {
 console.log("❌ томьёо ≠ жагсаалт", listName, price, want); ok = false;
}
    const old = Number(p.price_before_lan || p.price || 0);
    console.log(`${listName.padEnd(24)} → ${String(p.name).padEnd(34)} ${String(lan).padStart(5)} лан | ${f(old).padStart(11)} → ${f(price).padStart(11)} (${(((price - old) / old) * 100).toFixed(0)}%) | ${p.status}${p.product_kind === "silver_jewelry" ? " [аль хэдийн мөнгөн]" : ""}`);
    updates.push({ ref: snap.ref, data: { product_kind: "silver_jewelry", total_lan: lan, labor_per_lan: labor, tagsh_price: tagsh, price, price_before_lan: old, updated_at: admin.firestore.FieldValue.serverTimestamp(), updated_by: BY } });
  }
  console.log(`\nнийт ${updates.length} бараа | тохиргоо: металл ${f(CFG.price_per_lan)}/лан, хайрцаг ${f(CFG.box_price)}, нэмэгдэл ${CFG.markup_percent}%, НӨАТ ${CFG.vat_percent}%`);
  if (!ok) {
 console.log("алдаатай тул бичихгүй"); process.exit(1);
}
  if (!WRITE) {
 console.log("(dry-run; бичихийн тулд --write)"); process.exit(0);
}
  const batch = db.batch();
  batch.set(db.doc("system_config/silver_jewelry"), { ...CFG, updated_at: admin.firestore.FieldValue.serverTimestamp(), updated_by: BY, updated_by_name: BY, source: "АЯГАНЫ ҮНЭ ЖАГСААЛТ 2026.11.23" }, { merge: true });
  for (const u of updates) batch.update(u.ref, u.data);
  await batch.commit();
  console.log("✅ бичигдлээ");
  process.exit(0);
})().catch((e) => {
 console.error("❌", e); process.exit(1);
});
