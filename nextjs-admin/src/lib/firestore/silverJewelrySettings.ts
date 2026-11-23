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
 * 1 лангийн үнийг (эцсийн, нэмэгдэлгүй) админ оруулж баталгаажуулна. Мөнгөн
 * эдлэлийн хуваан төлөлтийн төлбөр бүр = лан × тухайн үеийн энэ үнэ; бүтэн
 * төлбөрийн үнэ = нийт лан × энэ үнэ. Сервер
 * (functions/src/payment/goldInstallmentShared.js → loadPricing) яг энэ
 * баримтыг уншина; үнэ тохируулаагүй бол мөнгөн эдлэл зарагдахгүй.
 */
export type SilverJewelrySettings = {
  price_per_lan: number;
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
  return {
    price_per_lan: Number.isFinite(p) && p > 0 ? p : 0,
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
  pricePerLan: number,
  minStepLan: number
): Promise<number> {
  const u = getFirebaseAuth().currentUser;
  if (!u) throw new Error("Нэвтрээгүй байна.");
  const db = getDb();
  await setDoc(
    REF(),
    {
      price_per_lan: Math.round(pricePerLan),
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
      price: silverProductPrice(lan, Math.round(pricePerLan)),
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
