import type { Withdraw } from "@/lib/firestore/withdraws";

export const SUPER_ADMIN_UID = "mOlavOSKiyfGXnEQ0D4ODDIb9eq1";

export function getWithdrawClientName(w: Withdraw): string {
  const first = w.client?.first_name?.trim() ?? "";
  const last = w.client?.last_name?.trim() ?? "";
  return `${last} ${first}`.trim() || "Байхгүй";
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  verified: "Баталгаажсан",
  rejected: "Татгалзсан",
  completed: "Дууссан",
};

export function withdrawStatusText(status: string | undefined): string {
  if (!status) return "Тодорхойгүй";
  return STATUS_LABEL[status] ?? status;
}

export function withdrawStatusBadge(status: string | undefined): string {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
    case "verified":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
    case "rejected":
      return "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300";
    case "completed":
      return "bg-primary-100 text-primary-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function withdrawTypeText(type: string | undefined): string {
  if (type === "sold_to_us") return "Манайд зарсан";
  if (type === "taken_physically") return "Биетээр авсан";
  return "-";
}

export function withdrawTypeBadge(type: string | undefined): string {
  if (type === "sold_to_us")
    return "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300";
  if (type === "taken_physically")
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
  return "bg-muted text-muted-foreground";
}

export function isVerificationCodeExpired(w: Withdraw): boolean {
  if (!w.verificationCodeExpiresAt) return false;
  return w.verificationCodeExpiresAt.toDate().getTime() < Date.now();
}

export type VerificationStatus =
  | "verified"
  | "code_used"
  | "code_expired"
  | "unverified";

export function getVerificationStatusKey(w: Withdraw): VerificationStatus {
  if (w.verified_at) return "verified";
  if (w.verificationCodeUsed) return "code_used";
  if (isVerificationCodeExpired(w)) return "code_expired";
  return "unverified";
}

const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  verified: "Баталгаажсан",
  code_used: "Код ашигласан",
  code_expired: "Код дууссан",
  unverified: "Баталгаажаагүй",
};

const VERIFICATION_BADGE: Record<VerificationStatus, string> = {
  verified: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  code_used: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  code_expired: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  unverified: "bg-muted text-muted-foreground",
};

export function verificationStatusText(w: Withdraw): string {
  return VERIFICATION_LABEL[getVerificationStatusKey(w)];
}

export function verificationStatusBadge(w: Withdraw): string {
  return VERIFICATION_BADGE[getVerificationStatusKey(w)];
}

export function canVerifyWithdraw(w: Withdraw, adminUid: string | null): boolean {
  if (!adminUid) return false;
  if (adminUid === SUPER_ADMIN_UID) {
    return w.status !== "verified";
  }
  return (
    w.status === "pending" &&
    !w.verified_at &&
    !isVerificationCodeExpired(w)
  );
}
