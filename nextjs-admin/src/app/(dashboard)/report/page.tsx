"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeftRight,
  Coins,
  Landmark,
  Loader2,
  Play,
  RefreshCw,
  ShoppingBag,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatCardSkeleton } from "@/components/dashboard/StatCard";
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
  fMNT,
  strings,
  type Lang,
} from "@/lib/report/i18n";
import { EXPLAIN } from "@/lib/report/explain";
import { currentMonthKey, percentChange } from "@/lib/format";

// ---------------------------------------------------------------------------
// Жижиг бүрэлдэхүүн: тоо + доор нь англи тайлбар
// ---------------------------------------------------------------------------

/** Англи тайлбар (хэл сонголтоос үл хамааран үргэлж англиар). */
function Hint({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p lang="en" className={cn("text-[11px] leading-snug text-muted-foreground/90", className)}>
      {children}
    </p>
  );
}

/** Гол үзүүлэлтийн карт: StatCard + англи тайлбар. */
function Kpi({
  label,
  value,
  icon: Icon,
  meta,
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  meta?: string;
  hint: string;
}) {
  const valueSize =
    value.length > 14 ? "text-[15px]" : value.length > 11 ? "text-[17px]" : "text-[20px]";
  return (
    <div className="flex flex-col rounded-xl border border-border-light bg-card p-4 transition-colors hover:border-primary-300">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[12px] text-muted-foreground">{label}</div>
          <div
            className={cn(
              "mt-1.5 whitespace-nowrap font-semibold leading-none tabular-nums text-foreground",
              valueSize
            )}
          >
            {value}
          </div>
          {meta && <div className="mt-2 text-[11px] text-muted-foreground">{meta}</div>}
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <Hint className="mt-3 border-t border-border-light/70 pt-2">{hint}</Hint>
    </div>
  );
}

/** Хэсгийн доторх жижиг үзүүлэлт + англи тайлбар. */
function Metric({
  label,
  value,
  sub,
  hint,
}: {
  label: string;
  value: string;
  sub?: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border-light bg-background/40 p-3">
      <div className="truncate text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-[16px] font-semibold tabular-nums text-foreground">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
      {hint && <Hint className="mt-1.5">{hint}</Hint>}
    </div>
  );
}

