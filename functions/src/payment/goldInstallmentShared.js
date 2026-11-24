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

/**
 * ЖИН ДЭЭР СУУРИЛСАН хуваан төлөлтийн төрлүүд. Алтан эдлэл (грамм, ханш +
 * татвар + ажлын хөлс) ба мөнгөн эдлэл (ЛАН, админы оруулсан 1 лангийн үнэ)
 * хоёр яг ижил механизмаар ажиллана: нэгжээр цуглуулж, нийт жинд хүрмэгц авна.
 *
 * Түүхэн шалтгаанаар баримтын талбарууд "grams" нэртэй (total_grams,
 * paid_grams, daily_grams, grams) — мөнгөн эдлэлд эдгээр нь ЛАН-гийн тоо бөгөөд
 * баримт дээрх `unit` ("gr" | "lan") талбар нэгжийг заана. Нэхэмжлэхийн type
 * хоёуланд ижил (gold_installment[_init]) — боловсруулалт нь адилхан.
 */
const KINDS = {
  gold_jewelry: {
    kind: "gold_jewelry",
    purchaseType: "gold_installment",
    unit: "gr",
    unitLabel: "гр",
    totalField: "total_grams",
    title: "Алтан эдлэл",
    invoicePrefix: "GOLDINST",
  },
  silver_jewelry: {
    kind: "silver_jewelry",
    purchaseType: "silver_installment",
    unit: "lan",
    unitLabel: "лан",
    totalField: "total_lan",
    title: "Мөнгөн эдлэл",
    invoicePrefix: "SILVINST",
  },
};
// Жин дээр суурилсан purchase_type-ууд (идэвхтэй тоолох, цуцлах, сануулгад).
const WEIGHT_PURCHASE_TYPES = Object.values(KINDS).map((k) => k.purchaseType);
const kindByPurchaseType = (t) =>
  Object.values(KINDS).find((k) => k.purchaseType === t) || null;

const SILVER_SETTINGS_DOC = "system_config/silver_jewelry";

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

/**
 * МӨНГӨН ЭДЛЭЛИЙН ҮНИЙН ТОМЬЁО (компанийн үнийн жагсаалттай яг ижил):
 *
 *   бүтэн үнэ = (нийт лан × (металл + ажлын хөлс) + тагш + хайрцаг)
 *               × (1 + нэмэгдэл%) × (1 + НӨАТ%)
 *
 *   НИЙТЛЭГ (system_config/silver_jewelry, админ баталгаажуулна):
 *     price_per_lan  — металлын (мөнгөний) 1 лангийн үнэ
 *     box_price      — хайрцагны үнэ (бараа бүрт нэг)
 *     markup_percent — нэмэгдэл % (анхдагч 10)
 *     vat_percent    — НӨАТ % (анхдагч 10)
 *   БАРАА БҮРТ (products/{id}):
 *     total_lan      — нийт лан
 *     labor_per_lan  — ажлын хөлс, 1 лан тутамд
 *     tagsh_price    — тагшны үнэ, бараа бүрт нэг удаа
 *     box_price      — (сонголт) хайрцагны үнийг дарж тавих
 *
 * Хуваан төлөлтөд 1 лангийн төлбөр = бүтэн үнэ ÷ нийт лан, тиймээс бүх ланг
 * төлөхөд нийлбэр нь бүтэн үнэтэй тэнцэнэ (тагш, хайрцаг лан бүрт тэнцүү
 * хуваарилагдана).
 * @param {object} cfg - silver тохиргоо (readSilverConfig)
 * @param {object} item - { total_lan, labor_per_lan, tagsh_price, box_price }
 * @return {number} бүтэн үнэ, бөөрөнхийлөөгүй (₮)
 */
function silverFullPriceExact(cfg, item) {
  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const lan = num(item && item.total_lan);
  const box = item && item.box_price != null ? num(item.box_price) : cfg.box_price;
  const base = lan * (cfg.price_per_lan + num(item && item.labor_per_lan)) +
    num(item && item.tagsh_price) + box;
  return base * (1 + cfg.markup_percent / 100) * (1 + cfg.vat_percent / 100);
}

