"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchCancelTrend,
  LAPSE_COPY_CHANGE_DATE,
  MIN_DAYS_FOR_PCT,
  type CancelTrend,
} from "@/lib/firestore/cancelTrend";

const fmtDay = (d: Date) =>
  `${d.getMonth() + 1}/${d.getDate()}`;
const per = (n: number) =>
  n >= 10 ? n.toFixed(0) : n.toFixed(1).replace(/\.0$/, "");

/**
 * Compact read on whether the softened lapse wording reduced self-cancellations.
 * Compares cancellation requests since the change against the same number of
 * days before it. Down is good, so a fall is green.
 */
export function CancelTrendCard() {
  const [data, setData] = useState<CancelTrend | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchCancelTrend()
      .then((d) => alive && setData(d))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  if (failed) return null;

  if (!data) {
    return (
      <div className="rounded-xl border border-border-light bg-card p-4">
        <div className="h-3 w-28 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-6 w-20 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const {
    afterDays,
    baselineDays,
    beforeCount,
    afterCount,
    beforePerDay,
    afterPerDay,
  } = data;
  const pct = data.changePct;
  const down = pct != null && pct < 0;
  const flat = pct == null || Math.abs(pct) < 1;
  const Icon = flat ? Minus : down ? ArrowDownRight : ArrowUpRight;

  // Under a week the daily rate still swings on a single request, so flag it
  // rather than letting one quiet day read as a win.
  const thin = afterDays < 7;
  const tooEarly = afterDays < MIN_DAYS_FOR_PCT;

  return (
    <div className="rounded-xl border border-border-light bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[12px] text-muted-foreground">
            Цуцлах хүсэлт — өөрчлөлтийн дараа
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="whitespace-nowrap text-[20px] font-semibold leading-none tabular-nums text-foreground">
              {per(afterPerDay)}
              <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                /өдөр
              </span>
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                flat
                  ? "bg-muted text-muted-foreground"
                  : down
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
              )}
            >
              <Icon className="h-3 w-3" />
              {pct == null ? "—" : `${Math.abs(pct).toFixed(0)}%`}
            </span>
          </div>
          <div className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            Өмнөх {baselineDays} хоног: {per(beforePerDay)}/өдөр ({beforeCount})
            {" · "}
            {fmtDay(LAPSE_COPY_CHANGE_DATE)}-наас хойш {afterDays} хоногт{" "}
            {afterCount}
            {tooEarly ? (
              <span className="text-amber-600"> · дүгнэхэд эрт</span>
            ) : thin ? (
              <span className="text-amber-600"> · өгөгдөл цөөн</span>
            ) : null}
          </div>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          <Undo2 className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}
