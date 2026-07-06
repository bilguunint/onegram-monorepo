const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });

// Same QPay merchant config as the installment flow (per product decision).
const QPAY_USERNAME = "LISTLY_AGENT";
const QPAY_PASSWORD = "nbIqiJvG";
const QPAY_INVOICE_CODE = "LISTLY_AGENT_INVOICE";

const CALLBACK_BASE =
  "https://asia-northeast1-grammgold.cloudfunctions.net/centerDonationCallback";

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
 * createCenterDonation
 * --------------------
 * POST /createCenterDonation
 * Headers: Authorization: Bearer <firebase id token>
 * Body: {
 *   items: [{ product_id: string, qty: number }],
 *   engrave_name?: string,   // name to engrave on the donor wall
 *   anonymous?: boolean
 * }
 *
 * Builds ONE QPay invoice for the full cart total (direct purchase — no
 * installments). Stores a pending invoice snapshotting the cart, user and
 * engraving choice. The matching callback creates the `center_donations` doc
 * only after QPay confirms payment.
 */
exports.createCenterDonation = onRequest({
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
      const body = req.body || {};
      const rawItems = Array.isArray(body.items) ? body.items : [];
      if (rawItems.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      // Campaign must be active.
      const campaignRef = db.collection("center_campaign").doc("main");
      const campaignSnap = await campaignRef.get();
      const campaign = campaignSnap.exists ? campaignSnap.data() : null;
      if (!campaign || campaign.status !== "active") {
        return res.status(409).json({ error: "Хандивын аян идэвхгүй байна." });
      }

      // Validate each product, compute the total and snapshot line items.
      const items = [];
      let amount = 0;
      for (const raw of rawItems) {
        const productId = raw && raw.product_id;
        const qty = Math.max(1, Math.floor(Number(raw && raw.qty) || 1));
        if (!productId) {
          return res.status(400).json({ error: "Invalid item (no product_id)" });
        }
        const pSnap = await db.collection("center_products").doc(productId).get();
        if (!pSnap.exists) {
          return res.status(404).json({ error: `Бараа олдсонгүй: ${productId}` });
        }
        const p = pSnap.data() || {};
        if (p.status !== "active") {
          return res.status(409).json({ error: `Бараа идэвхгүй: ${p.name || productId}` });
        }
        const hadStock = p.stock != null;
        if (hadStock && Number(p.stock) < qty) {
          return res.status(409).json({ error: `Нөөц хүрэлцэхгүй: ${p.name || productId}` });
        }
        const price = Number(p.price || 0);
        if (price <= 0) {
          return res.status(409).json({ error: `Үнэ буруу: ${p.name || productId}` });
        }
        items.push({
          type: "product",
          id: productId,
          name: p.name || "",
          image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null,
          price,
          qty,
          had_stock: hadStock,
        });
        amount += price * qty;
      }
      amount = Math.round(amount);
      if (amount <= 0) {
        return res.status(409).json({ error: "Invalid total amount" });
      }

      // Snapshot buyer.
      const userSnap = await db.collection("users").doc(uid).get();
      const u = userSnap.exists ? userSnap.data() : {};
      const accountName =
        [u.last_name, u.first_name].filter(Boolean).join(" ").trim() ||
        u.name ||
        "";
      const anonymous = body.anonymous === true;
      const engraveName = (body.engrave_name || accountName || "").toString().trim();

      // Reserve a pending invoice id for the callback URL.
      const pendingRef = db.collection("pending_invoices").doc();
      const pendingId = pendingRef.id;

      // QPay token
      const tokenResp = await axios.post(
        "https://merchant.qpay.mn/v2/auth/token",
        {},
        { auth: { username: QPAY_USERNAME, password: QPAY_PASSWORD } },
      );
      const token = tokenResp.data.access_token;

      const senderInvoiceNo = `CENTER-${pendingId}`;
      const callbackUrl = `${CALLBACK_BASE}?pending_id=${pendingId}`;
      const itemCount = items.reduce((s, it) => s + it.qty, 0);
      const invoicePayload = {
        invoice_code: QPAY_INVOICE_CODE,
        sender_invoice_no: senderInvoiceNo,
        invoice_receiver_code: "terminal",
        amount,
        callback_url: callbackUrl,
        invoice_description: `Хандивын худалдан авалт — ${itemCount} ширхэг`,
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
        logger.error("QPay invoice creation returned no invoice_id", { qpayInvoice });
        return res
          .status(502)
          .json({ error: "QPay invoice creation failed (no invoice_id)" });
      }

      await pendingRef.set({
        type: "center_donation",
        pending_id: pendingId,
        invoice_id: invoiceId,
        items,
        amount,
        user_id: uid,
        buyer_name: accountName,
        engrave_name: engraveName,
        anonymous,
        status: "pending",
        qpay_invoice: qpayInvoice,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info("Created center-donation QPay invoice", {
        uid,
        pending_id: pendingId,
        invoice_id: invoiceId,
        amount,
        itemCount,
      });

      return res.status(200).json({
        message: "Center donation QPay invoice created",
        qpay_invoice: qpayInvoice,
        pending_id: pendingId,
        invoice_id: invoiceId,
        amount,
      });
    } catch (err) {
      logger.error("Failed to create center donation", {
        error: err.message,
        stack: err.stack,
      });
      if (err.response && err.response.data) {
        logger.error("QPay error response", { data: err.response.data });
      }
      const code = err.message === "Missing or invalid Authorization header." ? 401 : 500;
      return res.status(code).json({
        error: err.message || "Failed to create center donation",
      });
    }
  });
});
