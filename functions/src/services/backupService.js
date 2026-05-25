const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { GoogleAuth } = require("google-auth-library");

// Collections to backup
const BACKUP_COLLECTIONS = ["orders", "users", "withdraws", "gift_orders"];

// GCS bucket name — replace with your actual bucket
const BACKUP_BUCKET = "gs://grammgold-backups";

// Firestore project ID
const PROJECT_ID = "grammgold";

/**
 * Core backup logic: calls Firestore Export REST API
 */
async function runBackup() {
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  const now = new Date();
  // Mongolia time label (UTC+8)
  const mntOffset = 8 * 60 * 60 * 1000;
  const mntNow = new Date(now.getTime() + mntOffset);
  const dateLabel = mntNow.toISOString().slice(0, 10); // "2026-03-09"
  const timeLabel = mntNow.toISOString().slice(11, 16).replace(":", ""); // "0300"
  const outputUriPrefix = `${BACKUP_BUCKET}/firestore-backup-${dateLabel}-${timeLabel}`;

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default):exportDocuments`;

  const body = {
    outputUriPrefix,
    collectionIds: BACKUP_COLLECTIONS,
  };

  logger.info("Starting Firestore backup", {
    outputUriPrefix,
    collections: BACKUP_COLLECTIONS,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (!response.ok) {
    logger.error("Firestore backup failed", {
      status: response.status,
      error: result,
    });
    throw new Error(`Backup failed: ${JSON.stringify(result.error || result)}`);
  }

  logger.info("Firestore backup started successfully", {
    operation: result.name,
    outputUriPrefix,
    collections: BACKUP_COLLECTIONS,
    metadata: result.metadata,
  });

  return {
    operation: result.name,
    outputUriPrefix,
    collections: BACKUP_COLLECTIONS,
    startedAt: now.toISOString(),
  };
}

/**
 * Scheduled backup: шөнийн 03:00 MNT (19:00 UTC)
 * Монгол улсын цагийн бүс: UTC+8
 */
exports.scheduledBackup = onSchedule({
  schedule: "0 19 * * *", // 19:00 UTC = 03:00 MNT
  timeZone: "UTC",
  memory: "512MiB",
  timeoutSeconds: 300,
}, async () => {
  try {
    const result = await runBackup();
    logger.info("Scheduled backup completed", result);
  } catch (err) {
    logger.error("Scheduled backup error", {
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }
});

/**
 * Manual backup trigger: admin-аас гараар backup хийхэд ашиглана
 * POST /manualBackup
 * Header: Authorization: Bearer <admin-token>
 */
exports.manualBackup = onRequest({
  memory: "512MiB",
  timeoutSeconds: 300,
}, async (req, res) => {
  const admin = require("firebase-admin");
  const cors = require("cors")({ origin: true });

  return cors(req, res, async () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      // AuthN
      const authHeader = req.headers.authorization || req.headers.Authorization || "";
      if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: Missing Bearer token" });
      }
      const idToken = authHeader.split(" ")[1];

      let decoded;
      try {
        decoded = await admin.auth().verifyIdToken(idToken);
      } catch (e) {
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
      }

      // AuthZ: admin only
      const db = admin.firestore();
      const adminUid = decoded.uid;
      let adminDocSnap = await db.collection("admins").doc(adminUid).get();
      if (!adminDocSnap.exists) {
        const q = await db.collection("admins").where("uid", "==", adminUid).limit(1).get();
        if (!q.empty) adminDocSnap = q.docs[0];
      }
      if (!adminDocSnap.exists) {
        return res.status(403).json({ error: "Forbidden: Not an admin" });
      }
      const adminRole = ((adminDocSnap.data() || {}).role || "").toLowerCase();
      if (!["admin", "superadmin", "owner"].includes(adminRole)) {
        return res.status(403).json({ error: "Forbidden: Insufficient role" });
      }

      const result = await runBackup();

      return res.status(200).json({
        status: "backup_started",
        ...result,
      });
    } catch (err) {
      logger.error("Manual backup error", { error: err.message, stack: err.stack });
      return res.status(500).json({ error: err.message || "Backup failed" });
    }
  });
});
