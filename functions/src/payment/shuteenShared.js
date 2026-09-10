const crypto = require("crypto");
const admin = require("firebase-admin");
const { logger } = require("firebase-functions");
const { getQPayToken, checkQPayPayment } = require("./installmentShared");

/**
 * Гэрчилгээний HMAC-SHA256 гарын үсэг (эхний 24 hex тэмдэгт = 96 бит).
 * Нууц түлхүүр `.env` → SHUTEEN_CERT_SECRET. Түлхүүргүй бол throw —
 * гарын үсэггүй гэрчилгээ үүсгэхгүй.
 * @param {string} certificateNo - SH-000001
 * @param {string} orderId - shuteen_orders doc id
 * @return {string} hex гарын үсэг
 */
function signCertificate(certificateNo, orderId) {
  const secret = process.env.SHUTEEN_CERT_SECRET;
  if (!secret) throw new Error("SHUTEEN_CERT_SECRET is not configured");
  return crypto
    .createHmac("sha256", secret)
    .update(`${certificateNo}:${orderId}`)
    .digest("hex")
    .slice(0, 24);
}

/**
 * QR payload-ийг задлан гарын үсгийг timing-safe харьцуулна.
 * Формат: shuteen:<certificate_no>:<order_id>:<signature>
 * @param {string} payload - QR-ийн утга
 * @return {object} { ok, certificateNo, orderId }
 */
function parseAndVerifyPayload(payload) {
  const parts = String(payload || "").trim().split(":");
  if (parts.length !== 4 || parts[0] !== "shuteen") return { ok: false };
  const [, certificateNo, orderId, sig] = parts;
  if (!/^SH-\d{6}$/.test(certificateNo) || !orderId || !sig) return { ok: false };
  let expected;
  try {
    expected = signCertificate(certificateNo, orderId);
  } catch (_) {
    return { ok: false };
  }
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false };
  return { ok: true, certificateNo, orderId };
}

/**
 * Гэрчилгээний дугаар: SH-000001 хэлбэртэй, `shuteen_khuur/main.certificate_seq`
 * тоолуураас transaction дотор олгоно.
 * @param {number} seq
 * @return {string}
 */
function certificateNo(seq) {
  return `SH-${String(seq).padStart(6, "0")}`;
}

/**
 * Эзэмшлийн түвшин — нэгжийн тоогоор (баримт: 100–499 I, 500–999 II, 1000+ III)
 * @param {number} units
 * @return {number} 0..3
 */
function tierFor(units) {
  if (units >= 1000) return 3;
  if (units >= 500) return 2;
  if (units >= 100) return 1;
  return 0;
}

/**
 * Төлөгдсөн "Шүтээн хуур" нэгжийн захиалгыг idempotent бүртгэнэ:
 *   1. (transaction) `shuteen_orders` doc + гэрчилгээний дугаар үүсгэж,
 *      `shuteen_khuur/main.sold_units`, `certificate_seq`-ийг нэмж,
 *      pending invoice-ийг processed болгоно
 *   2. (best-effort) `shuteen_holders/{uid}` нэгтгэлийг шинэчилнэ
 *
 * Callback, аппын self-heal poll, scheduled backstop гурвуулаа үүнийг дуудна.
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {FirebaseFirestore.DocumentReference} pendingRef - pending invoice ref
 * @param {object} pendingData - pending invoice data
 * @return {object} { orderId, created }
 */
async function recordShuteenOrderPaid(db, pendingRef, pendingData) {
  const invoiceId = pendingData.invoice_id;
  const amount = Number(pendingData.amount || 0);
  const uid = pendingData.user_id;
  const units = Math.max(1, Math.floor(Number(pendingData.units || 1)));
  const snap = pendingData.program_snapshot || {};
  const pendingId = pendingRef.id;

  const programRef = db.collection("shuteen_khuur").doc("main");
  const orderRef = db.collection("shuteen_orders").doc();
  let created = false;
  let orderId = pendingData.shuteen_order_id || null;

  await db.runTransaction(async (tx) => {
    const cur = await tx.get(pendingRef);
    const curData = cur.data() || {};
    if (curData.status === "processed" && curData.shuteen_order_id) {
      orderId = curData.shuteen_order_id;
      return;
    }
    const programSnap = await tx.get(programRef);
    const program = programSnap.exists ? programSnap.data() : {};
    const seq = Number(program.certificate_seq || 0) + 1;
    const holdMonths = Number(snap.hold_months || program.hold_months || 24);

    const now = admin.firestore.Timestamp.now();
    const buybackDate = new Date(now.toDate());
    buybackDate.setMonth(buybackDate.getMonth() + holdMonths);

    const totalUnits = Number(program.total_units || 0);
    const soldAfter = Number(program.sold_units || 0) + units;
    if (totalUnits > 0 && soldAfter > totalUnits) {
      // Мөнгө аль хэдийн төлөгдсөн тул бүртгэлийг хаахгүй, зөвхөн тэмдэглэнэ.
      logger.warn("Shuteen: sold_units exceeds total_units after this order", {
        pendingId,
        soldAfter,
        totalUnits,
      });
    }

    const certNo = certificateNo(seq);
    tx.set(orderRef, {
      buyer_uid: uid,
      buyer_name: pendingData.buyer_name || "",
      buyer_phone: pendingData.buyer_phone || "",
      units,
      unit_price: Number(snap.unit_price || 0),
      amount,
      annual_growth_percent: Number(snap.annual_growth_percent || 0),
      hold_months: holdMonths,
      buyback_price: Number(snap.buyback_price || 0),
      buyback_total: Number(snap.buyback_price || 0) * units,
      buyback_at: admin.firestore.Timestamp.fromDate(buybackDate),
      tier: tierFor(units),
      certificate_no: certNo,
      signature: signCertificate(certNo, orderRef.id),
      status: "active", // active → bought_back / cancelled
      invoice_id: invoiceId,
      pending_id: pendingId,
      created_at: now,
    });
    tx.set(
      programRef,
      {
        sold_units: admin.firestore.FieldValue.increment(units),
        certificate_seq: seq,
        order_count: admin.firestore.FieldValue.increment(1),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    tx.update(pendingRef, {
      status: "processed",
      shuteen_order_id: orderRef.id,
      paid_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    created = true;
    orderId = orderRef.id;
  });

  // Нэгтгэл — shuteen_orders эх сурвалж, энэ нь зөвхөн хурдан унших зориулалттай.
  if (created) {
    try {
      const inc = admin.firestore.FieldValue.increment;
      const holderRef = db.collection("shuteen_holders").doc(uid);
      const holderSnap = await holderRef.get();
      const prevUnits = holderSnap.exists ? Number(holderSnap.data().units || 0) : 0;
      await holderRef.set(
        {
          uid,
          name: pendingData.buyer_name || "",
          units: inc(units),
          amount: inc(amount),
          order_count: inc(1),
          tier: tierFor(prevUnits + units),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          ...(holderSnap.exists ?
            {} :
            { first_at: admin.firestore.FieldValue.serverTimestamp() }),
        },
        { merge: true },
      );
      if (!holderSnap.exists) {
        await programRef.set(
          { holder_count: inc(1) },
          { merge: true },
        );
      }
    } catch (aggErr) {
      logger.error("Shuteen holder aggregate failed (non-fatal)", {
        pendingId,
        error: aggErr.message,
      });
    }
  }

  return { orderId, created };
}

module.exports = {
  getQPayToken,
  checkQPayPayment,
  recordShuteenOrderPaid,
  tierFor,
  signCertificate,
  parseAndVerifyPayload,
};
