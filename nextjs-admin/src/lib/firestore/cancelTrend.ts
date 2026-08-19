import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";

// ---------------------------------------------------------------------------
// Did softening the lapse warnings actually stop people cancelling?
//
// The reminders (and the in-app banner) used to say the plan was at risk of
// cancellation; users read that as a verdict and cancelled themselves. The
// wording went out on the date below, so this compares cancellation requests
// since then against the same number of days immediately before it.
// ---------------------------------------------------------------------------

/** The day the softened wording went live (local time). */
export const LAPSE_COPY_CHANGE_DATE = new Date(2026, 7, 20); // 2026-08-20

/** Fixed baseline length. A stable pre-change rate beats one that shrinks to a
 *  day or two right after launch, when a single request swings it wildly. */
export const BASELINE_DAYS = 14;

/** Days of post-change data before the percentage is worth showing at all. */
export const MIN_DAYS_FOR_PCT = 3;

export type CancelTrend = {
  /** Whole days of data since the change. */
  afterDays: number;
  baselineDays: number;
  beforeCount: number;
  afterCount: number;
  /** Requests per day, so windows of different length stay comparable. */
  beforePerDay: number;
  afterPerDay: number;
  /** Negative means fewer cancellations since the change. Null while the
   *  post-change window is still too short, or with no baseline to divide by. */
  changePct: number | null;
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export async function fetchCancelTrend(
  changeDate: Date = LAPSE_COPY_CHANGE_DATE
): Promise<CancelTrend> {
  const change = startOfDay(changeDate);
  const today = startOfDay(new Date());

  const afterDays = Math.max(
    1,
    Math.round((today.getTime() - change.getTime()) / 86_400_000)
  );
  const windowStart = new Date(change.getTime() - BASELINE_DAYS * 86_400_000);

  // One query covering both windows; bucket client-side.
  const snap = await getDocs(
    query(
      collection(getDb(), "installment_cancel_requests"),
      where("created_at", ">=", Timestamp.fromDate(windowStart))
    )
  );

  let beforeCount = 0;
  let afterCount = 0;
  for (const d of snap.docs) {
    const ts = d.data().created_at as Timestamp | undefined;
    const at = ts?.toDate?.();
    if (!at) continue;
    if (at >= change) afterCount += 1;
    else if (at >= windowStart) beforeCount += 1;
  }

  const beforePerDay = beforeCount / BASELINE_DAYS;
  const afterPerDay = afterCount / afterDays;

  return {
    afterDays,
    baselineDays: BASELINE_DAYS,
    beforeCount,
    afterCount,
    beforePerDay,
    afterPerDay,
    changePct:
      beforePerDay > 0 && afterDays >= MIN_DAYS_FOR_PCT
        ? ((afterPerDay - beforePerDay) / beforePerDay) * 100
        : null,
  };
}
