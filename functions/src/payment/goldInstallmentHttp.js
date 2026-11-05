/**
 * Алтан эдлэлийн хуваан төлөлтийн HTTP функцууд (апп дуудна):
 *   POST createGoldInstallmentInit    { product_id, daily_grams, grams? }
 *   POST createGoldInstallmentPayment { purchase_id, grams }
 *   GET  quoteGoldInstallment         ?grams=0.1  (тооцоолуурт: өнөөдрийн ханш, 1 гр үнэ)
 * Callback-ууд goldInstallmentCallbacks.js-д.
 */
const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });
const { QPAY_USERNAME, QPAY_PASSWORD } = require("./installmentShared");
const G = require("./goldInstallmentShared");

const CALLBACK_INIT =
  "https://asia-northeast1-grammgold.cloudfunctions.net/goldInstallmentInitCallback";
const CALLBACK_PAY =
  "https://asia-northeast1-grammgold.cloudfunctions.net/goldInstallmentCallback";
// Ердийн хуваан төлөлттэй нийлээд нэг хэрэглэгчийн идэвхтэй plan-ийн дээд тоо.
const MAX_ACTIVE_INSTALLMENTS = 3;

async function authUid(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header.");
  }
  const decoded = await admin.auth().verifyIdToken(header.slice(7).trim());
  return decoded.uid;
}

const GRAMS_ERRORS = {
  INVALID_GRAMS: "Грамм буруу байна.",
  BELOW_MIN_STEP: "Хамгийн багадаа {step} гр төлнө.",
  NOT_STEP_MULTIPLE: "Грамм {step}-ийн үржвэр байх ёстой.",
};
function gramsError(err, settings) {
  const t = GRAMS_ERRORS[err.message];
  return t ? t.replace("{step}", String(settings.min_step_grams)) : null;
}

async function createQPayInvoice(senderInvoiceNo, amount, callbackUrl, description) {
  const tokenResp = await axios.post(
    "https://merchant.qpay.mn/v2/auth/token",
    {},
    { auth: { username: QPAY_USERNAME, password: QPAY_PASSWORD } },
  );
  const token = tokenResp.data.access_token;
  const resp = await axios.post(
    "https://merchant.qpay.mn/v2/invoice",
    {
      invoice_code: "LISTLY_AGENT_INVOICE",
      sender_invoice_no: senderInvoiceNo,
      invoice_receiver_code: "terminal",
      amount,
      callback_url: callbackUrl,
      invoice_description: description,
    },
    { headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } },
  );
  const inv = resp.data || {};
  if (!inv.invoice_id) {
    logger.error("QPay invoice creation returned no invoice_id", { inv });
    throw new Error("QPay invoice creation failed (no invoice_id)");
  }
  return inv;
}

function fail(res, err) {
  logger.error("gold installment request failed", { error: err.message, stack: err.stack });
  if (err.response && err.response.data) logger.error("QPay error", { data: err.response.data });
  const code = err.message === "Missing or invalid Authorization header." ? 401 : 500;
  return res.status(code).json({ error: err.message || "Алдаа гарлаа." });
}

const opts = { region: "asia-northeast1", memory: "512MiB", timeoutSeconds: 60 };

// Тооцоолуурт: өнөөдрийн ханш, 1 гр-ын эцсийн үнэ, тохиргоо, (сонголтоор) grams-ийн дүн.
exports.quoteGoldInstallment = onRequest(opts, async (req, res) => {
  return cors(req, res, async () => {
    const db = admin.firestore();
    try {
      const [settings, rate] = await Promise.all([G.loadSettings(db), G.loadGoldRate(db)]);
      const grams = Number((req.query && req.query.grams) || (req.body && req.body.grams) || 0);
      const out = {
        rate,
        price_per_gram: Math.round(G.pricePerGram(rate, settings)),
        labor_per_gram: settings.labor_per_gram,
        tax_percent: settings.tax_percent,
        min_step_grams: settings.min_step_grams,
      };
      if (grams > 0) out.quote = G.quoteGrams(grams, rate, settings);
      return res.status(200).json(out);
    } catch (err) {
      return fail(res, err);
    }
  });
});

