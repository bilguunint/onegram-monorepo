// Bilingual strings + language-aware number formatting for the investor
// Report page. Scoped to the report feature (the rest of the admin stays mn).

export type Lang = "mn" | "en";

export const REPORT_STRINGS = {
  mn: {
    title: "OneGram — Хөрөнгө оруулагчийн тайлан",
    subtitle: "Платформын өсөлт, хадгалалт, орлогын нэгдсэн тойм",
    updated: "Шинэчилсэн",
    refresh: "Шинэчлэх",
    present: "Танилцуулга",
    exitPresentation: "Гарах",
    loading: "Тайлан ачааллаж байна…",
    noData: "Өгөгдөл алга",
    autoComputed:
      "Тоонууд өдөр бүр автоматаар тооцоологддог (Улаанбаатар, 02:00).",
    fxNote: "",

    // sections
    secOverview: "Үндсэн үзүүлэлт",
    secThisMonth: "Энэ сар",
    secMonthlyRevenue: "Сарын борлуулалтын өсөлт",
    secDailyRevenue: "Өдрийн борлуулалт",
    secUserGrowth: "Хэрэглэгчийн өсөлт",
    secGoldPrice: "Алтны ханш",
    secCustody: "Алтны хадгалалт ба үлдэгдэл",
    secPortfolio: "Хуваан төлөлтийн багц",
    secRedemption: "Эргүүлэн авалт ба хөрвөх чадвар",
    secMonthly: "Сарын задаргаа",

    // KPIs
    kRevenue: "Нийт борлуулалт",
    kRevenueMeta: "бүх хугацааны нийлбэр",
    kCustody: "Хадгалагдаж буй алт",
    kUsers: "Нийт хэрэглэгч",
    kActivation: "идэвхжсэн",
    kGoldSold: "Зарагдсан алт",
    kBuyback: "Эргүүлэн худалдан авалт",
    kInvestCapital: "Хөрөнгө оруулалт",
    kOrders: "Амжилттай захиалга",
    kSuccessRate: "амжилттай",
    kOfTotal: "нийт захиалгаас",

    // this month
    revenueThisMonth: "Энэ сарын борлуулалт",
    vsLastMonth: "өмнөх сараас",
    mNewUsers: "Шинэ хэрэглэгч",
    mOrders: "Амжилттай захиалга",
    mGoldSold: "Зарсан алт",

    // gold price
    perGram: "1 гр",
    perGramUnit: "гр",
    last30: "сүүлийн 30 хоног",

    // period selector
    p1m: "1 сар",
    p6m: "6 сар",
    p1y: "1 жил",
    pAll: "Бүгд",

    // custody
    totalGoldInSystem: "Системд буй нийт алт",
    custodyValue: "Үнэлгээ (ханшаар)",
    withGold: "Алттай хэрэглэгч",
    penetration: "Нэвтрэлт",
    colGold: "Алтны үлдэгдэл",
    colUsers: "Хэрэглэгч",

    // portfolio
    gmv: "Нийт дүн (GMV)",
    collected: "Цуглуулсан төлбөр",
    collectionRate: "цуглуулалт",
    activePlans: "Идэвхтэй төлөлт",
    overduePlans: "Хугацаа хэтэрсэн",
    onTimeRate: "Хугацаандаа (идэвхтэйгээс)",
    statusMix: "Төлвийн харьцаа",
    stActive: "Идэвхтэй",
    stCompleted: "Төлөгдсөн",
    stDelivered: "Хүлээлгэн өгсөн",
    stCancelled: "Цуцалсан",

    // redemption
    soldToUs: "Манайд зарсан",
    takenPhysically: "Биетээр авсан",
    unspecified: "Тодорхойгүй",
    avgBuybackRate: "Дундаж эргүүлэн авах ханш",
    goldWithdrawn: "Биетээр гарсан алт",

    // monthly table
    thMonth: "Сар",
    thRevenue: "Орлого",
    thOrders: "Захиалга",
    thGold: "Алт",
    thSilver: "Мөнгө",

    // chart series / units
    sRevenue: "Борлуулалт",
    sNewUsers: "Шинэ хэрэглэгч",
    investors: "хөрөнгө оруулагч",
  },
  en: {
    title: "OneGram — Investor Report",
    subtitle: "A unified overview of platform growth, custody and revenue",
    updated: "Updated",
    refresh: "Refresh",
    present: "Present",
    exitPresentation: "Exit",
    loading: "Loading report…",
    noData: "No data",
    autoComputed:
      "Figures are recomputed automatically every day (Ulaanbaatar, 02:00).",
    fxNote: "Amounts in USD · 1 USD = 3,800₮",

    secOverview: "Key metrics",
    secThisMonth: "This month",
    secMonthlyRevenue: "Monthly gross sales growth",
    secDailyRevenue: "Daily gross sales",
    secUserGrowth: "User growth",
    secGoldPrice: "Gold price",
    secCustody: "Gold custody & balances",
    secPortfolio: "Installment portfolio",
    secRedemption: "Redemptions & liquidity",
    secMonthly: "Monthly breakdown",

    kRevenue: "Total Gross Sales",
    kRevenueMeta: "all-time cumulative",
    kCustody: "Gold under custody",
    kUsers: "Total users",
    kActivation: "activated",
    kGoldSold: "Gold sold",
    kBuyback: "Buy-back volume",
    kInvestCapital: "Investments",
    kOrders: "Successful orders",
    kSuccessRate: "successful",
    kOfTotal: "of all orders",

    revenueThisMonth: "Gross sales this month",
    vsLastMonth: "vs last month",
    mNewUsers: "New users",
    mOrders: "Successful orders",
    mGoldSold: "Gold sold",

    perGram: "1 g",
    perGramUnit: "g",
    last30: "last 30 days",

    p1m: "1m",
    p6m: "6m",
    p1y: "1y",
    pAll: "All",

    totalGoldInSystem: "Total gold in system",
    custodyValue: "Value (at rate)",
    withGold: "Funded users",
    penetration: "Penetration",
    colGold: "Gold balance",
    colUsers: "Users",

    gmv: "Installment GMV",
    collected: "Cash collected",
    collectionRate: "collected",
    activePlans: "Active plans",
    overduePlans: "Overdue plans",
    onTimeRate: "On-time (of active)",
    statusMix: "Status mix",
    stActive: "Active",
    stCompleted: "Completed",
    stDelivered: "Delivered",
    stCancelled: "Cancelled",

    soldToUs: "Sold back to us",
    takenPhysically: "Taken physically",
    unspecified: "Unspecified",
    avgBuybackRate: "Avg buy-back rate",
    goldWithdrawn: "Gold withdrawn",

    thMonth: "Month",
    thRevenue: "Revenue",
    thOrders: "Orders",
    thGold: "Gold",
    thSilver: "Silver",

    sRevenue: "Gross sales",
    sNewUsers: "New users",
    investors: "investors",
  },
} as const;

