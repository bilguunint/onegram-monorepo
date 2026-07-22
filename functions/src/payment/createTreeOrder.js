const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });

// Same QPay merchant config as the center-donation flow.
const QPAY_USERNAME = "LISTLY_AGENT";
const QPAY_PASSWORD = "nbIqiJvG";
const QPAY_INVOICE_CODE = "LISTLY_AGENT_INVOICE";

const CALLBACK_BASE =
  "https://asia-northeast1-grammgold.cloudfunctions.net/treeOrderCallback";

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
 * createTreeOrder
 * ---------------
 * POST /createTreeOrder
 * Headers: Authorization: Bearer <firebase id token>
 * Body: {
 *   tree_id: string,
 *   qty: number,          // >= 1
 *   label_name: string    // name printed on the tree's plaque (шошго)
 * }
 *
 * Builds a QPay invoice for a tree-planting order at the Morin Khuur center.
 * The matching callback creates the `center_tree_orders` doc only after QPay
 * confirms payment.
 */
exports.createTreeOrder = onRequest({
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
      const treeId = (body.tree_id || "").toString().trim();
      const qty = Math.max(1, Math.floor(Number(body.qty) || 1));
      const labelName = (body.label_name || "").toString().trim();

      if (!treeId) {
        return res.status(400).json({ error: "Missing tree_id" });
      }
      if (labelName.length < 2 || labelName.length > 40) {
        return res.status(400).json({
          error: "Шошгон дээр хэвлэгдэх нэр 2-40 тэмдэгт байна.",
        });
      }

      // Campaign must be active.
      const campaignSnap = await db.collection("center_campaign").doc("main").get();
      const campaign = campaignSnap.exists ? campaignSnap.data() : null;
      if (!campaign || campaign.status !== "active") {
        return res.status(409).json({ error: "Дэмжлэгийн аян идэвхгүй байна." });
      }

      // Validate the tree.
      const treeSnap = await db.collection("center_trees").doc(treeId).get();
      if (!treeSnap.exists) {
        return res.status(404).json({ error: "Мод олдсонгүй." });
      }
      const tree = treeSnap.data() || {};
      if (tree.status !== "active") {
        return res.status(409).json({ error: "Энэ мод идэвхгүй байна." });
      }
      const hadStock = tree.stock != null;
      if (hadStock && Number(tree.stock) < qty) {
        return res.status(409).json({ error: "Модны нөөц хүрэлцэхгүй байна." });
      }
      const price = Number(tree.price || 0);
      if (price <= 0) {
        return res.status(409).json({ error: "Модны үнэ буруу байна." });
      }
      const amount = Math.round(price * qty);

      // Buyer snapshot.
      const userSnap = await db.collection("users").doc(uid).get();
      const u = userSnap.exists ? userSnap.data() : {};
      const buyerName =
        [u.last_name, u.first_name].filter(Boolean).join(" ").trim() ||
        u.name || "";

      // Reserve a pending invoice id for the callback URL.
      const pendingRef = db.collection("pending_invoices").doc();
      const pendingId = pendingRef.id;

      // QPay token + invoice
      const tokenResp = await axios.post(
        "https://merchant.qpay.mn/v2/auth/token",
        {},
        { auth: { username: QPAY_USERNAME, password: QPAY_PASSWORD } },
      );
      const token = tokenResp.data.access_token;

      const invoicePayload = {
        invoice_code: QPAY_INVOICE_CODE,
        sender_invoice_no: `TREE-${pendingId}`,
        invoice_receiver_code: "terminal",
        amount,
        callback_url: `${CALLBACK_BASE}?pending_id=${pendingId}`,
        invoice_description: `Мод тарих захиалга — ${tree.name || "Мод"} x${qty}`,
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
        type: "tree_order",
        pending_id: pendingId,
        invoice_id: invoiceId,
        tree_id: treeId,
        tree_snapshot: {
          name: tree.name || "",
          image: Array.isArray(tree.images) && tree.images.length > 0 ?
            tree.images[0] :
            null,
          price,
        },
        had_stock: hadStock,
        label_name: labelName,
        qty,
        amount,
        user_id: uid,
        buyer_name: buyerName,
        status: "pending",
        qpay_invoice: qpayInvoice,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info("Created tree-order QPay invoice", {
        uid,
        pending_id: pendingId,
        invoice_id: invoiceId,
        tree_id: treeId,
        qty,
        amount,
      });

      return res.status(200).json({
        message: "Tree order QPay invoice created",
        qpay_invoice: qpayInvoice,
        pending_id: pendingId,
        invoice_id: invoiceId,
        amount,
      });
    } catch (err) {
      logger.error("Failed to create tree order", {
        error: err.message,
        stack: err.stack,
      });
      if (err.response && err.response.data) {
        logger.error("QPay error response", { data: err.response.data });
      }
      const code =
        err.message === "Missing or invalid Authorization header." ? 401 : 500;
      return res.status(code).json({
        error: err.message || "Мод тарих захиалга үүсгэхэд алдаа гарлаа.",
      });
    }
  });
});
