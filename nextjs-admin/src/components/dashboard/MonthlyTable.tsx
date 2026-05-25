import { formatGram, formatInt, formatMNT, monthLabel } from "@/lib/format";
import type { MonthlyAnalytics } from "@/lib/firestore/analytics";

type Props = {
  rows: MonthlyAnalytics[];
};

export function MonthlyTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-light bg-card px-4 py-10 text-center text-[12px] text-muted-foreground">
        Сарын мэдээлэл олдсонгүй.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-light bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-sidebar/40 text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Сар</th>
              <th className="px-4 py-3 text-right font-medium">Орлого</th>
              <th className="px-4 py-3 text-right font-medium">Амжилттай</th>
              <th className="px-4 py-3 text-right font-medium">Алт</th>
              <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">
                Мөнгө
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {rows.map((r) => (
              <tr
                key={r.month}
                className="transition-colors hover:bg-sidebar/30"
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {monthLabel(r.month)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-foreground">
                  {formatMNT(r.total_revenue)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  {formatInt(r.successful_orders)}
                  <span className="ml-1 text-[10px] text-muted-foreground/70">
                    / {formatInt(r.total_orders)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  {formatGram(r.total_gold_sold)}
                </td>
                <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground sm:table-cell">
                  {formatGram(r.total_silver_sold)}
                </td>
              </tr>
            ))}
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
