"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatInt, monthLabel } from "@/lib/format";
import {
  HOLD_BUCKETS,
  sumBuckets,
  type BucketGrams,
  type CohortRow,
  type MonthRow,
  type YearRow,
} from "@/lib/report/goldReserve";

export const COLORS = {
  bought: "var(--color-primary-500)",
  phys: "#2a78d6",
  sold: "#1baf7a",
  unspec: "#7c6fd6",
  pos: "#0ca30c",
  neg: "#d03b3b",
} as const;

export const SERIES_LABEL = {
  bought: "Зарсан алт",
  phys: "Биетээр авсан",
  sold: "Бидэнд буцааж зарсан",
  unspec: "Төрөл бүртгэгдээгүй",
} as const;

const TOOLTIP_STYLE = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border-light)",
  borderRadius: 8,
  fontSize: 11,
  padding: "6px 8px",
} as const;

const AXIS_TICK = { fontSize: 10, fill: "var(--color-muted-foreground)" } as const;

/** 12 345.678 → "12,346 г" */
export function g(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${formatInt(Math.round(n))} г`;
}

export function pct(a: number, b: number, digits = 1): string {
  if (!b) return "—";
  return `${((100 * a) / b).toFixed(digits)}%`;
}

function compactGram(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1000) return `${(v / 1000).toFixed(abs >= 10000 ? 0 : 1)} кг`;
  return `${Math.round(v)} г`;
}

function shortMonth(m: string): string {
  const [y, mo] = m.split("-");
  return mo === "01" ? y : `${parseInt(mo, 10)}-р`;
}

// ---------------------------------------------------------------------------
// 1. Жил бүр: зарсан (нэг багана) ба авсан (давхарласан)
// ---------------------------------------------------------------------------
export function YearlyChart({ rows }: { rows: YearRow[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 4, left: 4 }} barGap={6}>
          <CartesianGrid vertical={false} stroke="var(--color-border-light)" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tick={AXIS_TICK} />
          <YAxis
            width={52}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => compactGram(Number(v))}
            tick={AXIS_TICK}
          />
          <Tooltip
            cursor={{ fill: "var(--color-primary-300)", opacity: 0.12 }}
            contentStyle={TOOLTIP_STYLE}
            formatter={(v, name) => [g(Number(v)), String(name)]}
            labelFormatter={(l) => `${l} он`}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar
            dataKey="bought"
            name={SERIES_LABEL.bought}
            fill={COLORS.bought}
            radius={[4, 4, 0, 0]}
            maxBarSize={56}
            isAnimationActive={false}
          />
          <Bar dataKey="phys" name={SERIES_LABEL.phys} stackId="wd" fill={COLORS.phys} maxBarSize={56} isAnimationActive={false} />
          <Bar dataKey="sold" name={SERIES_LABEL.sold} stackId="wd" fill={COLORS.sold} maxBarSize={56} isAnimationActive={false} />
          <Bar
            dataKey="unspec"
            name={SERIES_LABEL.unspec}
            stackId="wd"
            fill={COLORS.unspec}
            radius={[4, 4, 0, 0]}
            maxBarSize={56}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2a. Сар бүрийн хуримтлагдсан нөөц
// ---------------------------------------------------------------------------
export function CumulativeChart({ rows }: { rows: MonthRow[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border-light)" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            minTickGap={16}
            tickFormatter={shortMonth}
            tick={AXIS_TICK}
          />
          <YAxis
            width={52}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => compactGram(Number(v))}
            tick={AXIS_TICK}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v) => [g(Number(v)), "Байх ёстой нөөц"]}
            labelFormatter={(l) => monthLabel(String(l))}
          />
          <Area
            type="monotone"
            dataKey="cum"
            stroke={COLORS.bought}
            strokeWidth={2}
            fill={COLORS.bought}
            fillOpacity={0.12}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2b. Сар бүрийн цэвэр өөрчлөлт (+/−)
// ---------------------------------------------------------------------------
export function NetChart({ rows }: { rows: MonthRow[] }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border-light)" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            minTickGap={16}
            tickFormatter={shortMonth}
            tick={AXIS_TICK}
          />
          <YAxis
            width={52}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => compactGram(Number(v))}
            tick={AXIS_TICK}
          />
          <Tooltip
            cursor={{ fill: "var(--color-primary-300)", opacity: 0.12 }}
            contentStyle={TOOLTIP_STYLE}
            formatter={(v) => [`${Number(v) > 0 ? "+" : ""}${g(Number(v))}`, "Өөрчлөлт"]}
            labelFormatter={(l) => monthLabel(String(l))}
          />
          <Bar dataKey="net" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {rows.map((r) => (
              <Cell key={r.month} fill={r.net < 0 ? COLORS.neg : COLORS.pos} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3a. Хадгалсан хугацааны бүлэг (хэвтээ багана, хувиар)
// ---------------------------------------------------------------------------
export function BucketChart({
  buckets,
  color,
}: {
  buckets: BucketGrams;
  color: string;
}) {
  const total = sumBuckets(buckets);
  const data = HOLD_BUCKETS.map((k) => ({
    label: k,
    grams: buckets[k] || 0,
    share: total ? (100 * (buckets[k] || 0)) / total : 0,
  }));
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 4 }}>
          <CartesianGrid horizontal={false} stroke="var(--color-border-light)" />
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis
            type="category"
            dataKey="label"
            width={96}
            tickLine={false}
            axisLine={false}
            tick={{ ...AXIS_TICK, fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: "var(--color-primary-300)", opacity: 0.12 }}
            contentStyle={TOOLTIP_STYLE}
            formatter={(v, _n, item) => [
              `${g(Number(item?.payload?.grams))} · ${Number(v).toFixed(1)}%`,
              "Хувь",
            ]}
          />
          <Bar
            dataKey="share"
            fill={color}
            radius={[0, 4, 4, 0]}
            maxBarSize={18}
            isAnimationActive={false}
            label={{
              position: "right",
              fontSize: 11,
              fill: "var(--color-muted-foreground)",
              formatter: (v: unknown) => `${Number(v).toFixed(1)}%`,
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3b. Хадгалсан хугацаа авалтын жил, төрлөөр (бүлэглэсэн багана, хувиар)
// ---------------------------------------------------------------------------
export function HoldByTypeChart({
  series,
}: {
  series: { key: string; label: string; color: string; buckets: BucketGrams }[];
}) {
  const data = HOLD_BUCKETS.map((k) => {
    const row: Record<string, number | string> = { label: k };
    for (const s of series) {
      const t = sumBuckets(s.buckets);
      row[s.key] = t ? (100 * (s.buckets[k] || 0)) / t : 0;
    }
    return row;
  });
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 4 }} barGap={3}>
          <CartesianGrid vertical={false} stroke="var(--color-border-light)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} interval={0} />
          <YAxis
            width={40}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            tick={AXIS_TICK}
          />
          <Tooltip
            cursor={{ fill: "var(--color-primary-300)", opacity: 0.12 }}
            contentStyle={TOOLTIP_STYLE}
            formatter={(v, name) => [`${Number(v).toFixed(1)}%`, String(name)]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color}
              radius={[3, 3, 0, 0]}
              maxBarSize={22}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Худалдан авсан жилээр: одоо ч байгаа / авагдсан
// ---------------------------------------------------------------------------
export function CohortChart({ rows }: { rows: CohortRow[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border-light)" />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            tickFormatter={(v) => `${v} онд зарсан`}
          />
          <YAxis
            width={52}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => compactGram(Number(v))}
            tick={AXIS_TICK}
          />
          <Tooltip
            cursor={{ fill: "var(--color-primary-300)", opacity: 0.12 }}
            contentStyle={TOOLTIP_STYLE}
            formatter={(v, name) => [g(Number(v)), String(name)]}
            labelFormatter={(l) => `${l} онд зарсан алт`}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="withdrawn" name="Авагдсан" stackId="c" fill={COLORS.phys} maxBarSize={90} isAnimationActive={false} />
          <Bar
            dataKey="held"
            name="Одоо ч аппд байгаа"
            stackId="c"
            fill={COLORS.bought}
            radius={[4, 4, 0, 0]}
            maxBarSize={90}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
