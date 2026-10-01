"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarDays,
  Coins,
  Loader2,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/StatCard";
import { ChartEmpty, MoMBadge, SectionCard } from "@/components/report/ReportParts";
import { fetchProfitReport, type ProfitMonth, type ProfitReport } from "@/lib/report/profit";
import {
  dateLabel,
  formatCompactMNT,
  formatGram,
  formatInt,
  formatMNT,
  monthLabel,
  percentChange,
  shortMonthLabel,
} from "@/lib/format";
import { cn } from "@/lib/utils";

const TOOLTIP_STYLE = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border-light)",
  borderRadius: 8,
  fontSize: 11,
  padding: "6px 8px",
} as const;
const AXIS_TICK = { fontSize: 10, fill: "var(--color-muted-foreground)" } as const;
const TH = "py-2 px-3 text-right text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground";
const TD = "py-2 px-3 text-right tabular-nums";

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border-light bg-background/40 p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-[18px] font-semibold tabular-nums text-foreground">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

/** Сарын тэнхлэгийн шошго: 1-р сар дээр оныг хамт харуулна. */
function axisMonth(key: string): string {
  return key.endsWith("-01") ? `${key.slice(0, 4)} ${shortMonthLabel(key)}` : shortMonthLabel(key);
}

function MonthlyProfitChart({ rows, avg }: { rows: ProfitMonth[]; avg: number }) {
  const data = rows.map((m) => ({ ...m, avg }));
  return (
    <div className="h-[300px] w-full">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--color-border-light)" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              minTickGap={8}
              tickFormatter={(v) => axisMonth(String(v))}
              tick={AXIS_TICK}
            />
            <YAxis
              width={64}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompactMNT(Number(v))}
              tick={AXIS_TICK}
            />
            <Tooltip
              cursor={{ fill: "var(--color-primary-300)", opacity: 0.12 }}
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: "var(--color-muted-foreground)" }}
              formatter={(v, name) => [
                formatMNT(Number(v)),
                name === "avg" ? "Сарын дундаж" : "Ашиг",
              ]}
              labelFormatter={(l) => monthLabel(String(l))}
            />
            <Bar
              dataKey="profit"
              fill="var(--color-primary-500)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="avg"
              stroke="#d03b3b"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ChartEmpty label="Өгөгдөл алга" height={300} />
      )}
    </div>
  );
}

function DailyProfitChart({ rows }: { rows: ProfitReport["last30Days"] }) {
  return (
    <div className="h-[220px] w-full">
      {rows.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--color-border-light)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              minTickGap={16}
              tickFormatter={(v) => String(v).slice(5).replace("-", ".")}
              tick={AXIS_TICK}
            />
            <YAxis
              width={64}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompactMNT(Number(v))}
              tick={AXIS_TICK}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: "var(--color-muted-foreground)" }}
              formatter={(v) => [formatMNT(Number(v)), "Ашиг"]}
              labelFormatter={(l) => dateLabel(String(l))}
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="var(--color-primary-500)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <ChartEmpty label="Сүүлийн 30 хоногт борлуулалт алга" height={220} />
      )}
    </div>
  );
}

