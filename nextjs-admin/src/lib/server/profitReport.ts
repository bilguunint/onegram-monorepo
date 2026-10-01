import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import {
  FEE_RATE,
  TAX_RATE,
  type ProfitBucket,
  type ProfitMonth,
  type ProfitReport,
  type ProfitYear,
} from "@/lib/report/profit";

/**
 * Ашгийн тайлан (сервер талын тооцоо).
 *
 * Орлогын эх сурвалж: orders — type deposit, payment_status success,
 * admin_status success (ажилтан баталгаажуулсан). Хуваан төлөлт, бэлэг,
 * дэмжлэг, Шүтээн хуур энд ОРОХГҮЙ: тэдгээр нь ханшийн 5% шимтгэлтэй биш.
 *
 * Захиалга бүрийн ашиг = quantity × price × 5% (price = захиалах үеийн
 * Монголбанкны ханш, захиалгын баримтад хадгалагдсан). price байхгүй хуучин
 * баримтад amount / 1.26 × 5%-аар урвуу тооцно (amount = суурь × 1.26).
 *
 * Үр дүнг analytics/profit_report баримтад кэшлэнэ.
 */

const CACHE_DOC = adminDb.collection("analytics").doc("profit_report");
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 цаг
const SCHEMA_VERSION = 1;
const AMOUNT_MULTIPLIER = (1 + FEE_RATE) * (1 + TAX_RATE); // 1.26

// Улаанбаатар UTC+8 (зуны цаг байхгүй).
const UB_OFFSET_MS = 8 * 60 * 60 * 1000;
function ub(d: Date): Date {
  return new Date(d.getTime() + UB_OFFSET_MS);
}
function ubMonthKey(d: Date): string {
  const u = ub(d);
  return `${u.getUTCFullYear()}-${String(u.getUTCMonth() + 1).padStart(2, "0")}`;
}
function ubDateKey(d: Date): string {
  return ub(d).toISOString().slice(0, 10);
}
function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  if (typeof v === "object" && v !== null && "toDate" in v) {
    const fn = (v as { toDate?: () => Date }).toDate;
    if (typeof fn === "function") return fn.call(v);
  }
  return null;
}

const r0 = (n: number) => Math.round(n);
const r3 = (n: number) => Math.round(n * 1000) / 1000;

function emptyBucket(): ProfitBucket {
  return { orders: 0, grams: 0, revenue: 0, base: 0, profit: 0, tax: 0 };
}
function add(b: ProfitBucket, o: { qty: number; revenue: number; base: number }) {
  b.orders += 1;
  b.grams += o.qty;
  b.revenue += o.revenue;
  b.base += o.base;
  b.profit += o.base * FEE_RATE;
  b.tax += o.base * (1 + FEE_RATE) * TAX_RATE;
}
function round(b: ProfitBucket): ProfitBucket {
  return {
    orders: b.orders,
    grams: r3(b.grams),
    revenue: r0(b.revenue),
    base: r0(b.base),
    profit: r0(b.profit),
    tax: r0(b.tax),
  };
}

