const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
const cors = require("cors")({ origin: true });
const { resolveAdmin } = require("./adminAuth");
const {
  COLLECTION,
  drawPeriodBounds,
  isLegacyCampaign,
} = require("./campaignShared");

/**
 * Settles a draw period: marks a winning ticket, tells the winner, and — once
 * the admin is done with the period — retires the tickets that did not win.
 *
 * Two actions:
 *  - "draw"  pick a winner, either at random from the period's live tickets or
 *            by the code the admin read out at the event.
 *  - "close" expire every remaining ticket of the period, so the next week
 *            starts from an empty pool. Winners are left as they are.
 *
 * A ticket belongs to exactly one period, so closing one period never touches
 * another's tickets.
 */

/**
 * @param {number} n exclusive upper bound
 * @return {number} a uniform integer in [0, n)
 */
function randomIndex(n) {
  // Rejection-sampled so low indices are not favoured, unlike `% n`.
  const limit = Math.floor(0xffffffff / n) * n;
  let x;
  do {
    x = crypto.randomBytes(4).readUInt32BE(0);
  } while (x >= limit);
  return x % n;
}

/**
 * Notifies the winner in-app and by push. A push failure is logged but does not
 * fail the draw — the ticket is already marked and the in-app record written.
 * @param {object} db Firestore instance
 * @param {object} args winner details
 */
async function notifyWinner(db, args) {
  const { userId, campaignId, campaignName, ticketCode, prize, period } = args;
  const title = "🎉 Та азтан боллоо!";
  const body = prize ?
    `${campaignName} — ${ticketCode} дугаартай сугалаагаар та ${prize} хожлоо!` :
    `${campaignName} — ${ticketCode} дугаартай сугалаа тань хожлоо!`;
  const data = {
    type: "lottery_win",
    campaign_id: String(campaignId),
    ticket_code: String(ticketCode),
    prize: String(prize || ""),
    draw_period: String(period),
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
  timeoutSeconds: 120,
}, async (req, res) => {
  return cors(req, res, async () => {
    const db = admin.firestore();
    try {
      if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

      const auth = await resolveAdmin(db, req);
      if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

      const b = req.body || {};
      const campaignId = (b.campaign_id || "").toString();
      const period = Math.max(0, Math.floor(Number(b.draw_period)));
      const action = (b.action || "draw").toString();
      if (!campaignId) return res.status(400).json({ error: "campaign_id шаардлагатай" });
      if (!Number.isFinite(period)) {
        return res.status(400).json({ error: "draw_period буруу" });
      }

      const campaignRef = db.collection(COLLECTION).doc(campaignId);
      const campaignSnap = await campaignRef.get();
      if (!campaignSnap.exists) return res.status(404).json({ error: "Аян олдсонгүй" });
      const campaign = campaignSnap.data();
      if (isLegacyCampaign(campaign)) {
        return res.status(409).json({ error: "Хуучин хэлбэрийн аян дээр тохирол хийх боломжгүй" });
      }

      const ticketsRef = campaignRef.collection("tickets");
      const drawRef = campaignRef.collection("draws").doc(String(period));
      const bounds = drawPeriodBounds(campaign, period);

      // ---- close: retire what did not win -------------------------------
      if (action === "close") {
        const live = await ticketsRef
          .where("draw_period", "==", period)
          .where("status", "==", "active")
          .get();
        let batch = db.batch();
        let n = 0;
        for (const doc of live.docs) {
          batch.update(doc.ref, { status: "expired" });
          if (++n % 400 === 0) {
            await batch.commit();
            batch = db.batch();
          }
        }
        await batch.commit();
        await drawRef.set({
          draw_period: period,
          status: "closed",
          period_start: bounds ? admin.firestore.Timestamp.fromDate(bounds.start) : null,
          period_end: bounds ? admin.firestore.Timestamp.fromDate(bounds.end) : null,
          closed_at: admin.firestore.FieldValue.serverTimestamp(),
          closed_by: auth.uid,
          closed_by_name: auth.name,
        }, { merge: true });

        logger.info("Draw period closed", {
          campaign_id: campaignId, period, expired: live.size, by: auth.uid,
        });
        return res.status(200).json({ expired: live.size, draw_period: period });
      }

      // ---- draw: pick and mark a winner ---------------------------------
      const prize = (b.prize || "").toString().trim();
      const manualCode = (b.ticket_code || "").toString().trim().toUpperCase();

      let ticketDoc = null;
      if (manualCode) {
        const found = await ticketsRef
          .where("draw_period", "==", period)
          .where("ticket_code", "==", manualCode)
          .limit(1)
          .get();
        if (found.empty) {
          return res.status(404).json({
            error: `${manualCode} дугаартай сугалаа энэ үед олдсонгүй`,
          });
        }
        ticketDoc = found.docs[0];
        if (ticketDoc.data().status === "won") {
          return res.status(409).json({ error: "Энэ сугалаа аль хэдийн хожсон байна" });
        }
      } else {
        const live = await ticketsRef
          .where("draw_period", "==", period)
          .where("status", "==", "active")
          .get();
        if (live.empty) {
          return res.status(404).json({ error: "Энэ үед оролцох сугалаа алга" });
        }
        ticketDoc = live.docs[randomIndex(live.size)];
      }

      const ticket = ticketDoc.data();
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

      // The user's own copy is a separate document; leave it consistent so the
      // app can show the win without reading the campaign's tickets, which it
      // is not allowed to.
      const mirror = await db.collection("users").doc(winnerId)
        .collection("lottery_tickets")
        .where("campaign_ticket_id", "==", ticketDoc.id)
        .limit(1)
        .get();
      if (!mirror.empty) {
        await mirror.docs[0].ref.update({
          status: "won",
          prize: prize || null,
          won_at: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      await drawRef.set({
        draw_period: period,
        status: "drawn",
        period_start: bounds ? admin.firestore.Timestamp.fromDate(bounds.start) : null,
        period_end: bounds ? admin.firestore.Timestamp.fromDate(bounds.end) : null,
        winners: admin.firestore.FieldValue.arrayUnion({
          user_id: winnerId,
          user_name: winnerName,
          ticket_code: ticket.ticket_code,
          ticket_id: ticketDoc.id,
          prize: prize || null,
          picked: manualCode ? "manual" : "random",
          drawn_by: auth.uid,
          drawn_by_name: auth.name,
        }),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      await notifyWinner(db, {
        userId: winnerId,
        campaignId,
        campaignName: campaign.name || "Сугалаат аян",
        ticketCode: ticket.ticket_code,
        prize,
        period,
      });

      logger.info("Lottery winner drawn", {
        campaign_id: campaignId, period, ticket: ticket.ticket_code,
        user_id: winnerId, picked: manualCode ? "manual" : "random", by: auth.uid,
      });

      return res.status(200).json({
        ticket_code: ticket.ticket_code,
        user_id: winnerId,
        user_name: winnerName,
        prize: prize || null,
        draw_period: period,
      });
    } catch (err) {
      logger.error("campaignDraw failed", { error: err.message });
      return res.status(500).json({ error: err.message });
    }
  });
});
