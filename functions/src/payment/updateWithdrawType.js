const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

const TYPES = ["sold_to_us", "taken_physically"];

/**
 * Corrects a withdraw recorded under the wrong type, in either direction.
 *
 * The type is chosen at verification time and occasionally gets it wrong — a
 * physical hand-over logged as a buy-back or the reverse. Firestore rules deny
 * every client write to `withdraws`, so the correction has to run here rather
 * than from the admin app.
 *
 * Bank details belong to "sold_to_us" alone: they are required when switching
 * to it and removed when switching away, so a physical hand-over is not left
 * holding an account number that means nothing. Nothing else about the
 * withdrawal moves — quantity, price, status and the balance deduction are
 * untouched.
 *
 * `withdraw_analytics` is rebuilt from these docs by the nightly job, so the
 * type breakdowns catch up on the next run rather than immediately.
 */
exports.updateWithdrawType = onRequest({
  region: "us-central1",
  timeoutSeconds: 60,
}, async (req, res) => {
  return cors(req, res, async () => {
    const db = admin.firestore();
    try {
      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      const authHeader =
        req.headers.authorization || req.headers.Authorization || "";
      if (!authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ error: "Unauthorized: Missing Bearer token" });
      }

      let decoded;
      try {
        decoded = await admin.auth().verifyIdToken(authHeader.split(" ")[1]);
      } catch (e) {
        logger.warn("Invalid ID token on updateWithdrawType", {
          message: e.message,
        });
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
      }
      const adminUid = decoded.uid;

      let adminDocSnap = await db.collection("admins").doc(adminUid).get();
      if (!adminDocSnap.exists) {
        const q = await db
          .collection("admins")
          .where("uid", "==", adminUid)
          .limit(1)
          .get();
        if (!q.empty) adminDocSnap = q.docs[0];
      }
      if (!adminDocSnap.exists) {
        return res.status(403).json({ error: "Forbidden: Not an admin" });
      }
      const adminData = adminDocSnap.data() || {};
      const adminRole = (adminData.role || "").toString().toLowerCase();
      // Correcting an accounting classification is an admin-level call;
      // sellers only record the type at hand-over time.
      if (!["admin", "superadmin", "owner"].includes(adminRole)) {
        return res.status(403).json({ error: "Forbidden: Insufficient role" });
      }
      const adminName =
        adminData.name || decoded.name || decoded.email || "unknown";

      const {
        withdrawId,
        withdrawType,
        bankName,
        bankAccountNumber,
        notes,
      } = req.body || {};

      if (!withdrawId || !TYPES.includes(withdrawType)) {
        return res.status(400).json({
          error: "withdrawId болон зөв withdrawType шаардлагатай.",
        });
      }
      const toSold = withdrawType === "sold_to_us";
      const bank = (bankName || "").toString().trim();
      const account = (bankAccountNumber || "").toString().trim();
      if (toSold && !bank) {
        return res.status(400).json({ error: "Банкаа сонгоно уу." });
      }
      if (toSold && !/^\d{5,20}$/.test(account)) {
        return res.status(400).json({
          error: "Дансны дугаар буруу байна (зөвхөн тоо, 5-20 орон).",
        });
      }

      const ref = db.collection("withdraws").doc(String(withdrawId));
      const result = await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) {
          throw new Error("Биетээр авах хүсэлт олдсонгүй.");
        }
        const w = snap.data() || {};
        const previous = w.withdraw_type || null;
        if (previous === withdrawType) {
          throw new Error("Хүсэлт аль хэдийн энэ төрөлтэй байна.");
        }

        const update = {
          withdraw_type: withdrawType,
          withdraw_type_previous: previous,
          withdraw_type_changed_at:
            admin.firestore.FieldValue.serverTimestamp(),
          withdraw_type_changed_by: adminUid,
          withdraw_type_changed_by_name: adminName,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (toSold) {
          update.bank_name = bank;
          update.bank_account_number = account;
        } else {
          update.bank_name = admin.firestore.FieldValue.delete();
          update.bank_account_number = admin.firestore.FieldValue.delete();
        }
        if (notes && String(notes).trim()) {
          update.notes = String(notes).trim();
        }
        tx.update(ref, update);
        return { previous };
      });

      logger.info("Withdraw type corrected", {
        withdrawId: String(withdrawId),
        from: result.previous,
        to: withdrawType,
        by: adminUid,
      });
      return res.json({
        status: "ok",
        withdraw_type: withdrawType,
        previous: result.previous,
      });
    } catch (e) {
      logger.error("updateWithdrawType failed", { message: e.message });
      return res.status(400).json({ error: e.message });
    }
  });
});
