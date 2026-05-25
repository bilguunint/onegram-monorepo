import type { Timestamp } from "firebase/firestore";
import type { Order } from "@/lib/firestore/orders";

export function getClientName(order: Order): string {
  const first = order.client?.first_name?.trim() ?? "";
  const last = order.client?.last_name?.trim() ?? "";
  return `${last} ${first}`.trim() || "Байхгүй";
}

const PRODUCT_TYPE_LABEL: Record<string, string> = {
  bar: "Гулдмай",
  ingot: "Ембүү",
  earrings: "Ээмэг",
  ring: "Бөгж",
};

export function getProductTypeName(prodType: string | undefined): string {
  if (!prodType) return "Тодорхойгүй";
  return PRODUCT_TYPE_LABEL[prodType] ?? prodType;
}

export function metalLabel(metalId: number | undefined): string {
  if (metalId === 1) return "Алт";
  if (metalId === 3) return "Мөнгө";
  return "Тодорхойгүй";
}

const ADMIN_STATUS_LABEL: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  success: "Баталгаажсан",
  rejected: "Татгалзсан",
};

export function getAdminStatusText(status: string | undefined): string {
  if (!status) return "Тодорхойгүй";
  return ADMIN_STATUS_LABEL[status] ?? status;
}

export function getAdminStatusBadge(status: string | undefined): string {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
    case "success":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
    case "rejected":
      return "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function getPaymentStatusBadge(status: string | undefined): string {
  return status === "success"
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
    : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
}

export function getPaymentStatusText(status: string | undefined): string {
  return status === "success" ? "Төлсөн" : "Төлөөгүй";
}

export function getTypeText(type: string | undefined): string {
  if (type === "deposit") return "Орлого";
  if (type === "withdraw") return "Зарлага";
  return type || "Тодорхойгүй";
}

export function formatOrderDate(value: Timestamp | string | null | undefined): string {
  if (!value) return "Байхгүй";
  let d: Date;
  if (typeof value === "object" && "toDate" in value) {
    d = value.toDate();
  } else {
    d = new Date(value);
  }
  if (Number.isNaN(d.getTime())) return "Алдаатай огноо";
  const date = d.toLocaleDateString("mn-MN");
  const time = d.toLocaleTimeString("mn-MN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date} ${time}`;
}

const MNT = new Intl.NumberFormat("mn-MN", { maximumFractionDigits: 0 });
const MNT_2 = new Intl.NumberFormat("mn-MN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const QTY_GOLD = new Intl.NumberFormat("mn-MN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});
const QTY_SILVER = new Intl.NumberFormat("mn-MN", { maximumFractionDigits: 0 });

export function formatMNT0(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "0₮";
  return `${MNT.format(n)}₮`;
}

export function formatMNT2(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "0.00₮";
  return `${MNT_2.format(n)}₮`;
}

export function formatQuantity(metalId: number | undefined, qty: number | undefined): string {
  if (qty == null || !Number.isFinite(qty)) return "0 гр";
  const fmt = metalId === 1 ? QTY_GOLD : QTY_SILVER;
  return `${fmt.format(qty)} гр`;
}
