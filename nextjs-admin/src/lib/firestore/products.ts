import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { getDb, getFirebaseAuth } from "@/lib/firebase/client";

export type ProductStatus = "active" | "inactive";

export type Product = {
  id: string;
  name: string;
  description?: string;
  images: string[]; // Firebase Storage download URLs
  price: number; // MNT
  min_months: number;
  max_months: number;
  cancel_fee_percent: number; // 0-100
  stock: number | null; // null = unlimited
  status: ProductStatus;
  created_at: Timestamp | null;
  updated_at: Timestamp | null;
  created_by?: string;
  updated_by?: string;
};

export type ProductDraft = {
  name: string;
  description: string;
  images: string[];
  price: number;
  min_months: number;
  max_months: number;
  cancel_fee_percent: number;
  stock: number | null;
  status: ProductStatus;
};

function mapProduct(id: string, raw: DocumentData): Product {
  return {
    id,
    name: String(raw.name ?? ""),
    description: raw.description ?? "",
    images: Array.isArray(raw.images) ? (raw.images as string[]) : [],
    price: Number(raw.price ?? 0),
    min_months: Number(raw.min_months ?? 1),
    max_months: Number(raw.max_months ?? 12),
    cancel_fee_percent: Number(raw.cancel_fee_percent ?? 0),
    stock: raw.stock == null ? null : Number(raw.stock),
    status:
      raw.status === "inactive" ? "inactive" : ("active" as ProductStatus),
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
    created_by: raw.created_by,
    updated_by: raw.updated_by,
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const q = query(collection(getDb(), "products"), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapProduct(d.id, d.data()));
}

export async function fetchProduct(productId: string): Promise<Product | null> {
  const snap = await getDoc(doc(getDb(), "products", productId));
  if (!snap.exists()) return null;
  return mapProduct(snap.id, snap.data());
}

/**
 * Reserve a Firestore-generated doc ID without writing the document yet.
 * Used so that image uploads can be placed at products/{id}/... before the
 * doc actually exists, then setDoc with the final draft.
 */
export function newProductRef() {
  return doc(collection(getDb(), "products"));
}

function currentAdminUid(): string {
  const u = getFirebaseAuth().currentUser;
  if (!u) throw new Error("Нэвтрээгүй байна.");
  return u.uid;
}

export async function createProduct(
  id: string,
  draft: ProductDraft
): Promise<void> {
  const uid = currentAdminUid();
  await setDoc(doc(getDb(), "products", id), {
    name: draft.name.trim(),
    description: draft.description.trim(),
    images: draft.images,
    price: draft.price,
    min_months: draft.min_months,
    max_months: draft.max_months,
    cancel_fee_percent: draft.cancel_fee_percent,
    stock: draft.stock,
    status: draft.status,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    created_by: uid,
    updated_by: uid,
  });
}

export async function updateProduct(
  id: string,
  draft: ProductDraft
): Promise<void> {
  const uid = currentAdminUid();
  await updateDoc(doc(getDb(), "products", id), {
    name: draft.name.trim(),
    description: draft.description.trim(),
    images: draft.images,
    price: draft.price,
    min_months: draft.min_months,
    max_months: draft.max_months,
    cancel_fee_percent: draft.cancel_fee_percent,
    stock: draft.stock,
    status: draft.status,
    updated_at: serverTimestamp(),
    updated_by: uid,
  });
}

export async function setProductStatus(
  id: string,
  status: ProductStatus
): Promise<void> {
  const uid = currentAdminUid();
  await updateDoc(doc(getDb(), "products", id), {
    status,
    updated_at: serverTimestamp(),
    updated_by: uid,
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), "products", id));
}

// Re-export addDoc for any callers that need it (e.g. unrelated collections)
export { addDoc };
