const admin = require("firebase-admin");
const { logger } = require("firebase-functions");
const { getQPayToken, checkQPayPayment } = require("./installmentShared");

// 6-digit pickup code the buyer shows when collecting the physical product.
function generatePickupCode() {
  return Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
}

/**
 * Records a PAID center donation idempotently:
 *   1. (transaction) creates the `center_donations` doc + marks the pending
 *      invoice processed
 *   2. (best-effort) bumps campaign aggregates, the public donor-wall
 *      leaderboard and each product's sold_count / stock
 *
 * Shared by both `centerDonationCallback` (realtime QPay webhook) and
 * `autoVerifyCenterDonations` (scheduled backstop) so the crediting logic can
 * never drift between them. `center_donations` is the source of truth — the
 * aggregate step is best-effort.
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {FirebaseFirestore.DocumentReference} pendingRef - pending invoice ref
 * @param {object} pendingData - pending invoice data
 * @return {object} { donationId, created }
 */
async function recordCenterDonationPaid(db, pendingRef, pendingData) {
  const invoiceId = pendingData.invoice_id;
  const amount = Number(pendingData.amount || 0);
  const uid = pendingData.user_id;
  const items = Array.isArray(pendingData.items) ? pendingData.items : [];
  const pendingId = pendingRef.id;

  const donationRef = db.collection("center_donations").doc();
  const now = admin.firestore.Timestamp.now();
  let created = false;
  let donationId = pendingData.donation_id || null;

  await db.runTransaction(async (tx) => {
    const cur = await tx.get(pendingRef);
    const curData = cur.data() || {};
    if (curData.status === "processed" && curData.donation_id) {
      donationId = curData.donation_id;
      return;
    }
    tx.set(donationRef, {
      buyer_uid: uid,
      buyer_name: pendingData.buyer_name || "",
      engrave_name: pendingData.engrave_name || "",
      anonymous: pendingData.anonymous === true,
      items: items.map((it) => ({
        type: "product",
        id: it.id,
        name: it.name || "",
        qty: Number(it.qty || 1),
        price: Number(it.price || 0),
      })),
      amount,
      status: "completed",
      delivery_status: "pending",
      pickup_code: generatePickupCode(),
      invoice_id: invoiceId,
      pending_id: pendingId,
      created_at: now,
    });
    tx.update(pendingRef, {
      status: "processed",
      donation_id: donationRef.id,
      paid_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    created = true;
    donationId = donationRef.id;
  });

  if (created) {
    try {
      const campaignRef = db.collection("center_campaign").doc("main");
      const donorRef = campaignRef.collection("donors").doc(uid);
      const donorSnap = await donorRef.get();
      const inc = admin.firestore.FieldValue.increment;
      const batch = db.batch();
      batch.set(
        campaignRef,
        {
          total_raised: inc(amount),
          donation_count: inc(1),
          ...(donorSnap.exists ? {} : { donor_count: inc(1) }),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      // Public donor-wall leaderboard entry.
      batch.set(
        donorRef,
        {
          engrave_name: pendingData.engrave_name || pendingData.buyer_name || "",
          anonymous: pendingData.anonymous === true,
          amount: inc(amount),
          count: inc(1),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          ...(donorSnap.exists ?
            {} :
            { first_at: admin.firestore.FieldValue.serverTimestamp() }),
        },
        { merge: true },
      );
      for (const it of items) {
        const pRef = db.collection("center_products").doc(it.id);
        const qty = Number(it.qty || 1);
        const update = { sold_count: inc(qty) };
        if (it.had_stock) update.stock = inc(-qty);
        batch.update(pRef, update);
      }
      await batch.commit();
    } catch (aggErr) {
      logger.error("Center aggregate update failed (non-fatal)", {
        pendingId,
        error: aggErr.message,
      });
    }
  }

  return { donationId, created };
}

module.exports = {
  getQPayToken,
  checkQPayPayment,
  recordCenterDonationPaid,
};
