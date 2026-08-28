const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const { resolveAdmin } = require("./adminAuth");
const { COLLECTION, isLegacyCampaign } = require("./campaignShared");

/**
 * Runs the draws of a campaign. Two actions:
 *
 *  - "start"  Opens the next draw. Every ticket not already in one is stamped
 *             with the draw's number and taken out of circulation, so the pool
 *             is fixed at the moment the button was pressed and tickets earned
 *             afterwards wait for the following draw. An admin may do this as
 *             often as they like while the campaign runs.
 *
 *  - "winner" Records a winning code against a draw and tells the holder. The
 *             winners themselves are picked outside this system: the codes are
 *             exported to a spreadsheet and run through the draw software, and
 *             only the result comes back here.
 *
 * Winners can be added to any past draw — the sweep and the announcement are
 * separate steps and often days apart.
 */

const TICKET_WRITE_BATCH = 400;

/**
 * Notifies a winner in-app and by push. A push failure is logged but does not
 * fail the call — the ticket is already marked and the in-app record written.
 * @param {object} db Firestore instance
 * @param {object} args winner details
 */
async function notifyWinner(db, args) {
  const { userId, campaignId, campaignName, ticketCode, prize, drawNumber } = args;
  const title = "🎉 Та азтан боллоо!";
  const body = prize ?
    `${campaignName} — ${ticketCode} дугаартай сугалаагаар та ${prize} хожлоо!` :
    `${campaignName} — ${ticketCode} дугаартай сугалаа тань хожлоо!`;
  const data = {
    type: "lottery_win",
    campaign_id: String(campaignId),
    ticket_code: String(ticketCode),
    prize: String(prize || ""),
    draw_number: String(drawNumber),
  };

  await db.collection("users").doc(String(userId)).collection("notifications").add({
    title, body, type: "lottery_win", data, read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  try {
    const userSnap = await db.collection("users").doc(String(userId)).get();
    const u = userSnap.exists ? userSnap.data() : null;
    const token = u && (u.fcm_token || (Array.isArray(u.fcm_tokens) ? u.fcm_tokens[0] : null));
    if (token) {
      await admin.messaging().send({ token, notification: { title, body }, data });
    }
  } catch (err) {
    logger.warn("Winner push failed", { user_id: userId, error: err.message });
  }
}

exports.campaignDraw = onRequest({
  region: "us-central1",
  timeoutSeconds: 300,
  memory: "512MiB",
}, async (req, res) => {
  return cors(req, res, async () => {
    const db = admin.firestore();
    try {
      if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

      const auth = await resolveAdmin(db, req);
      if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

      const b = req.body || {};
      const campaignId = (b.campaign_id || "").toString();
      const action = (b.action || "").toString();
      if (!campaignId) return res.status(400).json({ error: "campaign_id шаардлагатай" });

      const campaignRef = db.collection(COLLECTION).doc(campaignId);
      const campaignSnap = await campaignRef.get();
      if (!campaignSnap.exists) return res.status(404).json({ error: "Аян олдсонгүй" });
      const campaign = campaignSnap.data();
      if (isLegacyCampaign(campaign)) {
        return res.status(409).json({ error: "Хуучин хэлбэрийн аян дээр тохирол хийх боломжгүй" });
      }

      const ticketsRef = campaignRef.collection("tickets");

      // ---- start: sweep the live pool into a new numbered draw ----------
      if (action === "start") {
        const pending = await ticketsRef.where("draw_number", "==", null).get();
        if (pending.empty) {
          return res.status(409).json({ error: "Тохиролд оруулах шинэ сугалаа алга" });
        }

        // The number is handed out inside a transaction so two admins pressing
        // at once cannot land on the same one.
        const drawNumber = await db.runTransaction(async (tx) => {
          const snap = await tx.get(campaignRef);
          const next = Number((snap.data() || {}).draw_count || 0) + 1;
          tx.update(campaignRef, {
            draw_count: next,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          });
          return next;
        });

        const cutoff = admin.firestore.FieldValue.serverTimestamp();
        let batch = db.batch();
        let n = 0;
        for (const doc of pending.docs) {
          const t = doc.data();
          batch.update(doc.ref, { draw_number: drawNumber, status: "drawn" });
          n++;
          // The user's own copy is what the app reads; keep it in step. The
          // path was recorded when the ticket was issued, so no lookup here.
          if (t.user_ticket_id) {
            batch.update(
              db.collection("users").doc(String(t.user_id))
                .collection("lottery_tickets").doc(t.user_ticket_id),
              { draw_number: drawNumber, status: "drawn" },
            );
            n++;
          }
          if (n >= TICKET_WRITE_BATCH) {
            await batch.commit();
            batch = db.batch();
            n = 0;
          }
        }
        if (n > 0) await batch.commit();

        await campaignRef.collection("draws").doc(String(drawNumber)).set({
          draw_number: drawNumber,
          ticket_count: pending.size,
          status: "open",
          winners: [],
          started_at: cutoff,
          started_by: auth.uid,
          started_by_name: auth.name,
        });

        logger.info("Draw started", {
          campaign_id: campaignId, draw_number: drawNumber,
          tickets: pending.size, by: auth.uid,
        });
        return res.status(200).json({
          draw_number: drawNumber,
          ticket_count: pending.size,
        });
      }

      // ---- winner: record a code that won -------------------------------
      if (action === "winner") {
        const drawNumber = Math.floor(Number(b.draw_number));
        if (!Number.isFinite(drawNumber) || drawNumber < 1) {
          return res.status(400).json({ error: "draw_number буруу" });
        }
        const code = (b.ticket_code || "").toString().trim().toUpperCase();
        const prize = (b.prize || "").toString().trim();
        if (!code) return res.status(400).json({ error: "Сугалааны дугаар шаардлагатай" });

        const drawRef = campaignRef.collection("draws").doc(String(drawNumber));
        const drawSnap = await drawRef.get();
        if (!drawSnap.exists) return res.status(404).json({ error: "Тохирол олдсонгүй" });

        const found = await ticketsRef
          .where("draw_number", "==", drawNumber)
          .where("ticket_code", "==", code)
          .limit(1)
          .get();
        if (found.empty) {
          return res.status(404).json({
            error: `${code} дугаар ${drawNumber}-р тохиролд алга`,
          });
        }
        const ticketDoc = found.docs[0];
        const ticket = ticketDoc.data();
        if (ticket.status === "won") {
          return res.status(409).json({ error: "Энэ сугалаа аль хэдийн тэмдэглэгдсэн" });
        }

        const winnerId = String(ticket.user_id);
        const userSnap = await db.collection("users").doc(winnerId).get();
        const user = userSnap.exists ? userSnap.data() || {} : {};
        const winnerName = [user.last_name, user.first_name]
          .filter(Boolean).join(" ").trim() || winnerId;

        await ticketDoc.ref.update({
          status: "won",
          prize: prize || null,
          won_at: admin.firestore.FieldValue.serverTimestamp(),
          won_by_admin: auth.uid,
        });
        if (ticket.user_ticket_id) {
          await db.collection("users").doc(winnerId)
            .collection("lottery_tickets").doc(ticket.user_ticket_id)
            .update({
              status: "won",
              prize: prize || null,
              won_at: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        await drawRef.update({
          winners: admin.firestore.FieldValue.arrayUnion({
            user_id: winnerId,
            user_name: winnerName,
            user_phone: user.phone || user.phone_number || null,
            ticket_code: ticket.ticket_code,
            ticket_id: ticketDoc.id,
            prize: prize || null,
            marked_by: auth.uid,
            marked_by_name: auth.name,
          }),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        await notifyWinner(db, {
          userId: winnerId,
          campaignId,
          campaignName: campaign.name || "Сугалаат аян",
          ticketCode: ticket.ticket_code,
          prize,
          drawNumber,
        });

        logger.info("Lottery winner marked", {
          campaign_id: campaignId, draw_number: drawNumber,
          ticket: ticket.ticket_code, user_id: winnerId, by: auth.uid,
        });
        return res.status(200).json({
          ticket_code: ticket.ticket_code,
          user_id: winnerId,
          user_name: winnerName,
          prize: prize || null,
          draw_number: drawNumber,
        });
      }

      return res.status(400).json({ error: "action нь start эсвэл winner байх ёстой" });
    } catch (err) {
      logger.error("campaignDraw failed", { error: err.message });
      return res.status(500).json({ error: err.message });
    }
  });
});
