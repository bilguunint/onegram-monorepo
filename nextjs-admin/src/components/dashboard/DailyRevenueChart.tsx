"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ShoppingCart } from "lucide-react";
import { formatCompactMNT, formatInt, formatMNT } from "@/lib/format";
import {
  filterByPeriod,
  PeriodSelector,
  type Period,
} from "./PeriodSelector";
import type { DailyIncomePoint } from "@/lib/firestore/analytics";

type Props = {
  data: DailyIncomePoint[];
};

function shortDate(d: string): string {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(d);
  return m ? `${m[1]}/${m[2]}` : d;
}

function compactAxisMNT(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}тэр`;
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}сая`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}мян`;
  return String(v);
}

export function DailyRevenueChart({ data }: Props) {
  const [period, setPeriod] = useState<Period>("1m");
  const filtered = useMemo(() => filterByPeriod(data, period), [data, period]);

  const totals = useMemo(() => {
    let revenue = 0;
    let orders = 0;
    for (const p of filtered) {
      revenue += p.total_amount || 0;
      orders += p.order_count || 0;
    }
    return { revenue, orders };
  }, [filtered]);

  return (
    <section className="flex flex-col rounded-xl border border-border-light bg-card p-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <ShoppingCart className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-[14px] font-semibold text-foreground">
              Өдөр бүрийн борлуулалт
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {formatCompactMNT(totals.revenue)} · {formatInt(totals.orders)} захиалга
            </p>
          </div>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </header>

      <div className="mt-4 h-[260px] w-full">
        {filtered.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filtered}
              margin={{ top: 8, right: 8, bottom: 4, left: 4 }}
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--color-border-light)"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                tickFormatter={shortDate}
                minTickGap={32}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={48}
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                tickFormatter={compactAxisMNT}
              />
              <Tooltip
                cursor={{ stroke: "var(--color-primary-300)", strokeWidth: 1 }}
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border-light)",
                  borderRadius: 8,
                  fontSize: 11,
                  padding: "6px 8px",
                }}
                labelStyle={{ color: "var(--color-muted-foreground)" }}
                formatter={(v) => [formatMNT(Number(v)), "Орлого"]}
              />
              <Line
                type="monotone"
                dataKey="total_amount"
                stroke="var(--color-primary-500)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border-light text-[11px] text-muted-foreground">
            Сонгосон хугацаанд өгөгдөл алга
          </div>
        )}
      </div>
    </section>
  );
}
