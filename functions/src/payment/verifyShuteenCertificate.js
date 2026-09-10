const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const { parseAndVerifyPayload } = require("./shuteenShared");

/**
 * Эзэмшигчийн нэрийг "Б. Н." хэлбэрт оруулна — хувийн мэдээлэл задруулахгүй.
 * @param {string} name
 * @return {string}
 */
function initials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w[0].toUpperCase()}.`)
    .join(" ");
}

/**
 * verifyShuteenCertificate
 * ------------------------
 * GET  /verifyShuteenCertificate?payload=shuteen:SH-000001:<id>:<sig>
 * POST /verifyShuteenCertificate  { payload }
 *
 * Нэвтрэлт шаардахгүй — дэлгүүрийн ажилтан, цогцолборын хаалга ч дуудаж болно.
 * Гарын үсэг таарахгүй бол Firestore руу огт хандахгүй, `valid:false` буцаана.
 * Буцаах мэдээлэл хязгаартай: дугаар, нэгж, түвшин, эзэмшигчийн нэрийн эхний
 * үсэг, төлөв, огноо. Утас, дүн, uid буцаахгүй.
 */
exports.verifyShuteenCertificate = onRequest({
  region: "asia-northeast1",
  memory: "256MiB",
  timeoutSeconds: 30,
}, async (req, res) => {
  return cors(req, res, async () => {
    try {
      const payload =
        (req.method === "POST" ? req.body && req.body.payload : req.query.payload) || "";
      const parsed = parseAndVerifyPayload(payload);
      if (!parsed.ok) {
        return res.status(200).json({ valid: false, reason: "invalid_signature" });
      }

      const snap = await admin
        .firestore()
        .collection("shuteen_orders")
        .doc(parsed.orderId)
        .get();
      if (!snap.exists) {
        return res.status(200).json({ valid: false, reason: "not_found" });
      }
      const o = snap.data() || {};
      if (o.certificate_no !== parsed.certificateNo) {
        return res.status(200).json({ valid: false, reason: "mismatch" });
      }
      const active = o.status === "active";
      const toIso = (t) => (t && t.toDate ? t.toDate().toISOString() : null);

      return res.status(200).json({
        valid: active,
        reason: active ? "ok" : `status_${o.status || "unknown"}`,
        certificate_no: o.certificate_no,
        units: Number(o.units || 0),
        tier: Number(o.tier || 0),
        owner_initials: initials(o.buyer_name),
        status: o.status || "unknown",
        issued_at: toIso(o.created_at),
        buyback_at: toIso(o.buyback_at),
      });
    } catch (err) {
      logger.error("verifyShuteenCertificate failed", { error: err.message });
      return res.status(500).json({ valid: false, reason: "error" });
    }
  });
});
