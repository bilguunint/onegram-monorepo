"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PeriodSelector,
  filterByPeriod,
  type Period,
} from "@/components/dashboard/PeriodSelector";
import {
  fCompactGram,
  fCompactMNT,
  fGram,
  fInt,
  fMNT,
  fPct,
  monthLong,
  shortDate,
  shortMonth,
  strings,
  type Lang,
} from "@/lib/report/i18n";
import type { MonthlyAnalytics, GoldRate, RateSnapshot, GoldDistribution } from "@/lib/firestore/analytics";
import { ChartEmpty } from "@/components/report/ReportParts";

const TOOLTIP_STYLE = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border-light)",
  borderRadius: 8,
  fontSize: 11,
  padding: "6px 8px",
} as const;

const AXIS_TICK = { fontSize: 10, fill: "var(--color-muted-foreground)" } as const;

// ---------------------------------------------------------------------------
// Monthly revenue bar chart
// ---------------------------------------------------------------------------
export function MonthlyRevenueBarChart({
  months,
  lang,
  fill = false,
}: {
  months: MonthlyAnalytics[];
  lang: Lang;
  /** Fill the parent height (for fullscreen slides) instead of a fixed 280px. */
  fill?: boolean;
}) {
  const t = strings(lang);
  const data = [...months].reverse(); // analytics returns desc → chart asc

  return (
    <div className={fill ? "h-full w-full" : "h-[280px] w-full"}>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--color-border-light)" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              minTickGap={8}
              tickFormatter={(v) => shortMonth(String(v))}
              tick={AXIS_TICK}
            />
            <YAxis
              width={56}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => fCompactMNT(Number(v), lang)}
              tick={AXIS_TICK}
            />
            <Tooltip
              cursor={{ fill: "var(--color-primary-300)", opacity: 0.12 }}
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: "var(--color-muted-foreground)" }}
              formatter={(v) => [fMNT(Number(v), lang), t.sRevenue]}
              labelFormatter={(l) => monthLong(String(l), lang)}
            />
            <Bar
              dataKey="total_revenue"
              fill="var(--color-primary-500)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ChartEmpty label={t.noData} height={280} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generic daily trend line (revenue / users) with period selector
// ---------------------------------------------------------------------------
export function DailyTrendChart({
  points,
  lang,
  kind,
  seriesLabel,
  fill = false,
}: {
  points: { date: string; value: number }[];
  lang: Lang;
  kind: "mnt" | "count";
  seriesLabel: string;
  /** Fill the parent height (for fullscreen slides) instead of a fixed 240px. */
  fill?: boolean;
}) {
  const t = strings(lang);
  const [period, setPeriod] = useState<Period>("6m");
  const filtered = useMemo(() => filterByPeriod(points, period), [points, period]);
  const total = useMemo(() => filtered.reduce((s, p) => s + p.value, 0), [filtered]);
  const totalLabel = kind === "mnt" ? fCompactMNT(total, lang) : fInt(total, lang);
  const fmtY = (v: number) => (kind === "mnt" ? fCompactMNT(v, lang) : fInt(v, lang));
  const fmtV = (v: number) => (kind === "mnt" ? fMNT(v, lang) : fInt(v, lang));

  return (
    <div className={fill ? "flex h-full flex-col" : undefined}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[20px] font-semibold tabular-nums leading-none text-foreground">
          {totalLabel}
        </div>
        <PeriodSelector
          value={period}
          onChange={setPeriod}
          labels={{ "1m": t.p1m, "6m": t.p6m, "1y": t.p1y, all: t.pAll }}
        />
      </div>
      <div className={fill ? "min-h-0 w-full flex-1" : "h-[240px] w-full"}>
        {filtered.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filtered} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border-light)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                minTickGap={32}
                tickFormatter={(v) => shortDate(String(v))}
                tick={AXIS_TICK}
              />
              <YAxis
                width={52}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tickFormatter={(v) => fmtY(Number(v))}
                tick={AXIS_TICK}
              />
              <Tooltip
                cursor={{ stroke: "var(--color-primary-300)", strokeWidth: 1 }}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "var(--color-muted-foreground)" }}
                formatter={(v) => [fmtV(Number(v)), seriesLabel]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-primary-500)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty label={t.noData} height={240} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gold price: current rate + change pill + area sparkline
// ---------------------------------------------------------------------------
export function GoldPriceArea({
  rate,
  history,
  lang,
}: {
  rate: GoldRate | null;
  history: RateSnapshot[];
  lang: Lang;
}) {
  const t = strings(lang);
  const rateValue = rate?.rate ?? 0;
  // `changes` is already a percentage (see crawlGoldRate.js), not an absolute delta.
  const changePct = rate?.changes ?? 0;
  const positive = changePct >= 0;
  const series = history.map((r) => ({ date: r.date, rate: r.rate }));

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="text-[22px] font-semibold tabular-nums leading-none text-foreground">
          {fMNT(rateValue, lang)}
        </div>
        {rate && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
              positive ? "bg-[#d8f3e1] text-[#14653a]" : "bg-[#fcdce5] text-[#a8265a]"
            )}
          >
            {positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {fPct(changePct, lang)}
          </span>
        )}
        <span className="text-[11px] text-muted-foreground">
          {t.perGram} · {t.last30}
        </span>
      </div>
      <div className="mt-3 h-[120px] w-full">
        {series.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="reportGoldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary-500)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-primary-500)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Tooltip
                cursor={{ stroke: "var(--color-primary-300)", strokeWidth: 1 }}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "var(--color-muted-foreground)" }}
                formatter={(v) => [fMNT(Number(v), lang), ""]}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="var(--color-primary-500)"
                strokeWidth={2}
                fill="url(#reportGoldGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty label={t.noData} height={120} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generic donut (status mix / withdraw-type split)
