import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  icon: LucideIcon;
  meta?: React.ReactNode;
  className?: string;
};

export function StatCard({ label, value, icon: Icon, meta, className }: Props) {
  // Shrink large strings so they don't overflow narrow cards
  const valueSize =
    value.length > 14
      ? "text-[15px]"
      : value.length > 11
        ? "text-[17px]"
        : "text-[20px]";

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-2 rounded-xl border border-border-light bg-card p-4 transition-colors hover:border-primary-300",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] text-muted-foreground">
          {label}
        </div>
        <div
          className={cn(
            "mt-1.5 whitespace-nowrap font-semibold leading-none tabular-nums text-foreground",
            valueSize
          )}
        >
          {value}
        </div>
        {meta && (
          <div className="mt-2 truncate text-[11px] text-muted-foreground">
            {meta}
          </div>
        )}
      </div>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
        <Icon className="h-4 w-4" />
      </span>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="flex items-start justify-between rounded-xl border border-border-light bg-card p-4">
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        <div className="h-6 w-28 animate-pulse rounded bg-muted" />
        <div className="h-2.5 w-16 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
