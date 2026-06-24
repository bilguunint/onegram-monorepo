"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { fPct, type Lang } from "@/lib/report/i18n";

/** Titled content panel used to box each report section. */
export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border-light bg-card p-4 sm:p-5",
        className
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Month-over-month growth pill (green up / red down). */
export function MoMBadge({ value, lang }: { value: number | null; lang: Lang }) {
  if (value == null) return null;
  const positive = value >= 0;
  return (
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
      {fPct(value, lang)}
    </span>
  );
}

/** Dashed empty-state shown inside a chart area when there is no data. */
export function ChartEmpty({ label, height = 260 }: { label: string; height?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg border border-dashed border-border-light text-[11px] text-muted-foreground"
      style={{ height }}
    >
      {label}
    </div>
  );
}

/** Mongolian / English language switch (segmented). */
export function LangToggle({
  value,
  onChange,
}: {
  value: Lang;
  onChange: (l: Lang) => void;
}) {
  const opts: { key: Lang; label: string }[] = [
    { key: "mn", label: "МН" },
    { key: "en", label: "EN" },
  ];
  return (
    <div className="inline-flex rounded-lg bg-sidebar p-0.5 text-[11px]">
      {opts.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={cn(
            "rounded-md px-2.5 py-1 font-medium transition-colors",
            value === o.key
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
