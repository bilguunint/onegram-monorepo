# OneGram Analytics System

Энэхүү analytics систем нь OneGram платформын алт борлуулалт, хэрэглэгчдийн статистик, захиалгын мэдээллийг автоматаар бүртгэж, хянадаг.

## Хянаж байгаа үзүүлэлтүүд

### 1. Сарын статистик (Monthly Analytics)
- **Сар бүрийн зарсан алтны хэмжээ** (зөвхөн admin_status: "success" төлөвтэй)
- **Сарын борлуулалтын дүн** (төгрөгөөр)
- **Нийт захиалгын тоо**
- **Амжилттай захиалгын тоо**

### 2. Ерөнхий статистик (Overall Analytics)
- **Бүх цагийн зарсан алтны хэмжээ**
- **Бүх цагийн борлуулалтын дүн**
- **Нийт хэрэглэгчдийн тоо**
- **Алттай хэрэглэгчдийн тоо** (balance.gold > 0)
- **Нийт захиалгын тоо**
- **Амжилттай захиалгын тоо**

### 3. Өдрийн хэрэглэгчийн статистик (Daily User Analytics)
- **Өдөр бүрийн шинэ бүртгүүлсэн хэрэглэгчдийн тоо**

## Cloud Functions

### Автомат шинэчлэгдэх функцууд (Triggers)

1. **onOrderCreated** - Шинэ захиалга үүсэхэд
2. **onOrderUpdated** - Захиалгын төлөв өөрчлөгдөхөд
3. **onUserCreated** - Шинэ хэрэглэгч бүртгүүлэхэд

### HTTP Endpoints

1. **initializeAnalytics** (POST)
   - Анхны удаа ажиллуулах
   - Одоо байгаа бүх өгөгдлийг боловсруулж analytics үүсгэнэ
   
2. **getAnalytics** (GET)
   - `?type=overall` - Ерөнхий статистик
   - `?type=monthly&limit=12` - Сүүлийн 12 сарын статистик
   - `?type=monthly&month=2025-08` - Тодорхой сарын статистик
   - `?type=daily_users&limit=30` - Сүүлийн 30 хоногийн хэрэглэгчийн статистик

3. **refreshAnalytics** (POST)
   - Гараар analytics шинэчлэх

## Хэрэглэх заавар

### 1. Анхны тохиргоо
```bash
# Functions deploy хийх
firebase deploy --only functions

# Analytics анхны удаа тохируулах
curl -X POST https://your-region-your-project.cloudfunctions.net/initializeAnalytics
```

### 2. Статистик харах
```bash
# Ерөнхий статистик
curl "https://your-region-your-project.cloudfunctions.net/getAnalytics?type=overall"

# Сарын статистик
curl "https://your-region-your-project.cloudfunctions.net/getAnalytics?type=monthly&limit=6"

# Өдрийн хэрэглэгчийн статистик
curl "https://your-region-your-project.cloudfunctions.net/getAnalytics?type=daily_users&limit=7"
```

### 3. Гараар шинэчлэх
```bash
curl -X POST https://your-region-your-project.cloudfunctions.net/refreshAnalytics
```

## Firestore схем

### Analytics collection structure:
```
analytics/
├── overall (document)
│   ├── total_users: number
│   ├── users_with_gold: number
│   ├── total_orders: number
│   ├── successful_orders: number
│   ├── total_gold_sold_all_time: number
│   ├── total_revenue_all_time: number
│   └── last_updated: timestamp
├── monthly (document)
│   └── data/ (subcollection)
│       ├── 2025-08 (document)
│       │   ├── month: "2025-08"
│       │   ├── total_gold_sold: number
│       │   ├── total_revenue: number
│       │   ├── total_orders: number
│       │   ├── successful_orders: number
│       │   └── last_updated: timestamp
│       └── 2025-07 (document)
└── daily_users (document)
    └── data/ (subcollection)
        ├── 2025-08-12 (document)
        │   ├── date: "2025-08-12"
        │   ├── new_users: number
        │   └── last_updated: timestamp
        └── 2025-08-11 (document)
```

## Performance considerations

- **Batch операци**: Том collection-уудтай ажиллахад batch операци ашиглана
- **Transaction**: Давхцах шинэчлэлээс сэргийлэхийн тулд transaction ашиглана
- **Count queries**: Firestore-ын count() функц ашиглан эффективтэй тоолно
- **Incremental updates**: Бүгдийг дахин тооцоолохын оронд зөвхөн өөрчлөлтийг шинэчлэнэ

## Debugging

### Logs шалгах:
```bash
firebase functions:log --only initializeAnalytics
firebase functions:log --only onOrderCreated
firebase functions:log --only onUserCreated
```

### Manual queries Firestore консолд:
```javascript
// Амжилттай захиалгууд
db.collection("orders").where("admin_status", "==", "success").get()

// Алттай хэрэглэгчид  
db.collection("users").where("balance.gold", ">", 0).get()

// Analytics харах
db.collection("analytics").doc("overall").get()
```

## Анхаарах зүйлс

1. **initializeAnalytics** нэг удаа л ажиллуулна
2. Том collection-тай ажиллахад удаан байж болно
3. Firebase billing-г анхаарна уу (read/write operations)
4. Error handling болон retry mechanism бий
5. Timestamps нь server timestamp ашиглана
