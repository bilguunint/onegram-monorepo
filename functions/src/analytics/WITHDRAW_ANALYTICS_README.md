# Withdraw Analytics Service

## Overview

Withdraw Analytics Service нь `withdraws` collection-оос verified статустай бүх мэдээллийг цуглуулж, сар бүрийн болон нийт статистикийг тооцоолж `withdraw_analytics` collection-д хадгалдаг.

## Features

### 1. Үндсэн Статистик
- Нийт withdraw тоо
- Металл төрлөөр (алт, мөнгө) нийт грам
- Withdraw төрлөөр (sold_to_us, taken_physically) ангилал
- Хувь харьцаа тооцоолол

### 2. Санхүүгийн Мэдээлэл
- `sold_to_us` төрлийн нийт price (төгрөг)
- Дундаж үнэ (withdraw бүрд, грам бүрд)
- Дундаж алтны ханш

### 3. Хэрэглэгчийн Статистик
- Top 10 хэрэглэгчид (quantity-гаар)
- Top 10 хэрэглэгчид (давтамжаар)

### 4. Цаг хугацааны Мэдээлэл
- Өдөр бүрийн breakdown
- Сар бүрийн тойм

## Data Structure

### withdraw_analytics Collection

Документ ID нь:
- `overall` - Бүх цаг үеийн нийт статистик
- `YYYY_MM` - Тухайн сарын статистик (жишээ: `2026_02`)

### Document Schema

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
  
  silver: {
    total_grams: 5000.0,
    withdraw_count: 25,
    avg_quantity: 200.0
  },
  
  by_withdraw_type: {
    sold_to_us: {
      count: 75,
      percentage: 60.0,
      total_grams_gold: 800.0,
      total_grams_silver: 3000.0,
      total_price_mnt: 432000000,
      avg_price_per_withdraw: 5760000,
      avg_gold_rate: 540000  // price per gram
    },
    taken_physically: {
      count: 45,
      percentage: 36.0,
      total_grams_gold: 400.5,
      total_grams_silver: 1900.0
    },
    unspecified: {
      count: 5,
      percentage: 4.0,
      total_grams_gold: 50.0,
      total_grams_silver: 100.0
    }
  },
  
  top_users_by_quantity: [
    {
      rank: 1,
      user_id: "user_12345",
      name: "Батболд Төмөрбаатар",
      email: "user@example.com",
      total_quantity: 250.5,
      total_price: 135270000,
      withdraw_count: 15
    }
  ],
  
  top_users_by_frequency: [...],
  
  daily_breakdown: [
    {
      date: "2026-02-01",
      total_withdraws: 8,
      total_grams_gold: 85.5,
      total_grams_silver: 300.0,
      sold_to_us_count: 5,
      taken_physically_count: 3
    }
  ],
  
  calculated_at: Timestamp
}
```

## API Endpoints

### 1. Manual Calculation (HTTP)

**Endpoint:** `calculateWithdrawAnalytics`

**Method:** GET

**Auth:** Requires admin Bearer token

**Query Parameters:**
- `type` (optional): 
  - `overall` - Нийт статистик
  - `monthly` - Нэг сарын статистик
  - `all_months` - Бүх сарын статистик
  - Default: overall болон одоо сар
  
- `year` (optional): Тухайн жил (type=monthly үед)
- `month` (optional): Тухайн сар 1-12 (type=monthly үед)

**Examples:**

```bash
# Overall статистик тооцоолох
curl -X GET "https://your-region-your-project.cloudfunctions.net/calculateWithdrawAnalytics?type=overall" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 2026 оны 2-р сарын статистик
curl -X GET "https://your-region-your-project.cloudfunctions.net/calculateWithdrawAnalytics?type=monthly&year=2026&month=2" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Бүх сарын статистик тооцоолох
curl -X GET "https://your-region-your-project.cloudfunctions.net/calculateWithdrawAnalytics?type=all_months" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Withdraw analytics calculated and saved",
  "results": [
    {
      "period": "overall",
      "status": "saved"
    },
    {
      "period": "2026-02",
      "status": "saved"
    }
  ]
}
```

### 2. Scheduled Function (Automatic)

**Function:** `scheduledWithdrawAnalytics`

**Schedule:** Өдөр бүр 02:00 (Mongolia time - UTC+8)

**What it does:**
- Overall статистик тооцоолно
- Одоогийн сарын статистик тооцоолно
- Өмнөх сарын статистик дахин тооцоолно (хоцорч verify хийсэн тохиолдолд)

## Usage Examples

### Firestore-с өгөгдөл унших

```javascript
// Overall статистик авах
const overallDoc = await db.collection('withdraw_analytics').doc('overall').get();
const overallStats = overallDoc.data();