// Шинэ эдлэлийн хуваан төлөлт эхлүүлэх: эхний төлбөрийн QR.
exports.createGoldInstallmentInit = onRequest(opts, async (req, res) => {
  return cors(req, res, async () => {
    const db = admin.firestore();
    try {
      if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
      const uid = await authUid(req);
      const { product_id: productId, daily_grams: dailyGramsRaw, grams: gramsRaw } = req.body || {};
      if (!productId) return res.status(400).json({ error: "Missing product_id" });

      const activeSnap = await db.collection("product_purchases")
        .where("user_id", "==", uid)
        .where("status", "==", "active")
        .where("purchase_type", "in", ["installment", G.PURCHASE_TYPE])
        .limit(MAX_ACTIVE_INSTALLMENTS)
        .get();
      if (activeSnap.size >= MAX_ACTIVE_INSTALLMENTS) {
        return res.status(409).json({
          error: `Танд аль хэдийн ${MAX_ACTIVE_INSTALLMENTS} идэвхтэй хуваан төлөлт байна. ` +
            "Нэгийг нь дуусгасны дараа шинээр эхлүүлнэ үү.",
        });
      }

      const productSnap = await db.collection("products").doc(productId).get();
      if (!productSnap.exists) return res.status(404).json({ error: "Product not found" });
      const product = productSnap.data() || {};
      if (product.product_kind !== G.PRODUCT_KIND) {
        return res.status(409).json({ error: "Энэ бараа алтан эдлэлийн хуваан төлөлт биш." });
      }
      if (product.status !== "active") return res.status(409).json({ error: "Product is not active" });
      if (product.stock != null && Number(product.stock) <= 0) {
        return res.status(409).json({ error: "Product is out of stock" });
      }
      const totalCg = G.toCg(product.total_grams);
      if (!(totalCg > 0)) return res.status(409).json({ error: "Барааны грамм тохируулаагүй байна." });

      const [settings, rate] = await Promise.all([G.loadSettings(db), G.loadGoldRate(db)]);
      const dailyGrams = Number(dailyGramsRaw);
      let dailyCg;
      let firstCg;
      try {
        dailyCg = G.normalizeGramsCg(dailyGrams, totalCg, settings);
        firstCg = gramsRaw != null ? G.normalizeGramsCg(Number(gramsRaw), totalCg, settings) : dailyCg;
      } catch (e) {
        const msg = gramsError(e, settings);
        if (!msg) throw e;
        return res.status(400).json({ error: msg });
      }
      const quote = G.quoteGrams(G.toG(firstCg), rate, settings);

      const userSnap = await db.collection("users").doc(uid).get();
      if (!userSnap.exists) return res.status(404).json({ error: "User not found" });
      const u = userSnap.data() || {};

      const pendingRef = db.collection("pending_invoices").doc();
      const pendingId = pendingRef.id;
      const qpayInvoice = await createQPayInvoice(
        `GOLDINST_INIT-${pendingId}`,
        quote.amount,
        `${CALLBACK_INIT}?pending_id=${pendingId}`,
        `Алтан эдлэл — ${product.name || "Бараа"} (${quote.grams} гр)`,
      );

      await pendingRef.set({
        type: G.INVOICE_TYPE_INIT,
        pending_id: pendingId,
        invoice_id: qpayInvoice.invoice_id,
        product_id: productId,
        product_snapshot: {
          name: product.name || "",
          image: Array.isArray(product.images) && product.images.length ? product.images[0] : null,
          price: 0,
          product_kind: G.PRODUCT_KIND,
          total_grams: G.toG(totalCg),
          cancel_fee_percent: Number(product.cancel_fee_percent || 0),
        },
        user_id: uid,
        user_snapshot: {
          first_name: u.first_name || null,
          last_name: u.last_name || null,
          phone: u.phone || null,
          email: u.email || null,
        },
        total_grams: G.toG(totalCg),
        daily_grams: G.toG(dailyCg),
        grams: quote.grams,
        rate: quote.rate,
        price_per_gram: quote.price_per_gram,
        labor_per_gram: quote.labor_per_gram,
        tax_percent: quote.tax_percent,
        amount: quote.amount,
        status: "pending",
        qpay_invoice: qpayInvoice,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info("Created gold-installment init invoice", { uid, productId, pendingId, quote });
      return res.status(200).json({
        message: "Gold installment init invoice created",
        qpay_invoice: qpayInvoice,
        pending_id: pendingId,
        invoice_id: qpayInvoice.invoice_id,
        ...quote,
        total_grams: G.toG(totalCg),
        daily_grams: G.toG(dailyCg),
        estimated_days: Math.ceil(totalCg / dailyCg),
      });
    } catch (err) {
      return fail(res, err);
    }
  });
});

// Дараагийн төлбөр: хэрэглэгч хэдэн грамм төлөхөө сонгоно.
exports.createGoldInstallmentPayment = onRequest(opts, async (req, res) => {
  return cors(req, res, async () => {
    const db = admin.firestore();
    try {
      if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
      const uid = await authUid(req);
      const { purchase_id: purchaseId, grams: gramsRaw } = req.body || {};
      if (!purchaseId) return res.status(400).json({ error: "Missing purchase_id" });

      const snap = await db.collection("product_purchases").doc(purchaseId).get();
      if (!snap.exists) return res.status(404).json({ error: "Purchase not found" });
      const p = snap.data() || {};
      if (p.user_id !== uid) return res.status(403).json({ error: "Forbidden" });
      if (p.purchase_type !== G.PURCHASE_TYPE) {
        return res.status(409).json({ error: "Энэ худалдан авалт алтан эдлэлийн хуваан төлөлт биш." });
      }
      if (p.status !== "active") return res.status(409).json({ error: "Purchase is not active", status: p.status });
      if (p.cancel_request_status === "pending") {
        return res.status(409).json({ error: "Цуцлах хүсэлт хүлээгдэж байгаа тул төлбөр хийх боломжгүй." });
      }
      const remainingCg = G.toCg(p.total_grams) - G.toCg(p.paid_grams);
      if (remainingCg <= 0) return res.status(409).json({ error: "Бүх грамм төлөгдсөн." });

      const [settings, rate] = await Promise.all([G.loadSettings(db), G.loadGoldRate(db)]);
      let cg;
      try {
        cg = G.normalizeGramsCg(Number(gramsRaw != null ? gramsRaw : p.daily_grams), remainingCg, settings);
      } catch (e) {
        const msg = gramsError(e, settings);
        if (!msg) throw e;
        return res.status(400).json({ error: msg });
      }
      const quote = G.quoteGrams(G.toG(cg), rate, settings);
      const paidCount = Array.isArray(p.payments) ? p.payments.length : 0;
      const name = (p.product_snapshot && p.product_snapshot.name) || "Бараа";

      const qpayInvoice = await createQPayInvoice(
        `GOLDINST-${purchaseId}-${paidCount + 1}-${quote.grams}`,
        quote.amount,
        `${CALLBACK_PAY}?purchase_id=${encodeURIComponent(purchaseId)}`,
        `Алтан эдлэл — ${name} (${quote.grams} гр)`,
      );
      await db.collection("pending_invoices").doc(qpayInvoice.invoice_id).set({
        type: G.INVOICE_TYPE,
        invoice_id: qpayInvoice.invoice_id,
        purchase_id: purchaseId,
        userId: uid,
        grams: quote.grams,
        rate: quote.rate,
        price_per_gram: quote.price_per_gram,
        labor_per_gram: quote.labor_per_gram,
        tax_percent: quote.tax_percent,
        amount: quote.amount,
        status: "pending",
        qpay_invoice: qpayInvoice,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info("Created gold-installment payment invoice", { purchaseId, quote });
      return res.status(200).json({
        message: "Gold installment invoice created",
        qpay_invoice: qpayInvoice,
        invoice_id: qpayInvoice.invoice_id,
        ...quote,
        remaining_grams_after: G.toG(remainingCg - cg),
      });
    } catch (err) {
      return fail(res, err);
    }
  });
});
