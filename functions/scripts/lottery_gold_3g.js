// Алтны үлдэгдэл >= 3 гр хэрэглэгч бүрт 1 сугалааны дугаар үүсгэж JSON-д хадгална.
// Firestore-д ЮУ Ч БИЧИХГҮЙ. Код давхцахгүй, 1 хэрэглэгч = 1 сугалаа.
// JSON-той зэрэгцээд ижил нэртэй .xlsx файл давхар үүснэ.
//   node scripts/lottery_gold_3g.js [минимум_грамм=3] [гаралт=../docs/lottery_gold_3g_<огноо>.json]
// НЭМЭЛТ горим: --base <өмнөх.json> өгвөл тэнд байгаа хэрэглэгчдийн код ХЭВЭЭР үлдэж,
// зөвхөн шинээр босго давсан хэрэглэгчдэд шинэ (давхцахгүй) код нэмэгдэнэ.
//   node scripts/lottery_gold_3g.js 3 ../docs/lottery_gold_3g_2026-10-13_v2.json --base ../docs/lottery_gold_3g_2026-10-13.json
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(require(path.join(__dirname, "..", "grammgold-firebase.json"))) });
const { generateTicketCode } = require("../src/campaign/campaignShared");
const db = admin.firestore();
const argv = process.argv.slice(2);
const baseIdx = argv.indexOf("--base");
const BASE = baseIdx >= 0 ? path.resolve(argv[baseIdx + 1]) : null;
if (baseIdx >= 0) argv.splice(baseIdx, 2);
const MIN = Number(argv[0] || 3);
const today = new Date().toISOString().slice(0, 10);
const OUT = argv[1] || path.join(__dirname, "..", "..", "docs", `lottery_gold_3g_${today}.json`);

function writeXlsx(OUT, out) {
  const tickets = out.tickets;
  const XOUT = OUT.replace(/\.json$/, "") + ".xlsx";
  const rows = tickets.map((t, i) => ({
    "№": i + 1,
    "Сугалааны дугаар": t.ticket_number,
    "Хэрэглэгчийн ID": t.user_id,
    "Нэр": t.name,
    "Утас": t.phone,
    "И-мэйл": t.email,
    "Регистр": t.registration_number,
    "Алт (гр)": t.gold_grams,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [4, 18, 30, 28, 12, 28, 14, 10].map((w) => ({ wch: w }));
  ws["!autofilter"] = { ref: `A1:H${rows.length + 1}` };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Сугалаа");
  const info = XLSX.utils.aoa_to_sheet([["Үүсгэсэн", out.generated_at], ["Дүрэм", out.rule], ["Нийт сугалаа", out.total_tickets]]);
  info["!cols"] = [{ wch: 14 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, info, "Мэдээлэл");
  XLSX.writeFile(wb, XOUT);
  console.log(`xlsx: ${XOUT}`);
}

// Өмнө үүсгэсэн JSON-оос (кодуудыг өөрчлөхгүйгээр) зөвхөн xlsx гаргах:
//   node scripts/lottery_gold_3g.js --from ../docs/lottery_gold_3g_2026-10-13.json
if (process.argv[2] === "--from") {
  const src = path.resolve(process.argv[3]);
  writeXlsx(src, JSON.parse(fs.readFileSync(src, "utf8")));
  process.exit(0);
}

(async () => {
  const snap = await db.collection("users").where("balance.gold", ">=", MIN).get();
  const used = new Set();
  const tickets = [];
  const baseByUser = new Map();
  if (BASE) {
    const prev = JSON.parse(fs.readFileSync(BASE, "utf8"));
    for (const t of prev.tickets) {
      baseByUser.set(t.user_id, t);
      used.add(t.ticket_number);
    }
  }
  let kept = 0; let added = 0;
  for (const d of snap.docs) {
    const u = d.data();
    const prevT = baseByUser.get(d.id);
    if (prevT) {
      // Хуучин код хэвээр; зөвхөн одоогийн үлдэгдлийг шинэчилнэ.
      tickets.push({ ...prevT, gold_grams: Number(u.balance?.gold || 0) });
      kept++;
      continue;
    }
    added++;
    let code;
    do code = generateTicketCode(); while (used.has(code));
    used.add(code);
    tickets.push({
      ticket_number: code,
      user_id: d.id,
      name: [u.last_name, u.first_name].filter(Boolean).join(" ").trim(),
      phone: u.phone || "",
      email: u.email || "",
      registration_number: u.registration_number || "",
      gold_grams: Number(u.balance?.gold || 0),
      added_at: BASE ? new Date().toISOString().slice(0, 10) : undefined,
    });
  }
  // Өмнөх жагсаалтад байсан ч одоо босгоос доош орсон хэрэглэгч: кодыг нь хэвээр үлдээнэ.
  const seen = new Set(tickets.map((t) => t.user_id));
  let belowNow = 0;
  for (const [uid, t] of baseByUser) {
    if (!seen.has(uid)) {
      tickets.push({ ...t, note: "өмнө олгогдсон, одоо босгоос доош" });
      belowNow++;
    }
  }
  tickets.sort((a, b) => b.gold_grams - a.gold_grams);
  const out = {
    generated_at: new Date().toISOString(),
    rule: `balance.gold >= ${MIN} гр, 1 хэрэглэгч = 1 сугалаа`,
    total_tickets: tickets.length,
    ...(BASE ? { base_file: path.basename(BASE), kept_from_base: kept, newly_added: added, below_threshold_now: belowNow } : {}),
    tickets,
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  writeXlsx(OUT, out);
  const codes = new Set(tickets.map((t) => t.ticket_number));
  console.log(`нийт сугалаа: ${tickets.length} | хуучин хэвээр: ${kept} | шинээр: ${added} | босгоос доош орсон: ${belowNow} | давхардсан код: ${tickets.length - codes.size} | ${OUT}`);
  process.exit(0);
})().catch((e) => {
 console.error(e); process.exit(1);
});
