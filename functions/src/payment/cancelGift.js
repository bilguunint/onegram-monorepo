const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

exports.cancelGift = onRequest({
  memory: "1GiB",
  timeoutSeconds: 60,
  maxInstances: 10,
}, async (req, res) => {
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

      // Transaction: cancel gift and restore balance
      const result = await db.runTransaction(async (tx) => {
        const giftRef = db.collection("gift_orders").doc(gift_id);
        const giftSnap = await tx.get(giftRef);
        
        if (!giftSnap.exists) {
          throw new Error("Gift order not found");
        }

        const giftData = giftSnap.data();
        
        // Check if user is the sender
        if (giftData.sender.uid !== userUid) {
          throw new Error("Unauthorized: Only sender can cancel gift");
        }

        // Check gift status - only pending gifts can be cancelled
        if (giftData.status === "cancelled") {
          throw new Error("Gift is already cancelled");
        }
        if (giftData.status === "received") {
          throw new Error("Cannot cancel gift that has been received");
        }
        if (giftData.status !== "pending") {
          throw new Error(`Cannot cancel gift with status: ${giftData.status}`);
        }
        
        // Additional security checks
        if (giftData.quantity <= 0) {
          throw new Error("Invalid gift amount");
        }
        if (!giftData.metal_id || ![1, 3].includes(giftData.metal_id)) {
          throw new Error("Invalid metal type");
        }

        // Get sender's current balance
        const senderRef = db.collection("users").doc(userUid);
        const senderSnap = await tx.get(senderRef);
        
        if (!senderSnap.exists) {
          throw new Error("Sender not found");
        }

        const sender = senderSnap.data();
        const balance = sender.balance || {};
        const metalId = giftData.metal_id;
        const quantity = giftData.quantity;
        const safeQty = parseFloat(Number(quantity).toFixed(6));

        // Restore balance to sender
        const newBalance = { ...balance };
        if (metalId === 1) {
          newBalance.gold = parseFloat((Number(balance.gold || 0) + safeQty).toFixed(6));
        } else if (metalId === 3) {
          newBalance.silver = parseFloat((Number(balance.silver || 0) + safeQty).toFixed(6));
        }

        // Update gift status to cancelled
        tx.update(giftRef, {
          status: "cancelled",
          cancelled_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Restore sender's balance
        tx.update(senderRef, {
          balance: newBalance,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
          giftId: gift_id,
          metalId: metalId,
          quantity: safeQty,
          restoredBalance: newBalance,
        };
      });

      // Log successful cancellation
      logger.info("Gift cancelled successfully", {
        giftId: result.giftId,
        senderUid: userUid,
        quantity: result.quantity,
        metalId: result.metalId,
        restoredBalance: result.restoredBalance,
      });

      // Ledger transaction recording for sender (gold gifts only)
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
            const cancelAmount = result.quantity; // positive: balance restored to sender

            if (!ledgerSnap.exists) {
              const newTransaction = {
                amount: cancelAmount,
                created_at: now,
                ref_id: String(result.giftId),
                running_balance: cancelAmount,
                type: "gift_cancelled",
              };

              tx.set(ledgerRef, {
                user_id: String(userUid),
                balance_gold: currentGoldBalance,
                calculated_balance: cancelAmount,
                is_balanced: Math.abs(currentGoldBalance - cancelAmount) < 0.000001,
                transactions: [newTransaction],
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
              });
            } else {
              const ledgerData = ledgerSnap.data();
              const existingTransactions = ledgerData.transactions || [];
              const lastRunningBalance = existingTransactions.length > 0 ?
                existingTransactions[existingTransactions.length - 1].running_balance :
                0;

              const newRunningBalance = parseFloat((lastRunningBalance + cancelAmount).toFixed(6));
              const calculatedBalance = parseFloat((existingTransactions.reduce(
                (sum, t) => sum + (t.amount || 0), 0,
              ) + cancelAmount).toFixed(6));

              const newTransaction = {
                amount: cancelAmount,
                created_at: now,
                ref_id: String(result.giftId),
                running_balance: newRunningBalance,
                type: "gift_cancelled",
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

          logger.info("Ledger transaction recorded for gift_cancelled", {
            sender_uid: String(userUid),
            gift_id: String(result.giftId),
            quantity: result.quantity,
          });
        } catch (e) {
          logger.warn("Failed to record ledger transaction for gift_cancelled", {
            error: e.message,
            gift_id: result.giftId,
            sender_uid: userUid,
          });
        }
      }

      return res.status(200).json({
        status: "cancelled",
        gift_id: result.giftId,
        message: "Gift cancelled successfully and balance restored",
      });
    } catch (err) {
      logger.error("cancelGift error", { 
        message: err.message, 
        stack: err.stack,
        giftId: req.body && req.body.gift_id,
      });
      return res.status(400).json({ error: err.message || "Failed to cancel gift" });
    }
  });
});
