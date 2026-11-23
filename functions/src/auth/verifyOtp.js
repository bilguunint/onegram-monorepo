const functions = require("firebase-functions");
const admin = require("firebase-admin");

const db = admin.firestore();

module.exports = functions.https.onRequest(
  {
    memory: "512MiB",
    timeoutSeconds: 120,
  },
  async (req, res) => {
  try {
    const body = req.body || {};
    const input = body.phoneNumber || body.email || body.identifier;
    const otp = body.otp;

    if (!input || !otp) {
      return res.status(400).send("Missing fields");
    }

    // Оношилгоо: хэн, ямар үр дүнтэй болсныг логлоно (дугаарын сүүлийн 4 орон).
    const who = String(input).replace(/^.*(\d{4})$/, "***$1");
    const fail = (code, msg) => {
      console.warn(`verifyOtp ${who}: ${msg}`);
      return res.status(code).send(msg);
    };
    const phoneMatch = String(input).match(/^(\+976)?(\d{8})$/);
    const isPhone = !!phoneMatch;
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(input).toLowerCase());

    if (!isPhone && !isEmail) {
      return fail(400, "Invalid identifier");
    }

    // Build possible doc IDs to lookup in otp_requests
    let candidateDocIds = [];
    if (isEmail) {
      candidateDocIds = [String(input).toLowerCase()];
    } else if (isPhone) {
      const raw = phoneMatch[2];
      const e164 = `+976${raw}`;
      // Try exact input first (backward compat), then E.164, then raw 8 digits
      candidateDocIds = [String(input), e164, raw];
    }

    let docSnap = null;
    let docRef = null;
    for (const id of candidateDocIds) {
      const ref = db.collection("otp_requests").doc(id);
      const snap = await ref.get();
      if (snap.exists) {
        docSnap = snap;
        docRef = ref;
        break;
      }
    }

    if (!docSnap || !docSnap.exists) {
      return fail(400, "No OTP request found");
    }

    const data = docSnap.data();

    if (!data.createdAt || !data.createdAt.seconds) {
      return fail(400, "Invalid OTP timestamp");
    }

    const now = admin.firestore.Timestamp.now();
    const diff = now.seconds - data.createdAt.seconds;

    if (diff > 300) {
      await docRef.delete().catch(() => {});
      return fail(400, "OTP expired");
    }

    if (String(data.otp) !== String(otp)) {
      return fail(400, "Invalid OTP");
    }

    // OTP verified — get or create user
    let user;
    try {
      if (isEmail) {
        user = await admin.auth().getUserByEmail(String(input).toLowerCase());
      } else {
        const raw = phoneMatch[2];
        const e164 = `+976${raw}`;
        user = await admin.auth().getUserByPhoneNumber(e164);
      }
    } catch (error) {
      if (isEmail) {
        user = await admin.auth().createUser({
          email: String(input).toLowerCase(),
          emailVerified: true,
          disabled: false,
        });
      } else {
        const raw = phoneMatch[2];
        const e164 = `+976${raw}`;
        user = await admin.auth().createUser({ phoneNumber: e164 });
      }
    }

    // Consume OTP
    await docRef.delete().catch(() => {});

    const token = await admin.auth().createCustomToken(user.uid, {
      auth: isEmail ? "email_otp" : "sms_otp",
    });
    console.log(`verifyOtp ${who}: OK uid=${user.uid}`);
    return res.status(200).send({ token });
  } catch (err) {
    console.error("Error in verifyOtp:", err);
    return res.status(500).send("Internal server error");
  }
});
