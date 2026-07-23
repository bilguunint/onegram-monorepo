import {
  collection,
  doc,
  deleteDoc,
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

// ---------------------------------------------------------------------------
// "Дэлхийн морин хуурын төв цогцолбор" fundraising campaign.
//  - center_campaign/main      — single config doc (target amount, status…)
//  - center_products           — physical products for sale
//  - center_donations          — direct-purchase donation records (Phase 2)
// ---------------------------------------------------------------------------

export type CampaignStatus = "active" | "ended";
export type CenterItemStatus = "active" | "inactive";

export type CenterCampaign = {
  name: string;
  description: string;
  cover_image: string | null;
  header_image: string | null; // 21:9 banner shown atop the app detail screen
  gallery: string[]; // gallery photos shown in the app
  target_amount: number; // MNT
  top_count: number; // donors engraved (e.g. 99)
  status: CampaignStatus;
  updated_at: Timestamp | null;
};

export type CenterCampaignDraft = {
  name: string;
  description: string;
  cover_image: string | null;
  header_image: string | null;
  target_amount: number;
  top_count: number;
  status: CampaignStatus;
};

export type CenterProduct = {
  id: string;
  name: string;
  description: string;
  images: string[];
  price: number; // MNT
  stock: number | null; // null = unlimited / made-to-order
  status: CenterItemStatus;
  sold_count: number;
  created_at: Timestamp | null;
  updated_at: Timestamp | null;
};

export type CenterProductDraft = {
  name: string;
  description: string;
  images: string[];
  price: number;
  stock: number | null;
  status: CenterItemStatus;
};

export type CenterDonationItem = {
  type: "product";
  id: string;
  name: string;
  qty: number;
  price: number;
};

export type CenterDonation = {
  id: string;
  buyer_uid: string;
  buyer_name: string;
  engrave_name: string;
  anonymous: boolean;
  items: CenterDonationItem[];
  amount: number;
  status: "completed" | "pending" | "cancelled" | string;
  delivery_status: "pending" | "delivered" | string;
  pickup_code: string;
  delivered_at: Timestamp | null;
  delivered_by_name: string;
  created_at: Timestamp | null;
};

// ---------------------------------------------------------------------------
// Campaign config
// ---------------------------------------------------------------------------
const CAMPAIGN_DOC = () => doc(getDb(), "center_campaign", "main");

const DEFAULT_CAMPAIGN: CenterCampaign = {
  name: "Дэлхийн морин хуурын төв цогцолбор",
  description: "",
  cover_image: null,
  header_image: null,
  gallery: [],
  target_amount: 10_000_000_000, // 10 тэрбум төгрөг
  top_count: 99,
  status: "active",
  updated_at: null,
};

export async function fetchCampaign(): Promise<CenterCampaign> {
  const snap = await getDoc(CAMPAIGN_DOC());
  if (!snap.exists()) return DEFAULT_CAMPAIGN;
  const d = snap.data() as Partial<CenterCampaign>;
  return {
    name: d.name ?? DEFAULT_CAMPAIGN.name,
    description: d.description ?? "",
    cover_image: d.cover_image ?? null,
    header_image: d.header_image ?? null,
    gallery: Array.isArray(d.gallery) ? (d.gallery as string[]) : [],
    target_amount: Number(d.target_amount ?? 0),
    top_count: Number(d.top_count ?? 99),
    status: d.status === "ended" ? "ended" : "active",
    updated_at: d.updated_at ?? null,
  };
}

/** Persist only the gallery photos, leaving other campaign config untouched. */
export async function saveGallery(gallery: string[]): Promise<void> {
  await setDoc(
    CAMPAIGN_DOC(),
    { gallery, updated_at: serverTimestamp() },
    { merge: true }
  );
}

export async function saveCampaign(draft: CenterCampaignDraft): Promise<void> {
  await setDoc(
    CAMPAIGN_DOC(),
    {
      name: draft.name.trim(),
      description: draft.description.trim(),
      cover_image: draft.cover_image,
      header_image: draft.header_image,
      target_amount: Math.max(0, Math.round(draft.target_amount)),
      top_count: Math.max(1, Math.round(draft.top_count)),
      status: draft.status,
      updated_at: serverTimestamp(),
    },
    { merge: true }
  );
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
function adminUid(): string {
  const u = getFirebaseAuth().currentUser;
  if (!u) throw new Error("Нэвтрэх шаардлагатай.");
  return u.uid;
}

function mapProduct(id: string, raw: DocumentData): CenterProduct {
  return {
    id,
    name: String(raw.name ?? ""),
    description: String(raw.description ?? ""),
    images: Array.isArray(raw.images) ? (raw.images as string[]) : [],
    price: Number(raw.price ?? 0),
    stock: raw.stock == null ? null : Number(raw.stock),
    status: raw.status === "inactive" ? "inactive" : "active",
    sold_count: Number(raw.sold_count ?? 0),
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
  };
}

export function newCenterProductRef() {
  return doc(collection(getDb(), "center_products"));
}

export async function fetchCenterProducts(): Promise<CenterProduct[]> {
  const snap = await getDocs(
    query(collection(getDb(), "center_products"), orderBy("created_at", "desc"))
  );
  return snap.docs.map((d) => mapProduct(d.id, d.data()));
}

export async function createCenterProduct(
  id: string,
  draft: CenterProductDraft
): Promise<void> {
  const uid = adminUid();
  await setDoc(doc(getDb(), "center_products", id), {
    name: draft.name.trim(),
    description: draft.description.trim(),
    images: draft.images,
    price: Math.round(draft.price),
    stock: draft.stock,
    status: draft.status,
    sold_count: 0,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    created_by: uid,
  });
}

export async function updateCenterProduct(
  id: string,
  draft: CenterProductDraft
): Promise<void> {
  await updateDoc(doc(getDb(), "center_products", id), {
    name: draft.name.trim(),
    description: draft.description.trim(),
    images: draft.images,
    price: Math.round(draft.price),
    stock: draft.stock,
    status: draft.status,
    updated_at: serverTimestamp(),
  });
}

export async function setCenterProductStatus(
  id: string,
  status: CenterItemStatus
): Promise<void> {
  await updateDoc(doc(getDb(), "center_products", id), {
    status,
    updated_at: serverTimestamp(),
  });
}

export async function deleteCenterProduct(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), "center_products", id));
}

