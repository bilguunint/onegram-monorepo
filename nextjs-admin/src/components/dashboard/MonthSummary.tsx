import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatGram,
  formatInt,
  formatMNT,
  formatPercent,
  monthLabel,
  percentChange,
} from "@/lib/format";
import type { MonthlyAnalytics } from "@/lib/firestore/analytics";

type Props = {
  monthKey: string;
  current: MonthlyAnalytics | null;
  previous: MonthlyAnalytics | null;
};

export function MonthSummary({ monthKey, current, previous }: Props) {
  const revenue = current?.total_revenue ?? 0;
  const change = percentChange(revenue, previous?.total_revenue);
  const positive = change != null && change >= 0;

  return (
    <div className="rounded-xl border border-border-light bg-card p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Энэ сарын дүн
          </div>
          <div className="mt-1 text-[14px] font-medium text-foreground">
            {monthLabel(monthKey)}
          </div>
        </div>
        {change != null && (
          <span
            className={cn(
              "inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
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
            Өмнөх сараас {formatPercent(change)}
          </span>
        )}
      </div>

      <div className="mt-4 text-[28px] font-semibold leading-tight text-foreground">
        {formatMNT(revenue)}
      </div>
      <div className="text-[11px] text-muted-foreground">
        Өмнөх сар: {formatMNT(previous?.total_revenue ?? null)}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniStat
          label="Амжилттай захиалга"
          value={formatInt(current?.successful_orders ?? null)}
          sub={`Нийт ${formatInt(current?.total_orders ?? null)}`}
        />
        <MiniStat
          label="Алт зарагдсан"
          value={formatGram(current?.total_gold_sold ?? null)}
        />
        <MiniStat
          label="Мөнгө зарагдсан"
          value={formatGram(current?.total_silver_sold ?? null)}
        />
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg bg-sidebar/60 px-3 py-2.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-[15px] font-semibold text-foreground">
        {value}
      </div>
      {sub && (
        <div className="text-[10px] text-muted-foreground">{sub}</div>
      )}
    </div>
  );
}

export function MonthSummarySkeleton() {
  return (
    <div className="rounded-xl border border-border-light bg-card p-5">
      <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
