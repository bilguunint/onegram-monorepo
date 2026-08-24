import { getFirebaseAuth } from "@/lib/firebase/client";

const VERIFY_WITHDRAW_URL = "https://verifywithdraw-yuv3eg5qha-uc.a.run.app";
const UPDATE_WITHDRAW_TYPE_URL =
  "https://us-central1-grammgold.cloudfunctions.net/updateWithdrawType";

export type WithdrawType = "sold_to_us" | "taken_physically";

export type VerifyWithdrawRequest = {
  verificationCode: string;
  withdrawId: string;
  withdrawType?: WithdrawType;
  bankName?: string;
  bankAccountNumber?: string;
  notes?: string;
  attachments?: string[];
};

export type VerifyWithdrawResponse = {
  status: string;
  metal_id?: number;
  quantity?: number;
  user_id?: string;
  performed_by?: string;
  [k: string]: unknown;
};

export async function verifyWithdraw(
  req: VerifyWithdrawRequest
): Promise<VerifyWithdrawResponse> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new Error("Хэрэглэгч нэвтрээгүй байна.");
  }
  const token = await user.getIdToken();
  const res = await fetch(VERIFY_WITHDRAW_URL, {
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
    /* no body */
  }

  if (!res.ok) {
    const obj = (payload ?? {}) as Record<string, unknown>;
    let msg: string =
      (typeof obj.error === "string" && obj.error) ||
      (typeof obj.message === "string" && obj.message) ||
      (typeof obj.msg === "string" && obj.msg) ||
      "";
    if (!msg) {
      if (res.status === 401) msg = "Нэвтрэх эрх хангалтгүй.";
      else if (res.status === 403) msg = "Хандах эрх хангалтгүй — Админ эрх шаардлагатай.";
      else if (res.status === 404) msg = "Биетээр авах хүсэлт олдсонгүй.";
      else if (res.status === 400) msg = "Баталгаажуулах код буруу эсвэл хүчингүй.";
      else msg = `Үйлдэл амжилтгүй (${res.status}).`;
    }
    throw new Error(msg);
  }
  return payload as VerifyWithdrawResponse;
}

/**
 * Corrects a mis-recorded withdraw type. Runs server-side because
 * firestore.rules denies every client write to `withdraws`; the function also
 * enforces that bank details accompany "sold_to_us" and are cleared otherwise.
 */
export async function updateWithdrawType(req: {
  withdrawId: string;
  withdrawType: WithdrawType;
  bankName?: string;
  bankAccountNumber?: string;
  notes?: string;
}): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Хэрэглэгч нэвтрээгүй байна.");
  const token = await user.getIdToken();
  const res = await fetch(UPDATE_WITHDRAW_TYPE_URL, {
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
    /* no body */
  }
  if (!res.ok) {
    const obj = (payload ?? {}) as Record<string, unknown>;
    const msg =
      (typeof obj.error === "string" && obj.error) ||
      (res.status === 403
        ? "Хандах эрх хангалтгүй — Админ эрх шаардлагатай."
        : `Үйлдэл амжилтгүй (${res.status}).`);
    throw new Error(msg);
  }
}