console.log(`Нийт withdraw: ${overallStats.total_withdraws}`);
console.log(`Sold to us: ${overallStats.by_withdraw_type.sold_to_us.percentage}%`);
console.log(`Нийт үнэ: ${overallStats.by_withdraw_type.sold_to_us.total_price_mnt} MNT`);

// Тухайн сарын статистик авах
const monthlyDoc = await db.collection('withdraw_analytics').doc('2026_02').get();
const monthlyStats = monthlyDoc.data();

// Top users авах
console.log('Top 10 users by quantity:');
monthlyStats.top_users_by_quantity.forEach(user => {
  console.log(`${user.rank}. ${user.name}: ${user.total_quantity} grams`);
});

// Daily breakdown
monthlyStats.daily_breakdown.forEach(day => {
  console.log(`${day.date}: ${day.total_withdraws} withdraws`);
});
```

### Web Dashboard-д ашиглах

```javascript
// React/Vue component example
const fetchWithdrawAnalytics = async (period = 'overall') => {
  const doc = await db.collection('withdraw_analytics').doc(period).get();
  
  if (doc.exists) {
    const data = doc.data();
    
    // Chart.js pie chart for withdraw types
    const pieData = {
      labels: ['Sold to Us', 'Taken Physically', 'Unspecified'],
      datasets: [{
        data: [
          data.by_withdraw_type.sold_to_us.count,
          data.by_withdraw_type.taken_physically.count,
          data.by_withdraw_type.unspecified.count
        ],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
      }]
    };
    
    // Line chart for daily breakdown
    const lineData = {
      labels: data.daily_breakdown.map(d => d.date),
      datasets: [{
        label: 'Daily Withdraws',
        data: data.daily_breakdown.map(d => d.total_withdraws),
        borderColor: '#36A2EB'
      }]
    };
    
    return { pieData, lineData, stats: data };
  }
};
```

## Monitoring & Logs

Cloud Functions logs-г Firebase Console эсвэл gcloud CLI-ээр харах:

```bash
# Scheduled function logs
gcloud functions logs read scheduledWithdrawAnalytics --limit 50

# Manual calculation logs
gcloud functions logs read calculateWithdrawAnalytics --limit 50
```

## Performance Notes

- Transaction батлагдахад 1-2 секунд
- 1000+ withdraw-тай ажиллах боломжтой
- Memory: 1GiB
- Timeout: 5 минут
- Composite index шаардлагатай: `withdraws` collection дээр `status + verified_at`

## Composite Index Setup

Firebase Console руу орж Firestore Indexes хэсэгт дараах index-ийг үүсгэнэ:

**Collection:** `withdraws`
**Fields:**
- `status` (Ascending)
- `verified_at` (Ascending)

Эсвэл автоматаар үүсгэхийн тулд function-ийг дуудахад гарах error-ын линкийг дагана.

## Troubleshooting

### Issue: "Missing index" error
**Solution:** Composite index үүсгэнэ (дээрх хэсэгтэй)

### Issue: Timeout error
**Solution:** 
- Memory-ийг нэмэгдүүлнэ (2GiB)
- Timeout-ийг 540 секунд болгоно
- Эсвэл batch processing хийнэ

### Issue: No data returned
**Solution:**
- Verified статустай withdraw байгаа эсэхийг шалгана
- `verified_at` field байгаа эсэхийг шалгана
- Year/month зөв эсэхийг шалгана

## Future Enhancements

- [ ] Real-time dashboard subscription
- [ ] Email reports (weekly/monthly)
- [ ] Comparison between months/years
- [ ] Export to CSV/Excel
- [ ] Revenue predictions based on trends
- [ ] User segmentation analysis
