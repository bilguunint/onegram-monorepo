const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });

const QPAY_USERNAME = "LISTLY_AGENT";
const QPAY_PASSWORD = "nbIqiJvG";

const CALLBACK_BASE =
  "https://asia-northeast1-grammgold.cloudfunctions.net/installmentCallback";

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

/**
 * createInstallmentPayment
 * ------------------------
 * POST /createInstallmentPayment
 * Headers: Authorization: Bearer <firebase id token>
 * Body:    { purchase_id: string }
 *
 * Looks up the user's active installment purchase, computes which DAY is
 * due next (paid_days + 1), creates a QPay invoice for that day's payment,
 * and returns the QPay invoice payload (qr_text, qr_image, qPay_shortUrl,
 * urls[]) for the app to render.
 *
 * The last day's invoice amount is adjusted so the sum of all daily
 * payments equals total_price exactly (handles ceil rounding remainder).
 */
exports.createInstallmentPayment = onRequest({
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
      const { purchase_id, days } = req.body || {};
      if (!purchase_id) {
        return res.status(400).json({ error: "Missing purchase_id" });
      }
      // How many upcoming days to bundle into a single invoice (default 1).
      const requestedDays = Math.max(1, Math.floor(Number(days) || 1));

      const purchaseRef = db.collection("product_purchases").doc(purchase_id);
      const purchaseSnap = await purchaseRef.get();
      if (!purchaseSnap.exists) {
        return res.status(404).json({ error: "Purchase not found" });
      }
      const purchase = purchaseSnap.data() || {};

      if (purchase.user_id !== uid) {
        return res.status(403).json({ error: "Forbidden" });
      }
      if (purchase.status !== "active") {
        return res.status(409).json({
          error: "Purchase is not active",
          status: purchase.status,
        });
      }
      if (purchase.purchase_type !== "installment") {
        return res.status(409).json({ error: "Purchase is not an installment plan" });
      }
      if (purchase.cancel_request_status === "pending") {
        return res.status(409).json({
          error: "Цуцлах хүсэлт хүлээгдэж байгаа тул төлбөр хийх боломжгүй.",
        });
      }

      const paidDays = Number(purchase.paid_days || 0);
      const totalDays = Number(purchase.total_days || 0);
      const totalPrice = Number(purchase.total_price || 0);
      const paidAmount = Number(purchase.paid_amount || 0);
      if (totalDays <= 0) {
        return res.status(409).json({ error: "Invalid total_days value" });
      }
      if (paidDays >= totalDays) {
        return res.status(409).json({ error: "All days are already paid" });
      }
      const nextDay = paidDays + 1;
      const dailyPayment = Number(purchase.daily_payment || 0);
      if (dailyPayment <= 0) {
        return res.status(409).json({ error: "Invalid daily_payment value" });
      }

      // Bundle: pay days nextDay … endDay in a single invoice. endDay is
      // capped at the final day, so "pay all remaining" is just a large
      // `days` value.
      const endDay = Math.min(nextDay + requestedDays - 1, totalDays);
      const includesLastDay = endDay >= totalDays;
      // If the bundle reaches the final day, charge exactly what's left so the
      // total equals total_price (avoids ceil-rounding overpay). Otherwise
      // it's a flat dayCount × dailyPayment.
      const dayCount = endDay - nextDay + 1;
      const invoiceAmount = includesLastDay ?
        Math.max(totalPrice - paidAmount, 0) :
        dailyPayment * dayCount;
      if (invoiceAmount <= 0) {
        return res.status(409).json({ error: "Nothing left to pay" });
      }

      // Avoid duplicate invoices: reuse an existing pending invoice only if it
      // covers the exact same range (same nextDay → endDay).
      const existing = await db
        .collection("pending_invoices")
        .where("purchase_id", "==", purchase_id)
        .where("day_no", "==", endDay)
        .where("status", "==", "pending")
        .limit(1)
        .get();

      if (!existing.empty) {
        const data = existing.docs[0].data();
        if (data.qpay_invoice && Number(data.day_from || data.day_no) === nextDay) {
          logger.info("Reusing existing pending invoice", {
            purchase_id,
            nextDay,
            endDay,
            invoice_id: data.invoice_id,
          });
          return res.status(200).json({
            message: "Pending invoice already exists",
            qpay_invoice: data.qpay_invoice,
            invoice_id: data.invoice_id,
            day_no: endDay,
            day_from: nextDay,
            day_to: endDay,
            day_count: dayCount,
            amount: invoiceAmount,
          });
        }
      }

      // Get QPay token
      const tokenResp = await axios.post(
        "https://merchant.qpay.mn/v2/auth/token",
        {},
        { auth: { username: QPAY_USERNAME, password: QPAY_PASSWORD } },
      );
      const token = tokenResp.data.access_token;

      // Build invoice. The callback URL carries day_no=endDay so the callback
      // credits every day up to the end of the bundle in one shot.
      const senderInvoiceNo = `INSTALL-${purchase_id}-${nextDay}-${endDay}`;
      const callbackUrl =
        `${CALLBACK_BASE}?purchase_id=${encodeURIComponent(purchase_id)}` +
        `&day_no=${endDay}&day_from=${nextDay}`;
      const dayLabel = dayCount > 1 ?
        `${nextDay}-${endDay}/${totalDays} өдөр` :
        `${nextDay}/${totalDays} өдөр`;
      const invoicePayload = {
        invoice_code: "LISTLY_AGENT_INVOICE",
        sender_invoice_no: senderInvoiceNo,
        invoice_receiver_code: "terminal",
        amount: invoiceAmount,
        callback_url: callbackUrl,
        invoice_description:
          `Хуваан төлөлт — ${purchase.product_snapshot && purchase.product_snapshot.name || "Бараа"} (${dayLabel})`,
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

      // Persist pending invoice (idempotent by invoice_id). day_no = endDay so
      // the callback lookup (which queries by day_no) matches the bundle's
      // last day; day_from/day_to/day_count record the full range.
      await db.collection("pending_invoices").doc(invoiceId).set({
        type: "installment",
        invoice_id: invoiceId,
        purchase_id,
        day_no: endDay,
        day_from: nextDay,
        day_to: endDay,
        day_count: dayCount,
        userId: uid,
        amount: invoiceAmount,
        status: "pending",
        qpay_invoice: qpayInvoice,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info("Created installment QPay invoice", {
        purchase_id,
        nextDay,
        endDay,
        dayCount,
        invoice_id: invoiceId,
        amount: invoiceAmount,
      });

      return res.status(200).json({
        message: "Installment QPay invoice created",
        qpay_invoice: qpayInvoice,
        invoice_id: invoiceId,
        day_no: endDay,
        day_from: nextDay,
        day_to: endDay,
        day_count: dayCount,
        amount: invoiceAmount,
      });
    } catch (err) {
      logger.error("Failed to create installment payment", {
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
        error: err.message || "Failed to create installment payment",
      });
    }
  });
});
