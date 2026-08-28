const { logger } = require("firebase-functions");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const {
  COLLECTION,
  drawPeriodIndex,
  generateTicketCode,
  getActiveCampaigns,
  isLegacyCampaign,
  isWithinCampaignWindow,
  ticketsForGrams,
  toDate,
  writeTicket,
} = require("../campaign/campaignShared");

/**
 * Issues one participant's outstanding tickets for a campaign.
 *
 * Entitlement is always recomputed from the participant's cumulative grams
 * rather than from this order alone, so a gram remainder survives a draw
 * period boundary: 0.05g left over one week still counts toward the next.
 * @param {object} db Firestore instance
 * @param {object} campaign campaign doc data plus its id
 * @param {string} userId user id
 * @param {number} addGrams grams to add, 0 for a signup-only grant
 * @param {string|null} orderId order that triggered this, if any
 * @return {Promise<string[]>} codes issued in this call
 */
async function grantTickets(db, campaign, userId, addGrams, orderId) {
  const campaignRef = db.collection(COLLECTION).doc(campaign.id);
  const participantRef = campaignRef.collection("participants").doc(String(userId));
  const period = drawPeriodIndex(campaign, new Date());

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(participantRef);
    const prev = snap.exists ? snap.data() : null;

    const totalGrams = Number(
      ((prev ? prev.total_grams || 0 : 0) + (addGrams || 0)).toFixed(6),
    );
    const alreadyIssued = prev ? prev.tickets_issued || 0 : 0;
    const signupGranted = prev ? Boolean(prev.signup_bonus_granted) : false;

    // The signup grant is a one-off per participant per campaign; the purchase
    // rate is a running total, so subtract what the grant already contributed.
    const signupTickets = Number(campaign.signup_tickets) || 0;
    const grantSignup = !signupGranted && signupTickets > 0;
    const earnedFromGrams = ticketsForGrams(campaign, totalGrams);
    const issuedFromGrams = alreadyIssued - (signupGranted ? signupTickets : 0);
    const newFromGrams = Math.max(0, earnedFromGrams - issuedFromGrams);
    const newCount = newFromGrams + (grantSignup ? signupTickets : 0);

    const participantUpdate = {
      user_id: String(userId),
      total_grams: totalGrams,
      tickets_issued: alreadyIssued + newCount,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (grantSignup) participantUpdate.signup_bonus_granted = true;

    if (snap.exists) {
      tx.update(participantRef, participantUpdate);
    } else {
      tx.set(participantRef, { ...participantUpdate, signup_bonus_granted: grantSignup });
    }

    const codes = [];
    for (let i = 0; i < newFromGrams; i++) codes.push(generateTicketCode());
    for (const code of codes) {
      writeTicket(db, tx, {
        campaignId: campaign.id,
        campaignName: campaign.name,
        userId,
        code,
        period,
        source: "purchase",
        orderId,
      });
    }
    if (grantSignup) {
      for (let i = 0; i < signupTickets; i++) {
        const code = generateTicketCode();
        codes.push(code);
        writeTicket(db, tx, {
          campaignId: campaign.id,
          campaignName: campaign.name,
          userId,
          code,
          period,
          source: "signup",
          orderId: null,
        });
      }
    }

    const stats = { updated_at: admin.firestore.FieldValue.serverTimestamp() };
    if (newCount > 0) {
      stats.total_tickets = admin.firestore.FieldValue.increment(newCount);
    }
    if (!snap.exists) {
      stats.total_participants = admin.firestore.FieldValue.increment(1);
    }
    tx.update(campaignRef, stats);

    return codes;
  });
}

/**
 * Allocates lottery tickets for a verified gold order across every campaign
 * that is running right now.
 * @param {object} db Firestore instance
 * @param {string} userId user id
 * @param {string} orderId the order just verified
 * @param {number} goldQty grams of gold bought
 * @return {Promise<object>} {totalNewTickets, tickets}
 */
async function processLotteryTickets(db, userId, orderId, goldQty) {
  const campaigns = await getActiveCampaigns(db);
  if (campaigns.length === 0) return { totalNewTickets: 0, tickets: [] };

  const all = [];
  for (const campaign of campaigns) {
    try {
      const codes = await grantTickets(db, campaign, userId, goldQty, orderId);
      for (const code of codes) {
        all.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          ticketCode: code,
        });
      }
      if (codes.length > 0) {
        logger.info("Lottery tickets issued", {
          user_id: userId,
          order_id: orderId,
          campaign_id: campaign.id,
          new_tickets: codes.length,
        });
      }
    } catch (err) {
      logger.error("Failed to process lottery for campaign", {
        campaign_id: campaign.id,
        user_id: userId,
        order_id: orderId,
        error: err.message,
      });
    }
  }
  return { totalNewTickets: all.length, tickets: all };
}

/**
 * Grants the signup bonus to users who register while a campaign is running.
 */
const onUserCreatedLottery = onDocumentCreated({
  document: "users/{userId}",
  // Pinned to match the database and every other Firestore trigger here;
  // without it the deploy default put this one in another region.
  region: "us-central1",
  memory: "256MiB",
  timeoutSeconds: 120,
}, async (event) => {
  const db = admin.firestore();
  const userId = event.params.userId;
  try {
    const campaigns = await getActiveCampaigns(db);
    for (const campaign of campaigns) {
      if (!(Number(campaign.signup_tickets) > 0)) continue;
      try {
        const codes = await grantTickets(db, campaign, userId, 0, null);
        if (codes.length > 0) {
          logger.info("Signup lottery tickets granted", {
            user_id: userId,
            campaign_id: campaign.id,
            tickets: codes.length,
          });
        }
      } catch (err) {
        logger.error("Failed to grant signup tickets", {
          campaign_id: campaign.id,
          user_id: userId,
          error: err.message,
        });
      }
    }
  } catch (err) {
    logger.error("Signup lottery hook failed", { user_id: userId, error: err.message });
  }
});

/**
 * Closes campaigns whose end date has passed.
 *
 * This ran hourly for months without ever closing anything: `end_date` is a
 * Timestamp and the old code fed it to `new Date()`, producing Invalid Date,
 * whose every comparison is false. Expired campaigns therefore kept issuing
 * tickets until someone flipped the status by hand. `toDate` reads all the
 * shapes the field actually takes.
 */
const scheduledCampaignStatusUpdate = onSchedule({
  schedule: "every 1 hours",
  timeZone: "Asia/Ulaanbaatar",
  memory: "512MiB",
}, async () => {
  const db = admin.firestore();
  const now = new Date();
  try {
    const snap = await db.collection(COLLECTION).where("status", "==", "active").get();
    let updated = 0;
    for (const doc of snap.docs) {
      const data = doc.data();
      if (isLegacyCampaign(data)) continue;
      const end = toDate(data.end_date);
      if (!end || end >= now) continue;
      await doc.ref.update({
        status: "completed",
        completed_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      updated++;
      logger.info("Campaign marked as completed", { campaign_id: doc.id, name: data.name });
    }
    if (updated > 0) logger.info(`Completed ${updated} expired campaign(s)`);
  } catch (err) {
    logger.error("Failed to update campaign statuses", { error: err.message });
  }
});

module.exports = {
  processLotteryTickets,
  grantTickets,
  generateTicketCode,
  isWithinCampaignWindow,
  onUserCreatedLottery,
  scheduledCampaignStatusUpdate,
};
