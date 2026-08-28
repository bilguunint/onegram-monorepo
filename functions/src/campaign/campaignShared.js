const admin = require("firebase-admin");
const crypto = require("crypto");

/**
 * Shared rules for the lottery campaigns ("Сугалаат аян").
 *
 * A campaign issues tickets two ways: a fixed grant when someone registers
 * during its run, and a rate against gold bought. The rate is expressed per
 * 0.1g rather than per whole gram so a campaign can hand out tickets for the
 * small purchases that make up most of the order book.
 *
 * Draws are not scheduled. An admin starts one whenever they are ready, as
 * often as they like while the campaign runs. Starting draw N sweeps up every
 * ticket not yet in a draw, stamps it with N and takes it out of circulation;
 * the codes are then exported and run through the separate system that picks
 * the winners, and the winning codes are marked back here. Tickets issued
 * after that sweep wait for draw N+1.
 *
 * A gram remainder is never lost across a draw: entitlement is derived from a
 * participant's cumulative grams against the tickets already issued to them,
 * so 0.05g left over before a draw still counts toward the next ticket after.
 */

/** Gold is bought in fractions of a gram, so the rate is quoted per 0.1g. */
const GRAM_UNIT = 0.1;
const TICKET_CODE_LENGTH = 6;
const CAMPAIGN_STATUSES = ["draft", "active", "completed"];
const COLLECTION = "marketing_campaigns";

/** Marks docs written against the rules in this file. */
const SCHEMA_VERSION = 2;

/**
 * The two campaigns that predate this module store `grams_per_ticktes` (sic)
 * and carry no draws. They are read-only history; nothing here should try to
 * reinterpret them.
 * @param {object} data campaign document data
 * @return {boolean} true when the doc predates SCHEMA_VERSION 2
 */
function isLegacyCampaign(data) {
  return Number(data && data.schema_version) !== SCHEMA_VERSION;
}

/**
 * @return {string} a 6-character uppercase alphabetic ticket code
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
 * Firestore hands back a Timestamp, an import may leave an ISO string, and a
 * request body carries a number. The previous code assumed a string and fed a
 * Timestamp straight to `new Date()`, which yields Invalid Date — every
 * comparison against it was false, so campaigns never expired and kept issuing
 * tickets past their end date.
 * @param {*} value Timestamp, Date, ISO string or epoch millis
 * @return {Date|null} a valid Date, or null when it cannot be read as one
 */
function toDate(value) {
  if (!value) return null;
  let d = null;
  if (typeof value.toDate === "function") d = value.toDate();
  else if (value instanceof Date) d = value;
  else if (typeof value === "string" || typeof value === "number") d = new Date(value);
  if (!d || isNaN(d.getTime())) return null;
  return d;
}

/**
 * @param {object} campaign campaign document data
 * @param {Date} [now] the moment to test
 * @return {boolean} true when `now` falls inside the campaign's dates
 */
function isWithinCampaignWindow(campaign, now = new Date()) {
  const start = toDate(campaign.start_date);
  const end = toDate(campaign.end_date);
  if (start && now < start) return false;
  if (end && now > end) return false;
  // A campaign with unreadable dates is treated as closed rather than
  // open-ended: silently running forever is the worse failure.
  return Boolean(start && end);
}

/**
 * Tickets earned for a cumulative gram total under a campaign's rate.
 * @param {object} campaign campaign document data
 * @param {number} totalGrams cumulative grams bought during the campaign
 * @return {number} total tickets earned to date
 */
function ticketsForGrams(campaign, totalGrams) {
  const perUnit = Number(campaign.tickets_per_unit) || 0;
  if (perUnit <= 0 || !(totalGrams > 0)) return 0;
  // Rounded before flooring: 0.30000000000000004 grams is 3 units, not 2.
  const units = Math.floor(Number((totalGrams / GRAM_UNIT).toFixed(6)));
  return units * perUnit;
}

/**
 * Campaigns that are open for business right now.
 * @param {object} db Firestore instance
 * @param {Date} [now] the moment to test
 * @return {Promise<Array>} active, in-window, current-schema campaigns
 */
async function getActiveCampaigns(db, now = new Date()) {
  const snap = await db.collection(COLLECTION).where("status", "==", "active").get();
  const out = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    if (isLegacyCampaign(data)) continue;
    if (!isWithinCampaignWindow(data, now)) continue;
    out.push({ id: doc.id, ...data });
  }
  return out;
}

/**
 * Writes one ticket to both places it is read from: the campaign's own
 * sub-collection (admin views, draws) and the user's list (the app).
 *
 * The campaign copy records where its mirror lives, so a draw can lock
 * thousands of tickets by direct reference instead of one query each.
 * @param {object} db Firestore instance
 * @param {object} tx active transaction
 * @param {object} args ticket fields
 * @return {string} the ticket code written
 */
function writeTicket(db, tx, args) {
  const { campaignId, campaignName, userId, code, source, orderId } = args;

  const campaignTicketRef = db
    .collection(COLLECTION).doc(campaignId)
    .collection("tickets").doc();
  const userTicketRef = db
    .collection("users").doc(String(userId))
    .collection("lottery_tickets").doc();

  const payload = {
    user_id: String(userId),
    ticket_code: code,
    campaign_id: campaignId,
    // Null until a draw sweeps it up; that is what marks the live pool.
    draw_number: null,
    status: "active", // → "drawn" | "won"
    source, // "purchase" | "signup"
    order_id: orderId ? String(orderId) : null,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  };

  tx.set(campaignTicketRef, { ...payload, user_ticket_id: userTicketRef.id });
  tx.set(userTicketRef, {
    ...payload,
    campaign_name: campaignName || "",
    campaign_ticket_id: campaignTicketRef.id,
  });

  return code;
}

module.exports = {
  GRAM_UNIT,
  CAMPAIGN_STATUSES,
  COLLECTION,
  SCHEMA_VERSION,
  isLegacyCampaign,
  generateTicketCode,
  toDate,
  isWithinCampaignWindow,
  ticketsForGrams,
  getActiveCampaigns,
  writeTicket,
};
