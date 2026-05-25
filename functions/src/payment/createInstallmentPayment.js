const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });

const QPAY_USERNAME = "ONE_GRAM_GOLD";
const QPAY_PASSWORD = "zElO7j40";

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
 * Looks up the user's active installment purchase, computes which month is
 * due next (paid_months + 1), creates a QPay invoice for that month's
 * payment, and returns the QPay invoice payload (qr_text, qr_image,
 * qPay_shortUrl, urls[]) for the app to render.
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
      const { purchase_id } = req.body || {};
      if (!purchase_id) {
        return res.status(400).json({ error: "Missing purchase_id" });
      }

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

      const paidMonths = Number(purchase.paid_months || 0);
      const months = Number(purchase.months || 0);
      if (paidMonths >= months) {
        return res.status(409).json({ error: "All months are already paid" });
      }
      const nextMonth = paidMonths + 1;
      const monthlyPayment = Number(purchase.monthly_payment || 0);
      if (monthlyPayment <= 0) {
        return res.status(409).json({ error: "Invalid monthly_payment value" });
      }

      // Avoid duplicate invoices for the same month: reuse an existing pending
      // invoice if one already exists for this (purchase, month).
      const existing = await db
        .collection("pending_invoices")
        .where("purchase_id", "==", purchase_id)
        .where("month_no", "==", nextMonth)
        .where("status", "==", "pending")
        .limit(1)
        .get();

      if (!existing.empty) {
        const data = existing.docs[0].data();
        if (data.qpay_invoice) {
          logger.info("Reusing existing pending invoice", {
            purchase_id,
            nextMonth,
            invoice_id: data.invoice_id,
          });
          return res.status(200).json({
            message: "Pending invoice already exists",
            qpay_invoice: data.qpay_invoice,
            invoice_id: data.invoice_id,
            month_no: nextMonth,
            amount: monthlyPayment,
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

      // Build invoice
      const senderInvoiceNo = `INSTALL-${purchase_id}-${nextMonth}`;
      const callbackUrl =
        `${CALLBACK_BASE}?purchase_id=${encodeURIComponent(purchase_id)}` +
        `&month_no=${nextMonth}`;
      const invoicePayload = {
        invoice_code: "ONE_GRAM_GOLD_INVOICE",
        sender_invoice_no: senderInvoiceNo,
        invoice_receiver_code: "terminal",
        amount: monthlyPayment,
        callback_url: callbackUrl,
        invoice_description:
          `Хуваан төлөлт — ${purchase.product_snapshot && purchase.product_snapshot.name || "Бараа"} (${nextMonth}/${months} сар)`,
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

      // Persist pending invoice (idempotent by invoice_id)
      await db.collection("pending_invoices").doc(invoiceId).set({
        type: "installment",
        invoice_id: invoiceId,
        purchase_id,
        month_no: nextMonth,
        userId: uid,
        amount: monthlyPayment,
        status: "pending",
        qpay_invoice: qpayInvoice,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info("Created installment QPay invoice", {
        purchase_id,
        nextMonth,
        invoice_id: invoiceId,
        amount: monthlyPayment,
      });

      return res.status(200).json({
        message: "Installment QPay invoice created",
        qpay_invoice: qpayInvoice,
        invoice_id: invoiceId,
        month_no: nextMonth,
        amount: monthlyPayment,
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
