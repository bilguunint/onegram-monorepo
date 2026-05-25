const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const bcrypt = require("bcryptjs");
const cors = require("cors")({ origin: true });
const { sendGiftNotification } = require("../services/smsService");
const GiftSecurityManager = require("./giftSecurityManager");

// Initialize security manager
const securityManager = new GiftSecurityManager();

// Helpers
function normalizePhoneMongolia(input) {
  const m = String(input || "").match(/^(\+976)?(\d{8})$/);
  return m ? `+976${m[2]}` : null;
}

// Helper function to send SMS notification
async function sendGiftNotificationSMS(receiverPhone, senderFirstName, senderLastName, quantity, metalId) {
  try {
    const metalName = metalId === 1 ? "алт" : "мөнгө";
    const firstLetter = senderLastName ? senderLastName.charAt(0).toUpperCase() : "";
    const senderName = firstLetter ? `${firstLetter}.${senderFirstName || ""}` : (senderFirstName || "Хэрэглэгч");
    
    const success = await sendGiftNotification(receiverPhone, senderName, quantity, metalName);
    
    if (success) {
      logger.info("Gift SMS notification sent successfully", {
        to: receiverPhone,
        sender: senderName,
        quantity: quantity,
        metalId: metalId,
      });
    } else {
      logger.warn("Failed to send gift SMS notification", {
        to: receiverPhone,
        sender: senderName,
      });
    }
  } catch (error) {
    logger.error("Error sending gift SMS notification", {
      error: error.message,
      receiverPhone: receiverPhone,
    });
  }
}

