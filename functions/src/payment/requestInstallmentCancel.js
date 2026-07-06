const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

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
 * requestInstallmentCancel
 * ------------------------
 * POST /requestInstallmentCancel
 * Headers: Authorization: Bearer <firebase id token>
 * Body: {
 *   purchase_id: string,
 *   bank_name: string,       // recipient bank (Mongolian bank name)
 *   account_number: string,  // digits
 *   account_holder: string   // recipient full name
 * }
 *
 * The user asks to cancel their ACTIVE installment plan. Creates an
 * `installment_cancel_requests` doc (status "pending") for admins to review
 * in nextjs-admin, and stamps the purchase with cancel_request_status so the
 * app shows the pending state and payments are blocked meanwhile.
 *
 * The refund math is computed SERVER-side from the purchase doc:
 *   fee    = round(paid_amount * cancel_fee_percent / 100)
 *   refund = paid_amount - fee
 * The actual bank transfer is done manually by staff after admin approval —
 * this only records the request (refund = paid − fee, recorded only).
 */
exports.requestInstallmentCancel = onRequest({
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
      const purchaseId = (body.purchase_id || "").toString().trim();
      const bankName = (body.bank_name || "").toString().trim();
      const accountNumber = (body.account_number || "").toString().trim();
      const accountHolder = (body.account_holder || "").toString().trim();

      if (!purchaseId) {
        return res.status(400).json({ error: "Missing purchase_id" });
      }
      if (!bankName) {
        return res.status(400).json({ error: "Банк сонгоно уу." });
      }
      if (!/^\d{5,20}$/.test(accountNumber)) {
        return res.status(400).json({ error: "Дансны дугаар буруу байна (зөвхөн тоо, 5-20 орон)." });
      }
      if (accountHolder.length < 2) {
        return res.status(400).json({ error: "Хүлээн авагчийн нэрээ оруулна уу." });
      }

      const purchaseRef = db.collection("product_purchases").doc(purchaseId);
      const requestRef = db.collection("installment_cancel_requests").doc();

      // Validate + create atomically so double-taps can't create two
      // pending requests for the same purchase.
      const result = await db.runTransaction(async (tx) => {
        const snap = await tx.get(purchaseRef);
        if (!snap.exists) {
          throw new Error("PURCHASE_NOT_FOUND");
        }
        const p = snap.data() || {};
        if (p.user_id !== uid) {
          throw new Error("FORBIDDEN");
        }
        if (p.purchase_type !== "installment") {
          throw new Error("NOT_INSTALLMENT");
        }
        if (p.status !== "active") {
          throw new Error("NOT_ACTIVE");
        }
        if (p.cancel_request_status === "pending") {
          throw new Error("ALREADY_PENDING");
        }

        const paidAmount = Number(p.paid_amount || 0);
        const ps = p.product_snapshot || {};
        const feePercent = Math.min(
          100,
          Math.max(0, Number(ps.cancel_fee_percent || 0)),
        );
        const feeAmount = Math.round((paidAmount * feePercent) / 100);
        const refundAmount = Math.max(0, paidAmount - feeAmount);

        tx.set(requestRef, {
          purchase_id: purchaseId,
          user_id: uid,
          user_snapshot: p.user_snapshot || {},
          product_name: (ps.name || "").toString(),
          paid_amount: paidAmount,
          paid_days: Number(p.paid_days || 0),
          total_days: Number(p.total_days || 0),
          fee_percent: feePercent,
          fee_amount: feeAmount,
          refund_amount: refundAmount,
          bank_name: bankName,
          account_number: accountNumber,
          account_holder: accountHolder,
          status: "pending",
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        tx.update(purchaseRef, {
          cancel_request_status: "pending",
          cancel_request_id: requestRef.id,
          cancel_requested_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        return { paidAmount, feePercent, feeAmount, refundAmount };
      });

      logger.info("Installment cancel requested", {
        uid,
        purchase_id: purchaseId,
        request_id: requestRef.id,
        ...result,
      });

      return res.status(200).json({
        message: "Cancel request created",
        request_id: requestRef.id,
        paid_amount: result.paidAmount,
        fee_percent: result.feePercent,
        fee_amount: result.feeAmount,
        refund_amount: result.refundAmount,
      });
    } catch (err) {
      const map = {
        "PURCHASE_NOT_FOUND": [404, "Худалдан авалт олдсонгүй."],
        "FORBIDDEN": [403, "Энэ худалдан авалт таных биш байна."],
        "NOT_INSTALLMENT": [409, "Зөвхөн хуваан төлөлтийг цуцлах хүсэлт гаргана."],
        "NOT_ACTIVE": [409, "Зөвхөн идэвхтэй хуваан төлөлтийг цуцална."],
        "ALREADY_PENDING": [409, "Цуцлах хүсэлт аль хэдийн илгээгдсэн байна."],
      };
      const hit = map[err.message];
      if (hit) {
        return res.status(hit[0]).json({ error: hit[1] });
      }
      logger.error("Failed to create cancel request", {
        error: err.message,
        stack: err.stack,
      });
      const code =
        err.message === "Missing or invalid Authorization header." ? 401 : 500;
      return res.status(code).json({
        error: err.message || "Цуцлах хүсэлт үүсгэхэд алдаа гарлаа.",
      });
    }
  });
});
