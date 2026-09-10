const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });

// Хуваан төлөлт / мод захиалгатай ижил QPay merchant тохиргоо.
const QPAY_USERNAME = "LISTLY_AGENT";
const QPAY_PASSWORD = "nbIqiJvG";
const QPAY_INVOICE_CODE = "LISTLY_AGENT_INVOICE";

const CALLBACK_BASE =
  "https://asia-northeast1-grammgold.cloudfunctions.net/shuteenOrderCallback";

const MAX_UNITS_PER_ORDER = 100000;

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
 * createShuteenOrder
 * ------------------
 * POST /createShuteenOrder
 * Headers: Authorization: Bearer <firebase id token>
 * Body: { units: number }   // >= 1
 *
 * "Шүтээн хуур" хэсэгчилсэн эзэмшлийн нэгж худалдан авах QPay invoice үүсгэнэ.
 * `shuteen_orders` doc-ийг зөвхөн QPay төлбөр баталгаажсаны дараа callback
 * үүсгэнэ (shuteenShared.recordShuteenOrderPaid).
 */
exports.createShuteenOrder = onRequest({
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
      const units = Math.floor(Number(body.units) || 0);

      if (units < 1 || units > MAX_UNITS_PER_ORDER) {
        return res.status(400).json({
          error: `Нэгжийн тоо 1–${MAX_UNITS_PER_ORDER} хооронд байна.`,
        });
      }

      // Хөтөлбөр идэвхтэй байх ёстой.
      const programSnap = await db.collection("shuteen_khuur").doc("main").get();
      const program = programSnap.exists ? programSnap.data() : null;
      if (!program || program.status !== "active") {
        return res.status(409).json({ error: "Шүтээн хуурын хөтөлбөр идэвхгүй байна." });
      }
      const unitPrice = Math.round(Number(program.unit_price || 0));
      if (unitPrice <= 0) {
        return res.status(409).json({ error: "Нэгжийн үнэ тохируулаагүй байна." });
      }
      const totalUnits = Number(program.total_units || 0);
      const soldUnits = Number(program.sold_units || 0);
      const remaining = totalUnits > 0 ? totalUnits - soldUnits : Infinity;
      if (remaining <= 0) {
        return res.status(409).json({ error: "Бүх нэгж зарагдаж дууссан байна." });
      }
      if (units > remaining) {
        return res.status(409).json({
          error: `Зөвхөн ${remaining} нэгж үлдсэн байна.`,
        });
      }
      const amount = unitPrice * units;

      // Худалдан авагчийн snapshot.
      const userSnap = await db.collection("users").doc(uid).get();
      const u = userSnap.exists ? userSnap.data() : {};
      const buyerName =
        [u.last_name, u.first_name].filter(Boolean).join(" ").trim() ||
        u.name || "";
      const buyerPhone = (u.phone || u.phone_number || "").toString();

      // Callback URL-д зориулж pending invoice id урьдчилан авна.
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
        sender_invoice_no: `SHUTEEN-${pendingId}`,
        invoice_receiver_code: "terminal",
        amount,
        callback_url: `${CALLBACK_BASE}?pending_id=${pendingId}`,
        invoice_description: `Шүтээн хуур — ${units} нэгж хувь`,
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
        type: "shuteen_order",
        pending_id: pendingId,
        invoice_id: invoiceId,
        units,
        amount,
        program_snapshot: {
          unit_price: unitPrice,
          annual_growth_percent: Number(program.annual_growth_percent || 0),
          hold_months: Number(program.hold_months || 24),
          buyback_price: Math.round(Number(program.buyback_price || 0)),
        },
        user_id: uid,
        buyer_name: buyerName,
        buyer_phone: buyerPhone,
        status: "pending",
        qpay_invoice: qpayInvoice,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info("Created shuteen-order QPay invoice", {
        uid,
        pending_id: pendingId,
        invoice_id: invoiceId,
        units,
        amount,
      });

      return res.status(200).json({
        message: "Shuteen order QPay invoice created",
        qpay_invoice: qpayInvoice,
        pending_id: pendingId,
        invoice_id: invoiceId,
        amount,
        units,
      });
    } catch (err) {
      logger.error("Failed to create shuteen order", {
        error: err.message,
        stack: err.stack,
      });
      if (err.response && err.response.data) {
        logger.error("QPay error response", { data: err.response.data });
      }
      const code =
        err.message === "Missing or invalid Authorization header." ? 401 : 500;
      return res.status(code).json({
        error: err.message || "Нэгж худалдан авах захиалга үүсгэхэд алдаа гарлаа.",
      });
    }
  });
});
