import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";

// ---------------------------------------------------------------------------
// "Шүтээн хуур" — хэсэгчилсэн эзэмшлийн хөтөлбөр.
//  - shuteen_khuur/main — single config doc: тоон үзүүлэлт, төлөв, зургууд.
//  Апп нүүрний карт болон танилцуулга дэлгэц энэ doc-оос уншина.
//  sold_units-ийг зөвхөн Cloud Functions бичнэ (Phase 2), админ гараар засахгүй.
// ---------------------------------------------------------------------------

export type ShuteenStatus = "active" | "hidden";

export type ShuteenProgram = {
  title: string;
  subtitle: string;
  description: string;
  status: ShuteenStatus;
  /** Нүүрний том карт дээрх зураг (ойролцоогоор 16:9). */
  cover_image: string | null;
  /** Танилцуулга дэлгэцийн дээд hero зураг (21:9). */
  header_image: string | null;
  /** Шүтээн хуурын зургийн цомог — танилцуулга дэлгэц дээр гүйлгэж харна. */
  gallery: string[];
  total_valuation: number; // ₮ (3,600,000,000)
  total_units: number; // 100,000
  unit_price: number; // ₮ (36,000)
  hold_months: number; // 24
  annual_growth_percent: number; // 24
  buyback_price: number; // ₮ (53,280)
  sold_units: number; // backend-only
  updated_at: Timestamp | null;
};

export type ShuteenProgramDraft = Omit<ShuteenProgram, "sold_units" | "updated_at" | "gallery">;

export const DEFAULT_PROGRAM: ShuteenProgram = {
  title: "Шүтээн хуур",
  subtitle: "Дэлхийн Морин Хуурын Төв Цогцолбор төсөлд хүн бүр оролцох боломжтой боллоо.",
  description:
    "“Шүтээн хуур” хэсэгчилсэн эзэмшлийн хөтөлбөр нь “Их Хаадын Чулуу” ХХК-ийн хосгүй уран бүтээл, “Дэлхийн Морин Хуурын Төв Цогцолбор” ХХК-ийн өмчийн зах зээлийн бодит үнэлгээг 100,000 тэнцүү нэгж хувьд хувааж, аппаар дамжуулан олон нийтэд санал болгож байна.",
  status: "hidden",
  cover_image: null,
  header_image: null,
  gallery: [],
  total_valuation: 3_600_000_000,
  total_units: 100_000,
  unit_price: 36_000,
  hold_months: 24,
  annual_growth_percent: 24,
  buyback_price: 53_280,
  sold_units: 0,
  updated_at: null,
};

const PROGRAM_DOC = () => doc(getDb(), "shuteen_khuur", "main");

export async function fetchShuteenProgram(): Promise<ShuteenProgram> {
  const snap = await getDoc(PROGRAM_DOC());
  if (!snap.exists()) return DEFAULT_PROGRAM;
  const d = snap.data() as Partial<ShuteenProgram>;
  return {
    title: d.title ?? DEFAULT_PROGRAM.title,
    subtitle: d.subtitle ?? DEFAULT_PROGRAM.subtitle,
    description: d.description ?? DEFAULT_PROGRAM.description,
    status: d.status === "active" ? "active" : "hidden",
    cover_image: d.cover_image ?? null,
    header_image: d.header_image ?? null,
    gallery: Array.isArray(d.gallery) ? (d.gallery as string[]) : [],
    total_valuation: Number(d.total_valuation ?? DEFAULT_PROGRAM.total_valuation),
    total_units: Number(d.total_units ?? DEFAULT_PROGRAM.total_units),
    unit_price: Number(d.unit_price ?? DEFAULT_PROGRAM.unit_price),
    hold_months: Number(d.hold_months ?? DEFAULT_PROGRAM.hold_months),
    annual_growth_percent: Number(
      d.annual_growth_percent ?? DEFAULT_PROGRAM.annual_growth_percent
    ),
    buyback_price: Number(d.buyback_price ?? DEFAULT_PROGRAM.buyback_price),
    sold_units: Number(d.sold_units ?? 0),
    updated_at: d.updated_at ?? null,
  };
}

