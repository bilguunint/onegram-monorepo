const s = require("./campaignShared");
let pass = 0; let fail = 0;
const eq = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  console.log(`${ok ? "✓" : "✗"} ${label}  got=${JSON.stringify(got)}${ok ? "" : "  want=" + JSON.stringify(want)}`);
};
const at = (s) => new Date(s + "T00:00:00+08:00");

// ── 7 хоногийн давтамж: 3-р сарын 2-нд эхэлж 3-р сарын 30-нд дуусна
const weekly = { start_date: at("2026-03-02"), end_date: at("2026-03-30"), draw_frequency: "weekly" };
eq("7 хоног: эхлэх өдөр", s.drawPeriodIndex(weekly, at("2026-03-02")), 0);
eq("7 хоног: 6 дахь өдөр", s.drawPeriodIndex(weekly, at("2026-03-08")), 0);
eq("7 хоног: 8 дахь өдөр → үе 1", s.drawPeriodIndex(weekly, at("2026-03-09")), 1);
eq("7 хоног: 15 дахь өдөр → үе 2", s.drawPeriodIndex(weekly, at("2026-03-16")), 2);
eq("7 хоног: нийт үе", s.totalDrawPeriods(weekly), 4);

// ── сарын давтамж: 5-р сарын 3-нд эхэлнэ
const monthly = { start_date: at("2026-05-03"), end_date: at("2026-08-03"), draw_frequency: "monthly" };
eq("сар: эхлэх өдөр", s.drawPeriodIndex(monthly, at("2026-05-03")), 0);
eq("сар: 6-р сарын 2 → үе 0", s.drawPeriodIndex(monthly, at("2026-06-02")), 0);
eq("сар: 6-р сарын 3 → үе 1", s.drawPeriodIndex(monthly, at("2026-06-03")), 1);
eq("сар: 7-р сарын 3 → үе 2", s.drawPeriodIndex(monthly, at("2026-07-03")), 2);
eq("сар: нийт үе", s.totalDrawPeriods(monthly), 3);

// ── хугацааны хил
eq("эхлэхээс өмнө идэвхгүй", s.isWithinCampaignWindow(weekly, at("2026-03-01")), false);
eq("дундуур идэвхтэй", s.isWithinCampaignWindow(weekly, at("2026-03-15")), true);
eq("дууссаны дараа идэвхгүй", s.isWithinCampaignWindow(weekly, at("2026-04-01")), false);
eq("огноогүй бол идэвхгүй", s.isWithinCampaignWindow({}, at("2026-03-15")), false);

// ── Timestamp объект (хуучин bug)
const ts = { toDate: () => at("2026-03-30") };
eq("Timestamp уншина", s.toDate(ts).getTime(), at("2026-03-30").getTime());
eq("Invalid Date → null", s.toDate("хог"), null);

// ── сугалааны тоо: 0.1гр тутамд 2
const c = { tickets_per_unit: 2 };
eq("0.05гр → 0", s.ticketsForGrams(c, 0.05), 0);
eq("0.1гр  → 2", s.ticketsForGrams(c, 0.1), 2);
eq("0.35гр → 6", s.ticketsForGrams(c, 0.35), 6);
eq("1гр    → 20", s.ticketsForGrams(c, 1), 20);
eq("хөвөгч цэгийн алдаа (0.1+0.2)", s.ticketsForGrams(c, 0.1 + 0.2), 6);
eq("хувь тогтоогүй → 0", s.ticketsForGrams({}, 5), 0);

// ── үлдэгдэл дараагийн үе рүү шилжих (хуримтлагдсан загвар)
const issuedAfter = (grams) => s.ticketsForGrams(c, grams);
eq("1-р 7 хоног 0.35гр → 6", issuedAfter(0.35), 6);
eq("2-р 7 хоногт +0.05гр → нийт 8", issuedAfter(0.35 + 0.05), 8);
console.log(`   ↑ 0.05 үлдэгдэл шилжсэн тул 0.05 нэмэхэд шинээр 2 сугалаа гарлаа`);

// ── үеийн хил
const b = s.drawPeriodBounds(weekly, 1);
eq("үе 1 эхлэл", b.start.toISOString().slice(0, 10), "2026-03-08");
const last = s.drawPeriodBounds(weekly, 3);
eq("сүүлийн үе аяны төгсгөлөөр таслагдана", last.end.getTime(), at("2026-03-30").getTime());

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
