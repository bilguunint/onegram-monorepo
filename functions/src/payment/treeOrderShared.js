const admin = require("firebase-admin");
const { logger } = require("firebase-functions");
const { getQPayToken, checkQPayPayment } = require("./installmentShared");

/**
 * Records a PAID tree-planting order idempotently:
 *   1. (transaction) creates the `center_tree_orders` doc + marks the pending
 *      invoice processed
 *   2. (best-effort) bumps campaign aggregates (total_raised, tree_count),
 *      the donor-wall leaderboard and the tree's sold_count / stock
 *
 * Shared by `treeOrderCallback` (realtime QPay webhook), the app's self-heal
 * poll and the scheduled backstop so the crediting logic can never drift.
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {FirebaseFirestore.DocumentReference} pendingRef - pending invoice ref
 * @param {object} pendingData - pending invoice data
 * @return {object} { orderId, created }
 */
async function recordTreeOrderPaid(db, pendingRef, pendingData) {
  const invoiceId = pendingData.invoice_id;
  const amount = Number(pendingData.amount || 0);
  const uid = pendingData.user_id;
  const qty = Number(pendingData.qty || 1);
  const snap = pendingData.tree_snapshot || {};
  const pendingId = pendingRef.id;

  const orderRef = db.collection("center_tree_orders").doc();
  const now = admin.firestore.Timestamp.now();
  let created = false;
  let orderId = pendingData.tree_order_id || null;

  await db.runTransaction(async (tx) => {
    const cur = await tx.get(pendingRef);
    const curData = cur.data() || {};
    if (curData.status === "processed" && curData.tree_order_id) {
      orderId = curData.tree_order_id;
      return;
    }
    tx.set(orderRef, {
      buyer_uid: uid,
      buyer_name: pendingData.buyer_name || "",
      tree_id: pendingData.tree_id,
      tree_name: snap.name || "",
      tree_image: snap.image || null,
      label_name: pendingData.label_name || "",
      qty,
      unit_price: Number(snap.price || 0),
      amount,
      status: "completed",
      planting_status: "pending",
      invoice_id: invoiceId,
      pending_id: pendingId,
      created_at: now,
    });
    tx.update(pendingRef, {
      status: "processed",
      tree_order_id: orderRef.id,
      paid_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    created = true;
    orderId = orderRef.id;
  });

  // Best-effort aggregates — center_tree_orders is the source of truth.
  if (created) {
    try {
      const inc = admin.firestore.FieldValue.increment;
      const campaignRef = db.collection("center_campaign").doc("main");
      const donorRef = campaignRef.collection("donors").doc(uid);
      const donorSnap = await donorRef.get();
      const batch = db.batch();
      batch.set(
        campaignRef,
        {
          total_raised: inc(amount),
          donation_count: inc(1),
          tree_count: inc(qty),
          ...(donorSnap.exists ? {} : { donor_count: inc(1) }),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      // Tree purchases count toward the donor wall too. Never overwrite an
      // existing engrave_name/anonymity — only seed them for new donors.
      batch.set(
        donorRef,
        {
          amount: inc(amount),
          count: inc(1),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          ...(donorSnap.exists ?
            {} :
            {
              engrave_name: pendingData.buyer_name || "",
              anonymous: false,
              first_at: admin.firestore.FieldValue.serverTimestamp(),
            }),
        },
        { merge: true },
      );
      const treeUpdate = { sold_count: inc(qty) };
      if (pendingData.had_stock) treeUpdate.stock = inc(-qty);
      batch.update(db.collection("center_trees").doc(pendingData.tree_id), treeUpdate);
      await batch.commit();
    } catch (aggErr) {
      logger.error("Tree aggregate update failed (non-fatal)", {
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
  recordTreeOrderPaid,
};
