import {
  collection,
  doc,
  getCountFromServer,
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
  month_no: number;
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
  monthly_payment: number;
  months: number;
  paid_amount: number;
  paid_months: number;
  next_due_date: Timestamp | null;
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
    monthly_payment: Number(raw.monthly_payment ?? 0),
    months: Number(raw.months ?? 0),
    paid_amount: Number(raw.paid_amount ?? 0),
    paid_months: Number(raw.paid_months ?? 0),
    next_due_date: raw.next_due_date ?? null,
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

export async function deliverProductPurchase(purchaseId: string): Promise<void> {
  const uid = currentAdminUid();
  await updateDoc(doc(getDb(), "product_purchases", purchaseId), {
    status: "delivered",
    delivered_at: serverTimestamp(),
    delivered_by: uid,
  });
}