// ---------------------------------------------------------------------------
export type DonutSlice = { name: string; value: number; color: string };

export function ReportDonut({
  slices,
  lang,
  emptyLabel,
}: {
  slices: DonutSlice[];
  lang: Lang;
  emptyLabel: string;
}) {
  const visible = slices.filter((s) => s.value > 0);
  if (visible.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-[12px] text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }
  const total = visible.reduce((s, x) => s + x.value, 0);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={visible}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={88}
              innerRadius={48}
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {visible.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value, name) => {
                const v = typeof value === "number" ? value : Number(value) || 0;
                const pct = total ? ((v / total) * 100).toFixed(1) : "0";
                return [`${fInt(v, lang)} (${pct}%)`, String(name)];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px]">
        {visible.map((s) => (
          <li key={s.name} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="text-muted-foreground">{s.name}</span>
            <span className="font-medium tabular-nums text-foreground">{fInt(s.value, lang)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gold balance distribution — mini stats + horizontal bar list
// ---------------------------------------------------------------------------
export function BalanceDistribution({
  dist,
  goldRate,
  lang,
  maxRows = 16,
  showStats = true,
}: {
  dist: GoldDistribution | null;
  goldRate: number;
  lang: Lang;
  /** Cap the number of bucket rows (keeps fixed-height slides from clipping). */
  maxRows?: number;
  /** Show the 4-stat summary grid (hidden when the parent already shows it). */
  showStats?: boolean;
}) {
  const t = strings(lang);
  if (!dist) {
    return <ChartEmpty label={t.noData} height={200} />;
  }
  const penetration = dist.totalUsers > 0 ? (dist.usersWithGold / dist.totalUsers) * 100 : null;
  const buckets = [...dist.distribution].sort((a, b) => b.gold - a.gold).slice(0, maxRows);
  const maxCount = buckets.reduce((m, b) => Math.max(m, b.count), 0) || 1;

  const stats: { label: string; value: string }[] = [
    { label: t.totalGoldInSystem, value: fCompactGram(dist.totalGoldInSystem, lang) },
    { label: t.custodyValue, value: fCompactMNT(dist.totalGoldInSystem * goldRate, lang) },
    { label: t.withGold, value: fInt(dist.usersWithGold, lang) },
    { label: t.penetration, value: penetration == null ? "—" : `${penetration.toFixed(1)}%` },
  ];

  return (
    <div className="space-y-4">
      {showStats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-border-light bg-background/40 p-3">
              <div className="truncate text-[11px] text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {buckets.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            <span>{t.colGold}</span>
            <span>{t.colUsers}</span>
          </div>
          <div className="space-y-1.5">
            {buckets.map((b, i) => (
              <div key={`${b.gold}-${i}`} className="flex items-center gap-3">
                <div className="w-20 shrink-0 text-right text-[11px] tabular-nums text-foreground">
                  {fGram(b.gold, lang)}
                </div>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted/50">
                  <div
                    className="h-full rounded-full bg-primary-400"
                    style={{ width: `${(b.count / maxCount) * 100}%` }}
                  />
                </div>
                <div className="w-12 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                  {fInt(b.count, lang)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Monthly breakdown table
// ---------------------------------------------------------------------------
export function MonthlyBreakdownTable({
  months,
  lang,
}: {
  months: MonthlyAnalytics[];
  lang: Lang;
}) {
  const t = strings(lang);
  if (months.length === 0) {
    return <ChartEmpty label={t.noData} height={160} />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-[12px]">
        <thead>
          <tr className="border-b border-border-light text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            <th className="py-2 pr-3 font-medium">{t.thMonth}</th>
            <th className="py-2 px-3 text-right font-medium">{t.thRevenue}</th>
            <th className="py-2 px-3 text-right font-medium">{t.thOrders}</th>
            <th className="py-2 px-3 text-right font-medium">{t.thGold}</th>
            <th className="py-2 pl-3 text-right font-medium">{t.thSilver}</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.month} className="border-b border-border-light/60 last:border-0">
              <td className="py-2 pr-3 text-foreground">{monthLong(m.month, lang)}</td>
              <td className="py-2 px-3 text-right font-medium tabular-nums text-foreground">
                {fMNT(m.total_revenue, lang)}
              </td>
              <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                {fInt(m.successful_orders, lang)} / {fInt(m.total_orders, lang)}
              </td>
              <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                {fGram(m.total_gold_sold, lang)}
              </td>
              <td className="py-2 pl-3 text-right tabular-nums text-muted-foreground">
                {fGram(m.total_silver_sold, lang)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
