export type AdminRole = "admin" | "manager" | "accountant" | "seller";

export const VALID_ROLES: AdminRole[] = ["admin", "manager", "accountant", "seller"];

export function isValidRole(role: string | undefined | null): role is AdminRole {
  return !!role && (VALID_ROLES as string[]).includes(role);
}

export function defaultRouteForRole(role: AdminRole | null | undefined): string {
  if (role === "manager") return "/users";
  if (role === "seller") return "/";
  return "/";
}

export const ROLE_LABEL_MN: Record<AdminRole, string> = {
  admin: "Админ",
  manager: "Менежер",
  accountant: "Нягтлан",
  seller: "Худалдагч",
};
