import type { GiftOrder, GiftParty } from "@/lib/firestore/giftOrders";

export function partyName(p: GiftParty | undefined): string {
  const first = p?.first_name?.trim() ?? "";
  const last = p?.last_name?.trim() ?? "";
  return `${last} ${first}`.trim() || "Байхгүй";
}

export function getSenderName(o: GiftOrder): string {
  return partyName(o.sender);
}

export function getReceiverName(o: GiftOrder): string {
  return partyName(o.receiver);
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  sent: "Илгээгдсэн",
  received: "Хүлээн авсан",
  cancelled: "Цуцалсан",
};

export function giftStatusText(status: string | undefined): string {
  if (!status) return "Тодорхойгүй";
  return STATUS_LABEL[status] ?? status;
}

export function giftStatusBadge(status: string | undefined): string {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
    case "sent":
      return "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300";
    case "received":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
    case "cancelled":
      return "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}
