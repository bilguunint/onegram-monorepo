const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });

const QPAY_USERNAME = "ONE_GRAM_GOLD";
const QPAY_PASSWORD = "zElO7j40";

const CALLBACK_BASE =
  "https://asia-northeast1-grammgold.cloudfunctions.net/installmentInitCallback";

// Verify Firebase ID token from Authorization: Bearer <token>.
// Returns the decoded uid.
async function authUid(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header.");
  }
  const idToken = header.slice("Bearer ".length).trim();
  const decoded = await admin.auth().verifyIdToken(idToken);
  return decoded.uid;
}

// Fixed conversion — 1 month = 30 days. Keeps daily math simple and
// independent of calendar boundaries. The user picks N months in the UI
// and the backend immediately translates to N*30 daily installments.
const DAYS_PER_MONTH = 30;

/**
 * createInstallmentInit
 * ---------------------
 * POST /createInstallmentInit
 * Headers: Authorization: Bearer <firebase id token>
 * Body:    { product_id: string, months: int }
 *
 * Starts a NEW DAILY-installment plan. The user picks N months, the system
 * stretches the payment across N*30 daily installments. The first daily
 * invoice is created here; the purchase doc materialises only after the
 * first day's QPay payment is confirmed (anti-spam).
 *
 * Flow:
 *  1. Validate user + product (active, has stock, etc.)
 *  2. Reject if the user already has an active installment (one at a time)
 *  3. Compute total_days = months*30, daily_payment = ceil(price/total_days)
 *  4. Reserve a pending_invoices doc up front (callback URL needs the id)
 *  5. Create QPay invoice for day 1's amount
 *  6. Persist pending_invoices/{pending_id} with everything needed to
 *     materialise the purchase doc later
 */
exports.createInstallmentInit = onRequest({
  region: "asia-northeast1",
  memory: "512MiB",
  timeoutSeconds: 60,
}, async (req, res) => {
  return cors(req, res, async () => {
    const db = admin.firestore();
    try {
      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      const uid = await authUid(req);
      const { product_id, months } = req.body || {};
      const monthsInt = parseInt(months, 10);
      if (!product_id) {
        return res.status(400).json({ error: "Missing product_id" });
      }
      if (!Number.isFinite(monthsInt) || monthsInt < 1 || monthsInt > 12) {
        return res
          .status(400)
          .json({ error: "months must be an integer between 1 and 12" });
      }

      // Block multiple concurrent installments per user.
      const activeSnap = await db
        .collection("product_purchases")
        .where("user_id", "==", uid)
        .where("status", "==", "active")
        .where("purchase_type", "==", "installment")
        .limit(1)
        .get();
      if (!activeSnap.empty) {
        return res.status(409).json({
          error:
            "Танд аль хэдийн идэвхтэй хуваан төлөлт байна. Үүнийгээ дуусгасны дараа шинээр эхлүүлнэ үү.",
        });
      }

      // Load product
      const productSnap = await db
        .collection("products")
        .doc(product_id)
        .get();
      if (!productSnap.exists) {
        return res.status(404).json({ error: "Product not found" });
      }
      const product = productSnap.data() || {};
      if (product.status !== "active") {
        return res.status(409).json({ error: "Product is not active" });
      }
      if (product.stock != null && Number(product.stock) <= 0) {
        return res.status(409).json({ error: "Product is out of stock" });
      }
      const price = Number(product.price || 0);
      if (price <= 0) {
        return res.status(409).json({ error: "Invalid product price" });
      }
      const minMonths = Number(product.min_months || 1);
      const maxMonths = Number(product.max_months || 12);
      if (monthsInt < minMonths || monthsInt > maxMonths) {
        return res.status(400).json({
          error: `months must be between ${minMonths} and ${maxMonths} for this product`,
        });
      }

      const totalDays = monthsInt * DAYS_PER_MONTH;
      const dailyPayment = Math.ceil(price / totalDays);

      // Snapshot user info
      const userSnap = await db.collection("users").doc(uid).get();
      if (!userSnap.exists) {
        return res.status(404).json({ error: "User not found" });
      }
      const u = userSnap.data() || {};
      const userSnapshot = {
        first_name: u.first_name || null,
        last_name: u.last_name || null,
        phone: u.phone || null,
        email: u.email || null,
      };

      const productSnapshot = {
        name: product.name || "",
        image: Array.isArray(product.images) && product.images.length > 0 ?
          product.images[0] :
          null,
        price,
        cancel_fee_percent: Number(product.cancel_fee_percent || 0),
      };

      // Reserve a Firestore doc id up front so we can embed it in the QPay
      // callback URL (QPay does not give us invoice_id until after the
      // invoice is created, but the URL has to be known at creation time).
      const pendingRef = db.collection("pending_invoices").doc();
      const pendingId = pendingRef.id;

      // Get QPay token
      const tokenResp = await axios.post(
        "https://merchant.qpay.mn/v2/auth/token",
        {},
        { auth: { username: QPAY_USERNAME, password: QPAY_PASSWORD } },
      );
      const token = tokenResp.data.access_token;

      // Build invoice
      const senderInvoiceNo = `INSTALL_INIT-${pendingId}`;
      const callbackUrl = `${CALLBACK_BASE}?pending_id=${pendingId}`;
      const invoicePayload = {
        invoice_code: "ONE_GRAM_GOLD_INVOICE",
        sender_invoice_no: senderInvoiceNo,
        invoice_receiver_code: "terminal",
        amount: dailyPayment,
        callback_url: callbackUrl,
        invoice_description:
          `Хуваан төлөлт — ${product.name || "Бараа"} (1/${totalDays} өдөр)`,
      };

      const invoiceResp = await axios.post(
        "https://merchant.qpay.mn/v2/invoice",
        invoicePayload,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      const qpayInvoice = invoiceResp.data || {};
      const invoiceId = qpayInvoice.invoice_id;
      if (!invoiceId) {
        logger.error("QPay invoice creation returned no invoice_id", {
          qpayInvoice,
        });
        return res
          .status(502)
          .json({ error: "QPay invoice creation failed (no invoice_id)" });
      }

      // Persist pending invoice record. We don't create the product_purchases
      // doc yet — that happens in the callback after QPay confirms payment.
      await pendingRef.set({
        type: "installment_init",
        pending_id: pendingId,
        invoice_id: invoiceId,
        product_id,
        product_snapshot: productSnapshot,
        user_id: uid,
        user_snapshot: userSnapshot,
        amount: dailyPayment,
        total_price: price,
        months: monthsInt,
        total_days: totalDays,
        daily_payment: dailyPayment,
        status: "pending",
        qpay_invoice: qpayInvoice,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info("Created installment-init QPay invoice", {
        product_id,
        uid,
        pending_id: pendingId,
        invoice_id: invoiceId,
        months: monthsInt,
        total_days: totalDays,
        daily_payment: dailyPayment,
      });

      return res.status(200).json({
        message: "Installment-init QPay invoice created",
        qpay_invoice: qpayInvoice,
        pending_id: pendingId,
        invoice_id: invoiceId,
        amount: dailyPayment,
        months: monthsInt,
        total_days: totalDays,
        daily_payment: dailyPayment,
        total_price: price,
      });
    } catch (err) {
      logger.error("Failed to create installment init", {
        error: err.message,
        stack: err.stack,
      });
      if (err.response && err.response.data) {
        logger.error("QPay error response", { data: err.response.data });
      }
      const code = err.message === "Missing or invalid Authorization header." ?
        401 :
        500;
      return res.status(code).json({
        error: err.message || "Failed to create installment init",
      });
    }
  });
});
