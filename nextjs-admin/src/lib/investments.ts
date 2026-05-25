import type { Investment } from "@/lib/firestore/investments";

export function getInvestmentUserName(inv: Investment): string {
  const first = inv.user?.first_name?.trim() ?? "";
  const last = inv.user?.last_name?.trim() ?? "";
  return `${last} ${first}`.trim() || "Байхгүй";
}

export function isClosed(inv: Investment): boolean {
  return inv.status === "closed";
}

export type InvestmentStatus = "active" | "closed" | "expired" | "unknown";

export function getInvestmentStatusKey(inv: Investment): InvestmentStatus {
  if (isClosed(inv)) return "closed";
  if (!inv.endDate) return "unknown";
  const end = inv.endDate.toDate();
  return end.getTime() > Date.now() ? "active" : "expired";
}

const STATUS_LABEL: Record<InvestmentStatus, string> = {
  active: "Идэвхтэй",
  closed: "Хаагдсан",
  expired: "Дуусгавар болсон",
  unknown: "Тодорхойгүй",
};

const STATUS_BADGE: Record<InvestmentStatus, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  closed: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  expired: "bg-muted text-muted-foreground",
  unknown: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

export function investmentStatusText(inv: Investment): string {
  return STATUS_LABEL[getInvestmentStatusKey(inv)];
}

export function investmentStatusBadge(inv: Investment): string {
  return STATUS_BADGE[getInvestmentStatusKey(inv)];
}

export function getDaysRemaining(inv: Investment): number {
  if (!inv.endDate) return 0;
  const end = inv.endDate.toDate();
  const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export function formatClosedDate(value: Investment["closedDate"]): string {
  if (!value) return "-";
  let d: Date;
  if (typeof value === "string") d = new Date(value);
  else if (typeof value === "object" && "toDate" in value) d = value.toDate();
  else return "-";
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function getUniqueVerifiedAdmins(items: Investment[]): string[] {
  const set = new Set<string>();
  for (const inv of items) {
    if (inv.verifiedAdmin && inv.verifiedAdmin.trim() !== "") {
      set.add(inv.verifiedAdmin);
    }
  }
  return Array.from(set).sort();
}
