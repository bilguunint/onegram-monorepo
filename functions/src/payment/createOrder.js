const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });

const QPAY_USERNAME = "ONE_GRAM_GOLD";
const QPAY_PASSWORD = "zElO7j40";

// Helper to get client profile info from user document by uid (e.g., user_5850)
async function getClientInfo(db, uid) {
  try {
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) return {};
    const data = userDoc.data() || {};
    return {
      phone: data.phone || data.client_phone || null,
      email: data.email || data.client_email || null,
      first_name: data.first_name || data.client_first_name || null,
      last_name: data.last_name || data.client_last_name || null,
    };
  } catch (e) {
    logger.warn("Failed to load client info", { uid, error: e.message });
    return {};
  }
}

exports.createOrder = onRequest({
  region: "asia-northeast1", // Tokyo - Mongolia-д хамгийн ойр
  memory: "512MiB",
  timeoutSeconds: 120,
}, async (req, res) => {
  return cors(req, res, async () => {
    const db = admin.firestore();
    try {
      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      const {
        // id removed: always use Firestore auto ID
        user_id, // e.g., "user_5850"
        amount, // number total amount to pay
        quantity, // number
        price, // number
        metal_id, // number
        prod_type, // string e.g., "ingot"
        type = "deposit", // default deposit
      } = req.body || {};

      if (!user_id || !amount || !quantity || !price || !metal_id || !prod_type) {
        return res.status(400).json({
          error: "Missing required fields: user_id, amount, quantity, price, metal_id, prod_type",
        });
      }

      // Calculate total amount with service fee and tax
      const baseAmount = quantity * price;
      const serviceFee = baseAmount * 0.05; // 5% service fee
      const subtotal = baseAmount + serviceFee;
      const tax = subtotal * 0.20; // 20% tax
      const calculatedAmount = Math.round(subtotal + tax);

      // Generate Firestore auto ID for the order
      const orderRef = db.collection("orders").doc();
      const orderId = orderRef.id;

      // Build client info from users collection by uid
      const client = await getClientInfo(db, user_id);

      // Create QPay token
      const tokenResp = await axios.post("https://merchant.qpay.mn/v2/auth/token", {}, {
        auth: { username: QPAY_USERNAME, password: QPAY_PASSWORD },
      });
      const token = tokenResp.data.access_token;

      // Prepare QPay invoice (first without callback to get invoice_id)
      const senderInvoiceNo = `ORDER-${orderId}`;
      const invoicePayload = {
        invoice_code: "ONE_GRAM_GOLD_INVOICE",
        sender_invoice_no: senderInvoiceNo,
        invoice_receiver_code: "terminal",
        amount: calculatedAmount,
        callback_url: `https://asia-northeast1-grammgold.cloudfunctions.net/qpayCallback?userId=${encodeURIComponent(user_id)}&orderId=${encodeURIComponent(orderId)}`,
        invoice_description: "Order Payment",
      };

      const invoiceResp = await axios.post("https://merchant.qpay.mn/v2/invoice", invoicePayload, {
        headers: {
          Authorization: `Bearer ${token}`, // eslint-disable-line
          "Content-Type": "application/json",
        },
      });

      const invoice_id = invoiceResp.data.invoice_id;
      const qpay_description = invoice_id;

      // Create order doc with pending statuses
      const orderDoc = {
        id: orderId,
        user_id,
        invoice_id, // Store invoice_id for direct lookup
        amount: Number(calculatedAmount),
        price: Number(price),
        quantity: Number(quantity),
        metal_id: Number(metal_id),
        payment_status: "pending",
        admin_status: "pending",
        type,
        prod_type,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        client,
        qpay_description,
      };

      await orderRef.set(orderDoc, { merge: false });

      // Track pending invoice by invoice_id as key (not user_id) 
      // to avoid overwriting when same user creates multiple orders
      await db.collection("pending_invoices").doc(invoice_id).set({
        invoice_id,
        userId: user_id,
        amount: Number(calculatedAmount),
        order_id: orderId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "pending",
      });

      // Optionally record a wallet transaction if needed (not required for order)

      return res.status(200).json({
        message: "Order created and QPay invoice generated",
        order: orderDoc,
        qpay_invoice: invoiceResp.data,
      });
    } catch (err) {
      logger.error("Failed to create order", { error: err.message, stack: err.stack });
      if (err.response && err.response.data) {
        logger.error("QPay error response", { data: err.response.data });
      }
      return res.status(500).json({ error: "Failed to create order" });
    }
  });
});
