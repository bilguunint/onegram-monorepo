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
 * МӨНГӨН ЭДЛЭЛИЙН ҮНИЙН ТОМЬЁО (компанийн үнийн жагсаалттай ижил):
 *
 *   бүтэн үнэ = (нийт лан × (металл + ажлын хөлс) + тагш + хайрцаг)
 *               × (1 + нэмэгдэл%) × (1 + НӨАТ%)
 *
 * НИЙТЛЭГ (system_config/silver_jewelry — энэ файл):
 *   price_per_lan  металлын 1 лангийн үнэ
 *   box_price      хайрцагны үнэ (бараа бүрт нэг)
 *   markup_percent нэмэгдэл %      vat_percent  НӨАТ %
 * БАРАА БҮРТ (products/{id}): total_lan, labor_per_lan (ажлын хөлс/лан),
 *   tagsh_price (тагш, бараа бүрт нэг удаа).
 *
 * Сервер (functions/src/payment/goldInstallmentShared.js → silverFullPriceExact)
 * яг ижил томьёогоор тооцно. Хуваан төлөлтөд 1 лангийн төлбөр = бүтэн үнэ ÷
 * нийт лан. Металлын үнэ тохируулаагүй бол мөнгөн эдлэл зарагдахгүй.
 */
export type SilverJewelrySettings = {
  price_per_lan: number;
  box_price: number;
  markup_percent: number;
  vat_percent: number;
  min_step_lan: number;
  updated_at?: { toDate: () => Date } | null;
  updated_by_name?: string;
};

/** Барааны үнэд нөлөөлөх талбарууд */
export type SilverItem = {
  total_lan: number | null;
  labor_per_lan: number | null;
  tagsh_price: number | null;
};

const REF = () => doc(getDb(), "system_config", "silver_jewelry");

export async function fetchSilverJewelrySettings(): Promise<SilverJewelrySettings> {
  const snap = await getDoc(REF());
  const d = snap.exists() ? snap.data() : {};
  const num = (v: unknown, def: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : def;
  };
  const p = Number(d.price_per_lan);
  const s = Number(d.min_step_lan);
  return {
    price_per_lan: Number.isFinite(p) && p > 0 ? p : 0,
    box_price: num(d.box_price, 0),
    markup_percent: num(d.markup_percent, 10),
    vat_percent: num(d.vat_percent, 10),
    min_step_lan: Number.isFinite(s) && s > 0 ? s : 0.1,
    updated_at: d.updated_at ?? null,
    updated_by_name: d.updated_by_name,
  };
}

/** Мөнгөн эдлэлийн бүтэн үнэ (₮, бөөрөнхийлсөн) — серверийн томьёотой ижил. */
export function silverProductPrice(
  item: SilverItem,
  s: Pick<
    SilverJewelrySettings,
    "price_per_lan" | "box_price" | "markup_percent" | "vat_percent"
  >
): number {
  const lan = Math.max(0, Number(item.total_lan ?? 0));
  const labor = Math.max(0, Number(item.labor_per_lan ?? 0));
  const tagsh = Math.max(0, Number(item.tagsh_price ?? 0));
  const base = lan * (s.price_per_lan + labor) + tagsh + s.box_price;
  return Math.round(
    base * (1 + s.markup_percent / 100) * (1 + s.vat_percent / 100)
  );
}

/**
 * Нийтлэг тохиргоог баталгаажуулж хадгалаад, бүх мөнгөн эдлэл барааны `price`
 * талбарыг томьёогоор дахин тооцож шинэчилнэ. Шинэчилсэн барааны тоог буцаана.
 * Идэвхтэй ТӨГРӨГИЙН хуваан төлөлтүүдэд нөлөөлөхгүй (үнэ нь гэрээн дээрээ
 * түгжигдсэн); лангаар явж буй хуваан төлөлтийн ДАРААГИЙН төлбөрүүд шинэ үнээр.
 */
export async function saveSilverJewelrySettings(
  next: Pick<
    SilverJewelrySettings,
    "price_per_lan" | "box_price" | "markup_percent" | "vat_percent" | "min_step_lan"
  >
): Promise<number> {
  const u = getFirebaseAuth().currentUser;
  if (!u) throw new Error("Нэвтрээгүй байна.");
  const db = getDb();
  const s = {
    price_per_lan: Math.round(next.price_per_lan),
    box_price: Math.round(next.box_price),
    markup_percent: next.markup_percent,
    vat_percent: next.vat_percent,
    min_step_lan: next.min_step_lan,
  };
  await setDoc(
    REF(),
    {
      ...s,
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
    const x = d.data();
    if (!(Number(x.total_lan ?? 0) > 0)) continue;
    batch.update(d.ref, {
      price: silverProductPrice(
        {
          total_lan: Number(x.total_lan),
          labor_per_lan: Number(x.labor_per_lan ?? 0),
          tagsh_price: Number(x.tagsh_price ?? 0),
        },
        s
      ),
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
