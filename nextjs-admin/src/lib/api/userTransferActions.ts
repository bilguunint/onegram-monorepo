import { getFirebaseAuth } from "@/lib/firebase/client";

export type TransferBalance = { gold: number; silver: number; saving: number };

export type TransferUserSummary = {
  uid: string;
  exists: boolean;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  balance?: TransferBalance;
  invest_total?: number;
  merged_into?: string | null;
  merge_in_progress?: string | null;
};

export type TransferCounts = {
  orders: number;
  withdraws: number;
  product_purchases: number;
  pending_invoices: number;
  security_logs: number;
  gifts_as_sender: number;
  gifts_as_receiver: number;
  notifications: number;
  lottery_tickets: number;
  campaign_tickets: number;
  campaign_participants: number;
  center_tree_orders: number;
  center_donations: number;
  installment_cancel_requests: number;
  ledger_entries: number;
  investment: boolean;
};

export type TransferPreview = {
  source: TransferUserSummary;
  target: TransferUserSummary;
  counts: TransferCounts;
  alreadyMerged: boolean;
};

export type TransferResult = {
  auditId: string;
  counts: Record<string, number>;
  balances: {
    source: TransferBalance;
    targetBefore: TransferBalance;
    targetAfter: TransferBalance;
  };
  skipped: string[];
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
    /* no body */
  }
  if (!res.ok) {
    const obj = (payload ?? {}) as Record<string, unknown>;
    const msg =
      (typeof obj.msg === "string" && obj.msg) ||
      `Алдаа гарлаа (${res.status}).`;
    throw new Error(msg);
  }
  return payload as TRes;
}

export type MigrationRecord = {
  id: string;
  source_uid: string;
  target_uid: string;
  source_name: string;
  target_name: string;
  source_phone: string;
  target_phone: string;
  performed_by_name: string;
  performed_by_uid: string;
  status: string;
  counts: Record<string, number>;
  total_moved: number;
  error: string | null;
  note: string | null;
  created_at: number | null;
  completed_at: number | null;
};

export async function fetchTransferHistory(): Promise<MigrationRecord[]> {
  const res = await authedFetch<{ status: string; data: MigrationRecord[] }>(
    "/api/user-transfer/history",
    { method: "GET" }
  );
  return res.data;
}

export async function previewUserTransfer(
  sourceUid: string,
  targetUid: string
): Promise<TransferPreview> {
  const res = await authedFetch<{ status: string; data: TransferPreview }>(
    "/api/user-transfer/preview",
    { method: "POST", body: JSON.stringify({ sourceUid, targetUid }) }
  );
  return res.data;
}

export async function executeUserTransfer(
  sourceUid: string,
  targetUid: string,
  confirmPhone: string
): Promise<TransferResult> {
  const res = await authedFetch<{ status: string; data: TransferResult }>(
    "/api/user-transfer/execute",
    {
      method: "POST",
      body: JSON.stringify({ sourceUid, targetUid, confirmPhone }),
    }
  );
  return res.data;
}
