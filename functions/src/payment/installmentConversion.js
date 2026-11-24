/**
 * installmentConversion
 * ---------------------
 * Идэвхтэй ТӨГРӨГИЙН хуваан төлөлтийг (мөнгөн эдлэл бараан дээрх) ЛАН дээр
 * суурилсан хуваан төлөлт рүү хөрвүүлнэ.
 *
 * Дүрэм (2026-11-25, хэрэглэгчтэй тохирсон):
 *   - Төлсөн ХУВЬ хэвээр: төлсөн лан = нийт лан × (төлсөн дүн ÷ гэрээний хуучин үнэ)
 *   - Үлдсэн ланг шинэ томьёоны үнээр, төлбөр бүрийг тухайн үеийн үнээр лангаар төлнө
 *   - Төлсөн дүн (paid_amount), төлбөрийн түүх (payments[]) ХӨНДӨГДӨХГҮЙ — иймээс
 *     хэрэглэгч хүссэн үедээ цуцалж, төлсөн − шимтгэл дүнгээ буцаан авах эрх хэвээр
 *   - Хуучин гэрээний бүх утга `converted_from`-д хадгалагдана (буцаах боломжтой)
 *
 * Хөрвүүлэхээс өмнө үүссэн төгрөгийн QR-ыг цуцлахгүй: хожим төлөгдвөл
 * installmentShared.applyPaidInvoice мөнгийг лан болгон бүртгэнэ.
 */
const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const G = require("./goldInstallmentShared");

/**
 * Хөрвүүлэлтийн тооцоо (цэвэр функц).
 * @param {object} p - product_purchases өгөгдөл
 * @param {object} product - products өгөгдөл
 * @param {object} cfg - silver тохиргоо (parseSilverConfig)
 * @return {object} { eligible, reason?, ...тоонууд }
 */
function computeConversion(p, product, cfg) {
  const fail = (reason) => ({ eligible: false, reason });
  if (!p) return fail("PURCHASE_NOT_FOUND");
  if ((p.purchase_type || "installment") !== "installment") return fail("NOT_MNT_INSTALLMENT");
  if (p.status !== "active") return fail("NOT_ACTIVE");
  if (p.cancel_request_status === "pending") return fail("CANCEL_PENDING");
  if (!product || product.product_kind !== "silver_jewelry") return fail("NOT_SILVER_PRODUCT");
  const totalCg = G.toCg(product.total_lan);
  const totalPrice = Number(p.total_price || 0);
  const paidAmount = Number(p.paid_amount || 0);
  if (!(totalCg > 0) || !(totalPrice > 0)) return fail("INVALID_DATA");
  const progress = Math.max(0, Math.min(1, paidAmount / totalPrice));
  if (progress >= 1) return fail("ALREADY_PAID");

  // Төлсөн лан: хувь хадгална, 0.01 нарийвчлал; дор хаяж 0.01 лан үлдээнэ.
  const paidCg = Math.min(Math.round(totalCg * progress), totalCg - 1);
  const remainingCg = totalCg - paidCg;
  const item = G.silverItem(product);
  const newFullPrice = G.silverFullPriceExact(cfg, item);
  const perLan = newFullPrice / G.toG(totalCg);
  // Өдрийн лан: хуучин хэмнэлээс (нийт лан ÷ нийт хоног), алхам 0.1-ээр дээш.
  const stepCg = G.toCg(cfg.min_step_lan);
  const totalDays = Number(p.total_days || 0);
  const rawDailyCg = totalDays > 0 ? totalCg / totalDays : stepCg;
  const dailyCg = Math.min(remainingCg, Math.max(stepCg, Math.ceil(rawDailyCg / stepCg) * stepCg));
  const oldRemaining = Math.max(0, totalPrice - paidAmount);
  const newRemaining = Math.round(perLan * G.toG(remainingCg));
  return {
    eligible: true,
    unit: "lan",
    product_name: product.name || (p.product_snapshot && p.product_snapshot.name) || "",
    progress_percent: Math.round(progress * 10000) / 100,
    total_lan: G.toG(totalCg),
    paid_lan: G.toG(paidCg),
    remaining_lan: G.toG(remainingCg),
    daily_lan: G.toG(dailyCg),
    estimated_days: Math.max(1, Math.ceil(remainingCg / dailyCg)),
    price_per_lan: Math.round(perLan),
    new_full_price: Math.round(newFullPrice),
    old_total_price: totalPrice,
    paid_amount: paidAmount,
    old_remaining_amount: oldRemaining,
    new_remaining_amount: newRemaining,
    saving_amount: oldRemaining - newRemaining,
    cancel_fee_percent: Number((p.product_snapshot && p.product_snapshot.cancel_fee_percent) || 0),
  };
}

