const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });

const QPAY_USERNAME = "ONE_GRAM_GOLD";
const QPAY_PASSWORD = "zElO7j40";

const CALLBACK_BASE =
  "https://asia-northeast1-grammgold.cloudfunctions.net/directPurchaseCallback";

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
 * createDirectPurchase
 * --------------------
 * POST /createDirectPurchase
 * Headers: Authorization: Bearer <firebase id token>
 * Body:    { product_id: string }
 *
 * Builds a QPay invoice for the full product price. Stores a pending invoice
 * record snapshotting product + user; the corresponding callback creates the
 * product_purchases doc only after QPay confirms payment.
 *
 * Unlike installments, no product_purchases doc is created up front — the
 * doc is created in the callback once payment lands. This keeps unpaid
 * "direct buy" attempts out of the user's purchases list.
 */
exports.createDirectPurchase = onRequest({
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
      const { product_id } = req.body || {};
      if (!product_id) {
        return res.status(400).json({ error: "Missing product_id" });
      }

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

      // Snapshot user info for the eventual product_purchases doc
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
      const senderInvoiceNo = `DIRECT-${pendingId}`;
      const callbackUrl = `${CALLBACK_BASE}?pending_id=${pendingId}`;
      const invoicePayload = {
        invoice_code: "ONE_GRAM_GOLD_INVOICE",
        sender_invoice_no: senderInvoiceNo,
        invoice_receiver_code: "terminal",
        amount: price,
        callback_url: callbackUrl,
        invoice_description: `Шууд худалдан авалт — ${product.name || "Бараа"}`,
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
      // The doc id is the reserved pending_id (referenced in callback URL),
      // and invoice_id is stored as a field for cross-reference.
      await pendingRef.set({
        type: "direct_purchase",
        pending_id: pendingId,
        invoice_id: invoiceId,
        product_id,
        product_snapshot: productSnapshot,
        user_id: uid,
        user_snapshot: userSnapshot,
        amount: price,
        status: "pending",
        qpay_invoice: qpayInvoice,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info("Created direct-purchase QPay invoice", {
        product_id,
        uid,
        pending_id: pendingId,
        invoice_id: invoiceId,
        amount: price,
      });

      return res.status(200).json({
        message: "Direct purchase QPay invoice created",
        qpay_invoice: qpayInvoice,
        pending_id: pendingId,
        invoice_id: invoiceId,
        amount: price,
      });
    } catch (err) {
      logger.error("Failed to create direct purchase", {
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
        error: err.message || "Failed to create direct purchase",
      });
    }
  });
});
