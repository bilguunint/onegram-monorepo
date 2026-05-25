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
    try {
      if (req.method !== "POST") {
        return res.status(405).json({ status: "failed", msg: "Method Not Allowed" });
      }

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          status: "failed",
          msg: "Authorization header шаардлагатай (Bearer token)",
        });
      }
      const token = authHeader.split("Bearer ")[1];

      const { registerNum, newPin, otpCode, input } = req.body;

      // Validate required fields
      if (!registerNum || !newPin || !otpCode || !input) {
        return res.status(400).json({
          status: "failed",
          msg: "registerNum, newPin, otpCode, input талбарууд шаардлагатай",
        });
      }

      // Validate PIN format (6 digits)
      if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
        return res.status(400).json({
          status: "failed",
          msg: "PIN код 6 оронтой тоо байх ёстой",
        });
      }

      // Step 1: Verify Firebase token and get userId
      let decoded;
      try {
        decoded = await admin.auth().verifyIdToken(token);
      } catch (tokenError) {
        return res.status(401).json({ status: "failed", msg: "Token хүчингүй байна" });
      }
      const userId = decoded.uid;

      // Step 2: Get user document and verify registration_number
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({ status: "failed", msg: "Хэрэглэгч олдсонгүй" });
      }

      const userData = userDoc.data();

      if (userData.registration_number !== registerNum) {
        return res.status(400).json({
          status: "failed",
          msg: "Хэрэглэгчийн регистерийн дугаар буруу байна",
        });
      }

      // Step 3: Verify OTP from otp_requests collection (same logic as verifyOtp.js)
      const phoneMatch = String(input).match(/^(\+976)?(\d{8})$/);
      const isPhone = !!phoneMatch;
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(input).toLowerCase());

      if (!isPhone && !isEmail) {
        return res.status(400).json({ status: "failed", msg: "input утга буруу байна (утас эсвэл и-мэйл байх ёстой)" });
      }

      // Security: input must belong to the logged-in user (check via Firebase Auth)
      let authUser;
      try {
        authUser = await admin.auth().getUser(userId);
      } catch (e) {
        return res.status(404).json({ status: "failed", msg: "Хэрэглэгч олдсонгүй" });
      }

      const normalizePhone = (p) => {
        const cleaned = String(p || "").trim().replace(/\s+/g, "").replace(/^0+/, "");
        const m = cleaned.match(/^(\+976|976)?(\d{8})$/);
        return m ? m[2] : cleaned;
      };

      const inputNormalized = isPhone ? normalizePhone(input) : String(input).toLowerCase();

      // Check against Firebase Auth phone/email AND Firestore userData.phone/email as fallback
      const authPhoneNormalized = normalizePhone(authUser.phoneNumber || "");
      const authEmailNormalized = String(authUser.email || "").toLowerCase();
      const firestorePhoneNormalized = normalizePhone(userData.phone || userData.phoneNumber || "");
      const firestoreEmailNormalized = String(userData.email || "").toLowerCase();

      const inputMatchesUser = isPhone ?
        (authPhoneNormalized === inputNormalized || firestorePhoneNormalized === inputNormalized) :
        (authEmailNormalized === inputNormalized || firestoreEmailNormalized === inputNormalized);

      if (!inputMatchesUser) {
        console.warn("=== userResetPin: inputMatchesUser FAILED ===");
        console.warn("input:", input);
        console.warn("isPhone:", isPhone, "| isEmail:", isEmail);
        console.warn("inputNormalized:", inputNormalized);
        console.warn("authUser.phoneNumber:", authUser.phoneNumber, "→ normalized:", authPhoneNormalized);
        console.warn("authUser.email:", authUser.email, "→ normalized:", authEmailNormalized);
        console.warn("userData.phone:", userData.phone, "| userData.phoneNumber:", userData.phoneNumber, "→ normalized:", firestorePhoneNormalized);
        console.warn("userData.email:", userData.email, "→ normalized:", firestoreEmailNormalized);
        console.warn("=============================================");
        return res.status(403).json({
          status: "failed",
          msg: "Зөвхөн өөрийнхөө бүртгэлийн pincode-г солих боломжтой",
        });
      }

      let candidateDocIds = [];
      if (isEmail) {
        candidateDocIds = [String(input).toLowerCase()];
      } else if (isPhone) {
        const raw = phoneMatch[2];
        const e164 = `+976${raw}`;
        candidateDocIds = [String(input), e164, raw];
      }

      let otpDocSnap = null;
      let otpDocRef = null;

      for (const docId of candidateDocIds) {
        const ref = db.collection("otp_requests").doc(docId);
        const snap = await ref.get();
        if (snap.exists) {
          otpDocSnap = snap;
          otpDocRef = ref;
          break;
        }
      }

      if (!otpDocSnap || !otpDocSnap.exists) {
        return res.status(400).json({
          status: "failed",
          msg: "OTP хүсэлт олдсонгүй. Эхлээд requestOtp ашиглан OTP авна уу",
        });
      }

      const otpData = otpDocSnap.data();

      // Check OTP expiry (5 minutes = 300 seconds)
      if (!otpData.createdAt || !otpData.createdAt.seconds) {
        return res.status(400).json({ status: "failed", msg: "OTP хүчингүй байна" });
      }

      const now = admin.firestore.Timestamp.now();
      const diff = now.seconds - otpData.createdAt.seconds;

      if (diff > 300) {
        await otpDocRef.delete().catch(() => {});
        return res.status(400).json({ status: "failed", msg: "OTP кодын хугацаа дууссан" });
      }

      // Check OTP code
      if (String(otpData.otp) !== String(otpCode)) {
        return res.status(400).json({ status: "failed", msg: "OTP код буруу байна" });
      }

      // Step 4: Hash and update the new PIN (same logic as setPin.js)
      const salt = bcrypt.genSaltSync(10);
      const hashedPin = bcrypt.hashSync(newPin, salt);

      await db.collection("users").doc(userId).set(
        {
          pinHash: hashedPin,
          pinUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      // Consume OTP after successful pin reset
      await otpDocRef.delete().catch(() => {});

      console.log(`userResetPin: PIN updated for user ${userId} (registerNum: ${registerNum})`);

      return res.status(200).json({
        status: "success",
        msg: "PIN амжилттай шинэчлэгдлээ",
      });
    } catch (error) {
      console.error("userResetPin error:", error);
      return res.status(500).json({ status: "failed", msg: error.message });
    }
  },
);
