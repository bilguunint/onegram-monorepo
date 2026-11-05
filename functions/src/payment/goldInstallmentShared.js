/**
 * goldInstallmentShared
 * ---------------------
 * "Алтан эдлэл" хуваан төлөлтийн дундын логик. Ердийн хуваан төлөлт (installmentShared)
 * ҮНИЙН ДҮН дээр суурилж хоног тоолдог бол энэ нь ГРАММ дээр суурилна:
 *
 *   - Бараа үнэгүй, зөвхөн нийт грамм (products.total_grams).
 *   - Төлбөр бүрийн дүн = грамм × (өнөөдрийн ханш × (1 + татвар%) + ажлын хөлс/гр).
 *     Ханшийг QR үүсгэх мөчид latest_rates-аас СЕРВЕР уншиж нэхэмжлэхэд түгжинэ;
 *     нийт төгрөгийн дүн урьдчилан тогтдоггүй.
 *   - Явц = paid_grams / total_grams. Хамгийн бага алхам 0.1 гр, сүүлийн төлбөр
 *     үлдсэн граммыг яг авна (0.1-ээс бага байж болно).
 *   - Тохиргоо (ажлын хөлс, татвар, алхам) бүх эдлэлд нийтлэг:
 *     system_config/gold_jewelry, админаас өөрчилнө. Төлбөр бүрт тухайн үеийн
 *     утгыг snapshot болгон хадгална.
 *
 * Граммыг float-оор нэмж хасахад алдаа гардаг тул бүх арифметикийг САНТИГРАММ
 * (0.01 гр) бүхэл тоогоор хийж, баримтад грамм (2 орон) бичнэ.
 */
const admin = require("firebase-admin");
const { logger } = require("firebase-functions");
const { generatePickupCode } = require("./installmentShared");
const { ubEndOfDayAfter } = require("../utils/ubDate");

const SETTINGS_DOC = "system_config/gold_jewelry";
const RATE_DOC = "latest_rates/latest_gold_rate";
const PRODUCT_KIND = "gold_jewelry";
const PURCHASE_TYPE = "gold_installment";
const INVOICE_TYPE = "gold_installment";
const INVOICE_TYPE_INIT = "gold_installment_init";

const DEFAULT_SETTINGS = {
  labor_per_gram: 60000, // ажлын хөлс ₮/гр
  tax_percent: 20, // татвар, ханш дээр нэмэгдэнэ
  min_step_grams: 0.1, // хамгийн бага алхам
};

// грамм ↔ сантиграмм
const toCg = (g) => Math.round(Number(g) * 100);
const toG = (cg) => Math.round(cg) / 100;

async function loadSettings(db) {
  const snap = await db.doc(SETTINGS_DOC).get();
  const d = snap.exists ? snap.data() || {} : {};
  const s = {
    labor_per_gram: Number(d.labor_per_gram),
    tax_percent: Number(d.tax_percent),
    min_step_grams: Number(d.min_step_grams),
  };
  for (const k of Object.keys(DEFAULT_SETTINGS)) {
    if (!Number.isFinite(s[k]) || s[k] < 0) s[k] = DEFAULT_SETTINGS[k];
  }
  if (s.min_step_grams <= 0) s.min_step_grams = DEFAULT_SETTINGS.min_step_grams;
  return s;
}

// Аппд харагддаг 1 гр-ын ханш (₮).
async function loadGoldRate(db) {
  const snap = await db.doc(RATE_DOC).get();
  const rate = snap.exists ? Number((snap.data() || {}).rate) : NaN;
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Алтны ханш олдсонгүй.");
  }
  return rate;
}

// 1 гр-ын эцсийн үнэ ба өгөгдсөн граммын төлбөр.
function pricePerGram(rate, settings) {
  return rate * (1 + settings.tax_percent / 100) + settings.labor_per_gram;
}
function quoteGrams(grams, rate, settings) {
  const perGram = pricePerGram(rate, settings);
  return {
    grams: toG(toCg(grams)),
    rate,
    price_per_gram: Math.round(perGram),
    amount: Math.max(1, Math.round(perGram * grams)),
    labor_per_gram: settings.labor_per_gram,
    tax_percent: settings.tax_percent,
  };
}

