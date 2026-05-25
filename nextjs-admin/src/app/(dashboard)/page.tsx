"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  FileText,
  Gift,
  Loader2,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  fetchDashboardSnapshot,
  type DashboardSnapshot,
} from "@/lib/firestore/analytics";
import {
  currentMonthKey,
  formatCompactGram,
  formatCompactMNT,
  formatInt,
  previousMonthKey,
} from "@/lib/format";
import { Button } from "@/components/ui/button";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/StatCard";
import { GoldRateCard } from "@/components/dashboard/GoldRateCard";
import {
  MonthSummary,
  MonthSummarySkeleton,
} from "@/components/dashboard/MonthSummary";
import {
  MonthlyTable,
  MonthlyTableSkeleton,
} from "@/components/dashboard/MonthlyTable";
import { DailyUsersChart } from "@/components/dashboard/DailyUsersChart";
import { DailyRevenueChart } from "@/components/dashboard/DailyRevenueChart";
import { GoldBalanceDistribution } from "@/components/dashboard/GoldBalanceDistribution";

export default function DashboardPage() {
  const { adminData } = useAuth();
  const [data, setData] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { thisMonth, lastMonth } = useMemo(() => {
    const now = new Date();
    return { thisMonth: currentMonthKey(now), lastMonth: previousMonthKey(now) };
  }, []);

  const load = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const snap = await fetchDashboardSnapshot(thisMonth, lastMonth);
        setData(snap);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Мэдээлэл ачаалахад алдаа гарлаа.";
        setError(msg);
        if (silent) toast.error(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [thisMonth, lastMonth]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const overall = data?.overall;
  const lastFetched = data?.fetchedAt;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-foreground">
            Сайн байна уу, {adminData?.name ?? ""} 👋
          </h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Onegram-н хяналтын самбар
            {lastFetched && (
              <span className="ml-2">
                · сүүлд:{" "}
                {lastFetched.toLocaleTimeString("mn-MN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => load(true)}
          disabled={loading || refreshing}
          className="h-9 gap-2 text-[13px]"
        >
          {refreshing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Шинэчлэх
        </Button>
      </header>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-[#fcdce5] bg-[#fcdce5]/40 px-4 py-3 text-[12px] text-[#a8265a]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className="font-medium">Мэдээлэл татаж чадсангүй</div>
            <div className="mt-0.5 text-[11px] opacity-80">{error}</div>
          </div>
        </div>
      )}

      {/* KPI grid: 2 → 3 → 6 cols */}
      <section>
        <div className="mb-2 px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Нийт үзүүлэлт
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              <StatCard
                label="Нийт хэрэглэгч"
                icon={Users}
                value={formatInt(overall?.total_users)}
                meta={`Алттай: ${formatInt(overall?.users_with_gold)}`}
              />
              <StatCard
                label="Захиалга"
                icon={FileText}
                value={formatInt(overall?.successful_orders)}
                meta={`Нийт ${formatInt(overall?.total_orders)}`}
              />
              <StatCard
                label="Нийт орлого"
                icon={ShoppingCart}
                value={formatCompactMNT(overall?.total_revenue_all_time)}
                meta="Бүх цаг үед"
              />
              <StatCard
                label="Алт зарагдсан"
                icon={Gift}
                value={formatCompactGram(overall?.total_gold_sold_all_time)}
                meta={`Мөнгө: ${formatCompactGram(overall?.total_silver_sold_all_time)}`}
              />
              <StatCard
                label="Биетээр олгосон"
                icon={TrendingDown}
                value={formatCompactGram(overall?.total_gold_withdraws_all_time)}
                meta={`Мөнгө: ${formatCompactGram(overall?.total_silver_withdraws_all_time)}`}
              />
              <StatCard
                label="Хөрөнгө оруулалт"
                icon={Wallet}
                value={formatCompactGram(overall?.total_investments)}
                meta={`${formatInt(data?.investorCount)} оруулагч`}
              />
            </>
          )}
        </div>
      </section>

      {/* Gold rate + month summary */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_2fr]">
        {loading ? (
          <>
            <div className="h-[220px] animate-pulse rounded-xl border border-border-light bg-card" />
            <MonthSummarySkeleton />
          </>
        ) : (
          <>
            <GoldRateCard
              rate={data?.goldRate ?? null}
              history={data?.goldRateHistory ?? []}
            />
            <MonthSummary
              monthKey={thisMonth}
              current={data?.currentMonth ?? null}
              previous={data?.previousMonth ?? null}
            />
          </>
        )}
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <DailyUsersChart data={data?.dailyUsers ?? []} />
            <DailyRevenueChart data={data?.dailyIncomes ?? []} />
          </>
        )}
      </section>

      {/* Monthly table */}
      <section>
        <div className="mb-2 px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Сар бүрийн мэдээлэл (сүүлийн 12 сар)
        </div>
        {loading ? (
          <MonthlyTableSkeleton />
        ) : (
          <MonthlyTable rows={data?.recentMonths ?? []} />
        )}
      </section>

      {/* Gold balance distribution */}
      <section>
        {loading ? (
          <div className="h-[260px] animate-pulse rounded-xl border border-border-light bg-card" />
        ) : (
          <GoldBalanceDistribution data={data?.goldDistribution ?? null} />
        )}
      </section>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-border-light bg-card p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          <div className="h-2 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-7 w-36 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="mt-4 h-[240px] animate-pulse rounded-lg bg-muted/60" />
    </div>
  );
}