// ---------------------------------------------------------------------------
// Trees (мод тарих) — product shape + botanical fields, in `center_trees`.
// Categories (Шилмүүст мод, Навчит мод…) live in `center_tree_categories`.
// ---------------------------------------------------------------------------
export type CenterTreeCategory = {
  id: string;
  name: string;
  order: number; // display order in the app (ascending)
};

export type CenterTree = CenterProduct & {
  category_id: string | null;
  mature_height: string; // Нас бие хүрсэн өндөр, e.g. "20–35 м"
  lifespan: string; // Насжилт, e.g. "300–500 жил"
  features: string; // Онцлог
};

export type CenterTreeDraft = CenterProductDraft & {
  category_id: string | null;
  mature_height: string;
  lifespan: string;
  features: string;
};

function mapTree(id: string, raw: DocumentData): CenterTree {
  return {
    ...mapProduct(id, raw),
    category_id: raw.category_id == null ? null : String(raw.category_id),
    mature_height: String(raw.mature_height ?? ""),
    lifespan: String(raw.lifespan ?? ""),
    features: String(raw.features ?? ""),
  };
}

export function newCenterTreeRef() {
  return doc(collection(getDb(), "center_trees"));
}

export async function fetchCenterTrees(): Promise<CenterTree[]> {
  const snap = await getDocs(
    query(collection(getDb(), "center_trees"), orderBy("created_at", "desc"))
  );
  return snap.docs.map((d) => mapTree(d.id, d.data()));
}

function treeDraftData(draft: CenterTreeDraft) {
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    images: draft.images,
    price: Math.round(draft.price),
    status: draft.status,
    category_id: draft.category_id,
    mature_height: draft.mature_height.trim(),
    lifespan: draft.lifespan.trim(),
    features: draft.features.trim(),
  };
}

