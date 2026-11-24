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
 *   price_per_lan — мөнгөний 1 лангийн үнэ
 *   tagsh_price   — тагшны үнэ: лан бүрт БИШ, бараа бүрт нэг удаа нэмэгдэнэ
 *
 *   барааны бүтэн үнэ = нийт лан × 1 лангийн үнэ + тагшны үнэ
 *
 * Хуваан төлөлтөд сервер тагшийг лан бүрт тэнцүү хуваарилдаг (тухайн барааны
 * 1 лангийн төлбөр = 1 лангийн үнэ + тагш ÷ нийт лан), тиймээс бүх ланг
 * төлөхөд нийлбэр нь бүтэн үнэтэй тэнцэнэ. Сервер
 * (functions/src/payment/goldInstallmentShared.js → loadPricing) яг энэ
 * баримтыг уншина; үнэ тохируулаагүй бол мөнгөн эдлэл зарагдахгүй.
 */
export type SilverJewelrySettings = {
  /** Мөнгөний 1 лангийн үнэ (₮) */
  price_per_lan: number;
  /** Тагшны үнэ (₮), бараа бүрт нэг удаа */
  tagsh_price: number;
  min_step_lan: number;
  updated_at?: { toDate: () => Date } | null;
  updated_by_name?: string;
};

const REF = () => doc(getDb(), "system_config", "silver_jewelry");

export async function fetchSilverJewelrySettings(): Promise<SilverJewelrySettings> {
  const snap = await getDoc(REF());
  const d = snap.exists() ? snap.data() : {};
  const p = Number(d.price_per_lan);
  const t = Number(d.tagsh_price);
  const s = Number(d.min_step_lan);
  return {
    price_per_lan: Number.isFinite(p) && p > 0 ? p : 0,
    tagsh_price: Number.isFinite(t) && t > 0 ? t : 0,
    min_step_lan: Number.isFinite(s) && s > 0 ? s : 0.1,
    updated_at: d.updated_at ?? null,
    updated_by_name: d.updated_by_name,
  };
}

/** Мөнгөн эдлэлийн бүтэн үнэ (₮) = нийт лан × 1 лангийн үнэ + тагшны үнэ. */
export function silverProductPrice(
  totalLan: number,
  pricePerLan: number,
  tagshPrice: number
): number {
  return Math.round(totalLan * pricePerLan + tagshPrice);
}

/**
 * 1 лангийн үнийг баталгаажуулж хадгалаад, бүх мөнгөн эдлэл барааны `price`
 * талбарыг (нийт лан × шинэ үнэ) шинэчилнэ. Шинэчилсэн барааны тоог буцаана.
 * Идэвхтэй ТӨГРӨГИЙН хуваан төлөлтүүдэд нөлөөлөхгүй (үнэ нь гэрээн дээрээ
 * түгжигдсэн); лангаар явж буй хуваан төлөлтийн ДАРААГИЙН төлбөрүүд шинэ үнээр.
 */
export async function saveSilverJewelrySettings(
  pricePerLanRaw: number,
  tagshPriceRaw: number,
  minStepLan: number
): Promise<number> {
  const pricePerLan = Math.round(pricePerLanRaw);
  const tagshPrice = Math.round(tagshPriceRaw);
  const u = getFirebaseAuth().currentUser;
  if (!u) throw new Error("Нэвтрээгүй байна.");
  const db = getDb();
  await setDoc(
    REF(),
    {
      price_per_lan: pricePerLan,
      tagsh_price: tagshPrice,
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
      price: silverProductPrice(lan, pricePerLan, tagshPrice),
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
