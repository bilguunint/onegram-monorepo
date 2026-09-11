// admins/* бичлэгтэй бүх Auth хэрэглэгчид admin:true custom claim тавина (нэг удаагийн backfill).
// Ажиллуулах: cd functions && node tmp_set_admin_claims.js
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(require("./grammgold-firebase.json")) });

(async () => {
  const s = await admin.firestore().collection("admins").get();
  for (const d of s.docs) {
    const u = await admin.auth().getUser(d.id).catch(() => null);
    if (!u) {
      console.log("skip (no auth user):", d.id, d.get("email"));
      continue;
    }
    await admin.auth().setCustomUserClaims(d.id, { ...(u.customClaims || {}), admin: true });
    console.log("claim set:", d.get("email"), d.get("role"));
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
