import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { getDb, getFirebaseAuth } from "@/lib/firebase/client";

export type ProductPurchaseStatus =
  | "active"
  | "completed"
  | "delivered"
  | "cancelled";

export type ProductSnapshot = {
  name: string;
  image: string | null;
  price: number;
  cancel_fee_percent: number;
};

export type UserSnapshot = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
};

export type PaymentRecord = {
  day_no: number;
  amount: number;
  paid_at: Timestamp | string | null;
  payment_method?: string;
  transaction_id?: string;
};

export type ProductPurchase = {
  id: string;
  product_id: string;
  product_snapshot: ProductSnapshot;
  user_id: string;
  user_snapshot: UserSnapshot;
  total_price: number;
  /** Per-day installment amount (= ceil(total_price / total_days)). */
  daily_payment: number;
  /** User-selected duration in months (display only). */
  months: number;
  /** Number of daily installments (= months * 30). */
  total_days: number;
  paid_amount: number;
  paid_days: number;
  /** Date by which all daily payments should be made. */
  deadline: Timestamp | null;
  status: ProductPurchaseStatus;
  started_at: Timestamp | null;
  completed_at: Timestamp | null;
  cancelled_at: Timestamp | null;
  cancelled_by?: string;
  cancel_reason?: string;
  refund_amount?: number;
  refund_fee?: number;
  delivered_at: Timestamp | null;
  delivered_by?: string;
  delivered_by_name?: string;
  pickup_code?: string;
  payments?: PaymentRecord[];
};

function mapPurchase(id: string, raw: DocumentData): ProductPurchase {
  const ps = (raw.product_snapshot ?? {}) as Partial<ProductSnapshot>;
  const us = (raw.user_snapshot ?? {}) as Partial<UserSnapshot>;
  return {
    id,
    product_id: String(raw.product_id ?? ""),
    product_snapshot: {
      name: ps.name ?? "",
      image: ps.image ?? null,
      price: Number(ps.price ?? 0),
      cancel_fee_percent: Number(ps.cancel_fee_percent ?? 0),
    },
    user_id: String(raw.user_id ?? ""),
    user_snapshot: {
      first_name: us.first_name,
      last_name: us.last_name,
      phone: us.phone,
      email: us.email,
    },
    total_price: Number(raw.total_price ?? 0),
    daily_payment: Number(raw.daily_payment ?? 0),
    months: Number(raw.months ?? 0),
    total_days: Number(
      raw.total_days ?? Number(raw.months ?? 0) * 30
    ),
    paid_amount: Number(raw.paid_amount ?? 0),
    paid_days: Number(raw.paid_days ?? 0),
    deadline: raw.deadline ?? null,
    status: (raw.status ?? "active") as ProductPurchaseStatus,
    started_at: raw.started_at ?? null,
    completed_at: raw.completed_at ?? null,
    cancelled_at: raw.cancelled_at ?? null,
    cancelled_by: raw.cancelled_by,
    cancel_reason: raw.cancel_reason,
    refund_amount:
      raw.refund_amount == null ? undefined : Number(raw.refund_amount),
    refund_fee: raw.refund_fee == null ? undefined : Number(raw.refund_fee),
    delivered_at: raw.delivered_at ?? null,
    delivered_by: raw.delivered_by,
    delivered_by_name: raw.delivered_by_name,
    pickup_code: raw.pickup_code,
    payments: Array.isArray(raw.payments)
      ? (raw.payments as PaymentRecord[])
      : undefined,
  };
}

export async function fetchAllProductPurchases(): Promise<ProductPurchase[]> {
  const q = query(
    collection(getDb(), "product_purchases"),
    orderBy("started_at", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapPurchase(d.id, d.data()));
}

export async function fetchPurchasesForProduct(
  productId: string
): Promise<ProductPurchase[]> {
  const q = query(
    collection(getDb(), "product_purchases"),
    where("product_id", "==", productId),
    orderBy("started_at", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapPurchase(d.id, d.data()));
}

export async function countActivePurchasesForProduct(
  productId: string
): Promise<number> {
  const q = query(
    collection(getDb(), "product_purchases"),
    where("product_id", "==", productId),
    where("status", "in", ["active", "completed"])
  );
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

function currentAdminUid(): string {
  const u = getFirebaseAuth().currentUser;
  if (!u) throw new Error("Нэвтрээгүй байна.");
  return u.uid;
}

/** Who is acting, in a form the purchases table can show as-is. */
function currentAdminIdentity(): {
  uid: string;
  name: string;
  email: string | null;
} {
  const u = getFirebaseAuth().currentUser;
  if (!u) throw new Error("Нэвтрээгүй байна.");
  return {
    uid: u.uid,
    name: u.displayName || u.email || u.uid,
    email: u.email,
  };
}

export type CancelPurchaseInput = {
  reason: string;
  refundAmount: number;
  refundFee: number;
};

export async function cancelProductPurchase(
  purchaseId: string,
  input: CancelPurchaseInput
): Promise<void> {
  const uid = currentAdminUid();
  await updateDoc(doc(getDb(), "product_purchases", purchaseId), {
    status: "cancelled",
    cancelled_at: serverTimestamp(),
    cancelled_by: uid,
    cancel_reason: input.reason.trim(),
    refund_amount: input.refundAmount,
    refund_fee: input.refundFee,
  });
}

/**
 * Mark a completed purchase as delivered. The admin must enter the 6-digit
 * `pickup_code` that the user has on their phone; the function fetches the
 * purchase doc, compares codes server-side, and throws on mismatch so the
 * caller can surface an inline error in the dialog.
 */
export async function deliverProductPurchase(
  purchaseId: string,
  enteredCode: string
): Promise<void> {
  const actor = currentAdminIdentity();
  const ref = doc(getDb(), "product_purchases", purchaseId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error("Худалдан авалт олдсонгүй.");
  }
  const data = snap.data() as DocumentData;
  if (data.status === "delivered") {
    throw new Error("Энэ худалдан авалт аль хэдийн хүлээлгэн өгөгдсөн байна.");
  }
  if (data.status !== "completed") {
    throw new Error(
      "Зөвхөн төлбөр бүрэн төлөгдсөн худалдан авалтыг хүлээлгэн өгч болно."
    );
  }
  const expected = String(data.pickup_code ?? "").trim();
  const provided = enteredCode.trim();
  if (!expected) {
    throw new Error("Энэ худалдан авалт дээр код байхгүй байна.");
  }
  if (expected !== provided) {
    throw new Error("Код буруу байна. Хэрэглэгчийн утаснаас уншсан 6 оронтой кодыг шалгана уу.");
  }
  await updateDoc(ref, {
    status: "delivered",
    delivered_at: serverTimestamp(),
    delivered_by: actor.uid,
    delivered_by_name: actor.name,
    delivered_by_email: actor.email,
  });
}
