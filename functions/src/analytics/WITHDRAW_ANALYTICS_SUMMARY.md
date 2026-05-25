# Withdraw Analytics - Хураангуй

## Юу үүсгэсэн бэ?

Withdraw analytics system нь `withdraws` collection-ын verified өгөгдлийг задлан шинжлэх, статистик гаргах, `withdraw_analytics` collection-д хадгалах функц юм.

## Үүсгэсэн файлууд

1. **withdrawAnalyticsService.js** - Үндсэн service
2. **WITHDRAW_ANALYTICS_README.md** - Дэлгэрэнгүй документ
3. **testWithdrawAnalytics.js** - Тест скрипт
4. **index.js** - Exports нэмсэн

## Гол функцууд

### 1. `calculateWithdrawAnalytics` (HTTP endpoint)
- **URL:** `/calculateWithdrawAnalytics`
- **Method:** GET
- **Auth:** Admin token шаардлагатай
- **Query params:**
  - `type`: overall | monthly | all_months
  - `year`: жил (optional)
  - `month`: сар 1-12 (optional)

### 2. `scheduledWithdrawAnalytics` (Scheduled)
- **Schedule:** Өдөр бүр 02:00 (Mongolia time)
- **Action:** Overall + одоогийн сар + өмнөх сарын статистик тооцоолно

## Гаргах статистикууд

### Ерөнхий мэдээлэл
- ✅ Нийт withdraw тоо
- ✅ Металл төрлөөр нийт грам (алт, мөнгө)
- ✅ Дундаж грам

### Withdraw төрлөөр
- ✅ **sold_to_us**: Тоо, хувь, нийт price (төгрөг), дундаж үнэ
- ✅ **taken_physically**: Тоо, хувь
- ✅ **unspecified**: Тоо, хувь

### Санхүүгийн мэдээлэл (sold_to_us)
- ✅ Нийт overall төгрөг
- ✅ Сар бүрийн төгрөг
- ✅ Дундаж үнэ withdraw бүрд
- ✅ Дундаж алтны ханш (price/gram)

### Top хэрэглэгчид
- ✅ Top 10 by quantity (нийт грам)
- ✅ Top 10 by frequency (давтамж)

### Өдрийн задаргаа
- ✅ Daily breakdown (өдөр бүрийн статистик)
- ✅ Sold vs Physical харьцуулалт

## Data бүтэц

```javascript
{
  period: "2026-02" | "overall",
  year: 2026,
  month: 2,
  total_withdraws: 125,
  
  gold: {
    total_grams: 1250.5,
    withdraw_count: 100,
    avg_quantity: 12.505
  },
  
  by_withdraw_type: {
    sold_to_us: {
      count: 75,
      percentage: 60.0,
      total_price_mnt: 432000000,
      avg_gold_rate: 540000
    }
  },
  
  top_users_by_quantity: [...],
  daily_breakdown: [...]
}
```

## Хэрхэн ашиглах вэ?

### 1. Test хийх

```bash
cd functions/src/analytics
node testWithdrawAnalytics.js
```

### 2. Deploy хийх

```bash
cd /Users/bilguunnyamlhagva/OnegramFunctions/functions
firebase deploy --only functions:calculateWithdrawAnalytics,functions:scheduledWithdrawAnalytics
```

### 3. HTTP endpoint дуудах

```bash
# Overall статистик
curl -X GET "https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/calculateWithdrawAnalytics?type=overall" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 2026-02 сарын статистик
curl -X GET "https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/calculateWithdrawAnalytics?type=monthly&year=2026&month=2" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Бүх сарын статистик
curl -X GET "https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/calculateWithdrawAnalytics?type=all_months" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 4. Firestore-с унших

```javascript
// Overall
const doc = await db.collection('withdraw_analytics').doc('overall').get();
const stats = doc.data();

// Тухайн сар
const monthDoc = await db.collection('withdraw_analytics').doc('2026_02').get();
const monthStats = monthDoc.data();

console.log(`Sold to us: ${stats.by_withdraw_type.sold_to_us.percentage}%`);
console.log(`Total revenue: ₮${stats.by_withdraw_type.sold_to_us.total_price_mnt}`);
```

## Шаардлагатай index

Firebase Console -> Firestore -> Indexes:

**Collection:** `withdraws`
**Fields:**
- `status` (Ascending)
- `verified_at` (Ascending)

## Анхаарах зүйлс

1. ✅ Зөвхөн `status: "verified"` withdraw-ийг тооцно
2. ✅ `withdraw_type` байхгүй бол "unspecified" гэж тооцно
3. ✅ `metal_id` 1=gold, 3=silver
4. ✅ `price` зөвхөн sold_to_us-д тооцно
5. ✅ Scheduled function өдөр бүр автоматаар ажиллана
6. ✅ Admin token-тай л HTTP endpoint дуудаж болно

## Дараах алхмууд

1. [ ] Test script ажиллуулах
2. [ ] Firebase deploy хийх
3. [ ] Composite index үүсгэх
4. [ ] HTTP endpoint тестлэх
5. [ ] Dashboard-д харуулах
6. [ ] Scheduled function анхны ажиллалт шалгах

## Нэмэлт функц санал

Цаашид нэмж болох зүйлс:
- 📊 Chart/graph data export
- 📧 Email reports (weekly/monthly)
- 📈 Trend analysis & predictions
- 💾 CSV/Excel export
- 🔔 Alert notifications (unusual patterns)
- 📱 Mobile dashboard support