/**
 * Урьдчилсан тооцоо (юу ч бичихгүй).
 * @param {FirebaseFirestore.Firestore} db - Firestore
 * @param {string} purchaseId - product_purchases id
 * @return {Promise<object>} computeConversion-ийн үр дүн
 */
async function previewConversion(db, purchaseId) {
  const snap = await db.collection("product_purchases").doc(purchaseId).get();
  if (!snap.exists) return { eligible: false, reason: "PURCHASE_NOT_FOUND" };
  const p = snap.data();
  const prodSnap = await db.collection("products").doc(String(p.product_id)).get();
  let cfg;
  try {
    cfg = await G.readSilverConfig(db);
  } catch (e) {
    return { eligible: false, reason: "PRICE_NOT_SET" };
  }
  return { ...computeConversion(p, prodSnap.exists ? prodSnap.data() : null, cfg), user_id: p.user_id };
}

/**
 * Хөрвүүлнэ (нэг транзакц, идемпотент: аль хэдийн хөрвүүлсэн бол алгасна).
 * @param {FirebaseFirestore.Firestore} db - Firestore
 * @param {string} purchaseId - product_purchases id
 * @param {object} meta - { by, consent } — хэн, ямар зөвшөөрлөөр
 * @return {Promise<object>} { converted, ...тоонууд } эсвэл { converted:false, reason }
 */
