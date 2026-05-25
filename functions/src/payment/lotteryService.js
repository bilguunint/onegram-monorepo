const { logger } = require("firebase-functions");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const crypto = require("crypto");

const DEFAULT_GRAMS_PER_TICKET = 3;
const TICKET_CODE_LENGTH = 6;

/**
 * Generate a random 6-character uppercase alphabetic ticket code.
 * @return {string} 6-char uppercase code
 */
function generateTicketCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = crypto.randomBytes(TICKET_CODE_LENGTH);
  let code = "";
  for (let i = 0; i < TICKET_CODE_LENGTH; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

/**
 * Get all currently active marketing campaigns.
 * Only returns campaigns with status === "active" AND end_date still in the future.
 * @param {object} db - Firestore instance
 * @return {Promise<Array>} Active campaigns
 */
async function getActiveCampaigns(db) {
  const now = new Date();
  const campaignsSnap = await db.collection("marketing_campaigns")
    .where("status", "==", "active")
    .get();

  const activeCampaigns = [];
  for (const doc of campaignsSnap.docs) {
    const data = doc.data();
    const endDate = new Date(data.end_date);
    // Double-check: skip if end_date has already passed (safety net)
    if (endDate < now) {
      logger.warn("Campaign marked active but end_date passed, skipping", {
        campaign_id: doc.id,
        end_date: data.end_date,
      });
      continue;
    }
    activeCampaigns.push({ id: doc.id, ...data });
  }
  return activeCampaigns;
}

/**
 * Process lottery ticket allocation for a verified gold order.
 *
 * Logic:
 * - Track cumulative gold grams purchased per user per campaign
 * - For every GRAMS_PER_TICKET (3g), issue 1 ticket
 * - Only issue NEW tickets (total_earned - already_issued)
 *
 * Firestore structure:
 * - marketing_campaigns/{campaignId}/participants/{userId}
 *   { total_grams: number, tickets_issued: number, updated_at: timestamp }
 * - marketing_campaigns/{campaignId}/tickets/{auto}
 *   { user_id, ticket_code, order_id, created_at }
 * - users/{userId}/lottery_tickets/{auto}
 *   { campaign_id, campaign_name, ticket_code, order_id, created_at }
 *
 * @param {object} db - Firestore instance
 * @param {string} userId - User ID
 * @param {string} orderId - Order ID that was just verified
 * @param {number} goldQty - Gold grams purchased in this order
 * @return {object} { totalNewTickets, tickets: [{campaignId, ticketCode}] }
 */
async function processLotteryTickets(db, userId, orderId, goldQty) {
  const campaigns = await getActiveCampaigns(db);

  if (campaigns.length === 0) {
    return { totalNewTickets: 0, tickets: [] };
  }

  const allNewTickets = [];

  for (const campaign of campaigns) {
    try {
      const participantRef = db
        .collection("marketing_campaigns")
        .doc(campaign.id)
        .collection("participants")
        .doc(String(userId));

      const newTicketsForCampaign = await db.runTransaction(async (tx) => {
        const participantSnap = await tx.get(participantRef);
        const campaignRef = db.collection("marketing_campaigns").doc(campaign.id);
        const campaignSnap = await tx.get(campaignRef);

        let totalGrams = 0;
        let ticketsAlreadyIssued = 0;
        const isNewParticipant = !participantSnap.exists;

        if (participantSnap.exists) {
          const pData = participantSnap.data();
          totalGrams = pData.total_grams || 0;
          ticketsAlreadyIssued = pData.tickets_issued || 0;
        }

        // Read grams_per_ticket from campaign document
        const campaignData = campaignSnap.data() || {};
        const gramsPerTicket = campaignData.grams_per_ticket || DEFAULT_GRAMS_PER_TICKET;

        // Add current order's gold quantity
        totalGrams = parseFloat((totalGrams + goldQty).toFixed(6));

        // Calculate total tickets earned so far
        const totalTicketsEarned = Math.floor(totalGrams / gramsPerTicket);

        // How many new tickets to issue
        const newTicketCount = totalTicketsEarned - ticketsAlreadyIssued;

        if (newTicketCount <= 0) {
          // Still update the total grams tracked
          if (participantSnap.exists) {
            tx.update(participantRef, {
              total_grams: totalGrams,
              updated_at: admin.firestore.FieldValue.serverTimestamp(),
            });
          } else {
            tx.set(participantRef, {
              user_id: String(userId),
              total_grams: totalGrams,
              tickets_issued: 0,
              updated_at: admin.firestore.FieldValue.serverTimestamp(),
            });
            // New participant, update campaign participant count
            tx.update(campaignRef, {
              total_participants: admin.firestore.FieldValue.increment(1),
              updated_at: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
          return [];
        }

        // Generate ticket codes
        const tickets = [];
        for (let i = 0; i < newTicketCount; i++) {
          tickets.push(generateTicketCode());
        }

        // Update participant tracking
        if (participantSnap.exists) {
          tx.update(participantRef, {
            total_grams: totalGrams,
            tickets_issued: ticketsAlreadyIssued + newTicketCount,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          tx.set(participantRef, {
            user_id: String(userId),
            total_grams: totalGrams,
            tickets_issued: newTicketCount,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        // Write each ticket to campaign's tickets sub-collection and user's lottery_tickets
        for (const ticketCode of tickets) {
          const campaignTicketRef = db
            .collection("marketing_campaigns")
            .doc(campaign.id)
            .collection("tickets")
            .doc();

          tx.set(campaignTicketRef, {
            user_id: String(userId),
            ticket_code: ticketCode,
            order_id: String(orderId),
            created_at: admin.firestore.FieldValue.serverTimestamp(),
          });

          const userTicketRef = db
            .collection("users")
            .doc(String(userId))
            .collection("lottery_tickets")
            .doc();

          tx.set(userTicketRef, {
            campaign_id: campaign.id,
            campaign_name: campaign.name || "",
            ticket_code: ticketCode,
            order_id: String(orderId),
            created_at: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        // Update campaign-level stats
        const campaignStatsUpdate = {
          total_tickets: admin.firestore.FieldValue.increment(newTicketCount),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (isNewParticipant) {
          campaignStatsUpdate.total_participants = admin.firestore.FieldValue.increment(1);
        }
        tx.update(campaignRef, campaignStatsUpdate);

        return tickets;
      });

      for (const code of newTicketsForCampaign) {
        allNewTickets.push({ campaignId: campaign.id, campaignName: campaign.name, ticketCode: code });
      }

      if (newTicketsForCampaign.length > 0) {
        logger.info("Lottery tickets issued", {
          user_id: userId,
          order_id: orderId,
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          new_tickets: newTicketsForCampaign.length,
          ticket_codes: newTicketsForCampaign,
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

  return { totalNewTickets: allNewTickets.length, tickets: allNewTickets };
}

/**
 * Scheduled function: runs every hour, checks all "active" campaigns
 * and marks them "completed" if their end_date has passed.
 */
const scheduledCampaignStatusUpdate = onSchedule({
  schedule: "every 1 hours",
  timeZone: "Asia/Ulaanbaatar",
  memory: "512MiB",
}, async () => {
  const db = admin.firestore();
  const now = new Date();

  try {
    const activeCampaigns = await db.collection("marketing_campaigns")
      .where("status", "==", "active")
      .get();

    let updatedCount = 0;
    for (const doc of activeCampaigns.docs) {
      const data = doc.data();
      const endDate = new Date(data.end_date);
      if (endDate < now) {
        await doc.ref.update({
          status: "completed",
          completed_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        updatedCount++;
        logger.info("Campaign marked as completed", {
          campaign_id: doc.id,
          name: data.name,
          end_date: data.end_date,
        });
      }
    }

    if (updatedCount > 0) {
      logger.info(`Completed ${updatedCount} expired campaign(s)`);
    }
  } catch (err) {
    logger.error("Failed to update campaign statuses", { error: err.message });
  }
});

module.exports = { processLotteryTickets, generateTicketCode, scheduledCampaignStatusUpdate };
