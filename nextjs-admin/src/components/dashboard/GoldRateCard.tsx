"use client";

import { ArrowDownRight, ArrowUpRight, Sparkles } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { formatMNT, formatPercent } from "@/lib/format";
import type { GoldRate, RateSnapshot } from "@/lib/firestore/analytics";

type Props = {
  rate: GoldRate | null;
  history: RateSnapshot[];
};

export function GoldRateCard({ rate, history }: Props) {
  const rateValue = rate?.rate ?? 0;
  // `changes` is already a percentage (see crawlGoldRate.js), not an absolute delta.
  const changePct = rate?.changes ?? 0;
  const positive = changePct >= 0;

  const series = history.map((r) => ({ date: r.date, rate: r.rate }));

  return (
    <div className="flex flex-col rounded-xl border border-border-light bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[12px] text-muted-foreground">Алтны ханш</div>
          <div className="mt-1.5 whitespace-nowrap text-[20px] font-semibold tabular-nums leading-none text-foreground">
            {formatMNT(rateValue)}
          </div>
          {rate && (
            <div className="mt-2 flex items-center gap-2 text-[11px]">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                  positive
                    ? "bg-[#d8f3e1] text-[#14653a]"
                    : "bg-[#fcdce5] text-[#a8265a]"
                )}
              >
                {positive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {formatPercent(changePct)}
              </span>
              <span className="text-muted-foreground">1 гр · 30 хоног</span>
            </div>
          )}
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          <Sparkles className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-3 h-[80px] w-full">
        {series.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={series}
              margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-primary-500)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-primary-500)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <YAxis hide domain={["dataMin", "dataMax"]} />
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
                formatter={(v) => [formatMNT(Number(v)), ""]}
                labelFormatter={(l) => String(l)}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="var(--color-primary-500)"
                strokeWidth={2}
                fill="url(#goldGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-[11px] text-muted-foreground">
            Ханшийн өгөгдөл хүрэлцэхгүй
          </div>
        )}
      </div>
    </div>
  );
}
