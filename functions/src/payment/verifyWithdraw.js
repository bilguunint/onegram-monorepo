const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const { sendSMS } = require("../services/smsService");
const { roundQty, subQty } = require("../utils/money");

exports.verifyWithdraw = onRequest({
  memory: "1GiB",
  timeoutSeconds: 120,
}, async (req, res) => {
  return cors(req, res, async () => {
    const db = admin.firestore();
    try {
      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      // AuthN: require Firebase ID token
      const authHeader = req.headers.authorization || req.headers.Authorization || "";
      if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: Missing Bearer token" });
      }
      const idToken = authHeader.split(" ")[1];

      let decoded;
      try {
        decoded = await admin.auth().verifyIdToken(idToken);
      } catch (e) {
        logger.warn("Invalid ID token on verifyWithdraw", { message: e.message });
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
      }

      const adminUid = decoded.uid;

      // AuthZ: must be admin in admins collection
      let adminDocSnap = await db.collection("admins").doc(adminUid).get();
      if (!adminDocSnap.exists) {
        const q = await db.collection("admins").where("uid", "==", adminUid).limit(1).get();
        if (!q.empty) adminDocSnap = q.docs[0];
      }
      if (!adminDocSnap.exists) {
        return res.status(403).json({ error: "Forbidden: Not an admin" });
      }
      const adminData = adminDocSnap.data() || {};
      const adminRole = (adminData.role || "").toString().toLowerCase();
      if (!adminRole || !["admin", "superadmin", "owner", "seller"].includes(adminRole)) {
        return res.status(403).json({ error: "Forbidden: Insufficient role" });
      }
      const adminName = adminData.name || decoded.name || decoded.email || "unknown";

      const {
        verificationCode,
        withdrawId,
        withdrawType,
        bankName,
        bankAccountNumber,
        notes,
        attachments,
      } = req.body || {};
      if (!verificationCode || !withdrawId) {
        return res.status(400).json({ error: "Missing required fields: verificationCode, withdrawId" });
      }

      const trimmedBankName = typeof bankName === "string" ? bankName.trim() : "";
      const trimmedBankAccount =
        typeof bankAccountNumber === "string" ? bankAccountNumber.trim() : "";
      const trimmedNotes = typeof notes === "string" ? notes.trim() : "";
      const cleanAttachments = Array.isArray(attachments) ?
        attachments
          .filter((u) => typeof u === "string" && u.startsWith("https://"))
          .slice(0, 10) :
        [];

      const result = await db.runTransaction(async (tx) => {
        // ALL READS MUST BE DONE FIRST BEFORE ANY WRITES
        const withdrawRef = db.collection("withdraws").doc(String(withdrawId));
        
        // Read withdraw document
        const withdrawSnap = await tx.get(withdrawRef);
        if (!withdrawSnap.exists) {
          throw new Error("Withdraw request not found");
        }

        const withdraw = withdrawSnap.data();
        const userId = withdraw.user_id;

        // Read user document
        const userRef = db.collection("users").doc(String(userId));
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists) {
          throw new Error("User not found");
        }

        // Validate withdraw data
        if (!withdraw.quantity || !withdraw.metal_id) {
          throw new Error("Withdraw request missing required fields: quantity or metal_id");
        }

        const qty = Number(withdraw.quantity);
        const safeQty = roundQty(qty);
        const metalId = Number(withdraw.metal_id);
        
        if (safeQty <= 0) {
          throw new Error("Invalid withdraw quantity");
        }
        
        if (![1, 3].includes(metalId)) {
          throw new Error("Invalid metal_id. Must be 1 (gold) or 3 (silver)");
        }

        // Check verification code
        if (withdraw.verificationCode !== verificationCode) {
          throw new Error("Invalid verification code");
        }

        // Check if verification code is already used
        if (withdraw.verificationCodeUsed) {
          throw new Error("Verification code already used");
        }

        // Check if verification code is expired (skip for special admin).
        // For seller role we override the expiration to 15 min from created_at,
        // since the original verificationCodeExpiresAt is 10 min (admin flow).
        const isSpecialAdmin = adminUid === "mOlavOSKiyfGXnEQ0D4ODDIb9eq1";
        if (!isSpecialAdmin) {
          const now = new Date();
          if (adminRole === "seller") {
            const createdAt = withdraw.created_at && withdraw.created_at.toDate ?
              withdraw.created_at.toDate() :
              null;
            if (!createdAt || now.getTime() - createdAt.getTime() > 15 * 60 * 1000) {
              throw new Error("Код идэвхжүүлэх хугацаа дууссан");
            }
          } else {
            const expiresAt = withdraw.verificationCodeExpiresAt && withdraw.verificationCodeExpiresAt.toDate ?
              withdraw.verificationCodeExpiresAt.toDate() :
              null;
            if (!expiresAt || now > expiresAt) {
              throw new Error("Verification code has expired");
            }
          }
        }

        // Check if already verified
        if (withdraw.status === "verified") {
          throw new Error("Withdraw request already verified");
        }

        logger.info("Verifying withdraw request", {
          withdraw_id: String(withdrawId),
          user_id: String(userId),
          quantity: qty,
          metal_id: metalId,
          current_status: withdraw.status,
        });

        // Check user balance
        const userData = userSnap.data();
        const balance = userData.balance || {};
        const goldBalance = Number(balance.gold || 0);
        const silverBalance = Number(balance.silver || 0);

        let currentBalance;
        let metalName;
        
        if (metalId === 1) {
          currentBalance = goldBalance;
          metalName = "gold";
        } else if (metalId === 3) {
          currentBalance = silverBalance;
          metalName = "silver";
        }

        if (currentBalance < safeQty) {
          throw new Error(`Insufficient ${metalName} balance. Available: ${currentBalance}, Requested: ${safeQty}`);
        }

        // NOW START WRITES - Mark withdraw as verified and deduct balance
        const updateData = {
          status: "verified",
          verificationCodeUsed: true,
          verified_at: admin.firestore.FieldValue.serverTimestamp(),
          verified_by_uid: adminUid,
          verified_by_name: adminName,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        };
        
        // Add withdraw_type if provided
        const effectiveWithdrawType = withdrawType ?
          String(withdrawType) :
          (withdraw.withdraw_type ? String(withdraw.withdraw_type) : null);
        if (withdrawType) {
          updateData.withdraw_type = String(withdrawType);
        }

        // sold_to_us: require bank name + account number
        if (effectiveWithdrawType === "sold_to_us") {
          if (!trimmedBankName || !trimmedBankAccount) {
            throw new Error("Bank name and account number are required for sold_to_us");
          }
          updateData.bank_name = trimmedBankName;
          updateData.bank_account_number = trimmedBankAccount;
        }

        // notes (used as тайлбар for taken_physically; also accepted for sold_to_us)
        if (trimmedNotes) {
          updateData.notes = trimmedNotes;
        }

        // attachments
        if (cleanAttachments.length > 0) {
          updateData.attachments = cleanAttachments;
        }

        tx.update(withdrawRef, updateData);

        // Deduct user's balance by metal_id and quantity.
        // Use absolute rounded write (not FieldValue.increment) to avoid IEEE
        // float drift accumulating on the stored balance. Atomicity preserved
        // by surrounding tx; goldBalance/silverBalance read above in same tx.
        const updates = {};
        if (metalId === 1) {
          updates["balance.gold"] = subQty(goldBalance, safeQty);
        } else if (metalId === 3) {
          updates["balance.silver"] = subQty(silverBalance, safeQty);
        }

        if (Object.keys(updates).length > 0) {
          updates.updated_at = admin.firestore.FieldValue.serverTimestamp();
          tx.update(userRef, updates);

          logger.info("User balance deducted", {
            user_id: String(userId),
            metal_id: metalId,
            quantity: safeQty,
            previous_gold: goldBalance,
            previous_silver: silverBalance,
            updates: updates,
          });
        }

        // Audit log
        const auditRef = db.collection("order_admin_logs").doc();
        tx.set(auditRef, {
          withdraw_id: String(withdrawId),
          action: "withdraw",
          admin_uid: adminUid,
          admin_name: adminName,
          user_id: String(userId),
          quantity: qty,
          metal_id: metalId,
          at: admin.firestore.FieldValue.serverTimestamp(),
        });

        return { 
          status: "verified", 
          metal_id: metalId, 
          quantity: safeQty,
          user_id: userId,
          performed_by: adminName,
        };
      });

      // Log final user balance after transaction (for debugging)
      if (result && result.status === "verified") {
        try {
          const finalUserDoc = await db.collection("users").doc(String(result.user_id)).get();
          if (finalUserDoc.exists) {
            const finalBalance = finalUserDoc.data().balance || {};
            logger.info("Final user balance after withdraw verification", {
              user_id: String(result.user_id),
              withdraw_id: String(withdrawId),
              deducted_quantity: result.quantity,
              metal_id: result.metal_id,
              final_gold_balance: finalBalance.gold || 0,
              final_silver_balance: finalBalance.silver || 0,
            });
          }
        } catch (e) {
          logger.warn("Failed to log final balance", { error: e.message });
        }
      }

      // Send FCM notification to user on success (outside transaction)
      if (result && result.status === "verified") {
        try {
          const userDoc = await db.collection("users").doc(String(result.user_id)).get();
          const data = userDoc.exists ? userDoc.data() : {};
          let token = null;
          if (data && typeof data === "object") {
            token = data.fcm_token || (Array.isArray(data.fcm_tokens) ? data.fcm_tokens[0] : null);
          }

          const isGold = Number(result.metal_id) === 1;
          const metalName = isGold ? "алт" : "мөнгө";
          const title = "Авах хүсэлт баталгаажлаа";
          const body = `Таны ${result.quantity} гр ${metalName} авах хүсэлт амжилттай баталгаажлаа.`;

          // Save notification to user's notifications sub-collection
          await db.collection("users").doc(String(result.user_id)).collection("notifications").add({
            title: title,
            body: body,
            type: "withdraw_verified",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            data: {
              withdraw_id: String(withdrawId),
              metal_id: String(result.metal_id),
              quantity: String(result.quantity),
            },
            read: false,
          });

          if (token) {
            await admin.messaging().send({
              token,
              notification: {
                title: title,
                body: body,
              },
              data: {
                type: "withdraw_verified",
                withdraw_id: String(withdrawId),
                metal_id: String(result.metal_id),
                quantity: String(result.quantity),
              },
            });
            logger.info("FCM notification sent for verified withdraw", { withdraw_id: withdrawId, user_id: result.user_id });
          } else {
            logger.info("No FCM token found for user; notification saved to database", { user_id: result.user_id });
          }

          // Send SMS notification to user's phone
          const userPhone = data.phone || data.client_phone;
          if (userPhone) {
            try {
              const smsMessage = `Таны ${result.quantity} гр ${metalName} авах хүсэлт амжилттай баталгаажлаа. Onegram`;
              const smsSent = await sendSMS(userPhone, smsMessage);
              
              if (smsSent) {
                logger.info("SMS notification sent for verified withdraw", { 
                  withdraw_id: withdrawId, 
                  user_id: result.user_id,
                  phone: userPhone, 
                });
              } else {
                logger.warn("Failed to send SMS notification for verified withdraw", { 
                  withdraw_id: withdrawId, 
                  user_id: result.user_id,
                  phone: userPhone, 
                });
              }
            } catch (smsError) {
              logger.error("Error sending SMS notification for verified withdraw", { 
                error: smsError.message,
                withdraw_id: withdrawId, 
                user_id: result.user_id,
                phone: userPhone, 
              });
            }
          } else {
            logger.info("No phone number found for user; SMS notification not sent", { user_id: result.user_id });
          }
        } catch (e) {
          logger.warn("Failed to send FCM notification", { message: e.message, withdraw_id: withdrawId, user_id: result.user_id });
        }
      }

      // Ledger transaction recording (gold withdrawals only)
      if (result && result.status === "verified" && Number(result.metal_id) === 1) {
        try {
          const ledgerRef = db.collection("ledger_transactions").doc(String(result.user_id));

          await db.runTransaction(async (tx) => {
            const ledgerSnap = await tx.get(ledgerRef);
            const userSnapForLedger = await tx.get(db.collection("users").doc(String(result.user_id)));

            const currentGoldBalance = userSnapForLedger.exists ?
              (userSnapForLedger.data().balance?.gold || 0) :
              0;
            const now = admin.firestore.Timestamp.now();
            const withdrawAmount = -result.quantity;

            if (!ledgerSnap.exists) {
              // Create new ledger document
              const calculatedBalance = withdrawAmount;
              const newTransaction = {
                amount: withdrawAmount,
                created_at: now,
                ref_id: String(withdrawId),
                running_balance: withdrawAmount,
                type: "withdraw",
              };

              tx.set(ledgerRef, {
                user_id: String(result.user_id),
                balance_gold: currentGoldBalance,
                calculated_balance: calculatedBalance,
                is_balanced: Math.abs(currentGoldBalance - calculatedBalance) < 0.000001,
                transactions: [newTransaction],
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
              });
            } else {
              // Append new transaction to existing ledger
              const ledgerData = ledgerSnap.data();
              const existingTransactions = ledgerData.transactions || [];
              const lastRunningBalance = existingTransactions.length > 0 ?
                existingTransactions[existingTransactions.length - 1].running_balance :
                0;

              const newRunningBalance = parseFloat((lastRunningBalance + withdrawAmount).toFixed(6));
              const calculatedBalance = parseFloat((existingTransactions.reduce(
                (sum, t) => sum + (t.amount || 0), 0,
              ) + withdrawAmount).toFixed(6));

              const newTransaction = {
                amount: withdrawAmount,
                created_at: now,
                ref_id: String(withdrawId),
                running_balance: newRunningBalance,
                type: "withdraw",
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

          logger.info("Ledger transaction recorded for withdraw", {
            user_id: String(result.user_id),
            withdraw_id: String(withdrawId),
            quantity: result.quantity,
          });
        } catch (e) {
          logger.warn("Failed to record ledger transaction for withdraw", { error: e.message, withdraw_id: withdrawId, user_id: result.user_id });
        }
      }

      return res.status(200).json(result);
    } catch (err) {
      logger.error("Failed to verify withdraw", { error: err.message, stack: err.stack });
      return res.status(400).json({ error: err.message || "Failed to verify withdraw" });
    }
  });
});
