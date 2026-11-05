import { Timestamp } from "firebase/firestore";
import type { Product, ProductStatus } from "@/lib/firestore/products";
import type {
  ProductPurchase,
  ProductPurchaseStatus,
} from "@/lib/firestore/productPurchases";

export function productStatusText(s: ProductStatus): string {
  return s === "active" ? "Идэвхтэй" : "Идэвхгүй";
}

export function productStatusBadge(s: ProductStatus): string {
  return s === "active"
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
    : "bg-muted text-muted-foreground";
}

const STATUS_LABEL: Record<ProductPurchaseStatus, string> = {
  active: "Идэвхтэй",
  completed: "Төлөгдсөн",
  delivered: "Хүлээлгэн өгсөн",
  cancelled: "Цуцалсан",
};

const STATUS_BADGE: Record<ProductPurchaseStatus, string> = {
  active: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  delivered: "bg-primary-100 text-primary-700",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

export function purchaseStatusText(s: ProductPurchaseStatus): string {
  return STATUS_LABEL[s] ?? s;
}

export function purchaseStatusBadge(s: ProductPurchaseStatus): string {
  return STATUS_BADGE[s] ?? "bg-muted text-muted-foreground";
}

const MNT0 = new Intl.NumberFormat("mn-MN", { maximumFractionDigits: 0 });
const MNT2 = new Intl.NumberFormat("mn-MN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPriceMNT(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "0₮";
  return `${MNT0.format(n)}₮`;
}

export function formatPriceMNT2(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "0₮";
  return `${MNT2.format(n)}₮`;
}

export function isGoldPurchase(p: ProductPurchase): boolean {
  return p.purchase_type === "gold_installment";
}

export function formatGrams(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "0 гр";
  return `${Math.round(n * 100) / 100} гр`;
}

export function purchaseProgress(p: ProductPurchase): number {
  if (isGoldPurchase(p)) {
    if (!p.total_grams || p.total_grams <= 0) return 0;
    return Math.min(100, Math.round((p.paid_grams / p.total_grams) * 100));
  }
  if (!p.total_price || p.total_price <= 0) return 0;
  return Math.min(100, Math.round((p.paid_amount / p.total_price) * 100));
}

/** "67/360 өдөр" эсвэл эдлэлд "1.3/5.2 гр". */
export function purchaseProgressLabel(p: ProductPurchase): string {
  return isGoldPurchase(p)
    ? `${p.paid_grams}/${p.total_grams} гр`
    : `${p.paid_days}/${p.total_days} өдөр`;
}

export function getPurchaseUserName(p: ProductPurchase): string {
  const last = p.user_snapshot.last_name?.trim() ?? "";
  const first = p.user_snapshot.first_name?.trim() ?? "";
  return `${last} ${first}`.trim() || "Тодорхойгүй";
}

export function getProductPrimaryImage(p: Pick<Product, "images">): string | null {
  return p.images?.[0] ?? null;
}

// ---------- Daily-installment helpers ----------

function tsToDate(t: Timestamp | string | null | undefined): Date | null {
  if (!t) return null;
  if (typeof t === "string") {
    const d = new Date(t);
    return isNaN(d.getTime()) ? null : d;
  }
  if (t instanceof Timestamp) return t.toDate();
  // Plain object with seconds/nanoseconds (Firestore-like)
  const o = t as unknown as { seconds?: number };
  if (o && typeof o.seconds === "number") return new Date(o.seconds * 1000);
  return null;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Days elapsed since started_at (0+); null when started_at unknown. */
export function purchaseDaysSinceStart(p: ProductPurchase): number | null {
  const start = tsToDate(p.started_at);
  if (!start) return null;
  const ms = startOfDay(new Date()).getTime() - startOfDay(start).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/**
 * Days the user *should* have paid by today if on schedule (one payment
 * per day). Capped at total_days. Returns null without started_at.
 */
export function purchaseExpectedPaidDays(p: ProductPurchase): number | null {
  // Алтан эдлэлд хатуу хуваарь байхгүй (хэрэглэгч граммаа өөрөө сонгодог).
  if (isGoldPurchase(p)) return null;
  const elapsed = purchaseDaysSinceStart(p);
  if (elapsed == null) return null;
  // +1 because day 1 is paid on start day
  return Math.min(p.total_days || 0, elapsed + 1);
}

/**
 * Days the user is behind schedule (expected - actual). 0 when on track or
 * ahead. Null when started_at unknown or plan inactive.
 */
export function purchaseDaysBehind(p: ProductPurchase): number | null {
  if (p.status !== "active") return null;
  const expected = purchaseExpectedPaidDays(p);
  if (expected == null) return null;
  return Math.max(0, expected - (p.paid_days || 0));
}

/** Days until deadline (negative = overdue). Null when no deadline. */
export function purchaseDaysUntilDeadline(p: ProductPurchase): number | null {
  const dl = tsToDate(p.deadline);
  if (!dl) return null;
  const ms = startOfDay(dl).getTime() - startOfDay(new Date()).getTime();
  return Math.floor(ms / 86_400_000);
}

/** Date of the latest payment in payments[], or null if none. */
export function purchaseLastPaidAt(p: ProductPurchase): Date | null {
  if (!p.payments || p.payments.length === 0) return null;
  let latest: Date | null = null;
  for (const r of p.payments) {
    const d = tsToDate(r.paid_at);
    if (d && (!latest || d > latest)) latest = d;
  }
  return latest;
}

/**
 * How many days an active plan may fall BEHIND SCHEDULE before it is flagged
 * overdue to admins.
 *
 * IMPORTANT: this counts schedule lag (expected − paid_days), NOT the gap since
 * the last payment. The old gap-based rule flagged customers who had prepaid
 * weeks in advance and simply had nothing left to pay — 9 active plans were
 * sitting in the overdue list that way, one of them 27 days AHEAD of
 * schedule. Keep this in sync with the app's
 * `ProductPurchase.installmentCancelBehindDays` (20) and the backend's
 * `WARN_BEHIND_DAYS` (5, the softer in-app warning threshold).
 */
export const OVERDUE_BEHIND_DAYS = 20;

/**
 * Days since the most recent payment (falling back to started_at when no
 * payment record exists). Null when the plan isn't active or has no start
 * date.
 *
 * INFORMATIONAL ONLY — show it in the table, but never decide "overdue" from
 * it: a customer who prepaid 30 days is not late just because they haven't
 * opened the app since. Use purchaseDaysBehind for that.
 */
export function purchaseDaysSinceLastPayment(
  p: ProductPurchase
): number | null {
  if (p.status !== "active") return null;
  const last = purchaseLastPaidAt(p) ?? tsToDate(p.started_at);
  if (!last) return null;
  const ms = startOfDay(new Date()).getTime() - startOfDay(last).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/**
 * True when an active plan is OVERDUE_BEHIND_DAYS+ days behind schedule.
 * Plans that are on track or paid ahead are never overdue, however long ago
 * the last payment was.
 */
export function purchaseIsOverdue(p: ProductPurchase): boolean {
  const behind = purchaseDaysBehind(p);
  return behind != null && behind >= OVERDUE_BEHIND_DAYS;
}

/**
 * Compute refund split given paid amount and cancel fee % (0..100).
 */
export function computeRefundSplit(
  paidAmount: number,
  feePercent: number
): { refund: number; fee: number } {
  const safePaid = Math.max(0, Math.round(paidAmount));
  const safeFee = Math.max(0, Math.min(100, feePercent || 0));
  const fee = Math.round((safePaid * safeFee) / 100);
  const refund = Math.max(0, safePaid - fee);
  return { refund, fee };
}