export async function createCenterTree(
  id: string,
  draft: CenterTreeDraft
): Promise<void> {
  const uid = adminUid();
  await setDoc(doc(getDb(), "center_trees", id), {
    ...treeDraftData(draft),
    stock: draft.stock,
    sold_count: 0,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    created_by: uid,
  });
}

/**
 * Cloud Functions decrement `stock` as trees sell, so an edit form loaded
 * minutes ago holds a stale value. Only write stock back when the admin
 * actually changed it (`stockChanged`), otherwise leave the live count alone.
 */
export async function updateCenterTree(
  id: string,
  draft: CenterTreeDraft,
  opts: { stockChanged: boolean } = { stockChanged: true }
): Promise<void> {
  await updateDoc(doc(getDb(), "center_trees", id), {
    ...treeDraftData(draft),
    ...(opts.stockChanged ? { stock: draft.stock } : {}),
    updated_at: serverTimestamp(),
  });
}

export async function fetchTreeCategories(): Promise<CenterTreeCategory[]> {
  try {
    const snap = await getDocs(collection(getDb(), "center_tree_categories"));
    return snap.docs
      .map((d) => {
        const x = d.data();
        return {
          id: d.id,
          name: String(x.name ?? ""),
          order: Number(x.order ?? 0),
        };
      })
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

export async function createTreeCategory(
  name: string,
  order: number
): Promise<void> {
  const uid = adminUid();
  await setDoc(doc(collection(getDb(), "center_tree_categories")), {
    name: name.trim(),
    order: Math.round(order),
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    created_by: uid,
  });
}

export async function updateTreeCategory(
  id: string,
  data: { name: string; order: number }
): Promise<void> {
  await updateDoc(doc(getDb(), "center_tree_categories", id), {
    name: data.name.trim(),
    order: Math.round(data.order),
    updated_at: serverTimestamp(),
  });
}

export async function deleteTreeCategory(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), "center_tree_categories", id));
}

export async function setCenterTreeStatus(
  id: string,
  status: CenterItemStatus
): Promise<void> {
  await updateDoc(doc(getDb(), "center_trees", id), {
    status,
    updated_at: serverTimestamp(),
  });
}

export async function deleteCenterTree(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), "center_trees", id));
}

// ---------------------------------------------------------------------------
// Tree-planting orders (`center_tree_orders`, written by Cloud Functions).
// ---------------------------------------------------------------------------
export type CenterTreeOrder = {
  id: string;
  buyer_uid: string;
  buyer_name: string;
  tree_name: string;
  label_name: string;
  qty: number;
  amount: number;
  status: string;
  planting_status: "pending" | "planted" | string;
  planted_by_name: string;
  planted_at: Timestamp | null;
  created_at: Timestamp | null;
};

export async function fetchTreeOrders(): Promise<CenterTreeOrder[]> {
  try {
    const snap = await getDocs(
      query(
        collection(getDb(), "center_tree_orders"),
        orderBy("created_at", "desc")
      )
    );
    return snap.docs.map((d) => {
      const x = d.data();
      return {
        id: d.id,
        buyer_uid: String(x.buyer_uid ?? ""),
        buyer_name: String(x.buyer_name ?? ""),
        tree_name: String(x.tree_name ?? ""),
        label_name: String(x.label_name ?? ""),
        qty: Number(x.qty ?? 1),
        amount: Number(x.amount ?? 0),
        status: String(x.status ?? "pending"),
        planting_status: String(x.planting_status ?? "pending"),
        planted_by_name: String(x.planted_by_name ?? ""),
        planted_at: x.planted_at ?? null,
        created_at: x.created_at ?? null,
      };
    });
  } catch {
    return [];
  }
}

/** Admin marks a tree order as physically planted (шошготойгоо). */
export async function markTreePlanted(
  id: string,
  admin: { uid: string; name: string }
): Promise<void> {
  await updateDoc(doc(getDb(), "center_tree_orders", id), {
    planting_status: "planted",
    planted_at: serverTimestamp(),
    planted_by: admin.uid,
    planted_by_name: admin.name,
  });
}