export default function ProfitReportPage() {
  const [data, setData] = useState<ProfitReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [cached, setCached] = useState(false);
  const [showAllMonths, setShowAllMonths] = useState(false);

  // Эхний ачаалалт: loading анхнаасаа true тул effect дотор setState дуудахгүй.
  useEffect(() => {
    let active = true;
    fetchProfitReport(false)
      .then((res) => {
        if (!active) return;
        setData(res.data);
        setCached(res.cached);
      })
      .catch((err: unknown) => {
        if (!active) return;
        console.error("Profit report load error:", err);
        toast.error(err instanceof Error ? err.message : "Тайлан ачааллахад алдаа гарлаа.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const load = useCallback(async (refresh: boolean) => {
    setLoading(true);
    try {
      const res = await fetchProfitReport(refresh);
      setData(res.data);
      setCached(res.cached);
    } catch (err) {
      console.error("Profit report load error:", err);
      toast.error(err instanceof Error ? err.message : "Тайлан ачааллахад алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }, []);

  const monthsDesc = useMemo(() => (data ? [...data.months].reverse() : []), [data]);
  const visibleMonths = showAllMonths ? monthsDesc : monthsDesc.slice(0, 12);
  const chartMonths = useMemo(() => (data ? data.months.slice(-24) : []), [data]);

  const t = data?.totals ?? null;
  const cur = data?.currentMonth ?? null;
  const prev = data?.previousMonth ?? null;
  const profitShare = t && t.revenue > 0 ? (100 * t.profit) / t.revenue : null;
  const updatedAt = data ? new Date(data.computedAt).toLocaleString("mn-MN") : "";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[18px] font-semibold text-foreground">Ашгийн тайлан</h1>
          <p className="text-[12px] text-muted-foreground">
            Алтны захиалга бүрээс авдаг Монголбанкны ханшийн 5%-ийн үйлчилгээний шимтгэл.
            Хуваан төлөлт, бэлэг, дэмжлэг, Шүтээн хуур энд ороогүй.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load(true)} disabled={loading}>
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Дахин тооцох
        </Button>
      </header>

      {!data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 py-8 text-[12px] text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
            Тайлан тооцоолж байна...
          </div>
        </div>
      ) : (
        <>
          {/* ---- Гол үзүүлэлт ---- */}
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Бүх цаг үеийн ашиг"
              value={formatCompactMNT(t?.profit)}
              icon={Wallet}
              meta={profitShare == null ? undefined : `Нийт борлуулалтын ${profitShare.toFixed(2)}%`}
            />
            <StatCard
              label="Сарын дундаж ашиг"
              value={formatCompactMNT(data.avgMonthlyProfit)}
              icon={CalendarDays}
              meta={`Сүүлийн 12 сар: ${formatCompactMNT(data.avgMonthlyProfitLast12)}`}
            />
            <StatCard
              label="Энэ сарын ашиг"
              value={formatCompactMNT(cur?.profit ?? 0)}
              icon={TrendingUp}
              meta={
                <span className="inline-flex items-center gap-1.5">
                  <MoMBadge value={percentChange(cur?.profit ?? 0, prev?.profit)} lang="mn" />
                  өмнөх сараас
                </span>
              }
            />
            <StatCard
              label="Нэг захиалгын дундаж ашиг"
              value={formatMNT(data.avgProfitPerOrder)}
              icon={ShoppingBag}
              meta={`${formatInt(t?.orders)} баталгаажсан захиалга`}
            />
            <StatCard
              label="Нэг граммын дундаж ашиг"
              value={formatMNT(data.avgProfitPerGram)}
              icon={Coins}
              meta={`${formatGram(t?.grams)} зарсан`}
            />
          </section>

          {/* ---- Сар бүрийн ашиг ---- */}
          <SectionCard
            title="Сар бүрийн ашиг"
            subtitle={`Сүүлийн ${chartMonths.length} сар. Улаан тасархай шугам: борлуулалттай саруудын дундаж (${formatCompactMNT(data.avgMonthlyProfit)}).`}
          >
            <MonthlyProfitChart rows={chartMonths} avg={data.avgMonthlyProfit} />
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Tile
                label="Хамгийн сайн сар"
                value={data.bestMonth ? formatCompactMNT(data.bestMonth.profit) : "—"}
                sub={data.bestMonth ? monthLabel(data.bestMonth.month) : undefined}
              />
              <Tile
                label="Сүүлийн 6 сарын дундаж"
                value={formatCompactMNT(data.avgMonthlyProfitLast6)}
                sub="Борлуулалтгүй сарыг 0-ээр тооцсон"
              />
              <Tile
                label="Өмнөх сарын ашиг"
                value={formatCompactMNT(prev?.profit ?? 0)}
                sub={prev ? `${formatInt(prev.orders)} захиалга` : undefined}
              />
              <Tile
                label="Борлуулалттай сар"
                value={formatInt(data.months.length)}
                sub={
                  t?.firstOrderAt
                    ? `${dateLabel(t.firstOrderAt.slice(0, 10))}-оос хойш`
                    : undefined
                }
              />
            </div>
          </SectionCard>

          {/* ---- Сүүлийн 30 хоног + задаргаа ---- */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SectionCard title="Сүүлийн 30 хоногийн өдрийн ашиг">
              <DailyProfitChart rows={data.last30Days} />
            </SectionCard>
            <SectionCard
              title="Үнийн бүтэц (бүх цаг үе)"
              subtitle="Нийт дүн = суурь (грамм × ханш) + 5% шимтгэл + (суурь + шимтгэл) × 20% татвар"
            >
              <div className="grid grid-cols-2 gap-3">
                <Tile label="Хэрэглэгчийн төлсөн нийт" value={formatCompactMNT(t?.revenue)} />
                <Tile label="Суурь үнэ (ханшаар)" value={formatCompactMNT(t?.base)} />
                <Tile label="Ашиг (5% шимтгэл)" value={formatCompactMNT(t?.profit)} />
                <Tile label="Татварын мөр (20%)" value={formatCompactMNT(t?.tax)} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Tile
                  label="Алт"
                  value={formatCompactMNT(data.byMetal.gold.profit)}
                  sub={`${formatInt(data.byMetal.gold.orders)} захиалга · ${formatGram(data.byMetal.gold.grams)}`}
                />
                <Tile
                  label="Мөнгө"
                  value={formatCompactMNT(data.byMetal.silver.profit)}
                  sub={`${formatInt(data.byMetal.silver.orders)} захиалга · ${formatGram(data.byMetal.silver.grams)}`}
                />
              </div>
            </SectionCard>
          </div>

          {/* ---- Жилээр ---- */}
          <SectionCard title="Жилийн ашиг">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-[12px]">
                <thead>
                  <tr className="border-b border-border-light">
                    <th className={cn(TH, "text-left")}>Он</th>
                    <th className={TH}>Захиалга</th>
                    <th className={TH}>Грамм</th>
                    <th className={TH}>Нийт борлуулалт</th>
                    <th className={TH}>Ашиг</th>
                    <th className={TH}>Сарын дундаж</th>
                  </tr>
                </thead>
                <tbody>
                  {data.years.map((y) => {
                    const monthsInYear = data.months.filter((m) => m.month.startsWith(`${y.year}-`)).length;
                    return (
                      <tr key={y.year} className="border-b border-border-light/60 last:border-0">
                        <td className={cn(TD, "text-left font-medium text-foreground")}>{y.year}</td>
                        <td className={cn(TD, "text-muted-foreground")}>{formatInt(y.orders)}</td>
                        <td className={cn(TD, "text-muted-foreground")}>{formatGram(y.grams)}</td>
                        <td className={cn(TD, "text-foreground")}>{formatMNT(y.revenue)}</td>
                        <td className={cn(TD, "font-medium text-emerald-700 dark:text-emerald-400")}>
                          {formatMNT(y.profit)}
                        </td>
                        <td className={cn(TD, "text-muted-foreground")}>
                          {monthsInYear > 0 ? formatMNT(y.profit / monthsInYear) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* ---- Сарын задаргаа ---- */}
          <SectionCard
            title="Сарын задаргаа"
            action={
              monthsDesc.length > 12 ? (
                <Button variant="outline" size="sm" onClick={() => setShowAllMonths((v) => !v)}>
                  {showAllMonths ? "Сүүлийн 12 сар" : `Бүх ${monthsDesc.length} сар`}
                </Button>
              ) : undefined
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-[12px]">
                <thead>
                  <tr className="border-b border-border-light">
                    <th className={cn(TH, "text-left")}>Сар</th>
                    <th className={TH}>Захиалга</th>
                    <th className={TH}>Грамм</th>
                    <th className={TH}>Нийт борлуулалт</th>
                    <th className={TH}>Суурь үнэ</th>
                    <th className={TH}>Ашиг</th>
                    <th className={TH}>Дунджаас</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleMonths.map((m) => {
                    const diff =
                      data.avgMonthlyProfit > 0
                        ? (100 * (m.profit - data.avgMonthlyProfit)) / data.avgMonthlyProfit
                        : null;
                    return (
                      <tr key={m.month} className="border-b border-border-light/60 last:border-0">
                        <td className={cn(TD, "text-left font-medium text-foreground")}>
                          {monthLabel(m.month)}
                        </td>
                        <td className={cn(TD, "text-muted-foreground")}>{formatInt(m.orders)}</td>
                        <td className={cn(TD, "text-muted-foreground")}>{formatGram(m.grams)}</td>
                        <td className={cn(TD, "text-foreground")}>{formatMNT(m.revenue)}</td>
                        <td className={cn(TD, "text-muted-foreground")}>{formatMNT(m.base)}</td>
                        <td className={cn(TD, "font-medium text-emerald-700 dark:text-emerald-400")}>
                          {formatMNT(m.profit)}
                        </td>
                        <td
                          className={cn(
                            TD,
                            diff == null ? "text-muted-foreground" : diff < 0 ? "text-rose-600" : "text-emerald-700 dark:text-emerald-400"
                          )}
                        >
                          {diff == null ? "—" : `${diff > 0 ? "+" : ""}${diff.toFixed(0)}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <p className="px-1 pb-2 text-[11px] text-muted-foreground">
            Тооцоолсон: {updatedAt}
            {cached ? " (кэш, 1 цаг хүчинтэй)" : ""}
            {" · "}
            Эх сурвалж: баталгаажсан алтны захиалга (төлбөр амжилттай, ажилтан баталгаажуулсан).
            {t && t.extraOrders > 0 ? ` · Онцгой захиалга ${formatInt(t.extraOrders)} орсон.` : ""}
            {t && t.derivedFromAmount > 0
              ? ` · Ханш бүртгэгдээгүй ${formatInt(t.derivedFromAmount)} захиалгыг нийт дүнгээс урвуу тооцсон.`
              : ""}
          </p>
        </>
      )}
    </div>
  );
}
