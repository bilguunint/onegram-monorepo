import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getDb, getFirebaseAuth } from "@/lib/firebase/client";

/**
 * Мөнгөн эдлэлийн НИЙТЛЭГ тохиргоо (system_config/silver_jewelry).
 *
 * 1 лангийн ҮНДСЭН үнэ = мөнгөний лангийн үнэ (base_price_per_lan) + тагшны
 * үнэ (tagsh_per_lan, 1 лан тутамд). Нийлбэр нь `price_per_lan` талбарт
 * хадгалагдах бөгөөд сервер зөвхөн энэ эцсийн үнийг уншина; задаргаа нь
 * админд харуулах, түүх хадгалах зорилготой.
 *
 * 1 лангийн үнийг админ оруулж баталгаажуулна. Мөнгөн
 * эдлэлийн хуваан төлөлтийн төлбөр бүр = лан × тухайн үеийн энэ үнэ; бүтэн
 * төлбөрийн үнэ = нийт лан × энэ үнэ. Сервер
 * (functions/src/payment/goldInstallmentShared.js → loadPricing) яг энэ
 * баримтыг уншина; үнэ тохируулаагүй бол мөнгөн эдлэл зарагдахгүй.
 */
export type SilverJewelrySettings = {
  /** Эцсийн үндсэн үнэ = base_price_per_lan + tagsh_per_lan (сервер үүнийг уншина) */
  price_per_lan: number;
  /** Мөнгөний 1 лангийн үнэ (тагшгүй) */
  base_price_per_lan: number;
  /** Тагшны үнэ, 1 лан тутамд */
  tagsh_per_lan: number;
  min_step_lan: number;
  updated_at?: { toDate: () => Date } | null;
  updated_by_name?: string;
};

const REF = () => doc(getDb(), "system_config", "silver_jewelry");

export async function fetchSilverJewelrySettings(): Promise<SilverJewelrySettings> {
  const snap = await getDoc(REF());
  const d = snap.exists() ? snap.data() : {};
  const p = Number(d.price_per_lan);
  const s = Number(d.min_step_lan);
  const total = Number.isFinite(p) && p > 0 ? p : 0;
  const tagshRaw = Number(d.tagsh_per_lan);
  const tagsh = Number.isFinite(tagshRaw) && tagshRaw > 0 ? tagshRaw : 0;
  const baseRaw = Number(d.base_price_per_lan);
  return {
    price_per_lan: total,
    // Хуучин баримтад задаргаа байхгүй бол бүх үнийг лангийн үнэ гэж үзнэ.
    base_price_per_lan:
      Number.isFinite(baseRaw) && baseRaw > 0 ? baseRaw : Math.max(0, total - tagsh),
    tagsh_per_lan: tagsh,
    min_step_lan: Number.isFinite(s) && s > 0 ? s : 0.1,
    updated_at: d.updated_at ?? null,
    updated_by_name: d.updated_by_name,
  };
}

/** Мөнгөн эдлэлийн бүтэн үнэ (₮) = нийт лан × 1 лангийн үнэ. */
export function silverProductPrice(totalLan: number, pricePerLan: number): number {
  return Math.round(totalLan * pricePerLan);
}

/**
 * 1 лангийн үнийг баталгаажуулж хадгалаад, бүх мөнгөн эдлэл барааны `price`
 * талбарыг (нийт лан × шинэ үнэ) шинэчилнэ. Шинэчилсэн барааны тоог буцаана.
 * Идэвхтэй ТӨГРӨГИЙН хуваан төлөлтүүдэд нөлөөлөхгүй (үнэ нь гэрээн дээрээ
 * түгжигдсэн); лангаар явж буй хуваан төлөлтийн ДАРААГИЙН төлбөрүүд шинэ үнээр.
 */
export async function saveSilverJewelrySettings(
  basePricePerLan: number,
  tagshPerLan: number,
  minStepLan: number
): Promise<number> {
  const pricePerLan = Math.round(basePricePerLan) + Math.round(tagshPerLan);
  const u = getFirebaseAuth().currentUser;
  if (!u) throw new Error("Нэвтрээгүй байна.");
  const db = getDb();
  await setDoc(
    REF(),
    {
      price_per_lan: pricePerLan,
      base_price_per_lan: Math.round(basePricePerLan),
      tagsh_per_lan: Math.round(tagshPerLan),
      min_step_lan: minStepLan,
      updated_at: serverTimestamp(),
      updated_by: u.uid,
      updated_by_name: u.displayName || u.email || u.uid,
    },
    { merge: true }
  );
  const snap = await getDocs(
    query(collection(db, "products"), where("product_kind", "==", "silver_jewelry"))
  );
  let n = 0;
  let batch = writeBatch(db);
  let inBatch = 0;
  for (const d of snap.docs) {
    const lan = Number(d.data().total_lan ?? 0);
    if (!(lan > 0)) continue;
    batch.update(d.ref, {
      price: silverProductPrice(lan, pricePerLan),
      updated_at: serverTimestamp(),
      updated_by: u.uid,
    });
    n++;
    inBatch++;
    if (inBatch === 400) {
      await batch.commit();
      batch = writeBatch(db);
      inBatch = 0;
    }
  }
  if (inBatch > 0) await batch.commit();
  return n;
}