// ---------------------------------------------------------------------------
// Donations + stats (top donors, total raised)
// ---------------------------------------------------------------------------
function mapDonation(id: string, raw: DocumentData): CenterDonation {
  return {
    id,
    buyer_uid: String(raw.buyer_uid ?? ""),
    buyer_name: String(raw.buyer_name ?? ""),
    engrave_name: String(raw.engrave_name ?? ""),
    anonymous: !!raw.anonymous,
    items: Array.isArray(raw.items) ? (raw.items as CenterDonationItem[]) : [],
    amount: Number(raw.amount ?? 0),
    status: String(raw.status ?? "pending"),
    delivery_status: String(raw.delivery_status ?? "pending"),
    pickup_code: String(raw.pickup_code ?? ""),
    delivered_at: raw.delivered_at ?? null,
    delivered_by_name: String(raw.delivered_by_name ?? ""),
    created_at: raw.created_at ?? null,
  };
}

/** Admin marks a donation's physical product handed over to the buyer. */
export async function markDonationDelivered(
  id: string,
  admin: { uid: string; name: string }
): Promise<void> {
  await updateDoc(doc(getDb(), "center_donations", id), {
    delivery_status: "delivered",
    delivered_at: serverTimestamp(),
    delivered_by: admin.uid,
    delivered_by_name: admin.name,
  });
}

export async function fetchCenterDonations(): Promise<CenterDonation[]> {
  try {
    const snap = await getDocs(
      query(
        collection(getDb(), "center_donations"),
        orderBy("created_at", "desc")
      )
    );
    return snap.docs.map((d) => mapDonation(d.id, d.data()));
  } catch {
    return [];
  }
}

export type TopDonor = {
  buyer_uid: string;
  engrave_name: string;
  anonymous: boolean;
  amount: number;
  count: number;
  first_at: number; // earliest donation millis (tie-break)
};

export type CenterStats = {
  totalRaised: number;
  donorCount: number;
  donationCount: number;
  topDonors: TopDonor[];
};

/**
 * Campaign totals. Tree-planting orders count toward the same campaign as
 * product donations (the Cloud Function credits both into
 * `center_campaign/main.total_raised`), so they must be included here or the
 * admin dashboard under-reports what the app shows users.
 */
export function computeCenterStats(
  donations: CenterDonation[],
  topCount = 99,
  treeOrders: CenterTreeOrder[] = []
): CenterStats {
  const byBuyer = new Map<string, TopDonor>();
  let totalRaised = 0;
  let donationCount = 0;

  for (const t of treeOrders) {
    if (t.status !== "completed") continue;
    totalRaised += t.amount;
    donationCount += 1;
    const at = t.created_at?.toMillis?.() ?? Number.MAX_SAFE_INTEGER;
    const entry = byBuyer.get(t.buyer_uid) ?? {
      buyer_uid: t.buyer_uid,
      engrave_name: t.buyer_name,
      anonymous: false,
      amount: 0,
      count: 0,
      first_at: at,
    };
    entry.amount += t.amount;
    entry.count += 1;
    entry.first_at = Math.min(entry.first_at, at);
    byBuyer.set(t.buyer_uid, entry);
  }

  for (const d of donations) {
    if (d.status !== "completed") continue;
    totalRaised += d.amount;
    donationCount += 1;
    const at = d.created_at?.toMillis?.() ?? Number.MAX_SAFE_INTEGER;
    const entry = byBuyer.get(d.buyer_uid) ?? {
      buyer_uid: d.buyer_uid,
      engrave_name: d.engrave_name || d.buyer_name,
      anonymous: d.anonymous,
      amount: 0,
      count: 0,
      first_at: at,
    };
    entry.amount += d.amount;
    entry.count += 1;
    entry.first_at = Math.min(entry.first_at, at);
    // Latest non-empty engrave name / anonymity wins (most recent intent).
    if (d.engrave_name) entry.engrave_name = d.engrave_name;
    entry.anonymous = d.anonymous;
    byBuyer.set(d.buyer_uid, entry);
  }

  const topDonors = [...byBuyer.values()]
    .sort((a, b) => b.amount - a.amount || a.first_at - b.first_at)
    .slice(0, topCount);

  return {
    totalRaised,
    donorCount: byBuyer.size,
    donationCount,
    topDonors,
  };
}