/**
 * Хэрэглэгчийн сонгосон граммыг шалгаж засна: 0.1-ийн үржвэр, үлдсэнээс
 * хэтрэхгүй; үлдсэн нь алхмаас бага бол тэр үлдсэнийг л зөвшөөрнө.
 * @param {number} requestedGrams - хэрэглэгчийн хүссэн грамм
 * @param {number} remainingCg - үлдсэн сантиграмм
 * @param {object} settings - loadSettings()-ийн үр дүн
 * @return {number} сантиграмм
 */
function normalizeGramsCg(requestedGrams, remainingCg, settings) {
  const stepCg = toCg(settings.min_step_grams);
  const cg = toCg(requestedGrams);
  if (!Number.isFinite(cg) || cg <= 0) throw new Error("INVALID_GRAMS");
  if (cg >= remainingCg) return remainingCg; // бүгдийг нь (эсвэл илүү) → үлдсэн
  if (cg < stepCg) throw new Error("BELOW_MIN_STEP");
  if (cg % stepCg !== 0) throw new Error("NOT_STEP_MULTIPLE");
  // Сүүлд алхмаас бага үлдэгдэл үлдэхэд ч болно (сүүлийн төлбөр нь авна).
  return cg;
}

/**
 * Төлөгдсөн init нэхэмжлэхээс product_purchases үүсгэж, нэхэмжлэхийг processed
 * болгоно (нэг транзакц, идемпотент). Ердийн createPurchaseFromInit-тэй ижил
 * хэлбэртэй, гэхдээ грамм дээр.
 * @param {FirebaseFirestore.Firestore} db - Firestore
 * @param {FirebaseFirestore.DocumentReference} pendingRef - pending_invoices баримт
 * @param {object} pendingData - тухайн баримтын өгөгдөл
 * @return {Promise<{purchaseId: string, created: boolean}>} үр дүн
 */
