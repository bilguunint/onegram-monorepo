import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDb, getFirebaseAuth } from "@/lib/firebase/client";

/**
 * Алтан эдлэлийн хуваан төлөлтийн НИЙТЛЭГ тохиргоо (system_config/gold_jewelry).
 * Төлбөрийн дүн = грамм × (ханш × (1 + tax_percent/100) + labor_per_gram).
 * Сервер (functions/src/payment/goldInstallmentShared.js) яг энэ баримтыг
 * уншина; байхгүй бол анхдагч утгуудыг ашиглана.
 */
export type GoldJewelrySettings = {
  labor_per_gram: number;
  tax_percent: number;
  min_step_grams: number;
};

export const GOLD_JEWELRY_DEFAULTS: GoldJewelrySettings = {
  labor_per_gram: 60000,
  tax_percent: 20,
  min_step_grams: 0.1,
};

const REF = () => doc(getDb(), "system_config", "gold_jewelry");

export async function fetchGoldJewelrySettings(): Promise<GoldJewelrySettings> {
  const snap = await getDoc(REF());
  const d = snap.exists() ? snap.data() : {};
  const num = (v: unknown, def: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : def;
  };
  return {
    labor_per_gram: num(d.labor_per_gram, GOLD_JEWELRY_DEFAULTS.labor_per_gram),
    tax_percent: num(d.tax_percent, GOLD_JEWELRY_DEFAULTS.tax_percent),
    min_step_grams:
      num(d.min_step_grams, GOLD_JEWELRY_DEFAULTS.min_step_grams) ||
      GOLD_JEWELRY_DEFAULTS.min_step_grams,
  };
}

export async function saveGoldJewelrySettings(
  s: GoldJewelrySettings
): Promise<void> {
  const u = getFirebaseAuth().currentUser;
  if (!u) throw new Error("Нэвтрээгүй байна.");
  await setDoc(
    REF(),
    {
      labor_per_gram: Math.round(s.labor_per_gram),
      tax_percent: s.tax_percent,
      min_step_grams: s.min_step_grams,
      updated_at: serverTimestamp(),
      updated_by: u.uid,
    },
    { merge: true }
  );
}

/** 1 гр-ын эцсийн үнэ (₮) — апп тооцоолууртай ижил томьёо. */
export function goldPricePerGram(rate: number, s: GoldJewelrySettings): number {
  return Math.round(rate * (1 + s.tax_percent / 100) + s.labor_per_gram);
}
