"use client";

import { cn } from "@/lib/utils";

export type Period = "1m" | "6m" | "1y" | "all";

const PERIODS: { key: Period; label: string }[] = [
  { key: "1m", label: "1 сар" },
  { key: "6m", label: "6 сар" },
  { key: "1y", label: "1 жил" },
  { key: "all", label: "Бүгд" },
];

type Props = {
  value: Period;
  onChange: (p: Period) => void;
  /** Optional per-key label overrides (e.g. for a different language). */
  labels?: Partial<Record<Period, string>>;
};

export function PeriodSelector({ value, onChange, labels }: Props) {
  return (
    <div className="inline-flex rounded-lg bg-sidebar p-0.5 text-[11px]">
      {PERIODS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => onChange(p.key)}
          className={cn(
            "rounded-md px-2.5 py-1 transition-colors",
            value === p.key
              ? "bg-card font-medium text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {labels?.[p.key] ?? p.label}
        </button>
      ))}
    </div>
  );
}

// Return the start Date for a period
export function periodStart(period: Period, now = new Date()): Date {
  switch (period) {
    case "1m":
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case "6m":
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case "1y":
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    case "all":
      return new Date(2020, 0, 1);
  }
}

// Filter points with a YYYY-MM-DD `date` field by period start
export function filterByPeriod<T extends { date: string }>(
  points: T[],
  period: Period
): T[] {
  const start = periodStart(period);
  const startKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  return points.filter((p) => p.date >= startKey);
}
