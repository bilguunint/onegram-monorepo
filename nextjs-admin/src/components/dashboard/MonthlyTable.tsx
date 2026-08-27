import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  currentMonthKey,
  formatGram,
  formatInt,
  formatMNT,
  formatPercent,
  monthLabel,
  percentChange,
  shiftMonthKey,
} from "@/lib/format";
import type { MonthlyAnalytics } from "@/lib/firestore/analytics";

type Props = {
  rows: MonthlyAnalytics[];
  /** Months preceding `rows`, used only to look up each row's counterpart a
   *  year earlier. */
  previousYear?: MonthlyAnalytics[];
};

/** How much of the running month has elapsed, e.g. 27/31 on the 27th. */
function monthProgress(now = new Date()): { day: number; days: number } {
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return { day: now.getDate(), days };
}

function DeltaBadge({
  change,
  className,
}: {
  change: number | null;
  className?: string;
}) {
  if (change == null) {
    return <span className="text-muted-foreground/60">—</span>;
  }
  const flat = Math.abs(change) < 0.05;
  const positive = change >= 0;
  const Icon = flat ? Minus : positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
        flat
          ? "bg-muted text-muted-foreground"
          : positive
            ? "bg-[#d8f3e1] text-[#14653a]"
            : "bg-[#fcdce5] text-[#a8265a]",
        className
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {formatPercent(change)}
    </span>
  );
}

export function MonthlyTable({ rows, previousYear = [] }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-light bg-card px-4 py-10 text-center text-[12px] text-muted-foreground">
        Сарын мэдээлэл олдсонгүй.
      </div>
    );
  }

  // A month with no activity has no document at all, so pair the two windows by
  // key rather than by position.
  const byMonth = new Map<string, MonthlyAnalytics>();
  for (const m of [...rows, ...previousYear]) byMonth.set(m.month, m);
  const yearAgo = (monthKey: string) =>
    byMonth.get(shiftMonthKey(monthKey, -12)) ?? null;

  const thisMonth = currentMonthKey();
  const { day, days } = monthProgress();
  const headline = rows.find((r) => r.month === thisMonth) ?? null;
  const headlineYearAgo = headline ? yearAgo(headline.month) : null;

  return (
    <div className="overflow-hidden rounded-xl border border-border-light bg-card">
      {headline && headlineYearAgo && (
        <div className="border-b border-border-light bg-sidebar/30 px-4 py-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Өмнөх жилийн мөн үетэй харьцуулбал
          </div>
          <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2">
            <div>
              <div className="text-[11px] text-muted-foreground">
                {monthLabel(headlineYearAgo.month)}
              </div>
              <div className="text-[16px] font-medium tabular-nums text-muted-foreground">
                {formatMNT(headlineYearAgo.total_revenue)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">
                {monthLabel(headline.month)}
                <span className="ml-1 text-muted-foreground/70">
                  ({day}/{days} хоног)
                </span>
              </div>
              <div className="text-[22px] font-semibold leading-tight tabular-nums text-foreground">
                {formatMNT(headline.total_revenue)}
              </div>
            </div>
            <DeltaBadge
              change={percentChange(
                headline.total_revenue,
                headlineYearAgo.total_revenue
              )}
              className="mb-1 px-2 py-1 text-[12px]"
            />
          </div>
          <div className="mt-2 text-[10px] leading-relaxed text-muted-foreground/70">
            Энэ сар дуусаагүй тул бүтэн сартай харьцуулж байгааг анхаарна уу.
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-sidebar/40 text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Сар</th>
              <th className="px-4 py-3 text-right font-medium">Орлого</th>
              <th className="px-4 py-3 text-right font-medium">Өмнөх жил</th>
              <th className="px-4 py-3 text-right font-medium">Өөрчлөлт</th>
              <th className="px-4 py-3 text-right font-medium">Амжилттай</th>
              <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">
                Алт
              </th>
              <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">
                Мөнгө
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {rows.map((r) => {
              const prev = yearAgo(r.month);
              const running = r.month === thisMonth;
              return (
                <tr
                  key={r.month}
                  className="transition-colors hover:bg-sidebar/30"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {monthLabel(r.month)}
                    {running && (
                      <span className="ml-1 text-[10px] font-normal text-muted-foreground/70">
                        (үргэлжилж буй)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {formatMNT(r.total_revenue)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {prev ? formatMNT(prev.total_revenue) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeltaBadge
                      change={percentChange(
                        r.total_revenue,
                        prev?.total_revenue
                      )}
                    />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {formatInt(r.successful_orders)}
                    <span className="ml-1 text-[10px] text-muted-foreground/70">
                      / {formatInt(r.total_orders)}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground sm:table-cell">
                    {formatGram(r.total_gold_sold)}
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground sm:table-cell">
                    {formatGram(r.total_silver_sold)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MonthlyTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border-light bg-card">
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-9 animate-pulse rounded-md bg-muted/60"
          />
        ))}
      </div>
    </div>
  );
}