exports.createGift = onRequest(
  {
    memory: "1GiB",
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
      const receiver_phone_input = body.receiver_phone || body.reciever_phone; // support both spellings
      const { quantity, metal_id, pincode, token, greeting } = body;

      // Basic validations
      const phoneE164 = normalizePhoneMongolia(receiver_phone_input);
      if (!phoneE164) return res.status(400).json({ error: "Invalid receiver phone" });
      const qty = Number(quantity);
      const safeQty = parseFloat(qty.toFixed(6));
      if (!safeQty || safeQty <= 0) return res.status(400).json({ error: "Invalid quantity" });
      const metalId = Number(metal_id);
      if (![1, 3].includes(metalId)) return res.status(400).json({ error: "Invalid metal_id" });
      
      // Daily gold gift limit check (1 gram per 24 hours)
      if (metalId === 1 && safeQty > 1) {
        return res.status(400).json({
          error: "Өдөрт зөвхөн 1гр алтыг бэлэг болгон илгээх боломжтой.",
        });
      }
      if (!pincode || !token) return res.status(400).json({ error: "Missing pincode or token" });
      
      // Validate PIN format (6 digits)
      if (String(pincode).length !== 6 || !/^\d{6}$/.test(String(pincode))) {
        return res.status(400).json({ 
          error: "PIN код 6 оронтой тоо байх ёстой",
        });
      }

      // Auth sender
      let decoded;
      try {
        decoded = await admin.auth().verifyIdToken(token);
      } catch (e) {
        return res.status(401).json({ error: "Invalid token" });
      }
      const senderUid = decoded.uid;
      
      // Security checks
      try {
        // Rate limiting check
        await securityManager.checkRateLimit(senderUid, "create");
        
        // Suspicious activity check
        await securityManager.checkSuspiciousActivity(senderUid, phoneE164);
        
        // Log security event
        await securityManager.logSecurityEvent("gift_create_attempt", senderUid, {
          receiver_phone: phoneE164,
          amount: quantity,
          metal_id: metalId,
          ip_address: req.get("X-Forwarded-For") || req.connection.remoteAddress,
          user_agent: req.get("User-Agent"),
        });
      } catch (securityError) {
        logger.error("Security check failed:", securityError);
        return res.status(429).json({ error: securityError.message });
      }

      // Check daily gift limit: sender can only send 1 gift per calendar day
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todayGiftsSnap = await db.collection("gift_orders")
        .where("sender.uid", "==", senderUid)
        .where("created_at", ">=", admin.firestore.Timestamp.fromDate(todayStart))
        .where("created_at", "<=", admin.firestore.Timestamp.fromDate(todayEnd))
        .limit(1)
        .get();

      if (!todayGiftsSnap.empty) {
        return res.status(400).json({
          error: "Та өдөрт 1 удаа бэлгийн хүсэлт илгээх боломжтой",
        });
      }

      // Find or create receiver by phone BEFORE transaction
      let receiverUid = null;
      try {
        const userRecord = await admin.auth().getUserByPhoneNumber(phoneE164);
        receiverUid = userRecord.uid;
      } catch (e) {
        // create new user with phone only
        const userRecord = await admin.auth().createUser({ phoneNumber: phoneE164 });
        receiverUid = userRecord.uid;
        
        // Create Firestore document for new receiver
        await db.collection("users").doc(receiverUid).set({
          phone: phoneE164,
          balance: { gold: 0, silver: 0 },
          first_name: "",
          last_name: "",
          email: "",
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Check 24-hour gold gift limit BEFORE transaction
      if (metalId === 1) {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        // Query gifts sent in last 24 hours (including pending and success, exclude cancelled)
        const recentGiftsSnap = await db.collection("orders")
          .where("sender_uid", "==", senderUid)
          .where("type", "==", "gift")
          .where("metal_id", "==", 1)
          .where("created_at", ">=", admin.firestore.Timestamp.fromDate(yesterday))
          .get();
        
        let totalGoldSentToday = 0;
        recentGiftsSnap.forEach((doc) => {
          const giftData = doc.data();
          const giftStatus = giftData.status;
          
          // Count only pending and success gifts, exclude cancelled
          if (giftStatus === "success" || giftStatus === "pending") {
            totalGoldSentToday += Number(giftData.quantity || 0);
          }
        });
        
        // Check if adding current gift would exceed 1 gram limit
        if (totalGoldSentToday + safeQty > 1) {
          return res.status(400).json({ 
            error: "Өдөрт зөвхөн 1гр алтыг бэлэг болгон илгээх боломжтой.",
          });
        }
      }

      // Transaction: verify pin, check balance, create gift order, deduct balance
      const result = await db.runTransaction(async (tx) => {
        const senderRef = db.collection("users").doc(senderUid);
        const senderSnap = await tx.get(senderRef);
        if (!senderSnap.exists) throw new Error("Sender not found");

        const sender = senderSnap.data();
        
        // Verify PIN inside transaction for atomicity
        if (!sender.pinHash) {
          throw new Error("No pin set");
        }
        const pinValid = await bcrypt.compare(String(pincode), String(sender.pinHash));
        if (!pinValid) {
          throw new Error("Invalid pincode");
        }

        const balance = sender.balance || {};
        const goldBal = Number(balance.gold || 0);
        const silverBal = Number(balance.silver || 0);
        
        // Validate gift limits and amounts using security manager
        const metalType = metalId === 1 ? "gold" : "silver";
        const currentBalance = metalId === 1 ? goldBal : silverBal;
        
        try {
          securityManager.validateGiftLimits(quantity, metalType, currentBalance);
        } catch (validationError) {
          throw new Error(validationError.message);
        }

        if (metalId === 1 && goldBal < safeQty) throw new Error("Insufficient gold balance");
        if (metalId === 3 && silverBal < safeQty) throw new Error("Insufficient silver balance");

        // Deduct quantity from sender's balance
        const newBalance = { ...balance };
        if (metalId === 1) {
          newBalance.gold = parseFloat((goldBal - safeQty).toFixed(6));
        } else if (metalId === 3) {
          newBalance.silver = parseFloat((silverBal - safeQty).toFixed(6));
        }

        // Update sender's balance
        tx.update(senderRef, { 
          balance: newBalance,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        const now = admin.firestore.FieldValue.serverTimestamp();
        const giftRef = db.collection("gift_orders").doc();

        const giftDoc = {
          id: giftRef.id,
          status: "pending",
          metal_id: metalId,
          quantity: safeQty,
          greeting: greeting || null,
          created_at: now,
          received_at: null,
          receiver_id: receiverUid,
          sender: {
            uid: senderUid,
            phone: sender.phone || null,
            email: sender.email || null,
            first_name: sender.first_name || null,
            last_name: sender.last_name || null,
          },
          receiver: {
            uid: receiverUid || null,
            phone: phoneE164,
          },
        };

        tx.set(giftRef, giftDoc, { merge: false });

        return { giftId: giftRef.id, receiverUid, deductedAmount: safeQty, metalType: metalId };
      });

      // Enrich receiver nested info
      if (result.receiverUid) {
        const receiverDoc = await db.collection("users").doc(result.receiverUid).get();
        if (receiverDoc.exists) {
          await db.collection("gift_orders").doc(result.giftId).set({
            receiver: {
              uid: result.receiverUid,
              phone: receiverDoc.data().phone || phoneE164,
              email: receiverDoc.data().email || null,
              first_name: receiverDoc.data().first_name || null,
              last_name: receiverDoc.data().last_name || null,
            },
          }, { merge: true });
        }
      }

      // Send SMS notification to receiver
      const senderDoc = await db.collection("users").doc(senderUid).get();
      if (senderDoc.exists) {
        const senderData = senderDoc.data();
        await sendGiftNotificationSMS(
          phoneE164,
          senderData.first_name || senderData.firstName,
          senderData.last_name || senderData.lastName,
          qty,
          metalId,
        );
      }

      // Log successful gift creation with balance deduction
      logger.info("Gift created successfully", {
        giftId: result.giftId,
        senderUid: senderUid,
        receiverPhone: phoneE164,
        quantity: result.deductedAmount,
        metalId: result.metalType,
        balanceDeducted: true,
      });

      // Ledger transaction recording for sender (gold gifts only)
      if (Number(result.metalType) === 1) {
        try {
          const ledgerRef = db.collection("ledger_transactions").doc(String(senderUid));

          await db.runTransaction(async (tx) => {
            const ledgerSnap = await tx.get(ledgerRef);
            const userSnapForLedger = await tx.get(db.collection("users").doc(String(senderUid)));

            const currentGoldBalance = userSnapForLedger.exists ?
              (userSnapForLedger.data().balance?.gold || 0) :
              0;
            const now = admin.firestore.Timestamp.now();
            const giftAmount = -result.deductedAmount;

            if (!ledgerSnap.exists) {
              const calculatedBalance = giftAmount;
              const newTransaction = {
                amount: giftAmount,
                counterpart_uid: String(result.receiverUid),
                created_at: now,
                ref_id: String(result.giftId),
                running_balance: giftAmount,
                type: "gift_sent",
              };

              tx.set(ledgerRef, {
                user_id: String(senderUid),
                balance_gold: currentGoldBalance,
                calculated_balance: calculatedBalance,
                is_balanced: Math.abs(currentGoldBalance - calculatedBalance) < 0.000001,
                transactions: [newTransaction],
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
              });
            } else {
              const ledgerData = ledgerSnap.data();
              const existingTransactions = ledgerData.transactions || [];
              const lastRunningBalance = existingTransactions.length > 0 ?
                existingTransactions[existingTransactions.length - 1].running_balance :
                0;

              const newRunningBalance = parseFloat((lastRunningBalance + giftAmount).toFixed(6));
              const calculatedBalance = parseFloat((existingTransactions.reduce(
                (sum, t) => sum + (t.amount || 0), 0,
              ) + giftAmount).toFixed(6));

              const newTransaction = {
                amount: giftAmount,
                counterpart_uid: String(result.receiverUid),
                created_at: now,
                ref_id: String(result.giftId),
                running_balance: newRunningBalance,
                type: "gift_sent",
              };

              tx.update(ledgerRef, {
                balance_gold: currentGoldBalance,
                calculated_balance: calculatedBalance,
                is_balanced: Math.abs(currentGoldBalance - calculatedBalance) < 0.000001,
                transactions: [...existingTransactions, newTransaction],
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
          });

          logger.info("Ledger transaction recorded for gift_sent", {
            sender_uid: String(senderUid),
            gift_id: String(result.giftId),
            quantity: result.deductedAmount,
          });
        } catch (e) {
          logger.warn("Failed to record ledger transaction for gift_sent", {
            error: e.message,
            gift_id: result.giftId,
            sender_uid: senderUid,
          });
        }
      }

      return res.status(200).json({ status: "pending", gift_id: result.giftId });
    } catch (err) {
      logger.error("createGift error", { message: err.message, stack: err.stack });
      return res.status(400).json({ error: err.message || "Failed to create gift" });
    }
  });
});