// Тохиргооны баримтын өгөгдлөөс үнийн тохиргоог гаргана (транзакц дотроос ч
// ашиглах боломжтой цэвэр функц). Металлын үнэ байхгүй бол алдаа.
function parseSilverConfig(d) {
  const data = d || {};
  const perLan = Number(data.price_per_lan);
  if (!Number.isFinite(perLan) || perLan <= 0) {
    throw new Error("Мөнгөн эдлэлийн 1 лангийн үнэ тохируулаагүй байна.");
  }
  const pos = (v, def) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : def;
  };
  const step = Number(data.min_step_lan);
  return {
    price_per_lan: perLan,
    box_price: pos(data.box_price, 0),
    markup_percent: pos(data.markup_percent, 10),
    vat_percent: pos(data.vat_percent, 10),
    min_step_lan: Number.isFinite(step) && step > 0 ? step : 0.1,
  };
}

async function readSilverConfig(db) {
  const snap = await db.doc(SILVER_SETTINGS_DOC).get();
  return parseSilverConfig(snap.exists ? snap.data() : {});
}

/**
 * Тухайн төрлийн үнийн мэдээлэл: { settings, rate }.
 *   алт:   rate = Монголбанкны 1 гр ханш; settings = татвар, ажлын хөлс, алхам
 *   мөнгө: rate = тухайн барааны 1 лангийн төлбөр (= бүтэн үнэ ÷ нийт лан,
 *          silverFullPriceExact). [item] өгөөгүй бол зөвхөн металлын үнэ.
 * Мөнгөний үнэ тохируулаагүй бол алдаа — үнэгүйгээр гэрээ үүсэхгүй.
 * @param {FirebaseFirestore.Firestore} db - Firestore
 * @param {string} kind - "gold_jewelry" | "silver_jewelry"
 * @param {object} [item] - мөнгөн барааны { total_lan, labor_per_lan, tagsh_price, box_price }
 * @return {Promise<{settings: object, rate: number}>} үнийн мэдээлэл
 */
async function loadPricing(db, kind, item) {
  if (kind === "silver_jewelry") {
    const cfg = await readSilverConfig(db);
    const lan = Number(item && item.total_lan);
    const rate = Number.isFinite(lan) && lan > 0 ?
      silverFullPriceExact(cfg, item) / lan :
      cfg.price_per_lan;
    return {
      settings: {
        labor_per_gram: 0,
        tax_percent: 0,
        min_step_grams: cfg.min_step_lan,
        silver: cfg,
      },
      rate,
    };
  }
  const [settings, rate] = await Promise.all([loadSettings(db), loadGoldRate(db)]);
  return { settings, rate };
}

/**
 * Мөнгөн эдлэлийн бүтэн үнэ (₮, бөөрөнхийлсөн).
 * @param {FirebaseFirestore.Firestore} db - Firestore
 * @param {object} item - { total_lan, labor_per_lan, tagsh_price, box_price }
 * @return {Promise<number>} төгрөг
 */
async function silverFullPrice(db, item) {
  return Math.round(silverFullPriceExact(await readSilverConfig(db), item));
}

/**
 * Мөнгөн барааны үнийн талбаруудыг products баримт эсвэл snapshot-оос авна.
 * @param {object} src - products/{id} өгөгдөл эсвэл product_snapshot
 * @param {number} [fallbackTotal] - total_lan байхгүй үед (snapshot: total_grams)
 * @return {object} { total_lan, labor_per_lan, tagsh_price, box_price }
 */
function silverItem(src, fallbackTotal) {
  const d = src || {};
  return {
    total_lan: d.total_lan != null ? d.total_lan : fallbackTotal,
    labor_per_lan: d.labor_per_lan,
    tagsh_price: d.tagsh_price,
    box_price: d.box_price,
  };
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
      purchase_type: pendingData.purchase_type || PURCHASE_TYPE,
      unit: pendingData.unit || "gr",
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
  KINDS,
  WEIGHT_PURCHASE_TYPES,
  kindByPurchaseType,
  SILVER_SETTINGS_DOC,
  loadPricing,
  silverFullPrice,
  silverFullPriceExact,
  silverItem,
  parseSilverConfig,
  readSilverConfig,
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
