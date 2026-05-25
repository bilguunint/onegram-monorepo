import {
  collection,
  getDocs,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";

export type GiftStatus = "pending" | "sent" | "received" | "cancelled" | "";

export type GiftParty = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
};

export type GiftOrder = {
  id: string;
  sender?: GiftParty;
  receiver?: GiftParty;
  metal_id?: number;
  quantity?: number;
  greeting?: string;
  status?: string;
  created_at?: Timestamp | null;
  updated_at?: Timestamp | null;
  cancelled_at?: Timestamp | null;
  received_at?: Timestamp | null;
};

function mapGiftDoc(id: string, raw: DocumentData): GiftOrder {
  return {
    id,
    sender: raw.sender as GiftParty | undefined,
    receiver: raw.receiver as GiftParty | undefined,
    metal_id: raw.metal_id,
    quantity: raw.quantity,
    greeting: raw.greeting,
    status: raw.status,
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
    cancelled_at: raw.cancelled_at ?? null,
    received_at: raw.received_at ?? null,
  };
}

export async function fetchGiftOrders(): Promise<GiftOrder[]> {
  const snap = await getDocs(collection(getDb(), "gift_orders"));
  return snap.docs.map((d) => mapGiftDoc(d.id, d.data()));
}
