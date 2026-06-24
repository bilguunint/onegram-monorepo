"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Coins,
  Loader2,
  Play,
  RefreshCw,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/StatCard";
import { SectionCard, MoMBadge, LangToggle } from "@/components/report/ReportParts";
import {
  MonthlyRevenueBarChart,
  DailyTrendChart,
  GoldPriceArea,
  MonthlyBreakdownTable,
} from "@/components/report/charts";
import { Presentation } from "@/components/report/Presentation";
import { buildReportSlides } from "@/components/report/slides";
import { fetchReportData, type ReportData } from "@/lib/report/data";
import {
  fCompactGram,
  fCompactMNT,
  fInt,
  strings,
  type Lang,
} from "@/lib/report/i18n";
import { currentMonthKey, percentChange } from "@/lib/format";

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border-light bg-background/40 p-3">
      <div className="truncate text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-[16px] font-semibold tabular-nums text-foreground">
        {value}
      </div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export default function ReportPage() {
  const [lang, setLang] = useState<Lang>("mn");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [presenting, setPresenting] = useState(false);

  const t = strings(lang);

  useEffect(() => {
    const saved = localStorage.getItem("report_lang");
    if (saved === "en" || saved === "mn") setLang(saved);
  }, []);

  const changeLang = (l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem("report_lang", l);
    } catch {
      /* ignore */
    }
  };

  // Data is language-independent — fetch once on mount + explicit Refresh, not
  // on every MN/EN toggle (formatting re-renders from `t` regardless).
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchReportData();
      setData(d);
    } catch (err) {
      console.error("Report load error:", err);
      toast.error("Тайлан ачааллахад алдаа гарлаа. / Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const o = data?.snapshot.overall ?? null;
  const cur = data?.snapshot.currentMonth ?? null;
  const prev = data?.snapshot.previousMonth ?? null;
  const wt = data?.withdrawOverall?.by_withdraw_type;

  const activation =
    o && o.total_users > 0 ? (o.users_with_gold / o.total_users) * 100 : null;
  const successRate =
    o && o.total_orders > 0 ? (o.successful_orders / o.total_orders) * 100 : null;

  const cmk = currentMonthKey();
  const newUsersThisMonth =
    data?.snapshot.dailyUsers
      .filter((d) => d.date.startsWith(cmk))
      .reduce((s, d) => s + d.new_users, 0) ?? 0;

  const updatedAt = data
    ? data.snapshot.fetchedAt.toLocaleString(lang === "en" ? "en-US" : "mn-MN")
    : "";

  const slides = useMemo(
    () => (data ? buildReportSlides(data, lang) : []),
    [data, lang]
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[18px] font-semibold text-foreground">{t.title}</h1>
          <p className="text-[12px] text-muted-foreground">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <LangToggle value={lang} onChange={changeLang} />
          <Button size="sm" onClick={() => setPresenting(true)} disabled={!data}>
            <Play className="h-3.5 w-3.5" />
            {t.present}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            {t.refresh}
          </Button>
        </div>
      </header>

      {!data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 py-8 text-[12px] text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
            {t.loading}
          </div>
        </div>
      ) : (
        <>
          {/* Hero KPIs */}
          <section>
            <div className="mb-2 px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t.secOverview}
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              <StatCard
                label={t.kRevenue}
                value={fCompactMNT(o?.total_revenue_all_time, lang)}
                icon={Wallet}
                meta={t.kRevenueMeta}
              />
              <StatCard
                label={t.kUsers}
                value={fInt(o?.total_users, lang)}
                icon={Users}
                meta={
                  activation == null
                    ? undefined
                    : `${activation.toFixed(1)}% ${t.kActivation}`
                }
              />
              <StatCard
                label={t.kGoldSold}
                value={fCompactGram(o?.total_gold_sold_all_time, lang)}
                icon={Coins}
              />
              <StatCard
                label={t.kBuyback}
                value={fCompactMNT(wt?.sold_to_us?.total_price_mnt, lang)}
                icon={ArrowLeftRight}
              />
              <StatCard
                label={t.kOrders}
                value={fInt(o?.successful_orders, lang)}
                icon={ShoppingBag}
                meta={
                  successRate == null
                    ? undefined
                    : `${successRate.toFixed(1)}% ${t.kOfTotal}`
                }
              />
            </div>
          </section>

          {/* This month + gold price */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SectionCard title={t.secThisMonth}>
              <div className="flex items-center gap-3">
                <div className="text-[24px] font-semibold tabular-nums leading-none text-foreground">
                  {fCompactMNT(cur?.total_revenue, lang)}
                </div>
                <MoMBadge
                  value={percentChange(cur?.total_revenue, prev?.total_revenue)}
                  lang={lang}
                />
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {t.revenueThisMonth} · {t.vsLastMonth}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <Metric label={t.mOrders} value={fInt(cur?.successful_orders, lang)} />
                <Metric label={t.mGoldSold} value={fCompactGram(cur?.total_gold_sold, lang)} />
                <Metric label={t.mNewUsers} value={fInt(newUsersThisMonth, lang)} />
              </div>
            </SectionCard>

            <SectionCard title={t.secGoldPrice}>
              <GoldPriceArea
                rate={data.snapshot.goldRate}
                history={data.snapshot.goldRateHistory}
                lang={lang}
              />
            </SectionCard>
          </div>

          {/* Monthly revenue growth */}
          <SectionCard title={t.secMonthlyRevenue}>
            <MonthlyRevenueBarChart months={data.snapshot.recentMonths} lang={lang} />
          </SectionCard>

          {/* Daily revenue + user growth */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SectionCard title={t.secDailyRevenue}>
              <DailyTrendChart
                points={data.snapshot.dailyIncomes.map((d) => ({
                  date: d.date,
                  value: d.total_amount,
                }))}
                lang={lang}
                kind="mnt"
                seriesLabel={t.sRevenue}
              />
            </SectionCard>
            <SectionCard title={t.secUserGrowth}>
              <DailyTrendChart
                points={data.snapshot.dailyUsers.map((d) => ({
                  date: d.date,
                  value: d.new_users,
                }))}
                lang={lang}
                kind="count"
                seriesLabel={t.sNewUsers}
              />
            </SectionCard>
          </div>

          {/* Monthly breakdown */}
          <SectionCard title={t.secMonthly}>
            <MonthlyBreakdownTable months={data.snapshot.recentMonths} lang={lang} />
          </SectionCard>

          <p className="px-1 pb-2 text-[11px] text-muted-foreground">
            {t.autoComputed} · {t.updated}: {updatedAt}
            {t.fxNote ? ` · ${t.fxNote}` : ""}
          </p>
        </>
      )}

      <Presentation
        slides={slides}
        open={presenting}
        onClose={() => setPresenting(false)}
        lang={lang}
        onLangChange={changeLang}
      />
    </div>
  );
}
