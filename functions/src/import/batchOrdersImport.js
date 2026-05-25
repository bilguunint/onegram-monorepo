const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const db = admin.firestore();

// Orders JSON файл унших
const orders = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../../orders_deposit_success.json"),
    "utf8",
  ),
);

async function runImportOrders() {
  console.log(`🔁 Total orders to import: ${orders.length}`);

  for (const order of orders) {
    const uid = `user_${order.user_id}`;
    const orderId = `${order.id}`;

    try {
      if (!order.user_id || !order.created_at) {
        console.warn(`⚠️ Skipping invalid order ${orderId}`);
        continue;
      }

      const orderRef = db.collection("orders").doc(orderId);

      await orderRef.set({
        id: orderId,
        user_id: uid, // глобал collection тул аль хэрэглэгчийнх болохоо хадгална
        amount: order.amount,
        price: order.price,
        quantity: order.quantity,
        metal_id: order.metal_id,
        payment_status: order.status,
        admin_status: order.admin_status,
        type: order.type,
        prod_type: order.prod_type,
        created_at: new Date(order.created_at),
        client: {
          phone: order.client_phone,
          email: order.client_email,
          first_name: order.client_first_name,
          last_name: order.client_last_name,
        },
        qpay_description: order.qpay_description,
      });

      console.log(`✅ Order ${orderId} imported to global collection for ${uid}`);
    } catch (error) {
      console.error(`❌ Failed to import order ${orderId}: ${error.message}`);
    }
  }

  console.log("🎉 Order import finished.");
}

module.exports = runImportOrders;
