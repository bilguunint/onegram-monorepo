import { getFirebaseAuth } from "@/lib/firebase/client";

const VERIFY_ORDER_URL = "https://verifyorder-yuv3eg5qha-uc.a.run.app";

export type VerifyOrderRequest = {
  user_id: string;
  order_id: string;
  is_extraOrder: boolean;
  description: string;
};

export type VerifyOrderResponse = {
  status: "verified" | "already_verified" | string;
  metal_id?: number;
  qty?: number;
  performed_by?: string;
  [k: string]: unknown;
};

export async function verifyOrder(req: VerifyOrderRequest): Promise<VerifyOrderResponse> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new Error("Админ эрхээр нэвтэрсэн эсэхээ шалгана уу.");
  }
  const token = await user.getIdToken();
  const res = await fetch(VERIFY_ORDER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(req),
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    /* empty */
  }

  if (!res.ok) {
    const obj = (payload ?? {}) as Record<string, unknown>;
    const msg =
      (typeof obj.error === "string" && obj.error) ||
      (typeof obj.message === "string" && obj.message) ||
      (typeof obj.msg === "string" && obj.msg) ||
      `Үйлдэл амжилтгүй (${res.status}).`;
    throw new Error(msg);
  }
  return payload as VerifyOrderResponse;
}
