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

export function purchaseProgress(p: ProductPurchase): number {
  if (!p.total_price || p.total_price <= 0) return 0;
  return Math.min(100, Math.round((p.paid_amount / p.total_price) * 100));
}

export function getPurchaseUserName(p: ProductPurchase): string {
  const last = p.user_snapshot.last_name?.trim() ?? "";
  const first = p.user_snapshot.first_name?.trim() ?? "";
  return `${last} ${first}`.trim() || "Тодорхойгүй";
}

export function getProductPrimaryImage(p: Pick<Product, "images">): string | null {
  return p.images?.[0] ?? null;
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