/** Тохиргоо (текст, тоо, төлөв, cover/header) — цомог болон sold_units-д хүрэхгүй. */
export async function saveShuteenProgram(draft: ShuteenProgramDraft): Promise<void> {
  await setDoc(
    PROGRAM_DOC(),
    {
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
      description: draft.description.trim(),
      status: draft.status,
      cover_image: draft.cover_image,
      header_image: draft.header_image,
      total_valuation: Math.max(0, Math.round(draft.total_valuation)),
      total_units: Math.max(0, Math.round(draft.total_units)),
      unit_price: Math.max(0, Math.round(draft.unit_price)),
      hold_months: Math.max(0, Math.round(draft.hold_months)),
      annual_growth_percent: Math.max(0, draft.annual_growth_percent),
      buyback_price: Math.max(0, Math.round(draft.buyback_price)),
      updated_at: serverTimestamp(),
    },
    { merge: true }
  );
}

/** Зөвхөн зургийн цомгийг хадгална. */
export async function saveShuteenGallery(gallery: string[]): Promise<void> {
  await setDoc(
    PROGRAM_DOC(),
    { gallery, updated_at: serverTimestamp() },
    { merge: true }
  );
}

/** Анхны үнэ, жилийн өсөлт, хугацаанаас буцаан худалдан авах үнийг тооцно. */
export function computeBuyback(
  unitPrice: number,
  annualGrowthPercent: number,
  holdMonths: number
): number {
  const years = holdMonths / 12;
  return Math.round(unitPrice * (1 + (annualGrowthPercent / 100) * years));
}

// ---------------------------------------------------------------------------
// Нэгжийн захиалга = гэрчилгээ (`shuteen_orders`, Cloud Functions үүсгэнэ).
export type ShuteenOrderStatus = "active" | "bought_back" | "cancelled";

export type ShuteenOrder = {
  id: string;
  buyer_uid: string;
  buyer_name: string;
  buyer_phone: string;
  units: number;
  unit_price: number;
  amount: number;
  buyback_price: number;
  buyback_total: number;
  buyback_at: Timestamp | null;
  tier: number;
  certificate_no: string;
  status: ShuteenOrderStatus;
  created_at: Timestamp | null;
};

export async function fetchShuteenOrders(): Promise<ShuteenOrder[]> {
  const q = query(collection(getDb(), "shuteen_orders"), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id,
      buyer_uid: String(x.buyer_uid ?? ""),
      buyer_name: String(x.buyer_name ?? ""),
      buyer_phone: String(x.buyer_phone ?? ""),
      units: Number(x.units ?? 0),
      unit_price: Number(x.unit_price ?? 0),
      amount: Number(x.amount ?? 0),
      buyback_price: Number(x.buyback_price ?? 0),
      buyback_total: Number(x.buyback_total ?? 0),
      buyback_at: (x.buyback_at as Timestamp | undefined) ?? null,
      tier: Number(x.tier ?? 0),
      certificate_no: String(x.certificate_no ?? ""),
      status:
        x.status === "bought_back" || x.status === "cancelled" ? x.status : "active",
      created_at: (x.created_at as Timestamp | undefined) ?? null,
    };
  });
}

/** Захиалгуудын нэгтгэл: нийт нэгж, дүн, эзэмшигчийн тоо */
export function computeShuteenStats(orders: ShuteenOrder[]) {
  const active = orders.filter((o) => o.status === "active");
  const holders = new Set(active.map((o) => o.buyer_uid));
  return {
    orderCount: orders.length,
    units: active.reduce((s, o) => s + o.units, 0),
    amount: active.reduce((s, o) => s + o.amount, 0),
    buybackTotal: active.reduce((s, o) => s + o.buyback_total, 0),
    holderCount: holders.size,
  };
}
