import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
  type DocumentData,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";

export type DateRange = "week" | "month" | "year" | "all";
export type PaymentStatus = "pending" | "success" | "";
export type AdminStatus = "pending" | "success" | "rejected" | "";
export type ProductFilter = "gold" | "silver" | "";

export type OrderClient = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
};

export type Order = {
  id: string;
  user_id?: string;
  client?: OrderClient;
  metal_id?: number;
  prod_type?: string;
  type?: string;
  quantity?: number;
  price?: number;
  amount?: number;
  payment_status?: string;
  admin_status?: string;
  qpay_description?: string;
  description?: string;
  is_extraOrder?: boolean;
  verified_at?: Timestamp | string | null;
  verified_by_name?: string;
  verified_by_uid?: string;
  created_at?: Timestamp | null;
};

function mapOrderDoc(id: string, raw: DocumentData): Order {
  return {
    id,
    user_id: raw.user_id,
    client: raw.client as OrderClient | undefined,
    metal_id: raw.metal_id,
    prod_type: raw.prod_type,
    type: raw.type,
    quantity: raw.quantity,
    price: raw.price,
    amount: raw.amount,
    payment_status: raw.payment_status,
    admin_status: raw.admin_status,
    qpay_description: raw.qpay_description,
    description: raw.description,
    is_extraOrder: raw.is_extraOrder,
    verified_at: raw.verified_at ?? null,
    verified_by_name: raw.verified_by_name,
    verified_by_uid: raw.verified_by_uid,
    created_at: raw.created_at ?? null,
  };
}

function rangeStartDate(range: DateRange): Date | null {
  if (range === "all") return null;
  const now = new Date();
  if (range === "week") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (range === "month") {
    return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  }
  return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
}

export async function fetchOrdersByDateRange(range: DateRange): Promise<Order[]> {
  const col = collection(getDb(), "orders");
  const start = rangeStartDate(range);
  const q = start
    ? query(col, where("created_at", ">=", Timestamp.fromDate(start)))
    : query(col);
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapOrderDoc(d.id, d.data()));
}
