const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {logger} = require("firebase-functions");
const cors = require("cors")({origin: true});

const db = admin.firestore();

/**
 * Custom Notification Service
 *
 * Бүх хэрэглэгч эсвэл сонгосон хэрэглэгчдэд push notification илгээх.
 *
 * @example Бүх хэрэглэгчдэд илгээх
 * POST /sendCustomNotification
 * {
 *   "title": "🎉 Шинэ мэдээлэл",
 *   "body": "Манай аппд шинэ боломж нэмэгдлээ!",
 *   "type": "promotion"
 * }
 *
 * @example Тодорхой хэрэглэгчдэд илгээх
 * POST /sendCustomNotification
 * {
 *   "title": "🎁 Тусгай урамшуулал",
 *   "body": "Танд зориулсан тусгай санал!",
 *   "type": "custom",
 *   "userIds": ["uid1", "uid2", "uid3"]
 * }
 */
const sendCustomNotification = onRequest(
  {
    memory: "1GiB",
    timeoutSeconds: 540,
    maxInstances: 1,
  },
  async (req, res) => {
    return cors(req, res, async () => {
      try {
        if (req.method !== "POST") {
          return res.status(405).json({
            error: "Method Not Allowed",
            message: "Only POST requests are allowed",
          });
        }

        const body = req.body || {};
        const {title, body: notifBody, type, userIds} = body;

        // Validation
        if (!title || typeof title !== "string") {
          return res.status(400).json({error: "Missing or invalid field: title"});
        }

        if (!notifBody || typeof notifBody !== "string") {
          return res.status(400).json({error: "Missing or invalid field: body"});
        }

        const notificationType = type || "custom";

        logger.info("Starting custom notification service...", {
          title,
          body: notifBody,
          type: notificationType,
          targetUsers: userIds ? userIds.length : "all",
        });

        // Хэрэглэгчдийг авах
        let userDocs;
        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
          // Сонгосон хэрэглэгчдийг авах (Firestore in query 30-н лимиттэй)
          const chunks = [];
          for (let i = 0; i < userIds.length; i += 30) {
            chunks.push(userIds.slice(i, i + 30));
          }
          userDocs = [];
          for (const chunk of chunks) {
            const snapshot = await db
              .collection("users")
              .where(admin.firestore.FieldPath.documentId(), "in", chunk)
              .get();
            userDocs.push(...snapshot.docs);
          }
        } else {
          // Бүх хэрэглэгчдийг авах
          const snapshot = await db.collection("users").get();
          userDocs = snapshot.docs;
        }

        logger.info(`Found ${userDocs.length} users`);

        if (userDocs.length === 0) {
          return res.status(404).json({
            error: "No users found",
            message: userIds ? "None of the specified user IDs were found" : "No users in the database",
          });
        }

        let savedCount = 0;
        let sentCount = 0;
        let failedCount = 0;
        let batchCount = 0;
        let currentBatch = db.batch();
        const fcmMessages = [];
        const BATCH_SIZE = 400;
        const FCM_BATCH_SIZE = 500;

        for (let i = 0; i < userDocs.length; i++) {
          const userDoc = userDocs[i];
          const userId = userDoc.id;
          const userData = userDoc.data();

          // FCM token авах
          const fcmToken =
            userData.fcm_token ||
            (Array.isArray(userData.fcm_tokens) ? userData.fcm_tokens[0] : null);

          // Notification-г database-д хадгалах
          const notificationRef = db
            .collection("users")
            .doc(userId)
            .collection("notifications")
            .doc();

          currentBatch.set(notificationRef, {
            title: title,
            body: notifBody,
            type: notificationType,
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
                body: notifBody,
              },
              data: {
                type: notificationType,
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
          if ((i + 1) % BATCH_SIZE === 0 || i === userDocs.length - 1) {
            await currentBatch.commit();
            batchCount++;
            logger.info(
              `Committed batch ${batchCount}, saved ${savedCount} notifications so far`,
            );
            currentBatch = db.batch();
          }
        }

        logger.info(
          `Saved ${savedCount} notifications to database in ${batchCount} batches`,
        );

        // FCM notification илгээх (batch-аар)
        if (fcmMessages.length > 0) {
          for (let i = 0; i < fcmMessages.length; i += FCM_BATCH_SIZE) {
            const messageBatch = fcmMessages.slice(i, i + FCM_BATCH_SIZE);
            try {
              const response = await admin.messaging().sendEach(messageBatch);
              sentCount += response.successCount;
              failedCount += response.failureCount;

              logger.info(
                `FCM batch ${Math.floor(i / FCM_BATCH_SIZE) + 1}: sent ${response.successCount}/${messageBatch.length}`,
              );

              if (response.failureCount > 0) {
                logger.warn(
                  `Failed to send ${response.failureCount} notifications in FCM batch ${Math.floor(i / FCM_BATCH_SIZE) + 1}`,
                );
              }
            } catch (error) {
              logger.error(
                `Error sending FCM batch ${Math.floor(i / FCM_BATCH_SIZE) + 1}:`,
                error,
              );
            }
          }
        }

        const noTokenCount = userDocs.length - fcmMessages.length;

        const result = {
          success: true,
          totalUsers: userDocs.length,
          savedToDb: savedCount,
          fcmSent: sentCount,
          fcmFailed: failedCount,
          noFcmToken: noTokenCount,
          title: title,
          body: notifBody,
          type: notificationType,
        };

        // custom-notifications collection-д хадгалах
        await db.collection("custom-notifications").add({
          title: title,
          body: notifBody,
          type: notificationType,
          targetType: userIds ? "selected" : "all",
          targetUserIds: userIds || null,
          totalUsers: userDocs.length,
          savedToDb: savedCount,
          fcmSent: sentCount,
          fcmFailed: failedCount,
          noFcmToken: noTokenCount,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info("Custom notification sent successfully", result);

        return res.status(200).json(result);
      } catch (error) {
        logger.error("Error sending custom notification:", error);
        return res.status(500).json({
          error: "Internal server error",
          message: error.message,
        });
      }
    });
  },
);

module.exports = {
  sendCustomNotification,
};
