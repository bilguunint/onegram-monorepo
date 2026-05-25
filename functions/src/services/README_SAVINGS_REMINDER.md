# Алт Хуримтлуулах Санамж Service

Энэ service нь сар бүрийн тодорхой өдрүүдэд хэрэглэгчдэд алт хуримтлуулах урамшуулалын notification илгээдэг.

## Онцлогууд

- ✅ Сар бүрийн **5, 15, 20** болон **сарын сүүлчийн** өдрүүдэд автоматаар ажиллана
- ✅ **10 төрлийн мессеж**-ээс санамсаргүй сонгож илгээнэ
- ✅ **FCM (Firebase Cloud Messaging)** ашиглан push notification илгээнэ
- ✅ **Database-д хадгална** - FCM ажиллахгүй байсан ч мессеж хадгалагдана
- ✅ **Batch processing** - олон хэрэглэгчдэд хурдан илгээнэ
- ✅ **Scheduled function** - Өдөр бүр 10:00 AM цагт автоматаар ажиллана

## Хуваарь

Service нь **өдөр бүр 10:00 AM** (Улаанбаатарын цагаар) ажиллаж, дараах өдрүүдэд notification илгээнэ:
- 🗓️ Сарын **5-ны өдөр**
- 🗓️ Сарын **15-ны өдөр**
- 🗓️ Сарын **20-ны өдөр**
- 🗓️ Сарын **сүүлчийн өдөр** (28, 29, 30, 31)

## Мессежүүд

Service нь дараах 10 мессежээс санамсаргүй сонгож илгээнэ:

1. "💰 Өнөөдөр алт хуримтлуулаарай! Ирээдүйн хөрөнгөө өнөөдөр эхлүүлээрэй."
2. "✨ Алтны хуримтлал бол ирээдүйд хийх хамгийн ухаалаг хөрөнгө оруулалт!"
3. "🌟 Өдөр бүр бага хэмжээгээр хуримтлуулж, том хөрөнгө бүрдүүлээрэй."
4. "📈 Алтны үнэ өсч байна. Өнөөдөр хуримтлуулж эхлэх хамгийн тохиромжтой цаг!"
5. "💎 Таны ирээдүй таны өнөөдрийн шийдвэрээс хамаарна. Алт хуримтлуулаарай!"
6. "🎯 Зорилгодоо хүрэхийн тулд өнөөдөр алт нэмээрэй."
7. "🔐 Алт бол найдвартай хөрөнгө. Өнөөдөр хадгалж эхлээрэй."
8. "⭐ Бага хэмжээгээр эхэлж, том амжилтанд хүрээрэй. Алт хуримтлуулаарай!"
9. "💪 Өөрийн ирээдүйд хөрөнгө оруулаарай. Өнөөдөр алт хуримтлуул!"
10. "🎁 Өнөөдөр өөртөө бэлэг өг - алт хуримтлуул!"

## Deploy хийх

```bash
cd functions
firebase deploy --only functions:sendSavingsRemindersScheduled
```

## Manual ажиллуулах (тест)

Хэрэв шууд тест хийхийг хүсвэл, дараах командыг ашиглаарай:

```bash
# Firebase Console-с manual trigger
# Эсвэл HTTP function үүсгэж дуудах
```

Эсвэл HTTP function үүсгэж manual дуудах:

```javascript
exports.sendSavingsRemindersManual = onRequest(async (req, res) => {
  const result = await sendSavingsReminders();
  res.json(result);
});
```

## Технологи

- **Firebase Functions v2** - Scheduled function
- **Firebase Cloud Messaging (FCM)** - Push notifications
- **Firestore** - Notification хадгалах
- **Cron Expression** - `0 10 * * *` (өдөр бүр 10:00 AM)
- **Timezone** - `Asia/Ulaanbaatar`

## Бүтэц

```
functions/
  src/
    services/
      savingsReminderService.js  # Main service file
      README_SAVINGS_REMINDER.md # Энэ файл
```

## Notification бүтэц

### Database-д хадгалагдах бүтэц
```javascript
{
  title: "Алт хуримтлуулаарай",
  body: "Random message...",
  type: "savings_reminder",
  createdAt: Timestamp,
  read: false
}
```

### FCM notification бүтэц
```javascript
{
  notification: {
    title: "Алт хуримтлуулаарай",
    body: "Random message..."
  },
  data: {
    type: "savings_reminder",
    timestamp: "2026-01-15T10:00:00.000Z"
  }
}
```

## Monitoring

Firebase Console-с logs харах:

```bash
firebase functions:log --only sendSavingsRemindersScheduled
```

Log-д дараах мэдээллүүд харагдана:
- Notification илгээгдэх өдөр эсэх
- Нийт хэрэглэгчдийн тоо
- Database-д хадгалсан notification-ы тоо
- FCM-ээр илгээгдсэн notification-ы тоо
- Сонгогдсон мессеж

## Нэмэлт мессеж нэмэх

`SAVINGS_MESSAGES` array-д шинэ мессеж нэмээрэй:

```javascript
const SAVINGS_MESSAGES = [
  // ...одоо байгаа мессежүүд
  "🎉 Таны шинэ мессеж энд!", // Шинэ мессеж
];
```

## Хуваарь өөрчлөх

`schedule` параметрыг өөрчлөх:

```javascript
schedule: "0 10 * * *", // Өдөр бүр 10:00 AM
// Өөрчлөх жишээ:
schedule: "0 14 * * *", // Өдөр бүр 14:00 PM (2:00 PM)
schedule: "0 9 * * 1", // Даваа бүр 9:00 AM
```

## Анхаарах зүйлс

- ⚠️ FCM token байхгүй хэрэглэгчид зөвхөн database-д хадгалагдана
- ⚠️ Нэг удаад max 500 notification илгээж болно (Firebase limitation)
- ⚠️ Timezone нь Улаанбаатар (`Asia/Ulaanbaatar`) байгааг шалгаарай
- ⚠️ Сар бүрийн сүүлчийн өдөр автоматаар тодорхойлогдоно (28-31)

## Санал хүсэлт

Мессеж нэмэх эсвэл өөрчлөх, хуваарь засах гэх мэт санал хүсэлт байвал кодоо шууд засаж болно.