export type ReportStrings = {
  [K in keyof (typeof REPORT_STRINGS)["en"]]: string;
};

export function strings(lang: Lang): ReportStrings {
  return REPORT_STRINGS[lang];
}

// ---------------------------------------------------------------------------
// Language-aware number formatting
// ---------------------------------------------------------------------------
function locale(lang: Lang): string {
  return lang === "en" ? "en-US" : "mn-MN";
}

function nf(lang: Lang, opts: Intl.NumberFormatOptions): Intl.NumberFormat {
  return new Intl.NumberFormat(locale(lang), opts);
}

// In English the report shows money in USD, converted from MNT at this fixed
// rate. Mongolian keeps the native MNT (₮).
export const USD_MNT_RATE = 3800; // 1 USD = 3,800₮

export function fInt(n: number | null | undefined, lang: Lang): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return nf(lang, { maximumFractionDigits: 0 }).format(n);
}

export function fMNT(n: number | null | undefined, lang: Lang): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (lang === "en") {
    return `$${nf("en", { maximumFractionDigits: 0 }).format(n / USD_MNT_RATE)}`;
  }
  return `${nf("mn", { maximumFractionDigits: 0 }).format(n)}₮`;
}

export function fCompactMNT(n: number | null | undefined, lang: Lang): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (lang === "en") {
    const usd = n / USD_MNT_RATE;
    const dec = nf("en", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const a = Math.abs(usd);
    if (a >= 1_000_000_000) return `$${dec.format(usd / 1_000_000_000)}B`;
    if (a >= 1_000_000) return `$${dec.format(usd / 1_000_000)}M`;
    if (a >= 1_000) return `$${dec.format(usd / 1_000)}K`;
    return `$${nf("en", { maximumFractionDigits: 0 }).format(usd)}`;
  }
  const dec = nf("mn", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${dec.format(n / 1_000_000_000)} тэрбум₮`;
  if (abs >= 1_000_000) return `${dec.format(n / 1_000_000)} сая₮`;
  if (abs >= 100_000) return `${dec.format(n / 1_000)} мянган₮`;
  return `${nf("mn", { maximumFractionDigits: 0 }).format(n)}₮`;
}

export function fGram(n: number | null | undefined, lang: Lang): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const g = nf(lang, { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(n);
  return lang === "en" ? `${g} g` : `${g} гр`;
}

export function fCompactGram(n: number | null | undefined, lang: Lang): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1000) {
    const v = nf(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n / 1000);
    return lang === "en" ? `${v} kg` : `${v} кг`;
  }
  return fGram(n, lang);
}

export function fPct(n: number | null | undefined, lang: Lang): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  const v = nf(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);
  return `${sign}${v}%`;
}

// "2026-05-22" → "05/22" (axis ticks, language-neutral)
export function shortDate(dateKey: string): string {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(dateKey);
  return m ? `${m[1]}/${m[2]}` : dateKey;
}

// "2026-05" → "5/26" (axis ticks, language-neutral)
export function shortMonth(monthKey: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(monthKey);
  return m ? `${parseInt(m[2], 10)}/${m[1].slice(2)}` : monthKey;
}

// "2026-05" → localized full month label
const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export function monthLong(monthKey: string, lang: Lang): string {
  const m = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!m) return monthKey;
  const year = m[1];
  const mi = parseInt(m[2], 10);
  return lang === "en" ? `${EN_MONTHS[mi - 1]} ${year}` : `${year} оны ${mi}-р сар`;
}
