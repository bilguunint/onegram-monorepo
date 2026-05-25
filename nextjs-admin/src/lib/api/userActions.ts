import { getFirebaseAuth } from "@/lib/firebase/client";

const RESET_PIN_URL = "https://resetpin-yuv3eg5qha-uc.a.run.app";
const MAKE_INVESTMENT_URL = "https://makeinvest-yuv3eg5qha-uc.a.run.app";

export type ResetPinResponse = {
  status: "success" | "failed";
  msg: string;
  data?: {
    userId: string;
    userPhone: string;
    resetBy: string;
    resetByRole: string;
    resetAt: string;
  };
};

export type MakeInvestmentRequest = {
  userId: string;
  quantity: number;
  endDate: string;
};

export type MakeInvestmentResponse = {
  status: "success" | "failed";
  msg: string;
  data?: {
    userId: string;
    investmentAmount: number;
    previousGoldBalance: number;
    newGoldBalance: number;
    endDate: string;
    verifiedBy: string;
  };
};

async function authedFetch<TBody, TRes>(
  url: string,
  body: TBody,
  forceRefresh = false
): Promise<TRes> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new Error("Нэвтрэх шаардлагатай.");
  }
  const token = await user.getIdToken(forceRefresh);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
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
      (typeof obj.message === "string" && obj.message) ||
      `Алдаа гарлаа (${res.status}).`;
    throw new Error(msg);
  }
  return payload as TRes;
}

export function resetUserPin(userId: string): Promise<ResetPinResponse> {
  return authedFetch<{ userId: string }, ResetPinResponse>(RESET_PIN_URL, {
    userId,
  });
}

export function makeInvestment(
  req: MakeInvestmentRequest
): Promise<MakeInvestmentResponse> {
  if (!req.userId || req.quantity <= 0 || !req.endDate) {
    return Promise.reject(new Error("Бүх талбарыг зөв бөглөнө үү."));
  }
  return authedFetch<MakeInvestmentRequest, MakeInvestmentResponse>(
    MAKE_INVESTMENT_URL,
    req,
    true
  );
}