async function createGoldPurchaseFromInit(db, pendingRef, pendingData) {
  if (pendingData.status === "processed" && pendingData.purchase_id) {
    return { purchaseId: pendingData.purchase_id, created: false };
  }
  const purchaseRef = db.collection("product_purchases").doc();
  const now = admin.firestore.Timestamp.now();
  const totalCg = toCg(pendingData.total_grams);
  const paidCg = toCg(pendingData.grams);
  const completed = paidCg >= totalCg;
  const dailyGrams = Number(pendingData.daily_grams || pendingData.grams);
  const estimatedDays = Math.max(1, Math.ceil(totalCg / toCg(dailyGrams)));
  const deadline = completed ?
    null :
    admin.firestore.Timestamp.fromDate(ubEndOfDayAfter(now.toDate(), estimatedDays));

  let resultId = purchaseRef.id;
  await db.runTransaction(async (tx) => {
    const cur = (await tx.get(pendingRef)).data() || {};
    if (cur.status === "processed" && cur.purchase_id) {
      resultId = cur.purchase_id;
      return;
    }
    tx.set(purchaseRef, {
      purchase_type: PURCHASE_TYPE,
      product_id: pendingData.product_id,
      product_snapshot: pendingData.product_snapshot || {},
      user_id: pendingData.user_id,
      user_snapshot: pendingData.user_snapshot || {},
      total_grams: toG(totalCg),
      paid_grams: toG(paidCg),
      paid_amount: Number(pendingData.amount || 0),
      daily_grams: dailyGrams,
      estimated_days: estimatedDays,
      deadline,
      // Ердийн хуваан төлөлтийн талбаруудыг админ/апп нийтлэг кодын тулд 0-ээр
      total_price: 0,
      daily_payment: 0,
      paid_days: 0,
      total_days: 0,
      status: completed ? "completed" : "active",
      started_at: now,
      ...(completed ? { completed_at: now, pickup_code: generatePickupCode() } : {}),
      payments: [
        {
          day_no: 1,
          grams: toG(paidCg),
          rate: Number(pendingData.rate),
          price_per_gram: Number(pendingData.price_per_gram),
          labor_per_gram: Number(pendingData.labor_per_gram),
          tax_percent: Number(pendingData.tax_percent),
          amount: Number(pendingData.amount || 0),
          paid_at: now,
          payment_method: "qpay",
          invoice_id: pendingData.invoice_id,
        },
      ],
    });
    tx.update(pendingRef, {
      status: "processed",
      purchase_id: purchaseRef.id,
      paid_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  return { purchaseId: resultId, created: resultId === purchaseRef.id };
}

/**
 * Төлөгдсөн (PAID) грамм нэхэмжлэхийг purchase-д бүртгэнэ: нэхэмжлэхийн
 * граммыг paid_grams дээр нэмж, төгрөгийг paid_amount дээр нэмнэ. Нэг
 * транзакц, идемпотент (processed бол алгасна). Нийт граммаас хэтэрвэл
 * хэтэрсэн хэсгийг нэхэмжлэх дээр uncredited_grams гэж тэмдэглэнэ.
 * @param {FirebaseFirestore.Firestore} db - Firestore
 * @param {FirebaseFirestore.DocumentReference} pendingRef - pending_invoices баримт
 * @param {object} [opts] - {invoiceFields}: нэхэмжлэх дээр нэмж бичих талбарууд
 * @return {Promise<object>} үр дүн
 */
async function applyPaidGoldInvoice(db, pendingRef, opts = {}) {
  const extra = opts.invoiceFields || {};
  return db.runTransaction(async (tx) => {
    const invSnap = await tx.get(pendingRef);
    if (!invSnap.exists) throw new Error(`Pending invoice ${pendingRef.id} not found`);
    const inv = invSnap.data() || {};
    if (inv.status === "processed") {
      logger.info("Idempotent skip — gold invoice already processed", {
        pendingId: pendingRef.id,
      });
      return { changed: false, reason: "already_processed" };
    }
    const purchaseRef = db.collection("product_purchases").doc(inv.purchase_id);
    const snap = await tx.get(purchaseRef);
    if (!snap.exists) throw new Error(`Purchase ${inv.purchase_id} not found`);
    const p = snap.data() || {};

    const totalCg = toCg(p.total_grams);
    const paidCg = toCg(p.paid_grams);
    const invCg = toCg(inv.grams);
    const creditCg = Math.max(0, Math.min(invCg, totalCg - paidCg));
    const uncreditedCg = invCg - creditCg;
    const newPaidCg = paidCg + creditCg;
    const amount = Number(inv.amount || 0);
    const completed = newPaidCg >= totalCg;
    const now = admin.firestore.Timestamp.now();
    const payments = Array.isArray(p.payments) ? p.payments : [];

    const update = {
      paid_grams: toG(newPaidCg),
      paid_amount: Number(p.paid_amount || 0) + amount,
      payments: [
        ...payments,
        {
          day_no: payments.length + 1,
          grams: toG(creditCg),
          rate: Number(inv.rate),
          price_per_gram: Number(inv.price_per_gram),
          labor_per_gram: Number(inv.labor_per_gram),
          tax_percent: Number(inv.tax_percent),
          amount,
          paid_at: now,
          payment_method: "qpay",
          invoice_id: inv.invoice_id || null,
        },
      ],
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (completed && p.status !== "completed") {
      update.status = "completed";
      update.completed_at = admin.firestore.FieldValue.serverTimestamp();
      update.pickup_code = generatePickupCode();
    }
    tx.update(purchaseRef, update);
    tx.update(pendingRef, {
      status: "processed",
      paid_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      credited_grams: toG(creditCg),
      ...(uncreditedCg > 0 ? { uncredited_grams: toG(uncreditedCg) } : {}),
      ...extra,
    });
    return {
      changed: creditCg > 0,
      creditedGrams: toG(creditCg),
      uncreditedGrams: toG(uncreditedCg),
      amount,
      newPaidGrams: toG(newPaidCg),
      completed,
    };
  });
}

module.exports = {
  SETTINGS_DOC,
  RATE_DOC,
  PRODUCT_KIND,
  PURCHASE_TYPE,
  INVOICE_TYPE,
  INVOICE_TYPE_INIT,
  DEFAULT_SETTINGS,
  toCg,
  toG,
  loadSettings,
  loadGoldRate,
  pricePerGram,
  quoteGrams,
  normalizeGramsCg,
  createGoldPurchaseFromInit,
  applyPaidGoldInvoice,
};
