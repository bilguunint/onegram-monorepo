import "server-only";
import { AggregateField, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import {
  HOLD_BUCKETS,
  type BucketGrams,
  type CohortRow,
  type GoldReserveReport,
  type HoldBucket,
  type MonthRow,
  type YearRow,
} from "@/lib/report/goldReserve";

/**
 * Алтны нөөцийн судалгааг бүх цаг үеийн orders / withdraws / users өгөгдлөөс
 * тооцно. Зөвхөн бодит гүйлгээ:
 *   - зарсан: orders — type deposit, metal_id 1, payment_status success,
 *     admin_status success
 *   - авсан:  withdraws — metal_id 1, status verified
 * Pending төлөвтэй юуг ч тооцохгүй.
 *
 * Үр дүнг analytics/gold_reserve_report баримтад кэшлэнэ (computeAndCache).
 */

const CACHE_DOC = adminDb.collection("analytics").doc("gold_reserve_report");
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 цаг

// Улаанбаатар UTC+8 (зуны цаг байхгүй). Огноог +8 цаг шилжүүлээд UTC
// getter-ээр уншвал УБ-ын календарийн огноо гарна.
const UB_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function ub(d: Date): Date {
  return new Date(d.getTime() + UB_OFFSET_MS);
}
function ubYear(d: Date): number {
  return ub(d).getUTCFullYear();
}
function ubMonthKey(d: Date): string {
  const u = ub(d);
  return `${u.getUTCFullYear()}-${String(u.getUTCMonth() + 1).padStart(2, "0")}`;
}
function ubDateKey(d: Date): string {
  return ub(d).toISOString().slice(0, 10);
}
function ubDayIndex(d: Date): number {
  return Math.floor((d.getTime() + UB_OFFSET_MS) / DAY_MS);
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

function bucketOf(days: number): HoldBucket {
  if (days <= 0) return "0 өдөр";
  if (days <= 7) return "1–7 өдөр";
  if (days <= 30) return "8–30 өдөр";
  if (days <= 90) return "31–90 өдөр";
  if (days <= 180) return "91–180 өдөр";
  if (days <= 365) return "181–365 өдөр";
  return "1 жилээс дээш";
}

function emptyBuckets(): BucketGrams {
  const b = {} as BucketGrams;
  for (const k of HOLD_BUCKETS) b[k] = 0;
  return b;
}

const r3 = (n: number) => Math.round(n * 1000) / 1000;

type Lot = { d: Date; qty: number; uid: string; gift: boolean };
type Out = {
  d: Date;
  qty: number;
  uid: string;
  type: "taken_physically" | "sold_to_us" | "unspecified" | "gift";
};

async function loadSoldLots(): Promise<{ lots: Lot[]; revenueByYear: Map<number, number>; orderCount: number }> {
  const snap = await adminDb
    .collection("orders")
    .where("payment_status", "==", "success")
    .select("user_id", "type", "metal_id", "quantity", "admin_status", "created_at", "amount")
    .get();
  const lots: Lot[] = [];
  const revenueByYear = new Map<number, number>();
  for (const doc of snap.docs) {
    const o = doc.data();
    if (o.type !== "deposit") continue;
    if (Number(o.metal_id) !== 1) continue;
    if (o.admin_status !== "success") continue;
    const d = toDate(o.created_at);
    const qty = Number(o.quantity) || 0;
    if (!d || qty <= 0) continue;
    lots.push({ d, qty, uid: String(o.user_id || ""), gift: false });
    const y = ubYear(d);
    revenueByYear.set(y, (revenueByYear.get(y) || 0) + (Number(o.amount) || 0));
  }
  return { lots, revenueByYear, orderCount: lots.length };
}

async function loadWithdraws(): Promise<Out[]> {
  const snap = await adminDb
    .collection("withdraws")
    .where("status", "==", "verified")
    .select("user_id", "metal_id", "quantity", "withdraw_type", "verified_at", "created_at")
    .get();
  const outs: Out[] = [];
  for (const doc of snap.docs) {
    const w = doc.data();
    if (Number(w.metal_id) !== 1) continue;
    const d = toDate(w.verified_at) || toDate(w.created_at);
    const qty = Number(w.quantity) || 0;
    if (!d || qty <= 0) continue;
    const t =
      w.withdraw_type === "taken_physically" || w.withdraw_type === "sold_to_us"
        ? w.withdraw_type
        : "unspecified";
    outs.push({ d, qty, uid: String(w.user_id || ""), type: t });
  }
  return outs;
}

async function loadGifts(): Promise<{ received: { d: Date; qty: number; from: string; to: string }[]; pendingGrams: number }> {
  const snap = await adminDb
    .collection("gift_orders")
    .select("status", "quantity", "metal_id", "created_at", "sender", "receiver")
    .get();
  const received: { d: Date; qty: number; from: string; to: string }[] = [];
  let pendingGrams = 0;
  for (const doc of snap.docs) {
    const g = doc.data();
    if (Number(g.metal_id) !== 1) continue;
    const qty = Number(g.quantity) || 0;
    if (g.status === "pending") pendingGrams += qty;
    if (g.status !== "received") continue;
    const d = toDate(g.created_at);
    if (!d || qty <= 0) continue;
    received.push({
      d,
      qty,
      from: String(g.sender?.uid || ""),
      to: String(g.receiver?.uid || ""),
    });
  }
  return { received, pendingGrams };
}

async function loadInvestmentsOpen(): Promise<number> {
  const snap = await adminDb.collection("investments").select("balance").get();
  let sum = 0;
  for (const doc of snap.docs) sum += Math.max(0, Number(doc.data().balance) || 0);
  return sum;
}

async function loadUserStats(): Promise<{
  gold: number;
  silver: number;
  usersWithGold: number;
  distribution: { label: string; count: number }[];
  top10Sum: number;
  top100Sum: number;
}> {
  const users = adminDb.collection("users");
  const [goldAgg, silverAgg, withGold] = await Promise.all([
    users.aggregate({ gold: AggregateField.sum("balance.gold") }).get(),
    users.aggregate({ silver: AggregateField.sum("balance.silver") }).get(),
    users.where("balance.gold", ">", 0).count().get(),
  ]);

  const ranges: { label: string; lo: number; hi: number | null }[] = [
    { label: "1 г-аас бага", lo: 0, hi: 1 },
    { label: "1–4.99 г", lo: 1, hi: 5 },
    { label: "5–9.99 г", lo: 5, hi: 10 },
    { label: "10–49.99 г", lo: 10, hi: 50 },
    { label: "50–99.99 г", lo: 50, hi: 100 },
    { label: "100 г-аас дээш", lo: 100, hi: null },
  ];
  const distribution = await Promise.all(
    ranges.map(async (rg) => {
      let q =
        rg.lo === 0
          ? users.where("balance.gold", ">", 0)
          : users.where("balance.gold", ">=", rg.lo);
      if (rg.hi != null) q = q.where("balance.gold", "<", rg.hi);
      const c = await q.count().get();
      return { label: rg.label, count: c.data().count };
    })
  );

  const topSnap = await users
    .orderBy("balance.gold", "desc")
    .limit(100)
    .select("balance")
    .get();
  let top10Sum = 0;
  let top100Sum = 0;
  topSnap.docs.forEach((doc, i) => {
    const g = Number(doc.data().balance?.gold) || 0;
    if (i < 10) top10Sum += g;
    top100Sum += g;
  });

  return {
    gold: Number(goldAgg.data().gold) || 0,
    silver: Number(silverAgg.data().silver) || 0,
    usersWithGold: withGold.data().count,
    distribution,
    top10Sum,
    top100Sum,
  };
}

export async function computeGoldReserveReport(): Promise<GoldReserveReport> {
  const now = new Date();
  const [{ lots, revenueByYear, orderCount }, outs, gifts, investments, userStats] =
    await Promise.all([
      loadSoldLots(),
      loadWithdraws(),
      loadGifts(),
      loadInvestmentsOpen(),
      loadUserStats(),
    ]);

  // ---- Жил / сар
  type Agg = {
    bought: number;
    orders: number;
    buyers: Set<string>;
    phys: number;
    sold: number;
    unspec: number;
    wd: number;
    wdCount: number;
  };
  const mk = (): Agg => ({
    bought: 0, orders: 0, buyers: new Set(), phys: 0, sold: 0, unspec: 0, wd: 0, wdCount: 0,
  });
  const byYear = new Map<number, Agg>();
  const byMonth = new Map<string, Agg>();
  const get = <K,>(m: Map<K, Agg>, k: K) => {
    let v = m.get(k);
    if (!v) { v = mk(); m.set(k, v); }
    return v;
  };
  let firstDate: Date | null = null;
  for (const l of lots) {
    if (!firstDate || l.d < firstDate) firstDate = l.d;
    for (const a of [get(byYear, ubYear(l.d)), get(byMonth, ubMonthKey(l.d))]) {
      a.bought += l.qty;
      a.orders += 1;
      a.buyers.add(l.uid);
    }
  }
  for (const o of outs) {
    for (const a of [get(byYear, ubYear(o.d)), get(byMonth, ubMonthKey(o.d))]) {
      a.wd += o.qty;
      a.wdCount += 1;
      if (o.type === "taken_physically") a.phys += o.qty;
      else if (o.type === "sold_to_us") a.sold += o.qty;
      else a.unspec += o.qty;
    }
  }

  let cum = 0;
  const yearly: YearRow[] = [...byYear.keys()].sort().map((y) => {
    const a = byYear.get(y)!;
    const net = a.bought - a.wd;
    cum += net;
    return {
      year: y,
      bought: r3(a.bought),
      orders: a.orders,
      buyers: a.buyers.size,
      phys: r3(a.phys),
      sold: r3(a.sold),
      unspec: r3(a.unspec),
      wd: r3(a.wd),
      wdCount: a.wdCount,
      net: r3(net),
      cum: r3(cum),
      revenue: Math.round(revenueByYear.get(y) || 0),
    };
  });
  cum = 0;
  const monthly: MonthRow[] = [...byMonth.keys()].sort().map((m) => {
    const a = byMonth.get(m)!;
    const net = a.bought - a.wd;
    cum += net;
    return {
      month: m,
      bought: r3(a.bought),
      orders: a.orders,
      phys: r3(a.phys),
      sold: r3(a.sold),
      unspec: r3(a.unspec),
      wd: r3(a.wd),
      net: r3(net),
      cum: r3(cum),
    };
  });

  // ---- FIFO: хадгалсан хугацаа
  type UserFlow = { lots: Lot[]; outs: Out[] };
  const byUser = new Map<string, UserFlow>();
  const flow = (uid: string) => {
    let f = byUser.get(uid);
    if (!f) { f = { lots: [], outs: [] }; byUser.set(uid, f); }
    return f;
  };
  for (const l of lots) flow(l.uid).lots.push(l);
  for (const o of outs) flow(o.uid).outs.push(o);
  for (const g of gifts.received) {
    // Хүлээн авсан бэлэг: хүлээн авагчийн худалдан авалт, илгээгчийн гарц.
    flow(g.to).lots.push({ d: g.d, qty: g.qty, uid: g.to, gift: true });
    flow(g.from).outs.push({ d: g.d, qty: g.qty, uid: g.from, type: "gift" });
  }

  const holdAll = emptyBuckets();
  const holdByYearType: Record<string, BucketGrams> = {};
  const ageNow = emptyBuckets();
  const cohortBought = new Map<number, number>();
  const cohortWithdrawn = new Map<number, number>();
  const cohortHeld = new Map<number, number>();
  let unallocated = 0;
  let fullOut = 0;
  const buyers = new Set<string>();
  const withdrawers = new Set<string>();
  const nowIdx = ubDayIndex(now);

  for (const l of lots) {
    buyers.add(l.uid);
    const y = ubYear(l.d);
    cohortBought.set(y, (cohortBought.get(y) || 0) + l.qty);
  }
  for (const o of outs) withdrawers.add(o.uid);

  for (const [uid, f] of byUser) {
    const sorted = [...f.lots].sort((a, b) => a.d.getTime() - b.d.getTime());
    const left = sorted.map((l) => l.qty);
    let li = 0;
    let boughtReal = 0;
    let outReal = 0;
    for (const l of sorted) if (!l.gift) boughtReal += l.qty;
    for (const o of [...f.outs].sort((a, b) => a.d.getTime() - b.d.getTime())) {
      let need = o.qty;
      if (o.type !== "gift") outReal += o.qty;
      while (need > 1e-9 && li < sorted.length) {
        const lot = sorted[li];
        if (lot.d > o.d) break; // авалтаас хойш худалдаж авсан
        const take = Math.min(need, left[li]);
        if (take > 1e-9) {
          if (o.type !== "gift") {
            const days = ubDayIndex(o.d) - ubDayIndex(lot.d);
            const b = bucketOf(days);
            holdAll[b] += take;
            const key = `${ubYear(o.d)}|${o.type}`;
            if (!holdByYearType[key]) holdByYearType[key] = emptyBuckets();
            holdByYearType[key][b] += take;
            if (!lot.gift) {
              const py = ubYear(lot.d);
              cohortWithdrawn.set(py, (cohortWithdrawn.get(py) || 0) + take);
            }
          }
          need -= take;
          left[li] -= take;
        }
        if (left[li] <= 1e-9) li++;
      }
      if (need > 1e-9 && o.type !== "gift") unallocated += need;
    }
    sorted.forEach((lot, i) => {
      if (left[i] > 1e-9 && !lot.gift) {
        const py = ubYear(lot.d);
        cohortHeld.set(py, (cohortHeld.get(py) || 0) + left[i]);
        ageNow[bucketOf(nowIdx - ubDayIndex(lot.d))] += left[i];
      }
    });
    if (buyers.has(uid) && withdrawers.has(uid) && outReal >= boughtReal - 1e-6) fullOut++;
  }

  const roundBuckets = (b: BucketGrams): BucketGrams => {
    const o = emptyBuckets();
    for (const k of HOLD_BUCKETS) o[k] = r3(b[k]);
    return o;
  };
  for (const k of Object.keys(holdByYearType)) {
    holdByYearType[k] = roundBuckets(holdByYearType[k]);
  }

  const cohort: CohortRow[] = [...cohortBought.keys()].sort().map((y) => ({
    year: y,
    bought: r3(cohortBought.get(y) || 0),
    withdrawn: r3(cohortWithdrawn.get(y) || 0),
    held: r3(cohortHeld.get(y) || 0),
  }));

  // ---- Нийт дүн
  const bought = lots.reduce((s, l) => s + l.qty, 0);
  const withdrawn = outs.reduce((s, o) => s + o.qty, 0);
  const phys = outs.filter((o) => o.type === "taken_physically").reduce((s, o) => s + o.qty, 0);
  const sold = outs.filter((o) => o.type === "sold_to_us").reduce((s, o) => s + o.qty, 0);
  const unspec = outs.filter((o) => o.type === "unspecified").reduce((s, o) => s + o.qty, 0);

  const reserveTotal = userStats.gold + investments + gifts.pendingGrams;

  const everWithdrew = [...buyers].filter((u) => withdrawers.has(u)).length;

  let peakMonth: GoldReserveReport["peakMonth"] = null;
  for (const m of monthly) {
    if (!peakMonth || m.wd > peakMonth.wd) peakMonth = { month: m.month, wd: m.wd, phys: m.phys };
  }

  return {
    computedAt: now.toISOString(),
    dataFrom: firstDate ? ubDateKey(firstDate) : "",
    dataTo: ubDateKey(now),
    reserve: {
      total: r3(reserveTotal),
      userBalance: r3(userStats.gold),
      usersWithGold: userStats.usersWithGold,
      investments: r3(investments),
      giftPending: r3(gifts.pendingGrams),
      silverBalance: r3(userStats.silver),
    },
    totals: {
      bought: r3(bought),
      orders: orderCount,
      withdrawn: r3(withdrawn),
      withdrawCount: outs.length,
      phys: r3(phys),
      sold: r3(sold),
      unspec: r3(unspec),
      physicalOut: r3(phys + unspec),
      netFlow: r3(bought - withdrawn),
    },
    yearly,
    monthly,
    holdAll: roundBuckets(holdAll),
    holdByYearType,
    ageNow: roundBuckets(ageNow),
    unallocated: r3(unallocated),
    cohort,
    buyers: {
      total: buyers.size,
      everWithdrew,
      neverWithdrew: buyers.size - everWithdrew,
      fullOut,
    },
    distribution: userStats.distribution,
    top10Sum: r3(userStats.top10Sum),
    top100Share: userStats.gold > 0 ? r3((100 * userStats.top100Sum) / userStats.gold) : 0,
    peakMonth,
  };
}

export async function getCachedGoldReserveReport(): Promise<GoldReserveReport | null> {
  const snap = await CACHE_DOC.get();
  if (!snap.exists) return null;
  const d = snap.data() as { computed_at?: Timestamp; payload?: string };
  const at = toDate(d.computed_at);
  if (!at || !d.payload) return null;
  if (Date.now() - at.getTime() > CACHE_TTL_MS) return null;
  try {
    return JSON.parse(d.payload) as GoldReserveReport;
  } catch {
    return null;
  }
}

export async function computeAndCacheGoldReserveReport(): Promise<GoldReserveReport> {
  const report = await computeGoldReserveReport();
  await CACHE_DOC.set({
    computed_at: Timestamp.fromDate(new Date(report.computedAt)),
    payload: JSON.stringify(report),
  });
  return report;
}
