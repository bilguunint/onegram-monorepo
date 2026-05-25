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
import { Users } from "lucide-react";
import { formatInt } from "@/lib/format";
import {
  filterByPeriod,
  PeriodSelector,
  type Period,
} from "./PeriodSelector";
import type { DailyUserPoint } from "@/lib/firestore/analytics";

type Props = {
  data: DailyUserPoint[];
};

function shortDate(d: string): string {
  // YYYY-MM-DD → MM/DD
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(d);
  return m ? `${m[1]}/${m[2]}` : d;
}

export function DailyUsersChart({ data }: Props) {
  const [period, setPeriod] = useState<Period>("1m");
  const filtered = useMemo(() => filterByPeriod(data, period), [data, period]);

  const total = useMemo(
    () => filtered.reduce((sum, p) => sum + (p.new_users || 0), 0),
    [filtered]
  );

  return (
    <section className="flex flex-col rounded-xl border border-border-light bg-card p-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Users className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-[14px] font-semibold text-foreground">
              Шинэ хэрэглэгч
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Сонгосон хугацаанд нийт {formatInt(total)} хэрэглэгч нэмэгдсэн
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
                width={36}
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                allowDecimals={false}
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
                formatter={(v) => [formatInt(Number(v)), "Шинэ хэрэглэгч"]}
              />
              <Line
                type="monotone"
                dataKey="new_users"
                stroke="var(--color-primary-500)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="Сонгосон хугацаанд өгөгдөл алга" />
        )}
      </div>
    </section>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border-light text-[11px] text-muted-foreground">
      {label}
    </div>
  );
}