async function convertInstallmentToLan(db, purchaseId, meta = {}) {
  const ref = db.collection("product_purchases").doc(purchaseId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { converted: false, reason: "PURCHASE_NOT_FOUND" };
    const p = snap.data();
    if (p.purchase_type === "silver_installment" && p.converted_at) {
      return { converted: false, reason: "ALREADY_CONVERTED" };
    }
    const prodSnap = await tx.get(db.collection("products").doc(String(p.product_id)));
    const cfgSnap = await tx.get(db.doc(G.SILVER_SETTINGS_DOC));
    let cfg;
    try {
      cfg = G.parseSilverConfig(cfgSnap.exists ? cfgSnap.data() : {});
    } catch (e) {
      return { converted: false, reason: "PRICE_NOT_SET" };
    }
    const product = prodSnap.exists ? prodSnap.data() : null;
    const c = computeConversion(p, product, cfg);
    if (!c.eligible) return { converted: false, reason: c.reason };

    tx.update(ref, {
      purchase_type: "silver_installment",
      unit: "lan",
      total_grams: c.total_lan,
      paid_grams: c.paid_lan,
      daily_grams: c.daily_lan,
      estimated_days: c.estimated_days,
      // paid_amount, payments[], deadline, status ХӨНДӨХГҮЙ (цуцлах эрх хэвээр).
      product_snapshot: {
        ...(p.product_snapshot || {}),
        product_kind: "silver_jewelry",
        unit: "lan",
        total_lan: c.total_lan,
        total_grams: c.total_lan,
        labor_per_lan: Number(product.labor_per_lan || 0),
        tagsh_price: Number(product.tagsh_price || 0),
      },
      // Хуучин гэрээний утгууд — буцаах, тайлагнахад.
      converted_from: {
        purchase_type: p.purchase_type || "installment",
        total_price: Number(p.total_price || 0),
        daily_payment: Number(p.daily_payment || 0),
        months: Number(p.months || 0),
        total_days: Number(p.total_days || 0),
        paid_days: Number(p.paid_days || 0),
        paid_amount: Number(p.paid_amount || 0),
        product_snapshot: p.product_snapshot || {},
      },
      conversion: {
        rule: "keep_paid_percent",
        progress_percent: c.progress_percent,
        price_per_lan: c.price_per_lan,
        new_full_price: c.new_full_price,
        old_remaining_amount: c.old_remaining_amount,
        new_remaining_amount: c.new_remaining_amount,
        saving_amount: c.saving_amount,
        by: meta.by || "system",
        consent: meta.consent || null,
      },
      converted_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { converted: true, ...c };
  });
}

/**
 * Хөрвүүлэлтийг буцаана (зөвхөн хөрвүүлснээс хойш ЛАН төлбөр хийгдээгүй үед).
 * @param {FirebaseFirestore.Firestore} db - Firestore
 * @param {string} purchaseId - product_purchases id
 * @return {Promise<object>} { reverted } эсвэл { reverted:false, reason }
 */
async function revertConversion(db, purchaseId) {
  const ref = db.collection("product_purchases").doc(purchaseId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const p = snap.exists ? snap.data() : null;
    if (!p || !p.converted_from) return { reverted: false, reason: "NOT_CONVERTED" };
    if (Number(p.paid_amount || 0) !== Number(p.converted_from.paid_amount || 0)) {
      return { reverted: false, reason: "PAID_AFTER_CONVERSION" };
    }
    const f = p.converted_from;
    const del = admin.firestore.FieldValue.delete();
    tx.update(ref, {
      purchase_type: f.purchase_type,
      product_snapshot: f.product_snapshot,
      unit: del, total_grams: del, paid_grams: del, daily_grams: del, estimated_days: del,
      converted_from: del, conversion: del, converted_at: del,
      conversion_reverted_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { reverted: true };
  });
}

const REASON_TEXT = {
  PURCHASE_NOT_FOUND: "Худалдан авалт олдсонгүй.",
  NOT_MNT_INSTALLMENT: "Энэ хуваан төлөлт аль хэдийн шинэ нөхцөлд шилжсэн.",
  ALREADY_CONVERTED: "Энэ хуваан төлөлт аль хэдийн шинэ нөхцөлд шилжсэн.",
  NOT_ACTIVE: "Зөвхөн идэвхтэй хуваан төлөлтийг шилжүүлнэ.",
  CANCEL_PENDING: "Цуцлах хүсэлт хүлээгдэж байгаа тул шилжүүлэх боломжгүй.",
  NOT_SILVER_PRODUCT: "Энэ бараа лангаар тооцох төрөл биш.",
  PRICE_NOT_SET: "Шинэ үнэ тохируулаагүй байна.",
  INVALID_DATA: "Тооцоолох боломжгүй өгөгдөл.",
  ALREADY_PAID: "Бүрэн төлөгдсөн байна.",
};

async function authUid(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) throw new Error("Missing or invalid Authorization header.");
  return (await admin.auth().verifyIdToken(header.slice(7).trim())).uid;
}

/**
 * POST convertInstallmentToLan { purchase_id, accept?: boolean, platform?: string }
 *   accept байхгүй/false → зөвхөн урьдчилсан тооцоо (юу ч бичихгүй)
 *   accept: true         → хэрэглэгчийн зөвшөөрлөөр хөрвүүлнэ
 */
const convertInstallmentToLanHttp = onRequest(
  { region: "asia-northeast1", memory: "512MiB", timeoutSeconds: 60 },
  async (req, res) => cors(req, res, async () => {
    const db = admin.firestore();
    try {
      if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
      const uid = await authUid(req);
      const body = req.body || {};
      const purchaseId = String(body.purchase_id || "").trim();
      if (!purchaseId) return res.status(400).json({ error: "Missing purchase_id" });
      const preview = await previewConversion(db, purchaseId);
      if (preview.reason === "PURCHASE_NOT_FOUND") return res.status(404).json({ error: REASON_TEXT.PURCHASE_NOT_FOUND });
      if (preview.user_id !== uid) return res.status(403).json({ error: "Энэ худалдан авалт таных биш байна." });
      delete preview.user_id;
      if (!preview.eligible) {
        return res.status(200).json({ ...preview, message: REASON_TEXT[preview.reason] || preview.reason });
      }
      if (body.accept !== true) return res.status(200).json(preview);

      const result = await convertInstallmentToLan(db, purchaseId, {
        by: `user:${uid}`,
        consent: {
          accepted: true,
          uid,
          platform: String(body.platform || ""),
          accepted_at: new Date().toISOString(),
          shown: {
            old_remaining_amount: preview.old_remaining_amount,
            new_remaining_amount: preview.new_remaining_amount,
            remaining_lan: preview.remaining_lan,
            price_per_lan: preview.price_per_lan,
          },
        },
      });
      if (!result.converted) {
        return res.status(409).json({ error: REASON_TEXT[result.reason] || result.reason, reason: result.reason });
      }
      logger.info("Installment converted to lan", { purchaseId, uid, result });
      return res.status(200).json(result);
    } catch (err) {
      logger.error("convertInstallmentToLan failed", { error: err.message, stack: err.stack });
      const code = err.message === "Missing or invalid Authorization header." ? 401 : 500;
      return res.status(code).json({ error: err.message || "Алдаа гарлаа." });
    }
  }),
);

module.exports = {
  computeConversion,
  previewConversion,
  convertInstallmentToLan,
  revertConversion,
  REASON_TEXT,
  convertInstallmentToLanHttp,
};
