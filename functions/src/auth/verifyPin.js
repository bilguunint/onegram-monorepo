const functions = require("firebase-functions");
const admin = require("firebase-admin");
const bcrypt = require("bcryptjs");

const db = admin.firestore();

module.exports = functions.https.onRequest(
  {
    memory: "512MiB",
    timeoutSeconds: 120,
  },
  async (req, res) => {
  const { pin, token } = req.body;

  if (!pin || !token) {
    return res.status(400).json({ status: "failed", msg: "Missing fields" });
  }

  // Validate PIN format (6 digits)
  if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    return res.status(400).json({ 
      status: "failed", 
      msg: "PIN код 6 оронтой тоо байх ёстой",
    });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;
    if (!uid) {
      return res.status(401).json({ status: "failed", msg: "Invalid token" });
    }

    const doc = await db.collection("users").doc(uid).get();
    if (!doc.exists || !doc.data().pinHash) {
      return res.status(400).json({ status: "failed", msg: "No pin set" });
    }

    const match = await bcrypt.compare(pin, doc.data().pinHash);
    if (!match) {
      return res.status(400).json({ status: "failed", msg: "Пин буруу" });
    }

    return res.status(200).json({ status: "success", msg: "Амжилттай" });
  } catch (error) {
    console.error("verifyPin error:", error);
    return res.status(500).json({ status: "failed", msg: error.message });
  }
});
