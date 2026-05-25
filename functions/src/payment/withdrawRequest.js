const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const bcrypt = require("bcryptjs");
const cors = require("cors")({ origin: true });
const { sendWithdrawVerification } = require("../services/smsService");
const axios = require("axios");

// Helper function to generate verification code
function generateVerificationCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result; // 5-character alphanumeric code (e.g., XD34G)
}

// Helper function to send email via SendGrid
async function sendVerificationEmail(email, verificationCode, quantity, metalName) {
  try {
    const sendgridKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || "no-reply@onegram.mn";

    if (!sendgridKey) {
      logger.error("SendGrid API key not configured");
      return false;
    }

    const payload = {
      personalizations: [{ to: [{ email: String(email).toLowerCase() }] }],
      from: { email: fromEmail, name: "Ikh Khaadiin Chuluu" },
      subject: "Таны авах хүсэлтийн баталгаажуулах код",
      content: [{ 
        type: "text/plain", 
        value: `Таны ${quantity}гр ${metalName} авах хүсэлтийн баталгаажуулах код: ${verificationCode}\n10 минутын дотор ашиглана уу.`,
      }],
    };

    const response = await axios.post("https://api.sendgrid.com/v3/mail/send", payload, {
      headers: {
        "Authorization": `Bearer ${sendgridKey}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 202) {
      logger.info("Withdraw verification email sent successfully", { email });
      return true;
    } else {
      logger.error("SendGrid API error", { status: response.status, data: response.data });
      return false;
    }
  } catch (error) {
    logger.error("Failed to send verification email", { error: error.message, email });
    return false;
  }
}

exports.withdrawRequest = onRequest(
  {
  memory: "512MiB",
  timeoutSeconds: 120,
},
  async (req, res) => {
  return cors(req, res, async () => {
    const db = admin.firestore();
    try {
      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      const body = req.body || {};
      const { user_id, quantity, metal_id, pincode, token, withdrawType } = body;

      // Basic validations
      if (!user_id) {
        return res.status(400).json({ error: "Missing user_id" });
      }
      if (!quantity) {
        return res.status(400).json({ error: "Missing quantity" });
      }
      if (!metal_id) {
        return res.status(400).json({ error: "Missing metal_id" });
      }
      if (!pincode) {
        return res.status(400).json({ error: "Missing pincode" });
      }
      
      // Validate PIN format (6 digits)
      if (String(pincode).length !== 6 || !/^\d{6}$/.test(String(pincode))) {
        return res.status(400).json({ 
          error: "PIN код 6 оронтой тоо байх ёстой",
        });
      }
      if (!token) {
        return res.status(400).json({ error: "Missing token" });
      }

      const qty = Number(quantity);
      const metalId = Number(metal_id);
      
      if (qty <= 0) {
        return res.status(400).json({ error: "Quantity must be positive" });
      }
      
      if (![1, 3].includes(metalId)) {
        return res.status(400).json({ error: "Invalid metal_id. Must be 1 (gold) or 3 (silver)" });
      }

      // Auth user
      let decoded;
      try {
        decoded = await admin.auth().verifyIdToken(token);
      } catch (e) {
        return res.status(401).json({ error: "Invalid token" });
      }
      const userUid = decoded.uid;

      // Check if the authenticated user matches the user_id
      if (userUid !== user_id) {
        return res.status(403).json({ error: "Unauthorized: Cannot withdraw for another user" });
      }

      // Transaction: verify pin, check balance and create withdraw request
      const result = await db.runTransaction(async (tx) => {
        // ALL READS FIRST
        const userRef = db.collection("users").doc(String(user_id));
        const userSnap = await tx.get(userRef);
        
        if (!userSnap.exists) {
          throw new Error("User not found");
        }

        const userData = userSnap.data();
        
        // Verify PIN inside transaction for atomicity (similar to createGift)
        if (!userData.pinHash) {
          throw new Error("No pin set");
        }
        const pinValid = await bcrypt.compare(String(pincode), String(userData.pinHash));
        if (!pinValid) {
          throw new Error("Invalid pincode");
        }

        const balance = userData.balance || {};
        const goldBalance = Number(balance.gold || 0);
        const silverBalance = Number(balance.silver || 0);

        // Check if user has enough balance for the requested metal (but don't deduct yet)
        let currentBalance;
        let metalName;
        
        if (metalId === 1) {
          currentBalance = goldBalance;
          metalName = "gold";
        } else if (metalId === 3) {
          currentBalance = silverBalance;
          metalName = "silver";
        }

        if (currentBalance < qty) {
          throw new Error(`Insufficient ${metalName} balance. Available: ${currentBalance}, Requested: ${qty}`);
        }

        // Prepare client info
        const client = {
          email: userData.email || userData.client_email || null,
          first_name: userData.first_name || userData.client_first_name || null,
          last_name: userData.last_name || userData.client_last_name || null,
          phone: userData.phone || userData.client_phone || null,
        };

        // Fetch latest rate if metal_id is 1 (gold)
        let price = null;
        if (metalId === 1) {
          const ratesSnapshot = await tx.get(
            db.collection("rates")
              .orderBy("created_at", "desc")
              .limit(1),
          );
          
          if (!ratesSnapshot.empty) {
            const latestRate = ratesSnapshot.docs[0].data();
            const goldRate = latestRate.rate;
            if (goldRate) {
              price = qty * goldRate;
              logger.info("Price calculated for withdraw", {
                quantity: qty,
                gold_rate: goldRate,
                price: price,
              });
            }
          }
        }

        // Generate withdraw request ID and verification code
        const withdrawRef = db.collection("withdraws").doc();
        const withdrawId = withdrawRef.id;
        const verificationCode = generateVerificationCode();

        // NOW START WRITES
        // Create withdraw request document (NO balance deduction yet)
        const withdrawDoc = {
          id: withdrawId,
          user_id: String(user_id),
          quantity: qty,
          metal_id: metalId,
          status: "pending",
          client: client,
          verificationCode: verificationCode,
          verificationCodeExpiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)), // 10 minutes
          verificationCodeUsed: false,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          verified_at: null,
          verified_by_uid: null,
          verified_by_name: null,
          notes: null,
        };
        
        // Add price field if calculated
        if (price !== null) {
          withdrawDoc.price = price;
        }
        
        // Add withdraw_type if provided
        if (withdrawType) {
          withdrawDoc.withdraw_type = String(withdrawType);
        }

        tx.set(withdrawRef, withdrawDoc);

        // Log the withdrawal request
        logger.info("Withdraw request created", {
          withdraw_id: withdrawId,
          user_id: String(user_id),
          quantity: qty,
          metal_id: metalId,
          current_balance: currentBalance,
          client: client,
        });

        return {
          withdraw_id: withdrawId,
          quantity: qty,
          metal_id: metalId,
          current_balance: currentBalance,
          status: "pending",
          verificationCode: verificationCode,
          client: client,
        };
      });

      // Send verification code via SMS or Email (outside transaction)
      try {
        const metalName = metalId === 1 ? "алт" : "мөнгө";
        let verificationSent = false;

        // Check if user has phone number (prefer SMS)
        if (result.client.phone) {
          verificationSent = await sendWithdrawVerification(
            result.client.phone,
            result.verificationCode,
            result.quantity,
            metalName,
          );
          
          if (verificationSent) {
            logger.info("Withdraw verification SMS sent", {
              withdraw_id: result.withdraw_id,
              phone: result.client.phone,
            });
          }
        }

        // If SMS failed or no phone, try email
        if (!verificationSent && result.client.email) {
          verificationSent = await sendVerificationEmail(
            result.client.email,
            result.verificationCode,
            result.quantity,
            metalName,
          );
          
          if (verificationSent) {
            logger.info("Withdraw verification email sent", {
              withdraw_id: result.withdraw_id,
              email: result.client.email,
            });
          }
        }

        if (!verificationSent) {
          logger.warn("Failed to send verification code", {
            withdraw_id: result.withdraw_id,
            phone: result.client.phone,
            email: result.client.email,
          });
        }
      } catch (verificationError) {
        logger.error("Error sending verification code", {
          error: verificationError.message,
          withdraw_id: result.withdraw_id,
        });
      }

      // Send notification to user about withdraw request (outside transaction)
      try {
        const userDoc = await db.collection("users").doc(String(user_id)).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        
        const metalName = metalId === 1 ? "алт" : "мөнгө";
        
        // Save notification to user's notifications sub-collection
        await db.collection("users").doc(String(user_id)).collection("notifications").add({
          title: `${metalName} авах хүсэлт үүслээ`,
          body: `Таны ${result.quantity} гр ${metalName} авах хүсэлт амжилттай үүслээ. Хүсэлт шалгагдаж байна.`,
          type: "withdraw_request",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          data: {
            withdraw_id: result.withdraw_id,
            quantity: String(result.quantity),
            metal_id: String(result.metal_id),
            status: "pending",
          },
          read: false,
        });

        // Send FCM notification if token available
        let fcmToken = null;
        if (userData && typeof userData === "object") {
          fcmToken = userData.fcm_token || (Array.isArray(userData.fcm_tokens) ? userData.fcm_tokens[0] : null);
        }

        if (fcmToken) {
          await admin.messaging().send({
            token: fcmToken,
            notification: {
              title: `${metalName} авах хүсэлт үүслээ`,
              body: `Таны ${result.quantity} гр ${metalName} авах хүсэлт амжилттай үүслээ.`,
            },
            data: {
              type: "withdraw_request",
              withdraw_id: result.withdraw_id,
              quantity: String(result.quantity),
              metal_id: String(result.metal_id),
              status: "pending",
            },
          });
          logger.info("FCM notification sent for withdraw request", { withdraw_id: result.withdraw_id, user_id });
        } else {
          logger.info("No FCM token found for user; notification saved to database", { user_id });
        }
      } catch (e) {
        logger.warn("Failed to send withdraw request notification", { message: e.message, withdraw_id: result.withdraw_id });
      }

      return res.status(200).json({
        status: "pending",
        withdraw_id: result.withdraw_id,
        quantity: result.quantity,
        metal_id: result.metal_id,
        current_balance: result.current_balance,
        verification_required: true,
        verification_sent_to: result.client.phone ? "SMS" : (result.client.email ? "Email" : "None"),
        message: "Биетээр авах хүсэлт амжилттай илгээлээ. Таны бүртгэлтэй утас эсвэл имэйл хаяг руу баталгаажуулах код илгээлээ.",
      });
    } catch (err) {
      logger.error("withdrawRequest error", { 
        message: err.message,
        stack: err.stack,
        user_id: req.body && req.body.user_id,
        quantity: req.body && req.body.quantity,
        metal_id: req.body && req.body.metal_id,
      });
      return res.status(400).json({ error: err.message || "Failed to create withdraw request" });
    }
  });
});
