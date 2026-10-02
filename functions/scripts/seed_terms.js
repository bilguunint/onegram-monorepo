// Үйлчилгээний нөхцөлийг Firestore `terms/{key}`-д анх удаа seed хийнэ.
//
//   cd app && dart run tool/export_terms.dart > /tmp/terms_seed.json
//   cd functions && node scripts/seed_terms.js /tmp/terms_seed.json [--force] [--dry]
//
// Байгаа баримтыг (админ засварласан байж болно) --force өгөөгүй бол алгасна.
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const jsonPath = process.argv[2];
const force = process.argv.includes("--force");
const dry = process.argv.includes("--dry");
if (!jsonPath) {
  console.error("usage: node scripts/seed_terms.js <terms_seed.json> [--force] [--dry]");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(path.join(__dirname, "..", "grammgold-firebase.json"))),
});
const db = admin.firestore();

(async () => {
  const seed = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  for (const [key, t] of Object.entries(seed)) {
    const ref = db.collection("terms").doc(key);
    const snap = await ref.get();
    if (snap.exists && !force) {
      console.log(`skip   ${key} (exists, version ${snap.get("version")})`);
      continue;
    }
    const version = snap.exists ? Number(snap.get("version") || 0) + 1 : 1;
    const doc = {
      key,
      title: t.title,
      body: t.body,
      version,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_by: "seed-script",
    };
    if (dry) {
      console.log(`would write ${key} v${version}:`, Object.keys(t.body).map((l) => `${l}=${t.body[l].length}ch`).join(" "));
      continue;
    }
    await ref.set(doc);
    await ref.collection("versions").doc(String(version)).set({
      version,
      title: t.title,
      body: t.body,
      saved_at: admin.firestore.FieldValue.serverTimestamp(),
      saved_by: "seed-script",
    });
    console.log(`wrote  ${key} v${version}`);
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
