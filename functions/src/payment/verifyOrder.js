const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const { processLotteryTickets } = require("./lotteryService");
const { roundQty, addQty } = require("../utils/money");

exports.verifyOrder = onRequest({
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
        logger.warn("Invalid ID token on verifyOrder", { message: e.message });
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
      if (!adminRole || !["admin", "superadmin", "owner"].includes(adminRole)) {
        return res.status(403).json({ error: "Forbidden: Insufficient role" });
      }
      const adminName = adminData.name || decoded.name || decoded.email || "unknown";

      const { user_id, order_id, is_extraOrder, description } = req.body || {};
      if (!user_id || !order_id) {
        return res.status(400).json({ error: "Missing required fields: user_id, order_id" });
      }

      const result = await db.runTransaction(async (tx) => {
        // ALL READS MUST BE DONE FIRST BEFORE ANY WRITES
        const orderRef = db.collection("orders").doc(String(order_id));
        const userRef = db.collection("users").doc(String(user_id));
        
        // Read order document
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists) {
          throw new Error("Order not found");
        }

        // Read user document
        const userSnap = await tx.get(userRef);

        const order = orderSnap.data();
        if (order.user_id && order.user_id !== user_id) {
          throw new Error("Order does not belong to provided user_id");
        }

        // Validate order data
        if (!order.quantity || !order.metal_id) {
          throw new Error("Order missing required fields: quantity or metal_id");
        }

        const qty = Number(order.quantity);
        const safeQty = roundQty(qty);
        const metalId = Number(order.metal_id);
        
        if (safeQty <= 0) {
          throw new Error("Invalid order quantity");
        }
        
        if (![1, 3].includes(metalId)) {
          throw new Error("Invalid metal_id. Must be 1 (gold) or 3 (silver)");
        }

        logger.info("Verifying order", {
          order_id: String(order_id),
          user_id: String(user_id),
          quantity: safeQty,
          metal_id: metalId,
          current_status: order.admin_status,
        });

        if (order.admin_status === "success") {
          // already verified; still ensure audit trail exists
          const auditRef = db.collection("order_admin_logs").doc();
          tx.set(auditRef, {
            order_id: String(order_id),
            action: "verify",
            admin_uid: adminUid,
            admin_name: adminName,
            at: admin.firestore.FieldValue.serverTimestamp(),
            note: "re-verify call on already verified order",
          });
          // Update optional fields if provided
          const extraUpdates = {};
          if (is_extraOrder !== undefined) extraUpdates.is_extraOrder = Boolean(is_extraOrder);
          if (description !== undefined && description !== null) extraUpdates.description = String(description);
          if (Object.keys(extraUpdates).length > 0) {
            tx.update(orderRef, extraUpdates);
          }
          return { status: "already_verified", performed_by: adminName };
        }

        // NOW START WRITES - Mark admin_status success + who verified + payment_status success
        const orderUpdate = {
          admin_status: "success",
          payment_status: "success",
          verified_at: admin.firestore.FieldValue.serverTimestamp(),
          verified_by_uid: adminUid,
          verified_by_name: adminName,
        };
        if (is_extraOrder !== undefined) orderUpdate.is_extraOrder = Boolean(is_extraOrder);
        if (description !== undefined && description !== null) orderUpdate.description = String(description);
        tx.update(orderRef, orderUpdate);

        // Update user's nested balance by metal_id and quantity
        // Check if user document exists, create if not
        if (!userSnap.exists) {
          // Create user document with initial balance
          const initialBalance = {
            gold: metalId === 1 ? safeQty : 0,
            silver: metalId === 3 ? safeQty : 0,
          };

          tx.set(userRef, {
            balance: initialBalance,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          });

          logger.info("Created new user with initial balance", {
            user_id: String(user_id),
            metal_id: metalId,
            quantity: safeQty,
            initial_balance: initialBalance,
          });
        } else {
          // User exists. Read current balance (already loaded in userSnap from earlier
          // read in this transaction) and write absolute rounded value to avoid IEEE
          // float drift. Atomicity is guaranteed by the surrounding tx.
          const currentBalance = userSnap.data().balance || {};
          const currentGold = Number(currentBalance.gold || 0);
          const currentSilver = Number(currentBalance.silver || 0);

          const updates = {};
          if (metalId === 1) {
            updates["balance.gold"] = addQty(currentGold, safeQty);
          } else if (metalId === 3) {
            updates["balance.silver"] = addQty(currentSilver, safeQty);
          }

          if (Object.keys(updates).length > 0) {
            updates.updated_at = admin.firestore.FieldValue.serverTimestamp();
            tx.update(userRef, updates);

            logger.info("User balance updated", {
              user_id: String(user_id),
              metal_id: metalId,
              quantity: safeQty,
              previous_gold: currentGold,
              previous_silver: currentSilver,
              updates: updates,
            });
          }
        }

        // Audit log
        const auditRef = db.collection("order_admin_logs").doc();
        tx.set(auditRef, {
          order_id: String(order_id),
          action: "verify",
          admin_uid: adminUid,
          admin_name: adminName,
          at: admin.firestore.FieldValue.serverTimestamp(),
        });

        return { status: "verified", metal_id: metalId, qty: safeQty, performed_by: adminName };
      });

      // Log final user balance after transaction (for debugging)
      if (result && result.status === "verified") {
        try {
          const finalUserDoc = await db.collection("users").doc(String(user_id)).get();
          if (finalUserDoc.exists) {
            const finalBalance = finalUserDoc.data().balance || {};
            logger.info("Final user balance after verification", {
              user_id: String(user_id),
              order_id: String(order_id),
              added_quantity: result.qty,
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
          const userDoc = await db.collection("users").doc(String(user_id)).get();
          const data = userDoc.exists ? userDoc.data() : {};
          let token = null;
          if (data && typeof data === "object") {
            token = data.fcm_token || (Array.isArray(data.fcm_tokens) ? data.fcm_tokens[0] : null);
          }

          const isGold = Number(result.metal_id) === 1;
          const title = "Захиалга баталгаажлаа";
          const body = `Таны ${result.qty} гр ${isGold ? "алтны" : "мөнгөний"} худалдан авалт амжилттай баталгаажлаа.`;

          // Save notification to user's notifications sub-collection
          await db.collection("users").doc(String(user_id)).collection("notifications").add({
            title: title,
            body: body,
            type: "order_verified",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            data: {
              order_id: String(order_id),
              metal_id: String(result.metal_id),
              quantity: String(result.qty),
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
                type: "order_verified",
                order_id: String(order_id),
                metal_id: String(result.metal_id),
                quantity: String(result.qty),
              },
            });
            logger.info("FCM notification sent for verified order", { order_id, user_id });
          } else {
            logger.info("No FCM token found for user; notification saved to database", { user_id });
          }
        } catch (e) {
          logger.warn("Failed to send FCM notification", { message: e.message, order_id, user_id });
        }
      }

      // Ledger transaction recording (gold orders only)
      if (result && result.status === "verified" && Number(result.metal_id) === 1) {
        try {
          const ledgerRef = db.collection("ledger_transactions").doc(String(user_id));

          await db.runTransaction(async (tx) => {
            const ledgerSnap = await tx.get(ledgerRef);
            const userSnapForLedger = await tx.get(db.collection("users").doc(String(user_id)));

            const currentGoldBalance = userSnapForLedger.exists ?
              (userSnapForLedger.data().balance?.gold || 0) :
              0;
            const now = admin.firestore.Timestamp.now();

            if (!ledgerSnap.exists) {
              // Create new ledger document
              const calculatedBalance = result.qty;
              const newTransaction = {
                amount: result.qty,
                created_at: now,
                ref_id: String(order_id),
                running_balance: result.qty,
                type: "order",
              };

              tx.set(ledgerRef, {
                user_id: String(user_id),
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

              const newRunningBalance = parseFloat((lastRunningBalance + result.qty).toFixed(6));
              const calculatedBalance = parseFloat((existingTransactions.reduce(
                (sum, t) => sum + (t.amount || 0), 0,
              ) + result.qty).toFixed(6));

              const newTransaction = {
                amount: result.qty,
                created_at: now,
                ref_id: String(order_id),
                running_balance: newRunningBalance,
                type: "order",
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

          logger.info("Ledger transaction recorded", {
            user_id: String(user_id),
            order_id: String(order_id),
            qty: result.qty,
          });
        } catch (e) {
          logger.warn("Failed to record ledger transaction", { error: e.message, order_id, user_id });
        }
      }

      // On-chain mirror (ONEGRAM token). Gold only — ONEGRAM is gold-backed.
      // Defaults to SHADOW mode (logs only, no broadcast, no ethers needed), so
      // this never touches the live system until CHAIN_SHADOW_MODE=false. The
      // Firestore balance + ledger above are the source of truth regardless;
      // a chain error here is logged and swallowed.
      if (result && result.status === "verified" && Number(result.metal_id) === 1) {
        try {
          const chain = require("../blockchain/tokenService");
          const chainResult = await chain.recordMint(String(user_id), result.qty, {
            source: "verifyOrder",
            order_id: String(order_id),
          });
          logger.info("Chain mint recorded", {
            user_id: String(user_id),
            order_id: String(order_id),
            qty: result.qty,
            ...chainResult,
          });
        } catch (e) {
          logger.warn("Chain mint skipped (production unaffected)", {
            error: e.message,
            order_id: String(order_id),
            user_id: String(user_id),
          });
        }
      }

      // Lottery ticket allocation for gold orders
      if (result && result.status === "verified" && Number(result.metal_id) === 1) {
        try {
          const lotteryResult = await processLotteryTickets(
            db,
            String(user_id),
            String(order_id),
            result.qty,
          );
          if (lotteryResult.totalNewTickets > 0) {
            result.lottery = lotteryResult;

            // Send lottery notification to user
            try {
              const userDoc = await db.collection("users").doc(String(user_id)).get();
              const data = userDoc.exists ? userDoc.data() : {};
              let token = null;
              if (data && typeof data === "object") {
                token = data.fcm_token || (Array.isArray(data.fcm_tokens) ? data.fcm_tokens[0] : null);
              }

              const ticketCodes = lotteryResult.tickets.map((t) => t.ticketCode).join(", ");
              const lotteryTitle = "Сугалааны дугаар олголоо!";
              const lotteryBody = `Танд ${lotteryResult.totalNewTickets} ширхэг сугалааны дугаар олгогдлоо: ${ticketCodes}`;

              await db.collection("users").doc(String(user_id)).collection("notifications").add({
                title: lotteryTitle,
                body: lotteryBody,
                type: "lottery_ticket",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                data: {
                  order_id: String(order_id),
                  ticket_codes: ticketCodes,
                  total_tickets: String(lotteryResult.totalNewTickets),
                },
                read: false,
              });

              if (token) {
                await admin.messaging().send({
                  token,
                  notification: { title: lotteryTitle, body: lotteryBody },
                  data: {
                    type: "lottery_ticket",
                    order_id: String(order_id),
                    ticket_codes: ticketCodes,
                    total_tickets: String(lotteryResult.totalNewTickets),
                  },
                });
              }
            } catch (notifErr) {
              logger.warn("Failed to send lottery notification", {
                error: notifErr.message,
                user_id,
                order_id,
              });
            }
          }
        } catch (e) {
          logger.warn("Failed to process lottery tickets", { error: e.message, order_id, user_id });
        }
      }

      return res.status(200).json(result);
    } catch (err) {
      logger.error("Failed to verify order", { error: err.message, stack: err.stack });
      return res.status(400).json({ error: err.message || "Failed to verify order" });
    }
  });
});
