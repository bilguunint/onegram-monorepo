const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

exports.acceptGift = onRequest(
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
      const { gift_id, token } = body;

      // Basic validations
      if (!gift_id) {
        return res.status(400).json({ error: "Missing gift_id" });
      }
      if (!token) {
        return res.status(400).json({ error: "Missing token" });
      }

      // Auth user
      let decoded;
      try {
        decoded = await admin.auth().verifyIdToken(token);
      } catch (e) {
        return res.status(401).json({ error: "Invalid token" });
      }
      const userUid = decoded.uid;

      // Transaction: accept gift and add balance to receiver
      const result = await db.runTransaction(async (tx) => {
        const giftRef = db.collection("gift_orders").doc(gift_id);
        const giftSnap = await tx.get(giftRef);
        
        if (!giftSnap.exists) {
          throw new Error("Gift order not found");
        }

        const giftData = giftSnap.data();
        
        // Check if user is the receiver
        if (giftData.receiver.uid !== userUid) {
          throw new Error("Unauthorized: Only receiver can accept gift");
        }

        // Check gift status - only pending gifts can be accepted
        if (giftData.status === "received") {
          throw new Error("Gift has already been received");
        }
        if (giftData.status === "cancelled") {
          throw new Error("Cannot accept cancelled gift");
        }
        if (giftData.status !== "pending") {
          throw new Error(`Cannot accept gift with status: ${giftData.status}`);
        }
        
        // Additional security checks
        if (giftData.quantity <= 0) {
          throw new Error("Invalid gift amount");
        }
        if (!giftData.metal_id || ![1, 3].includes(giftData.metal_id)) {
          throw new Error("Invalid metal type");
        }
        if (giftData.created_at && 
            new Date() - new Date(giftData.created_at.toDate()) > 30 * 24 * 60 * 60 * 1000) {
          throw new Error("Gift has expired (30 days limit)");
        }

        // Get receiver's current balance
        const receiverRef = db.collection("users").doc(userUid);
        const receiverSnap = await tx.get(receiverRef);
        
        if (!receiverSnap.exists) {
          throw new Error("Receiver not found");
        }

        const receiver = receiverSnap.data();
        const balance = receiver.balance || {};
        const metalId = giftData.metal_id;
        const quantity = giftData.quantity;
        const safeQty = parseFloat(Number(quantity).toFixed(6));

        // Add balance to receiver
        const newBalance = { ...balance };
        if (metalId === 1) {
          newBalance.gold = parseFloat((Number(balance.gold || 0) + safeQty).toFixed(6));
        } else if (metalId === 3) {
          newBalance.silver = parseFloat((Number(balance.silver || 0) + safeQty).toFixed(6));
        }

        // Update gift status to received
        tx.update(giftRef, {
          status: "received",
          received_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Add balance to receiver
        tx.update(receiverRef, {
          balance: newBalance,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
          giftId: gift_id,
          metalId: metalId,
          quantity: safeQty,
          newBalance: newBalance,
          senderUid: giftData.sender.uid || null,
          senderName: `${giftData.sender.first_name || ""} ${giftData.sender.last_name || ""}`.trim(),
          greeting: giftData.greeting,
        };
      });

      // Log successful acceptance
      logger.info("Gift accepted successfully", {
        giftId: result.giftId,
        receiverUid: userUid,
        quantity: result.quantity,
        metalId: result.metalId,
        newBalance: result.newBalance,
        senderName: result.senderName,
      });

      // Ledger transaction recording for receiver (gold gifts only)
      if (Number(result.metalId) === 1) {
        try {
          const ledgerRef = db.collection("ledger_transactions").doc(String(userUid));

          await db.runTransaction(async (tx) => {
            const ledgerSnap = await tx.get(ledgerRef);
            const userSnapForLedger = await tx.get(db.collection("users").doc(String(userUid)));

            const currentGoldBalance = userSnapForLedger.exists ?
              (userSnapForLedger.data().balance?.gold || 0) :
              0;
            const now = admin.firestore.Timestamp.now();
            const giftAmount = result.quantity;

            if (!ledgerSnap.exists) {
              const newTransaction = {
                amount: giftAmount,
                counterpart_uid: result.senderUid ? String(result.senderUid) : null,
                created_at: now,
                ref_id: String(result.giftId),
                running_balance: giftAmount,
                type: "gift_received",
              };

              tx.set(ledgerRef, {
                user_id: String(userUid),
                balance_gold: currentGoldBalance,
                calculated_balance: giftAmount,
                is_balanced: Math.abs(currentGoldBalance - giftAmount) < 0.000001,
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
                counterpart_uid: result.senderUid ? String(result.senderUid) : null,
                created_at: now,
                ref_id: String(result.giftId),
                running_balance: newRunningBalance,
                type: "gift_received",
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

          logger.info("Ledger transaction recorded for gift_received", {
            receiver_uid: String(userUid),
            gift_id: String(result.giftId),
            quantity: result.quantity,
          });
        } catch (e) {
          logger.warn("Failed to record ledger transaction for gift_received", {
            error: e.message,
            gift_id: result.giftId,
            receiver_uid: userUid,
          });
        }
      }

      return res.status(200).json({
        status: "received",
        gift_id: result.giftId,
        quantity: result.quantity,
        metal_id: result.metalId,
        sender_name: result.senderName,
        greeting: result.greeting,
        new_balance: result.newBalance,
        message: "Gift received successfully",
      });
    } catch (err) {
      logger.error("acceptGift error", { 
        message: err.message, 
        stack: err.stack,
        giftId: req.body && req.body.gift_id,
      });
      return res.status(400).json({ error: err.message || "Failed to accept gift" });
    }
  });
});
