import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type Timestamp,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";

export type OverallAnalytics = {
  total_users: number;
  users_with_gold: number;
  total_orders: number;
  successful_orders: number;
  total_gold_sold_all_time: number;
  total_silver_sold_all_time: number;
  total_gold_withdraws_all_time: number;
  total_silver_withdraws_all_time: number;
  total_revenue_all_time: number;
  total_investments: number;
  last_updated?: Timestamp;
};

export type MonthlyAnalytics = {
  month: string;
  total_orders: number;
  successful_orders: number;
  total_gold_sold: number;
  total_silver_sold: number;
  total_gold_withdraws: number;
  total_silver_withdraws: number;
  total_revenue: number;
  last_updated?: Timestamp;
};

export type GoldRate = {
  id: number;
  rate: number;
  changes: number;
  name: string;
  updated_at?: Timestamp;
};

export type RateSnapshot = {
  id: number;
  rate: number;
  date: string;
  name: string;
};

export async function fetchOverall(): Promise<OverallAnalytics | null> {
  const snap = await getDoc(doc(getDb(), "analytics", "overall"));
  return snap.exists() ? (snap.data() as OverallAnalytics) : null;
}

export async function fetchLatestGoldRate(): Promise<GoldRate | null> {
  const snap = await getDoc(doc(getDb(), "latest_rates", "latest_gold_rate"));
  return snap.exists() ? (snap.data() as GoldRate) : null;
}

export async function fetchRecentGoldRates(days = 30): Promise<RateSnapshot[]> {
  const q = query(
    collection(getDb(), "rates"),
    where("name", "==", "Алт"),
    orderBy("date", "desc"),
    limit(days)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as RateSnapshot)
    .reverse(); // chronological ascending for sparkline
}

export async function fetchMonth(monthKey: string): Promise<MonthlyAnalytics | null> {
  const snap = await getDoc(doc(getDb(), "analytics", "monthly", "data", monthKey));
  return snap.exists() ? (snap.data() as MonthlyAnalytics) : null;
}

export async function fetchRecentMonths(n = 12): Promise<MonthlyAnalytics[]> {
  const q = query(
    collection(getDb(), "analytics", "monthly", "data"),
    orderBy("month", "desc"),
    limit(n)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as MonthlyAnalytics);
}

export async function fetchInvestmentsCount(): Promise<number> {
  const snap = await getCountFromServer(collection(getDb(), "investments"));
  return snap.data().count;
}

export type DailyUserPoint = {
  date: string; // YYYY-MM-DD
  new_users: number;
};

export async function fetchDailyUsers(): Promise<DailyUserPoint[]> {
  const snap = await getDocs(
    query(
      collection(getDb(), "analytics", "daily_users", "data"),
      orderBy("date", "asc")
    )
  );
  return snap.docs.map((d) => {
    const x = d.data() as { date?: string; new_users?: number };
    return {
      date: x.date ?? d.id,
      new_users: Number(x.new_users ?? 0),
    };
  });
}

export type DailyIncomePoint = {
  date: string;
  total_amount: number;
  order_count: number;
};

export async function fetchDailyIncomes(): Promise<DailyIncomePoint[]> {
  const snap = await getDocs(
    query(
      collection(getDb(), "analytics", "daily_incomes", "data"),
      orderBy("date", "asc")
    )
  );
  return snap.docs.map((d) => {
    const x = d.data() as {
      date?: string;
      total_amount?: number;
      order_count?: number;
    };
    return {
      date: x.date ?? d.id,
      total_amount: Number(x.total_amount ?? 0),
      order_count: Number(x.order_count ?? 0),
    };
  });
}

export type GoldDistributionBucket = { gold: number; count: number };

export type GoldDistribution = {
  totalUsers: number;
  usersWithGold: number;
  usersWithoutGold: number;
  totalGoldInSystem: number;
  uniqueBalanceCount: number;
  distribution: GoldDistributionBucket[];
  calculated_at?: Timestamp;
};

export async function fetchGoldDistribution(): Promise<GoldDistribution | null> {
  const snap = await getDoc(
    doc(getDb(), "gold_balance_distribution", "latest")
  );
  if (!snap.exists()) return null;
  const raw = snap.data() as Partial<GoldDistribution>;
  return {
    totalUsers: raw.totalUsers ?? 0,
    usersWithGold: raw.usersWithGold ?? 0,
    usersWithoutGold: raw.usersWithoutGold ?? 0,
    totalGoldInSystem: raw.totalGoldInSystem ?? 0,
    uniqueBalanceCount: raw.uniqueBalanceCount ?? 0,
    distribution: Array.isArray(raw.distribution) ? raw.distribution : [],
    calculated_at: raw.calculated_at,
  };
}

export type DashboardSnapshot = {
  overall: OverallAnalytics | null;
  goldRate: GoldRate | null;
  goldRateHistory: RateSnapshot[];
  currentMonth: MonthlyAnalytics | null;
  previousMonth: MonthlyAnalytics | null;
  recentMonths: MonthlyAnalytics[];
  dailyUsers: DailyUserPoint[];
  dailyIncomes: DailyIncomePoint[];
  goldDistribution: GoldDistribution | null;
  investorCount: number;
  fetchedAt: Date;
};

export async function fetchDashboardSnapshot(
  currentMonthKey: string,
  previousMonthKey: string
): Promise<DashboardSnapshot> {
  const [
    overall,
    goldRate,
    goldRateHistory,
    currentMonth,
    previousMonth,
    recentMonths,
    dailyUsers,
    dailyIncomes,
    goldDistribution,
    investorCount,
  ] = await Promise.all([
    fetchOverall(),
    fetchLatestGoldRate(),
    fetchRecentGoldRates(30).catch(() => []),
    fetchMonth(currentMonthKey),
    fetchMonth(previousMonthKey),
    fetchRecentMonths(12),
    fetchDailyUsers().catch(() => []),
    fetchDailyIncomes().catch(() => []),
    fetchGoldDistribution().catch(() => null),
    fetchInvestmentsCount().catch(() => 0),
  ]);
  return {
    overall,
    goldRate,
    goldRateHistory,
    currentMonth,
    previousMonth,
    recentMonths,
    dailyUsers,
    dailyIncomes,
    goldDistribution,
    investorCount,
    fetchedAt: new Date(),
  };
}
