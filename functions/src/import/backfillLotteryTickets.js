/**
 * Backfill lottery tickets for orders verified since April 1, 2026.
 *
 * Usage: RUN_BACKFILL_LOTTERY=true node src/index.js
 *
 * This script:
 * 1. Fetches all gold orders with admin_status "success" and verified_at >= April 1
 * 2. Groups them by user_id
 * 3. Sorts each user's orders chronologically
 * 4. Calls processLotteryTickets for each order in order
 *
 * Safe to re-run: processLotteryTickets tracks total_grams and tickets_issued,
 * so it will not issue duplicate tickets.
 */

const admin = require("firebase-admin");
const { processLotteryTickets } = require("../payment/lotteryService");

module.exports = async function backfillLotteryTickets() {
  const db = admin.firestore();

  // April 1, 2026 00:00:00 UTC+8 (Mongolia timezone)
  const campaignStartDate = new Date("2026-04-01T00:00:00+08:00");

  console.log("=== Lottery Backfill Started ===");
  console.log(`Fetching gold orders verified since ${campaignStartDate.toISOString()}`);

  try {
    // Query all verified gold orders since campaign start
    const ordersSnap = await db.collection("orders")
      .where("admin_status", "==", "success")
      .where("metal_id", "==", 1)
      .where("verified_at", ">=", campaignStartDate)
      .get();

    if (ordersSnap.empty) {
      console.log("No eligible orders found. Done.");
      return;
    }

    console.log(`Found ${ordersSnap.size} verified gold orders since April 1`);

    // Group orders by user_id and sort chronologically
    const ordersByUser = {};
    for (const doc of ordersSnap.docs) {
      const data = doc.data();
      const userId = data.user_id;
      if (!userId) continue;

      const qty = Number(data.quantity);
      if (!qty || qty <= 0) continue;

      if (!ordersByUser[userId]) {
        ordersByUser[userId] = [];
      }

      ordersByUser[userId].push({
        orderId: doc.id,
        quantity: parseFloat(qty.toFixed(6)),
        verified_at: data.verified_at,
      });
    }

    // Sort each user's orders by verified_at
    for (const userId of Object.keys(ordersByUser)) {
      ordersByUser[userId].sort((a, b) => {
        const aTime = a.verified_at?.toMillis ? a.verified_at.toMillis() : 0;
        const bTime = b.verified_at?.toMillis ? b.verified_at.toMillis() : 0;
        return aTime - bTime;
      });
    }

    const userIds = Object.keys(ordersByUser);
    console.log(`Processing ${userIds.length} users...`);

    let totalTicketsIssued = 0;
    let usersProcessed = 0;
    let notificationsSent = 0;

    for (const userId of userIds) {
      const orders = ordersByUser[userId];
      let userTickets = 0;
      const userTicketCodes = [];

      for (const order of orders) {
        try {
          const result = await processLotteryTickets(
            db,
            String(userId),
            String(order.orderId),
            order.quantity,
          );

          if (result.totalNewTickets > 0) {
            userTickets += result.totalNewTickets;
            for (const t of result.tickets) {
              userTicketCodes.push(t.ticketCode);
            }
            console.log(`  [${userId}] Order ${order.orderId}: ${order.quantity}g → ${result.totalNewTickets} ticket(s)`);
          }
        } catch (err) {
          console.error(`  [${userId}] Error processing order ${order.orderId}: ${err.message}`);
        }
      }

      // Send combined notification per user (all tickets at once)
      if (userTickets > 0) {
        try {
          const ticketCodesStr = userTicketCodes.join(", ");
          const title = "Сугалааны дугаар олголоо!";
          const body = `Танд ${userTickets} ширхэг сугалааны дугаар олгогдлоо: ${ticketCodesStr}`;

          // Save in-app notification
          await db.collection("users").doc(String(userId)).collection("notifications").add({
            title,
            body,
            type: "lottery_ticket",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            data: {
              ticket_codes: ticketCodesStr,
              total_tickets: String(userTickets),
              source: "backfill",
            },
            read: false,
          });

          // Send FCM push
          const userDoc = await db.collection("users").doc(String(userId)).get();
          const userData = userDoc.exists ? userDoc.data() : {};
          const token = userData.fcm_token || (Array.isArray(userData.fcm_tokens) ? userData.fcm_tokens[0] : null);

          if (token) {
            await admin.messaging().send({
              token,
              notification: { title, body },
              data: {
                type: "lottery_ticket",
                ticket_codes: ticketCodesStr,
                total_tickets: String(userTickets),
              },
            });
          }

          notificationsSent++;
        } catch (notifErr) {
          console.error(`  [${userId}] Notification error: ${notifErr.message}`);
        }
      }

      usersProcessed++;
      totalTicketsIssued += userTickets;

      if (userTickets > 0) {
        console.log(`  [${userId}] Total: ${orders.length} orders, ${orders.reduce((s, o) => s + o.quantity, 0).toFixed(4)}g → ${userTickets} ticket(s)`);
      }

      // Progress log every 50 users
      if (usersProcessed % 50 === 0) {
        console.log(`  Progress: ${usersProcessed}/${userIds.length} users processed...`);
      }
    }

    console.log("=== Lottery Backfill Complete ===");
    console.log(`Users processed: ${usersProcessed}`);
    console.log(`Total tickets issued: ${totalTicketsIssued}`);
    console.log(`Notifications sent: ${notificationsSent}`);
  } catch (err) {
    console.error("Backfill failed:", err.message);
    throw err;
  }
};
