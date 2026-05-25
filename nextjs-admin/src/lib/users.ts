import type { Timestamp } from "firebase/firestore";
import type { AdminUser } from "@/lib/firestore/users";

export function getFullName(user: Pick<AdminUser, "first_name" | "last_name">): string {
  const first = user.first_name?.trim() ?? "";
  const last = user.last_name?.trim() ?? "";
  const full = `${last} ${first}`.trim();
  return full || "Нэр тодорхойгүй";
}

export function getInitials(user: Pick<AdminUser, "first_name" | "last_name" | "email">): string {
  const first = user.first_name?.trim() ?? "";
  const last = user.last_name?.trim() ?? "";
  if (first && last) return (first.charAt(0) + last.charAt(0)).toUpperCase();
  if (first) return first.charAt(0).toUpperCase();
  if (last) return last.charAt(0).toUpperCase();
  if (user.email) return user.email.charAt(0).toUpperCase();
  return "U";
}

export function formatTimestamp(value: Timestamp | string | null | undefined): string {
  if (!value) return "Мэдээлэл алга";
  let d: Date;
  if (typeof value === "object" && "toDate" in value) {
    d = value.toDate();
  } else {
    d = new Date(value);
  }
  if (Number.isNaN(d.getTime())) return "Мэдээлэл алга";
  return d.toLocaleString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const GRAM_1 = new Intl.NumberFormat("mn-MN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export function formatGramShort(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "0 гр";
  return `${GRAM_1.format(n)} гр`;
}
