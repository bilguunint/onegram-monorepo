import {
  collection,
  doc,
  getDoc,
  getDocs,
  type Timestamp,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";

export type WithdrawTypeBreakdown = {
  count: number;
  percentage: number;
  total_grams_gold?: number;
  total_grams_silver?: number;
  total_price_mnt?: number;
  avg_gold_rate?: number;
};

export type DailyBreakdownRow = {
  date: Timestamp | string;
  sold_to_us_count?: number;
  taken_physically_count?: number;
  total_withdraws?: number;
  total_grams_gold?: number;
  total_grams_silver?: number;
};

export type TopUserRow = {
  rank: number;
  name: string;
  withdraw_count: number;
  total_quantity: number;
};

export type MetalStats = {
  total_grams?: number;
  avg_quantity?: number;
  withdraw_count?: number;
};

export type WithdrawAnalytics = {
  monthKey: string; // e.g. "2026_05"
  total_withdraws?: number;
  gold?: MetalStats;
  silver?: MetalStats;
  by_withdraw_type?: {
    sold_to_us?: WithdrawTypeBreakdown;
    taken_physically?: WithdrawTypeBreakdown;
    unspecified?: WithdrawTypeBreakdown;
  };
  daily_breakdown?: DailyBreakdownRow[];
  top_users_by_frequency?: TopUserRow[];
  top_users_by_quantity?: TopUserRow[];
  calculated_at?: Timestamp;
};

const MONTH_KEY_RE = /^\d{4}_\d{2}$/;

export async function listAnalyticsMonths(): Promise<string[]> {
  const snap = await getDocs(collection(getDb(), "withdraw_analytics"));
  return snap.docs
    .map((d) => d.id)
    .filter((id) => id !== "overall" && MONTH_KEY_RE.test(id))
    .sort()
    .reverse();
}

export async function fetchWithdrawAnalytics(
  monthKey: string
): Promise<WithdrawAnalytics | null> {
  const snap = await getDoc(doc(getDb(), "withdraw_analytics", monthKey));
  if (!snap.exists()) return null;
  return { monthKey, ...(snap.data() as Omit<WithdrawAnalytics, "monthKey">) };
}

export function formatMonthDisplay(monthKey: string): string {
  if (!MONTH_KEY_RE.test(monthKey)) return monthKey;
  return monthKey.replace("_", "-");
}

export function currentMonthKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}_${m}`;
}
