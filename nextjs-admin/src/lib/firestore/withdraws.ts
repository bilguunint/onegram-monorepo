import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
  type DocumentData,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";

export type WithdrawDateRange = "week" | "month" | "year" | "all";
export type WithdrawStatus = "pending" | "verified" | "rejected" | "completed" | "";
export type WithdrawMetal = "gold" | "silver" | "";
export type WithdrawVerificationFilter =
  | "verified"
  | "unverified"
  | "code_used"
  | "code_not_used"
  | "";

export type WithdrawClient = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
};

export type Withdraw = {
  id: string;
  user_id?: string;
  client?: WithdrawClient;
  metal_id?: number;
  quantity?: number;
  price?: number;
  status?: string;
  withdraw_type?: string;
  notes?: string;
  bank_name?: string;
  bank_account_number?: string;
  attachments?: string[];
  verificationCode?: string;
  verificationCodeUsed?: boolean;
  verificationCodeExpiresAt?: Timestamp | null;
  verified_at?: Timestamp | null;
  verified_by_name?: string;
  verified_by_uid?: string;
  created_at?: Timestamp | null;
  updated_at?: Timestamp | null;
};

function mapWithdrawDoc(id: string, raw: DocumentData): Withdraw {
  return {
    id,
    user_id: raw.user_id,
    client: raw.client as WithdrawClient | undefined,
    metal_id: raw.metal_id,
    quantity: raw.quantity,
    price: raw.price,
    status: raw.status,
    withdraw_type: raw.withdraw_type,
    notes: raw.notes,
    bank_name: raw.bank_name,
    bank_account_number: raw.bank_account_number,
    attachments: Array.isArray(raw.attachments) ? raw.attachments : undefined,
    verificationCode: raw.verificationCode,
    verificationCodeUsed: raw.verificationCodeUsed,
    verificationCodeExpiresAt: raw.verificationCodeExpiresAt ?? null,
    verified_at: raw.verified_at ?? null,
    verified_by_name: raw.verified_by_name,
    verified_by_uid: raw.verified_by_uid,
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
  };
}

export async function findWithdrawByVerificationCode(
  code: string
): Promise<Withdraw | null> {
  const col = collection(getDb(), "withdraws");
  const q = query(col, where("verificationCode", "==", code));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return mapWithdrawDoc(d.id, d.data());
}

function rangeStartDate(range: WithdrawDateRange): Date | null {
  if (range === "all") return null;
  const now = new Date();
  if (range === "week") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (range === "month")
    return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
}

export async function fetchWithdrawsByDateRange(
  range: WithdrawDateRange
): Promise<Withdraw[]> {
  const col = collection(getDb(), "withdraws");
  const start = rangeStartDate(range);
  const q = start
    ? query(col, where("created_at", ">=", Timestamp.fromDate(start)))
    : query(col);
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapWithdrawDoc(d.id, d.data()));
}