export async function computeProfitReport(): Promise<ProfitReport> {
  const snap = await adminDb
    .collection("orders")
    .where("payment_status", "==", "success")
    .select("type", "metal_id", "quantity", "price", "amount", "admin_status", "is_extraOrder", "created_at")
    .get();

  const totals = emptyBucket();
  const gold = emptyBucket();
  const silver = emptyBucket();
  const months = new Map<string, ProfitBucket>();
  const years = new Map<number, ProfitBucket>();
  const days = new Map<string, { profit: number; orders: number }>();
  let extraOrders = 0;
  let derivedFromAmount = 0;
  let first: Date | null = null;
  let last: Date | null = null;

  const now = new Date();
  const cutoff30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  for (const doc of snap.docs) {
    const o = doc.data();
    if ((o.type ?? "deposit") !== "deposit") continue;
    if (o.admin_status !== "success") continue;
    const d = toDate(o.created_at);
    const qty = Number(o.quantity) || 0;
    const revenue = Number(o.amount) || 0;
    if (!d || qty <= 0) continue;

    const price = Number(o.price) || 0;
    let base: number;
    if (price > 0) {
      base = qty * price;
    } else if (revenue > 0) {
      base = revenue / AMOUNT_MULTIPLIER;
      derivedFromAmount += 1;
    } else {
      continue;
    }
    if (o.is_extraOrder) extraOrders += 1;

    const entry = { qty, revenue, base };
    add(totals, entry);
    add(Number(o.metal_id) === 3 ? silver : gold, entry);

    const mk = ubMonthKey(d);
    if (!months.has(mk)) months.set(mk, emptyBucket());
    add(months.get(mk)!, entry);

    const y = ub(d).getUTCFullYear();
    if (!years.has(y)) years.set(y, emptyBucket());
    add(years.get(y)!, entry);

    if (d >= cutoff30) {
      const dk = ubDateKey(d);
      const cur = days.get(dk) ?? { profit: 0, orders: 0 };
      cur.profit += base * FEE_RATE;
      cur.orders += 1;
      days.set(dk, cur);
    }

    if (!first || d < first) first = d;
    if (!last || d > last) last = d;
  }

  const monthRows: ProfitMonth[] = [...months.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, b]) => ({ month, ...round(b) }));
  const yearRows: ProfitYear[] = [...years.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, b]) => ({ year, ...round(b) }));

  const curKey = ubMonthKey(now);
  const prevKey = shiftMonth(curKey, -1);
  const byKey = new Map(monthRows.map((m) => [m.month, m]));

  const avgOver = (n: number) => {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += byKey.get(shiftMonth(curKey, -i))?.profit ?? 0;
    return r0(sum / n);
  };

  // Дундажид гүйцэд дуусаагүй энэ сарыг оруулахгүй (хэрэв өмнөх сарууд байвал).
  const completed = monthRows.filter((m) => m.month !== curKey);
  const avgPool = completed.length > 0 ? completed : monthRows;
  const avgMonthlyProfit =
    avgPool.length > 0 ? r0(avgPool.reduce((s, m) => s + m.profit, 0) / avgPool.length) : 0;

  const bestMonth = monthRows.reduce<ProfitMonth | null>(
    (best, m) => (best == null || m.profit > best.profit ? m : best),
    null
  );

  const last30Days = [...days.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, v]) => ({ date, profit: r0(v.profit), orders: v.orders }));

  return {
    computedAt: now.toISOString(),
    feeRate: FEE_RATE,
    taxRate: TAX_RATE,
    totals: {
      ...round(totals),
      extraOrders,
      derivedFromAmount,
      firstOrderAt: first ? first.toISOString() : null,
      lastOrderAt: last ? last.toISOString() : null,
    },
    byMetal: { gold: round(gold), silver: round(silver) },
    months: monthRows,
    years: yearRows,
    avgMonthlyProfit,
    avgMonthlyProfitLast12: avgOver(12),
    avgMonthlyProfitLast6: avgOver(6),
    bestMonth,
    currentMonth: byKey.get(curKey) ?? null,
    previousMonth: byKey.get(prevKey) ?? null,
    avgProfitPerOrder: totals.orders > 0 ? r0(totals.profit / totals.orders) : 0,
    avgProfitPerGram: totals.grams > 0 ? r0(totals.profit / totals.grams) : 0,
    last30Days,
  };
}

export async function getCachedProfitReport(): Promise<ProfitReport | null> {
  const snap = await CACHE_DOC.get();
  if (!snap.exists) return null;
  const d = snap.data() as { computed_at?: Timestamp; payload?: string; schema?: number };
  if (d.schema !== SCHEMA_VERSION) return null;
  const at = toDate(d.computed_at);
  if (!at || !d.payload) return null;
  if (Date.now() - at.getTime() > CACHE_TTL_MS) return null;
  try {
    return JSON.parse(d.payload) as ProfitReport;
  } catch {
    return null;
  }
}

export async function computeAndCacheProfitReport(): Promise<ProfitReport> {
  const report = await computeProfitReport();
  await CACHE_DOC.set({
    schema: SCHEMA_VERSION,
    computed_at: Timestamp.fromDate(new Date(report.computedAt)),
    payload: JSON.stringify(report),
  });
  return report;
}
