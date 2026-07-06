import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";

// ---------------------------------------------------------------------------
// User-initiated installment cancellation requests (`installment_cancel_requests`),
// created by the requestInstallmentCancel Cloud Function from the app. Admin
// reviews here: approve → purchase becomes "cancelled" (refund recorded, the
// actual bank transfer is done manually); reject → purchase stays active.
// ---------------------------------------------------------------------------

export type CancelRequestStatus = "pending" | "approved" | "rejected";

export type InstallmentCancelRequest = {
  id: string;
  purchase_id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  product_name: string;
  paid_amount: number;
  paid_days: number;
  total_days: number;
  fee_percent: number;
  fee_amount: number;
  refund_amount: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  status: CancelRequestStatus | string;
  created_at: Timestamp | null;
  decided_at: Timestamp | null;
  decided_by_name: string;
};

function mapRequest(id: string, raw: DocumentData): InstallmentCancelRequest {
  const u = (raw.user_snapshot ?? {}) as DocumentData;
  return {
    id,
    purchase_id: String(raw.purchase_id ?? ""),
    user_id: String(raw.user_id ?? ""),
    user_name: `${u.last_name ?? ""} ${u.first_name ?? ""}`.trim(),
    user_phone: String(u.phone ?? ""),
    product_name: String(raw.product_name ?? ""),
    paid_amount: Number(raw.paid_amount ?? 0),
    paid_days: Number(raw.paid_days ?? 0),
    total_days: Number(raw.total_days ?? 0),
    fee_percent: Number(raw.fee_percent ?? 0),
    fee_amount: Number(raw.fee_amount ?? 0),
    refund_amount: Number(raw.refund_amount ?? 0),
    bank_name: String(raw.bank_name ?? ""),
    account_number: String(raw.account_number ?? ""),
    account_holder: String(raw.account_holder ?? ""),
    status: String(raw.status ?? "pending"),
    created_at: raw.created_at ?? null,
    decided_at: raw.decided_at ?? null,
    decided_by_name: String(raw.decided_by_name ?? ""),
  };
}

export async function fetchCancelRequests(): Promise<
  InstallmentCancelRequest[]
> {
  try {
    const snap = await getDocs(
      query(
        collection(getDb(), "installment_cancel_requests"),
        orderBy("created_at", "desc")
      )
    );
    return snap.docs.map((d) => mapRequest(d.id, d.data()));
  } catch {
    return [];
  }
}

/**
 * Approve: cancels the purchase (status "cancelled") and records the refund
 * split on it. The refund is recomputed from the purchase's CURRENT
 * paid_amount so a payment that landed between request and approval can't
 * leave a stale figure. Returns the final refund amount for the toast.
 */
export async function approveCancelRequest(
  req: InstallmentCancelRequest,
  admin: { uid: string; name: string }
): Promise<number> {
  const db = getDb();
  const purchaseRef = doc(db, "product_purchases", req.purchase_id);
  const purchaseSnap = await getDoc(purchaseRef);
  if (!purchaseSnap.exists()) {
    throw new Error("Худалдан авалт олдсонгүй.");
  }
  const p = purchaseSnap.data() as DocumentData;
  if (p.status !== "active") {
    throw new Error(`Худалдан авалт идэвхтэй биш байна (${p.status}).`);
  }

  const paid = Number(p.paid_amount ?? 0);
  const feePercent = req.fee_percent;
  const fee = Math.round((paid * feePercent) / 100);
  const refund = Math.max(0, paid - fee);

  const batch = writeBatch(db);
  batch.update(purchaseRef, {
    status: "cancelled",
    cancelled_at: serverTimestamp(),
    cancelled_by: admin.uid,
    cancel_reason: "Хэрэглэгчийн хүсэлтээр цуцлагдсан",
    refund_amount: refund,
    refund_fee: fee,
    cancel_request_status: "approved",
  });
  batch.update(doc(db, "installment_cancel_requests", req.id), {
    status: "approved",
    paid_amount: paid,
    fee_amount: fee,
    refund_amount: refund,
    decided_at: serverTimestamp(),
    decided_by: admin.uid,
    decided_by_name: admin.name,
  });
  await batch.commit();
  return refund;
}

/** Reject: the purchase stays active and the user may request again. */
export async function rejectCancelRequest(
  req: InstallmentCancelRequest,
  admin: { uid: string; name: string }
): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);
  batch.update(doc(db, "product_purchases", req.purchase_id), {
    cancel_request_status: deleteField(),
    cancel_request_id: deleteField(),
    cancel_requested_at: deleteField(),
  });
  batch.update(doc(db, "installment_cancel_requests", req.id), {
    status: "rejected",
    decided_at: serverTimestamp(),
    decided_by: admin.uid,
    decided_by_name: admin.name,
  });
  await batch.commit();
}
