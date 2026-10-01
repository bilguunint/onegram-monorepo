import { getFirebaseAuth } from "@/lib/firebase/client";

/**
 * Ашгийн тайлан — төрөл ба клиентийн fetch.
 *
 * Аппын захиалгын үнийн тооцоолуур (metal_price_view.dart, createOrder.js):
 *   суурь     = грамм × Монголбанкны тухайн өдрийн ханш
 *   шимтгэл   = суурь × 5%            ← компанийн ашиг
 *   татвар    = (суурь + шимтгэл) × 20%
 *   нийт дүн  = суурь + шимтгэл + татвар = суурь × 1.26
 *
 * Тайлан нь зөвхөн 5%-ийн шимтгэлийг ашиг гэж тооцно.
 */

export const FEE_RATE = 0.05;
export const TAX_RATE = 0.2;

export type ProfitBucket = {
  /** Баталгаажсан захиалгын тоо */
  orders: number;
  /** Зарсан грамм */
  grams: number;
  /** Хэрэглэгчийн төлсөн нийт дүн, ₮ */
  revenue: number;
  /** Суурь үнэ (грамм × ханш), ₮ */
  base: number;
  /** Ашиг = суурь × 5%, ₮ */
  profit: number;
  /** Татварын мөр = (суурь + шимтгэл) × 20%, ₮ */
  tax: number;
};

export type ProfitMonth = ProfitBucket & { month: string /* YYYY-MM */ };
export type ProfitYear = ProfitBucket & { year: number };

export type ProfitReport = {
  computedAt: string;
  feeRate: number;
  taxRate: number;
  totals: ProfitBucket & {
    /** "Онцгой" гэж тэмдэглэгдсэн захиалгын тоо (тооцоонд орсон) */
    extraOrders: number;
    /** price талбар байхгүй тул нийт дүнгээс урвуу тооцсон захиалга */
    derivedFromAmount: number;
    firstOrderAt: string | null;
    lastOrderAt: string | null;
  };
  byMetal: { gold: ProfitBucket; silver: ProfitBucket };
  /** Өсөх дарааллаар, зөвхөн борлуулалттай сарууд */
  months: ProfitMonth[];
  years: ProfitYear[];
  /** Борлуулалттай саруудын дундаж ашиг */
  avgMonthlyProfit: number;
  /** Сүүлийн 12 хуанлийн сарын дундаж (борлуулалтгүй сарыг 0-ээр) */
  avgMonthlyProfitLast12: number;
  /** Сүүлийн 6 сарын дундаж */
  avgMonthlyProfitLast6: number;
  bestMonth: ProfitMonth | null;
  currentMonth: ProfitMonth | null;
  previousMonth: ProfitMonth | null;
  avgProfitPerOrder: number;
  avgProfitPerGram: number;
  /** Сүүлийн 30 хоногийн өдрийн ашиг (өсөх дараалал) */
  last30Days: { date: string; profit: number; orders: number }[];
};

export type ProfitResponse = {
  status: string;
  data: ProfitReport;
  cached: boolean;
};

export async function fetchProfitReport(refresh = false): Promise<ProfitResponse> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Нэвтрэх шаардлагатай.");
  const token = await user.getIdToken();
  const res = await fetch(`/api/reports/profit${refresh ? "?refresh=1" : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    /* no body */
  }
  if (!res.ok) {
    const obj = (payload ?? {}) as Record<string, unknown>;
    const msg =
      (typeof obj.msg === "string" && obj.msg) ||
      `Тайлан ачааллахад алдаа гарлаа (${res.status}).`;
    throw new Error(msg);
  }
  return payload as ProfitResponse;
}
