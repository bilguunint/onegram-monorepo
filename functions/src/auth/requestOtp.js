const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const { sendOTP } = require("../services/smsService");

const db = admin.firestore();

module.exports = functions.https.onRequest(
  {
    memory: "512MiB",
    timeoutSeconds: 120,
  },
  async (req, res) => {
  // Support both phone and email inputs
  const body = req.body || {};
  const input = body.phoneNumber || body.email || body.identifier;
  const isFourDigits = body.isFourDigits === true;
  if (!input) return res.status(400).send("Phone or email required");

  const phoneMatch = String(input).match(/^(\+976)?(\d{8})$/);
  const isPhone = !!phoneMatch;
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(input).toLowerCase());

  if (!isPhone && !isEmail) return res.status(400).send("Invalid phone or email");

  // Special test case for phone number 86663322
  let otp;
  if (isPhone && (input === '86663322' || input === '+97686663322')) {
    otp = isFourDigits ? '1122' : '112233'; // Fixed OTP for test number
    console.log(`Using test OTP for phone ${input}: ${otp}`);
  } else {
    otp = isFourDigits ?
      Math.floor(1000 + Math.random() * 9000).toString() :
      Math.floor(100000 + Math.random() * 900000).toString();
  }

  try {
    // Persist OTP (same collection). Use lowercase email as doc id when email.
    const docId = isEmail ? String(input).toLowerCase() : String(input);
    await db.collection("otp_requests").doc(docId).set({
      otp,
      channel: isEmail ? "email" : "sms",
      isFourDigits: isFourDigits,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Firestore write error:", error);
    return res.status(500).send("Failed to save OTP");
  }

  if (isPhone) {
    const success = await sendOTP(input, otp);
    
    if (success) {
      return res.status(200).send("OTP sent successfully");
    } else {
      return res.status(500).send("Failed to send SMS OTP");
    }
  } else if (isEmail) {
    // Send via SendGrid using .env
    const sendgridKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || "no-reply@onegram.mn";

    if (!sendgridKey) return res.status(500).send("Email not configured");

    const payload = {
      personalizations: [{ to: [{ email: String(input).toLowerCase() }] }],
      from: { email: fromEmail, name: "Ikh Khaadiin Chuluu" },
      subject: "Таны баталгаажуулах код",
      content: [{ type: "text/plain", value: `Таны OTP код: ${otp}\n5 минутын дотор ашиглана уу.` }],
    };

    try {
      await axios.post("https://api.sendgrid.com/v3/mail/send", payload, {
        headers: {
          Authorization: `Bearer ${sendgridKey}`,// eslint-disable-line
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });
      return res.status(200).send("OTP sent successfully");
    } catch (err) {
      console.error("SendGrid error:", err.response.data || err.message);
      return res.status(500).send("Failed to send Email OTP");
    }
  }
});
