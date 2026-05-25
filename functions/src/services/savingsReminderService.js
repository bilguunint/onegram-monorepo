const {onSchedule} = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const {logger} = require("firebase-functions");

// Алтаа хуримтлуулах урамшуулалын мессежүүд (title + body)
const SAVINGS_MESSAGES = [
  {
    title: "💰 Алтаа өнөөдрөөс эхэлье",
    body: "Өнөөдөр багахан алт нэмж ирээдүйдээ том хөрөнгө оруулалт хийе.",
  },
  {
    title: "🌟 Өдөр бүр бага багаар",
    body: "Бага багаар хуримтлуулбал том дүн болно.",
  },
  {
    title: "📈 Алт үнэ цэнтэй хэвээр",
    body: "Алт цаг хугацаанд үнэ цэнээ алддаггүй. Одоо эхлэхэд яг тохиромжтой.",
  },
  {
    title: "💎 Ирээдүйгээ бэлд",
    body: "Маргаашийн хэрэгцээндээ өнөөдөр алт хуримтлуулаарай.",
  },
  {
    title: "🎯 Зорилгодоо ойрт",
    body: "Өнөөдөр алт нэмэх нь зорилгодоо нэг алхам ойртоно гэсэн үг.",
  },
  {
    title: "🔐 Найдвартай хадгаламж",
    body: "Алт бол эрсдэл багатай, найдвартай сонголт.",
  },
  {
    title: "⭐ Багаас эхэл",
    body: "Их мөнгө хэрэггүй. Багаас эхлэхэд л болно.",
  },
  {
    title: "💪 Өөртөө хөрөнгө оруул",
    body: "Өнөөдрийн шийдвэр маргаашийн тайван амьдрал.",
  },
  {
    title: "🎁 Өөртөө бэлэг барь",
    body: "Өнөөдөр өөрийгөө шагнаж хуримтлалаа нэмээрэй.",
  },
];

// Сарын эцсийн өдрийг олох функц
function getLastDayOfMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Өнөөдөр notification илгээх өдөр эсэхийг шалгах
function shouldSendNotification(now) {
  const day = now.getDate();
  const lastDay = getLastDayOfMonth(now.getFullYear(), now.getMonth());
  
  // 5, 15, 19, 20, болон сарын сүүлчийн өдөр
  return day === 5 || day === 15 || day === 20 || day === lastDay;
}

// Random мессеж сонгох
function getRandomMessage() {
  const randomIndex = Math.floor(Math.random() * SAVINGS_MESSAGES.length);
  return SAVINGS_MESSAGES[randomIndex];
}

// Бүх хэрэглэгчдэд notification илгээх
async function sendSavingsReminders() {
  const db = admin.firestore();
  
  try {
    logger.info("Starting savings reminder service...");
    
    const now = new Date();
    
    // Өнөөдөр notification илгээх өдөр эсэхийг шалгах
    if (!shouldSendNotification(now)) {
      logger.info("Not a scheduled notification day, skipping...");
      return {success: true, message: "Not a scheduled day"};
    }
    
    logger.info(`Today is a scheduled notification day (day ${now.getDate()})`);
    
    // Random мессеж сонгох
    const message = getRandomMessage();
    const title = message.title;
    const body = message.body;
    
    logger.info("Selected message:", {title, body});
    
    // Бүх хэрэглэгчдийг авах
    const usersSnapshot = await db.collection("users").get();
    
    logger.info(`Found ${usersSnapshot.size} users`);
    
    let sentCount = 0;
    let savedCount = 0;
    let batchCount = 0;
    let currentBatch = db.batch();
    const fcmMessages = [];
    const BATCH_SIZE = 400; // Firestore batch limit 500, бага buffer үлдээе
    const FCM_BATCH_SIZE = 500; // FCM batch limit
    
    for (let i = 0; i < usersSnapshot.docs.length; i++) {
      const userDoc = usersSnapshot.docs[i];
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      // FCM token авах
      const fcmToken = userData.fcm_token || 
                      (Array.isArray(userData.fcm_tokens) ? userData.fcm_tokens[0] : null);
      
      // Notification-г database-д хадгалах
      const notificationRef = db
        .collection("users")
        .doc(userId)
        .collection("notifications")
        .doc();
      
      currentBatch.set(notificationRef, {
        title: title,
        body: body,
        type: "savings_reminder",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      });
      savedCount++;
      
      // FCM token байвал notification илгээх
      if (fcmToken) {
        fcmMessages.push({
          token: fcmToken,
          notification: {
            title: title,
            body: body,
          },
          data: {
            type: "savings_reminder",
            timestamp: new Date().toISOString(),
          },
          android: {
            notification: {
              icon: "ic_notification",
              color: "#FFD700",
              sound: "default",
            },
            priority: "high",
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
                badge: 1,
              },
            },
          },
        });
      }
      
      // Batch хэмжээ хэтрэвэл commit хийх
      if ((i + 1) % BATCH_SIZE === 0 || i === usersSnapshot.docs.length - 1) {
        await currentBatch.commit();
        batchCount++;
        logger.info(`Committed batch ${batchCount}, saved ${savedCount} notifications so far`);
        currentBatch = db.batch(); // Шинэ batch эхлүүлэх
      }
    }
    
    logger.info(`Saved ${savedCount} notifications to database in ${batchCount} batches`);
    
    // FCM notification илгээх (batch-аар)
    if (fcmMessages.length > 0) {
      for (let i = 0; i < fcmMessages.length; i += FCM_BATCH_SIZE) {
        const messageBatch = fcmMessages.slice(i, i + FCM_BATCH_SIZE);
        try {
          const response = await admin.messaging().sendEach(messageBatch);
          sentCount += response.successCount;
          
          logger.info(`FCM batch ${Math.floor(i / FCM_BATCH_SIZE) + 1}: sent ${response.successCount}/${messageBatch.length}`);
          
          if (response.failureCount > 0) {
            logger.warn(`Failed to send ${response.failureCount} notifications in FCM batch ${Math.floor(i / FCM_BATCH_SIZE) + 1}`);
          }
        } catch (error) {
          logger.error(`Error sending FCM batch ${Math.floor(i / FCM_BATCH_SIZE) + 1}:`, error);
        }
      }
    }
    
    logger.info("Savings reminders sent successfully", {
      totalUsers: usersSnapshot.size,
      savedToDb: savedCount,
      fcmSent: sentCount,
      title: title,
      body: body,
    });
    
    return {
      success: true,
      totalUsers: usersSnapshot.size,
      savedToDb: savedCount,
      fcmSent: sentCount,
      title: title,
      body: body,
    };
  } catch (error) {
    logger.error("Error sending savings reminders:", error);
    throw error;
  }
}

// Scheduled function - өдөр бүр 22:10 цагт ажиллана (UTC+8 timezone)
// Cron format: минут цаг * * *
// "10 22 * * *" = Өдөр бүр 22:10 PM (10:10 PM) цагт
const sendSavingsRemindersScheduled = onSchedule({
  schedule: "00 15 * * *", // Өдөр бүр 15:00 PM (3:00 PM) цагт ажиллана
  timeZone: "Asia/Ulaanbaatar", // Улаанбаатарын цагийн бүс
  memory: "1GiB",
  timeoutSeconds: 540, // 9 minutes max timeout
  maxInstances: 1,
}, async (event) => {
  return await sendSavingsReminders();
});

module.exports = {
  sendSavingsRemindersScheduled,
  sendSavingsReminders, // Manual trigger-ийн хувьд
};