const TH = "py-2 px-3 text-right text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground";
const TD = "py-2 px-3 text-right tabular-nums";

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
  const gr = data?.goldReserve ?? null;
  const gd = data?.snapshot.goldDistribution ?? null;
  const rate = data?.snapshot.goldRate?.rate ?? null;

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

  // Грамм: бүхэл тоогоор, нэгжтэй (19,056 гр / 19,056 g)
  const fG = (n: number | null | undefined) =>
    n == null ? "—" : `${fInt(Math.round(n), lang)} ${lang === "en" ? "g" : "гр"}`;
  const fPctPlain = (n: number | null | undefined, digits = 1) =>
    n == null || !Number.isFinite(n) ? "—" : `${n.toFixed(digits)}%`;
  const share = (a: number, b: number) => (b ? (100 * a) / b : null);

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
          {/* ---- Гол үзүүлэлт ---- */}
          <section>
            <div className="mb-2 px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t.secOverview}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <Kpi
                label={t.kRevenue}
                value={fCompactMNT(o?.total_revenue_all_time, lang)}
                icon={Wallet}
                meta={t.kRevenueMeta}
                hint={EXPLAIN.kRevenue}
              />
              <Kpi
                label={t.kUsers}
                value={fInt(o?.total_users, lang)}
                icon={Users}
                meta={activation == null ? undefined : `${activation.toFixed(1)}% ${t.kActivation}`}
                hint={EXPLAIN.kUsers}
              />
              <Kpi
                label={t.kGoldSold}
                value={fCompactGram(o?.total_gold_sold_all_time, lang)}
                icon={Coins}
                hint={EXPLAIN.kGoldSold}
              />
              <Kpi
                label={t.kBuyback}
                value={fCompactMNT(wt?.sold_to_us?.total_price_mnt, lang)}
                icon={ArrowLeftRight}
                hint={EXPLAIN.kBuyback}
              />
              <Kpi
                label={t.kOrders}
                value={fInt(o?.successful_orders, lang)}
                icon={ShoppingBag}
                meta={successRate == null ? undefined : `${successRate.toFixed(1)}% ${t.kOfTotal}`}
                hint={EXPLAIN.kOrders}
              />
            </div>
          </section>

          {/* ---- Алтны нөөц ба өр ---- */}
          <SectionCard title={t.secReserve} subtitle={EXPLAIN.secReserve}>
            {gr ? (
              <>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="text-[11px] text-muted-foreground">{t.kReserve}</div>
                    <div className="mt-1 text-[32px] font-semibold leading-none tabular-nums text-primary-600 dark:text-primary-400">
                      {fG(gr.reserve.total)}
                    </div>
                    <div className="mt-1.5 text-[13px] font-medium tabular-nums text-foreground">
                      ≈ {fCompactMNT(gr.investor.reserveValueMnt, lang)}
                      <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                        {t.kReserveValue} · {fMNT(gr.goldRate.rate, lang)}/{t.perGramUnit}
                      </span>
                    </div>
                    <Hint className="mt-2 max-w-[60ch]">{EXPLAIN.kReserve}</Hint>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12px] tabular-nums">
                    <span className="text-muted-foreground">{t.kFundedUsers}</span>
                    <span className="text-right font-medium">
                      {fInt(gr.reserve.usersWithGold, lang)} {t.uPeople}
                    </span>
                    <span className="text-muted-foreground">{t.kGoldSold}</span>
                    <span className="text-right font-medium">{fG(gr.totals.bought)}</span>
                    <span className="text-muted-foreground">{t.goldWithdrawn}</span>
                    <span className="text-right font-medium">{fG(gr.totals.withdrawn)}</span>
                    <span className="text-muted-foreground">{t.kInvestGrams}</span>
                    <span className="text-right font-medium">{fG(gr.reserve.investments)}</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                  <Metric
                    label={t.kPhysicalOut}
                    value={fG(gr.totals.physicalOut)}
                    hint={EXPLAIN.kPhysicalOut}
                  />
                  <Metric
                    label={t.kSoldBack}
                    value={fG(gr.totals.sold)}
                    sub={fCompactMNT(gr.investor.totalBuybackMnt, lang)}
                    hint={EXPLAIN.kSoldBack}
                  />
                  <Metric
                    label={t.kRedemptionRate}
                    value={fPctPlain(gr.investor.redemptionPct)}
                    hint={EXPLAIN.kRedemptionRate}
                  />
                  <Metric
                    label={t.kCoverMonths}
                    value={
                      gr.investor.coverMonths != null
                        ? `${gr.investor.coverMonths.toFixed(1)} ${t.uMonths}`
                        : "—"
                    }
                    sub={`${fG(gr.investor.last6AvgWithdrawn)} / ${lang === "en" ? "month" : "сар"}`}
                    hint={EXPLAIN.kCoverMonths}
                  />
                  <Metric
                    label={t.kTop100}
                    value={fPctPlain(gr.top100Share, 0)}
                    hint={EXPLAIN.kTop100}
                  />
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-border-light px-4 py-6 text-center text-[12px] text-muted-foreground">
                {t.reserveUnavailable}
              </div>
            )}
          </SectionCard>

          {/* ---- Хэрэглэгчийн хадгалалт ---- */}
          {gr && (
            <SectionCard title={t.secHolding} subtitle={EXPLAIN.secHolding}>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                <Metric
                  label={t.kNeverRedeemed}
                  value={fPctPlain(share(gr.buyers.neverWithdrew, gr.buyers.total), 0)}
                  sub={`${fInt(gr.buyers.neverWithdrew, lang)} / ${fInt(gr.buyers.total, lang)} ${t.uBuyers}`}
                  hint={EXPLAIN.kNeverRedeemed}
                />
                <Metric
                  label={t.kRepeatBuyers}
                  value={fPctPlain(gr.investor.repeatBuyerPct, 0)}
                  sub={t.ofBuyers}
                  hint={EXPLAIN.kRepeatBuyers}
                />
                <Metric
                  label={t.kAvgHold}
                  value={`${fInt(gr.investor.avgHoldDays, lang)} ${t.uDays}`}
                  hint={EXPLAIN.kAvgHold}
                />
                <Metric
                  label={t.kAvgAge}
                  value={`${fInt(gr.investor.avgAgeDays, lang)} ${t.uDays}`}
                  hint={EXPLAIN.kAvgAge}
                />
                <Metric
                  label={t.kOrdersPerBuyer}
                  value={gr.investor.ordersPerBuyer.toFixed(1)}
                  hint={EXPLAIN.kOrdersPerBuyer}
                />
                <Metric
                  label={t.kAvgOrder}
                  value={`${gr.investor.avgOrderGrams.toFixed(2)} ${t.perGramUnit}`}
                  hint={EXPLAIN.kAvgOrder}
                />
              </div>
            </SectionCard>
          )}

          {/* ---- Энэ сар + ханш ---- */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SectionCard title={t.secThisMonth} subtitle={EXPLAIN.secThisMonth}>
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
                <Metric label={t.mOrders} value={fInt(cur?.successful_orders, lang)} hint={EXPLAIN.mOrders} />
                <Metric label={t.mGoldSold} value={fCompactGram(cur?.total_gold_sold, lang)} hint={EXPLAIN.mGoldSold} />
                <Metric label={t.mNewUsers} value={fInt(newUsersThisMonth, lang)} hint={EXPLAIN.mNewUsers} />
              </div>
            </SectionCard>

            <SectionCard title={t.secGoldPrice} subtitle={EXPLAIN.secGoldPrice}>
              <GoldPriceArea
                rate={data.snapshot.goldRate}
                history={data.snapshot.goldRateHistory}
                lang={lang}
              />
            </SectionCard>
          </div>

          {/* ---- Сарын борлуулалт ---- */}
          <SectionCard title={t.secMonthlyRevenue} subtitle={EXPLAIN.secMonthlyRevenue}>
            <MonthlyRevenueBarChart months={data.snapshot.recentMonths} lang={lang} />
          </SectionCard>

          {/* ---- Өдрийн борлуулалт + хэрэглэгчийн өсөлт ---- */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SectionCard title={t.secDailyRevenue} subtitle={EXPLAIN.secDailyRevenue}>
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
            <SectionCard title={t.secUserGrowth} subtitle={EXPLAIN.secUserGrowth}>
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

          {/* ---- Жилийн үзүүлэлт ---- */}
          {gr && gr.yearly.length > 0 && (
            <SectionCard title={t.secYearly} subtitle={EXPLAIN.secYearly}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-[12px]">
                  <thead>
                    <tr className="border-b border-border-light">
                      <th className={cn(TH, "text-left")}>{t.thYear}</th>
                      <th className={TH}>{t.thRevenue}</th>
                      <th className={TH}>{t.kGoldSold}</th>
                      <th className={TH}>{t.thOrders}</th>
                      <th className={TH}>{t.thBuyers}</th>
                      <th className={TH}>{t.thNewBuyers}</th>
                      <th className={TH}>{t.thRetention}</th>
                      <th className={TH}>{t.thRedeemed}</th>
                      <th className={TH}>{t.thNetReserve}</th>
                      <th className={TH}>{t.thYearEnd}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gr.yearly.map((y) => (
                      <tr key={y.year} className="border-b border-border-light/60 last:border-0">
                        <td className={cn(TD, "text-left font-medium text-foreground")}>{y.year}</td>
                        <td className={cn(TD, "font-medium text-foreground")}>{fCompactMNT(y.revenue, lang)}</td>
                        <td className={cn(TD, "text-foreground")}>{fG(y.bought)}</td>
                        <td className={cn(TD, "text-muted-foreground")}>{fInt(y.orders, lang)}</td>
                        <td className={cn(TD, "text-muted-foreground")}>{fInt(y.buyers, lang)}</td>
                        <td className={cn(TD, "text-muted-foreground")}>{fInt(y.newBuyers, lang)}</td>
                        <td className={cn(TD, "text-muted-foreground")}>
                          {y.retentionPct != null ? `${y.retentionPct.toFixed(0)}%` : "—"}
                        </td>
                        <td className={cn(TD, "text-muted-foreground")}>{fG(y.wd)}</td>
                        <td
                          className={cn(
                            TD,
                            "font-medium",
                            y.net < 0 ? "text-rose-600" : "text-emerald-700 dark:text-emerald-400"
                          )}
                        >
                          {y.net > 0 ? "+" : ""}
                          {fG(y.net)}
                        </td>
                        <td className={cn(TD, "text-foreground")}>{fG(y.cum)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* ---- Хадгалалт (custody) + Хөрөнгө оруулалт ---- */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SectionCard title={t.secCustody} subtitle={EXPLAIN.secCustody}>
              <div className="grid grid-cols-2 gap-3">
                <Metric
                  label={t.totalGoldInSystem}
                  value={fG(gd?.totalGoldInSystem)}
                  hint={EXPLAIN.totalGoldInSystem}
                />
                <Metric
                  label={t.custodyValue}
                  value={
                    gd && rate ? fCompactMNT(gd.totalGoldInSystem * rate, lang) : "—"
                  }
                  hint={EXPLAIN.custodyValue}
                />
                <Metric
                  label={t.withGold}
                  value={fInt(gd?.usersWithGold, lang)}
                  hint={EXPLAIN.withGold}
                />
                <Metric
                  label={t.penetration}
                  value={
                    gd && gd.totalUsers
                      ? fPctPlain((100 * gd.usersWithGold) / gd.totalUsers)
                      : "—"
                  }
                  hint={EXPLAIN.penetration}
                />
              </div>
              {gr && gr.distribution.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  {(() => {
                    const max = Math.max(1, ...gr.distribution.map((b) => b.count));
                    return gr.distribution.map((b) => (
                      <div
                        key={b.label}
                        className="grid grid-cols-[120px_1fr_80px] items-center gap-3 text-[11px]"
                      >
                        <span className="text-muted-foreground">{b.label}</span>
                        <div className="h-2.5 overflow-hidden rounded-sm bg-muted">
                          <div
                            className="h-full rounded-r-sm bg-primary-500"
                            style={{ width: `${(100 * b.count) / max}%` }}
                          />
                        </div>
                        <span className="text-right tabular-nums text-muted-foreground">
                          {fInt(b.count, lang)} {t.uPeople}
                        </span>
                      </div>
                    ));
                  })()}
                  <Hint className="pt-1">
                    Number of customers in each balance band (grams of gold held).
                  </Hint>
                </div>
              )}
            </SectionCard>

            <SectionCard title={t.secInvestments} subtitle={EXPLAIN.secInvestments}>
              <div className="grid grid-cols-3 gap-3">
                <Metric
                  label={t.kInvestCount}
                  value={fInt(data.investments.count, lang)}
                  hint={EXPLAIN.kInvestCount}
                />
                <Metric
                  label={t.kInvestGrams}
                  value={fG(data.investments.totalGrams)}
                  sub={rate ? fCompactMNT(data.investments.totalGrams * rate, lang) : undefined}
                  hint={EXPLAIN.kInvestGrams}
                />
                <Metric
                  label={t.kInvestActive}
                  value={fInt(data.investments.active, lang)}
                  sub={`${t.stCompleted}: ${fInt(data.investments.closed, lang)}`}
                  hint={EXPLAIN.kInvestActive}
                />
              </div>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
                <Landmark className="h-3.5 w-3.5" />
                {t.secRedemption}
              </div>
              <Hint className="mt-1">{EXPLAIN.secRedemption}</Hint>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <Metric
                  label={t.soldToUs}
                  value={fInt(wt?.sold_to_us?.count, lang)}
                  sub={fG(wt?.sold_to_us?.total_grams_gold)}
                  hint={EXPLAIN.soldToUs}
                />
                <Metric
                  label={t.takenPhysically}
                  value={fInt(wt?.taken_physically?.count, lang)}
                  sub={fG(wt?.taken_physically?.total_grams_gold)}
                  hint={EXPLAIN.takenPhysically}
                />
                <Metric
                  label={t.avgBuybackRate}
                  value={fMNT(wt?.sold_to_us?.avg_gold_rate, lang)}
                  sub={`/ ${t.perGramUnit}`}
                  hint={EXPLAIN.avgBuybackRate}
                />
              </div>
            </SectionCard>
          </div>

          {/* ---- Хуваан төлөлтийн багц ---- */}
          <SectionCard title={t.secPortfolio} subtitle={EXPLAIN.secPortfolio}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              <Metric label={t.gmv} value={fCompactMNT(data.portfolio.gmv, lang)} hint={EXPLAIN.gmv} />
              <Metric
                label={t.collected}
                value={fCompactMNT(data.portfolio.collected, lang)}
                sub={
                  data.portfolio.collectionRate == null
                    ? undefined
                    : `${data.portfolio.collectionRate.toFixed(1)}% ${t.collectionRate}`
                }
                hint={EXPLAIN.collected}
              />
              <Metric
                label={t.activePlans}
                value={fInt(data.portfolio.active, lang)}
                sub={`${t.stCompleted} ${fInt(data.portfolio.completed, lang)} · ${t.stDelivered} ${fInt(data.portfolio.delivered, lang)}`}
                hint={EXPLAIN.activePlans}
              />
              <Metric
                label={t.overduePlans}
                value={fInt(data.portfolio.overdue, lang)}
                sub={`${t.stCancelled} ${fInt(data.portfolio.cancelled, lang)}`}
                hint={EXPLAIN.overduePlans}
              />
              <Metric
                label={t.onTimeRate}
                value={fPctPlain(data.portfolio.onTimeRate)}
                hint={EXPLAIN.onTimeRate}
              />
            </div>
          </SectionCard>

          {/* ---- Сарын задаргаа ---- */}
          <SectionCard title={t.secMonthly} subtitle={EXPLAIN.secMonthly}>
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
