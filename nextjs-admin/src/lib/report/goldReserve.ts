// Алтны нөөцийн судалгааны төрлүүд + клиент талын fetch.
// Тооцоолол нь сервер дээр (src/lib/server/goldReserveReport.ts) хийгдэж,
// /api/reports/gold-reserve-ээр ирнэ.

import { getFirebaseAuth } from "@/lib/firebase/client";

export type YearRow = {
  year: number;
  bought: number;
  orders: number;
  buyers: number;
  /** Биетээр авсан, г */
  phys: number;
  /** Бидэнд буцааж зарсан, г */
  sold: number;
  /** Төрөл бүртгэгдээгүй (2026-02-с өмнөх), г */
  unspec: number;
  wd: number;
  wdCount: number;
  net: number;
  cum: number;
  revenue: number;
};

export type MonthRow = {
  month: string; // YYYY-MM
  bought: number;
  orders: number;
  phys: number;
  sold: number;
  unspec: number;
  wd: number;
  net: number;
  cum: number;
};

export const HOLD_BUCKETS = [
  "0 өдөр",
  "1–7 өдөр",
  "8–30 өдөр",
  "31–90 өдөр",
  "91–180 өдөр",
  "181–365 өдөр",
  "1 жилээс дээш",
] as const;
export type HoldBucket = (typeof HOLD_BUCKETS)[number];

export type BucketGrams = Record<HoldBucket, number>;

export type CohortRow = {
  year: number;
  bought: number;
  withdrawn: number;
  held: number;
};

export type DistBucket = { label: string; count: number };

export type GoldReserveReport = {
  computedAt: string; // ISO
  dataFrom: string; // YYYY-MM-DD (эхний захиалга)
  dataTo: string; // YYYY-MM-DD (тооцсон өдөр)
  reserve: {
    total: number;
    userBalance: number;
    usersWithGold: number;
    investments: number;
    giftPending: number;
    silverBalance: number;
  };
  totals: {
    bought: number;
    orders: number;
    withdrawn: number;
    withdrawCount: number;
    phys: number;
    sold: number;
    unspec: number;
    /** Биетээр гарсан = phys + unspec */
    physicalOut: number;
    /** Зарсан − авсан (нөөцтэй тулгах) */
    netFlow: number;
  };
  yearly: YearRow[];
  monthly: MonthRow[];
  /** Авагдсан алтны хадгалагдсан хугацаа (FIFO), г */
  holdAll: BucketGrams;
  /** Авалтын жил|төрөл → хугацааны бүлэг → г */
  holdByYearType: Record<string, BucketGrams>;
  /** Одоо хадгалагдаж буй алтны нас, г */
  ageNow: BucketGrams;
  /** FIFO-д холбогдоогүй авалт, г */
  unallocated: number;
  cohort: CohortRow[];
  buyers: {
    total: number;
    everWithdrew: number;
    neverWithdrew: number;
    fullOut: number;
  };
  distribution: DistBucket[];
  top10Sum: number;
  top100Share: number; // %
  peakMonth: { month: string; wd: number; phys: number } | null;
};

export type GoldReserveResponse = {
  status: string;
  data: GoldReserveReport;
  cached: boolean;
};

export async function fetchGoldReserveReport(
  refresh = false
): Promise<GoldReserveResponse> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Нэвтрэх шаардлагатай.");
  const token = await user.getIdToken();
  const res = await fetch(
    `/api/reports/gold-reserve${refresh ? "?refresh=1" : ""}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    /* no body */
  }
  if (!res.ok) {
    const obj = (payload ?? {}) as Record<string, unknown>;
    const msg =
      (typeof obj.msg === "string" && obj.msg) ||
      `Тайлан ачааллахад алдаа гарлаа (${res.status}).`;
    throw new Error(msg);
  }
  return payload as GoldReserveResponse;
}

export function sumBuckets(b: BucketGrams): number {
  return HOLD_BUCKETS.reduce((s, k) => s + (b[k] || 0), 0);
}
