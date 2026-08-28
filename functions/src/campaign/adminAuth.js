const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

/**
 * Roles allowed to create campaigns and settle draws. Sellers reach the
 * campaigns page from the menu but only to look; handing out prizes is not
 * theirs to do.
 */
const WRITE_ROLES = ["admin", "superadmin", "owner", "manager"];

/**
 * Resolves the caller's admin record from a Bearer token.
 *
 * The admins collection is keyed by uid for most records but a few older ones
 * carry the uid in a field instead, so both are tried before giving up.
 * @param {object} db Firestore instance
 * @param {object} req the request
 * @return {Promise<object>} {ok, status, error, uid, name, role}
 */
async function resolveAdmin(db, req) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  if (!header.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Unauthorized: Missing Bearer token" };
  }
  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(header.split(" ")[1]);
  } catch (e) {
    logger.warn("Invalid ID token", { message: e.message });
    return { ok: false, status: 401, error: "Unauthorized: Invalid token" };
  }

  let snap = await db.collection("admins").doc(decoded.uid).get();
  if (!snap.exists) {
    const q = await db.collection("admins").where("uid", "==", decoded.uid).limit(1).get();
    if (!q.empty) snap = q.docs[0];
  }
  if (!snap.exists) {
    return { ok: false, status: 403, error: "Forbidden: Not an admin" };
  }

  const data = snap.data() || {};
  const role = (data.role || "").toString().toLowerCase();
  if (!WRITE_ROLES.includes(role)) {
    return { ok: false, status: 403, error: "Forbidden: Insufficient role" };
  }
  return {
    ok: true,
    uid: decoded.uid,
    role,
    name: data.name || decoded.name || decoded.email || "unknown",
  };
}

module.exports = { resolveAdmin, WRITE_ROLES };
