import { getFirebaseAuth } from "@/lib/firebase/client";
import type { AdminRole } from "@/lib/auth/roles";

export type AdminListItem = {
  uid: string;
  name: string;
  email: string;
  role: string;
};

async function authedFetch<TRes>(
  url: string,
  init: RequestInit = {}
): Promise<TRes> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Нэвтрэх шаардлагатай.");
  const token = await user.getIdToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    /* response without body */
  }
  if (!res.ok) {
    const obj = (payload ?? {}) as Record<string, unknown>;
    const msg =
      (typeof obj.msg === "string" && obj.msg) ||
      (typeof obj.error === "string" && obj.error) ||
      `Алдаа гарлаа (${res.status}).`;
    throw new Error(msg);
  }
  return payload as TRes;
}

export async function listAdmins(): Promise<AdminListItem[]> {
  const res = await authedFetch<{ status: string; data: AdminListItem[] }>(
    "/api/admins"
  );
  return res.data || [];
}

export type CreateAdminRequest = {
  email: string;
  password: string;
  name: string;
  role: AdminRole;
};

export async function createAdmin(
  req: CreateAdminRequest
): Promise<AdminListItem> {
  const res = await authedFetch<{ status: string; data: AdminListItem }>(
    "/api/admins",
    {
      method: "POST",
      body: JSON.stringify(req),
    }
  );
  return res.data;
}

export async function deleteAdmin(uid: string): Promise<void> {
  await authedFetch<{ status: string }>(`/api/admins/${encodeURIComponent(uid)}`, {
    method: "DELETE",
  });
}
