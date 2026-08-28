const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const { resolveAdmin } = require("./adminAuth");
const {
  CAMPAIGN_STATUSES,
  COLLECTION,
  DRAW_FREQUENCIES,
  SCHEMA_VERSION,
  isLegacyCampaign,
  toDate,
} = require("./campaignShared");

/**
 * Creates or updates a lottery campaign.
 *
 * Firestore rules deny every client write to `marketing_campaigns` — the
 * collection is world-readable so the app can show the running campaign, and
 * letting a client write it would let anyone mint themselves tickets. So the
 * admin app sends its edits here.
 *
 * The two pre-existing campaigns are refused: they were written under the old
 * field names, carry no draw periods, and their 879 participants are history
 * rather than something to reinterpret.
 */
exports.saveCampaign = onRequest({
  region: "us-central1",
  timeoutSeconds: 60,
}, async (req, res) => {
  return cors(req, res, async () => {
    const db = admin.firestore();
    try {
      if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

      const auth = await resolveAdmin(db, req);
      if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

      const b = req.body || {};
      const id = b.id ? String(b.id) : null;

      const name = (b.name || "").toString().trim();
      if (!name) return res.status(400).json({ error: "Аяны нэр шаардлагатай" });

      const start = toDate(b.start_date);
      const end = toDate(b.end_date);
      if (!start || !end) {
        return res.status(400).json({ error: "Эхлэх болон дуусах хугацаа шаардлагатай" });
      }
      if (end <= start) {
        return res.status(400).json({ error: "Дуусах хугацаа эхлэхээс хойш байх ёстой" });
      }

      const frequency = (b.draw_frequency || "weekly").toString();
      if (!DRAW_FREQUENCIES.includes(frequency)) {
        return res.status(400).json({ error: "Хонжвор олгох давтамж буруу" });
      }

      const status = (b.status || "draft").toString();
      if (!CAMPAIGN_STATUSES.includes(status)) {
        return res.status(400).json({ error: "Төлөв буруу" });
      }

      const signupTickets = Math.max(0, Math.floor(Number(b.signup_tickets) || 0));
      const ticketsPerUnit = Math.max(0, Math.floor(Number(b.tickets_per_unit) || 0));
      if (signupTickets === 0 && ticketsPerUnit === 0) {
        return res.status(400).json({
          error: "Бүртгэлийн эсвэл 0.1гр тутмын сугалааны аль нэг нь 0-ээс их байх ёстой",
        });
      }

      const modalEnabled = Boolean(b.modal_enabled);
      const modalTitle = (b.modal_title || "").toString().trim();
      const modalBody = (b.modal_body || "").toString().trim();
      const modalImage = b.modal_image ? String(b.modal_image) : null;
      // A modal that opens on every launch with nothing in it is worse than no
      // modal, so it cannot be switched on empty.
      if (modalEnabled && (!modalTitle || !modalImage)) {
        return res.status(400).json({
          error: "Popup асаахын тулд 16:9 зураг болон гарчиг шаардлагатай",
        });
      }

      const payload = {
        name,
        description: (b.description || "").toString(),
        status,
        start_date: admin.firestore.Timestamp.fromDate(start),
        end_date: admin.firestore.Timestamp.fromDate(end),
        signup_tickets: signupTickets,
        tickets_per_unit: ticketsPerUnit,
        draw_frequency: frequency,
        cover_image: b.cover_image ? String(b.cover_image) : null,
        campaign_image: b.campaign_image ? String(b.campaign_image) : null,
        modal_enabled: modalEnabled,
        modal_image: modalImage,
        modal_title: modalTitle,
        modal_body: modalBody,
        schema_version: SCHEMA_VERSION,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_by: auth.uid,
        updated_by_name: auth.name,
      };

      let ref;
      if (id) {
        ref = db.collection(COLLECTION).doc(id);
        const snap = await ref.get();
        if (!snap.exists) return res.status(404).json({ error: "Аян олдсонгүй" });
        if (isLegacyCampaign(snap.data())) {
          return res.status(409).json({
            error: "Хуучин хэлбэрийн аяныг засах боломжгүй. Шинээр үүсгэнэ үү.",
          });
        }
        await ref.update(payload);
      } else {
        ref = db.collection(COLLECTION).doc();
        await ref.set({
          ...payload,
          total_participants: 0,
          total_tickets: 0,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          created_by: auth.uid,
          created_by_name: auth.name,
        });
      }

      logger.info("Campaign saved", {
        campaign_id: ref.id, by: auth.uid, created: !id, status,
      });
      return res.status(200).json({ id: ref.id, status });
    } catch (err) {
      logger.error("saveCampaign failed", { error: err.message });
      return res.status(500).json({ error: err.message });
    }
  });
});
