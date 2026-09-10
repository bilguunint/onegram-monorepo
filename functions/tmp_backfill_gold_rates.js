// Алтны ханшийн түүхийг Монголбанкнаас татаж `rates` collection-д
// байхгүй өдрүүдийг нөхнө (crawlGoldRate.js-тэй яг ижил бүтэц).
// Ажиллуулах: cd functions && node tmp_backfill_gold_rates.js [startDate] [endDate]
const admin = require("firebase-admin");
const axios = require("axios");
admin.initializeApp({ credential: admin.credential.cert(require("./grammgold-firebase.json")) });
const db = admin.firestore();

const START = process.argv[2] || "2024-09-01";
const END = process.argv[3] || "2025-08-10";

function toNumber(val) {
  if (val === null || val === undefined) return null;
  const n = Number(String(val).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}
function fmt(d) { return d.toISOString().split("T")[0]; }

async function fetchRange(start, end) {
  const url = `https://www.mongolbank.mn/mn/gold-and-silver-price/data?startDate=${start}&endDate=${end}`;
  const r = await axios.post(url, {}, { headers: { "Content-Type": "application/json" }, timeout: 60000 });
  const data = r.data && r.data.data;
  return Array.isArray(data) ? data : [];
}

async function main() {
  // Сар сараар татна (endpoint-ийн хязгаараас сэргийлж)
  const rows = new Map(); // RATE_DATE -> GOLD_BUY
  let cur = new Date(START + "T00:00:00Z");
  const endD = new Date(END + "T00:00:00Z");
  while (cur <= endD) {
    const chunkEnd = new Date(cur); chunkEnd.setUTCMonth(chunkEnd.getUTCMonth() + 1); chunkEnd.setUTCDate(0);
    const e = chunkEnd > endD ? endD : chunkEnd;
    const data = await fetchRange(fmt(cur), fmt(e));
    for (const item of data) {
      const d = item["RATE_DATE"]; const g = toNumber(item["GOLD_BUY"]);
      if (d && g !== null && g > 0) rows.set(d, g);
    }
    console.log(`${fmt(cur)}..${fmt(e)}: ${data.length} мөр`);
    cur = new Date(e); cur.setUTCDate(cur.getUTCDate() + 1);
  }
  const dates = [...rows.keys()].sort();
  console.log(`Нийт ${dates.length} өдрийн ханш татлаа`);

  // Байгаа doc-уудыг нэг удаа уншина
  const existing = new Set();
  const snap = await db.collection("rates").where("id", "==", 1).get();
  snap.forEach((d) => existing.add(d.id));

  let batch = db.batch(); let inBatch = 0; let inserted = 0; let prevRate = null;
  for (const d of dates) {
    const rate = rows.get(d);
    const changes = prevRate && prevRate > 0 ? Number((((rate - prevRate) / prevRate) * 100).toFixed(2)) : 0;
    prevRate = rate;
    const id = `1_${d}`;
    if (existing.has(id)) continue;
    batch.set(db.collection("rates").doc(id), {
      id: 1,
      date: admin.firestore.Timestamp.fromDate(new Date(d)),
      rate,
      changes,
      name: "Алт",
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      backfilled: true,
    });
    inserted++; inBatch++;
    if (inBatch >= 400) { await batch.commit(); batch = db.batch(); inBatch = 0; }
  }
  if (inBatch > 0) await batch.commit();
  console.log(`Шинээр нэмсэн: ${inserted} (аль хэдийн байсан: ${dates.length - inserted})`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
