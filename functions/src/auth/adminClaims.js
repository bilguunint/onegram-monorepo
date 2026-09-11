const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

/**
 * admins/{uid} бичлэг үүсэх/устахад Auth custom claim `admin: true`-г
 * тааруулна. Storage/Firestore rules `request.auth.token.admin == true`-г
 * эхэлж шалгадаг тул cross-service `firestore.exists()`-ээс хамаарахгүй.
 * Хэрэглэгч дахин нэвтэрсний (ID token шинэчлэгдсэний) дараа хүчинтэй болно.
 */
exports.syncAdminClaim = onDocumentWritten(
  {
    document: "admins/{uid}",
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (event) => {
    const uid = event.params.uid;
    const exists = !!(event.data && event.data.after && event.data.after.exists);
    try {
      const user = await admin.auth().getUser(uid);
      const claims = { ...(user.customClaims || {}) };
      if (exists) {
        claims.admin = true;
      } else {
        delete claims.admin;
      }
      await admin.auth().setCustomUserClaims(uid, claims);
      logger.info("admin claim synced", { uid, admin: exists });
    } catch (err) {
      // Auth хэрэглэгч байхгүй (хуучин admins бичлэг) бол алгасна.
      logger.warn("admin claim sync skipped", { uid, error: err.message });
    }
  },
);
