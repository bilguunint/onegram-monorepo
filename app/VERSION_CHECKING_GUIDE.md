# Version Checking System

## Тайлбар (Description)

Энэ систем нь Flutter апп-н хувилбарыг Firestore-тэй харьцуулж, хэрэв апп хуучирсан бол хэрэглэгчид шинэчлэлт хийх мэдэгдэл харуулдаг.

This system compares the Flutter app version with Firestore and shows an update alert to users if the app is outdated.

## Суулгасан файлууд (Installed Files)

1. **lib/repositories/version_service.dart** - Version шалгалт хийдэг service
2. **lib/screens/app_new_screen/main_screen/main_screen.dart** - MainScreen-д version check нэмсэн

## Хэрхэн ажилладаг (How It Works)

### 1. Version Comparison
- Апп-н одоогийн хувилбар: `2.0.3` (version_service.dart дотор `currentAppVersion` константад хадгалагдсан)
- Firestore-с iOS болон Android хувилбаруудыг уншина
- `version` package ашиглан semantic version харьцуулалт хийнэ

### 2. Firestore Structure

Firestore-д дараах collection үүсгэх хэрэгтэй:

```
versions/
  ├── ios/
  │   └── version: "2.1.0"  (String)
  └── android/
      └── version: "2.1.0"  (String)
```

**Firebase Console дээр үүсгэх:**
1. Cloud Firestore -> Data -> Add collection
2. Collection ID: `versions`
3. Document ID: `ios`
4. Field: `version`, Type: string, Value: `2.1.0`
5. Дахин document нэмэх: Document ID: `android`
6. Field: `version`, Type: string, Value: `2.1.0`

### 3. Version Update Process

**Хэрэв апп-н хувилбар шинэчлэх бол:**

1. `pubspec.yaml` дээр version-г өөрчлөх:
```yaml
version: 2.1.0+25
```

2. `lib/repositories/version_service.dart` дээр `currentAppVersion` өөрчлөх:
```dart
static const String currentAppVersion = '2.1.0';
```

3. Firestore дээр хуучин хувилбаруудыг үлдээх (жишээ: `2.0.3`-г `2.1.0` болгох)

### 4. Alert Dialog

Хэрэв апп хуучирсан бол:
- Dialog харагдана: "Шинэчлэлт хийх шаардлагатай"
- "Үргэлжлүүлэхийн тулд шинэчлэлт хийнэ үү"
- "Шинэчлэх" товч дарахад Store руу очно

**App Store/Play Store URL-үүдийг солих:**

`version_service.dart` дотор:
```dart
if (Platform.isIOS) {
  storeUrl = 'https://apps.apple.com/app/idYOUR_APP_ID';
} else {
  storeUrl = 'https://play.google.com/store/apps/details?id=YOUR_PACKAGE_NAME';
}
```

Солих:
- iOS: `idYOUR_APP_ID` -> жинхэнэ App Store ID
- Android: `YOUR_PACKAGE_NAME` -> `com.yourcompany.onegrgold`

### 5. Testing

**Firestore дээр тест хийх:**
1. Firestore `versions/ios` эсвэл `versions/android` дээр version-г `2.1.0` болго
2. Апп-г ачаална
3. MainScreen харагдахад Alert харагдана

**Хэвийн үед:**
1. Firestore version = `2.0.3` (одоогийн хувилбар)
2. Alert харагдахгүй

## Code Flow

1. **MainScreen initState()**
   - `WidgetsBinding.instance.addPostFrameCallback()` - widget mount болсны дараа
   - `_checkVersion()` дуудагдана

2. **_checkVersion()**
   - `VersionService.checkAndShowUpdateIfNeeded()` дуудна

3. **VersionService.checkAndShowUpdateIfNeeded()**
   - `needsUpdate()` дуудаж шалгана
   - Хэрэв `true` бол `showUpdateAlert()` харуулна

4. **VersionService.needsUpdate()**
   - Platform тодорхойлно (iOS/Android)
   - Firestore-с version татна
   - Version харьцуулна
   - `true`/`false` буцаана

5. **showUpdateAlert()**
   - AlertDialog харуулна
   - "Шинэчлэх" дарахад `_openStore()` дуудагдана

## Important Notes

⚠️ **Анхаарах зүйлүүд:**

1. Firestore `versions` collection үүсгэх ЗААВАЛ
2. `currentAppVersion` болон `pubspec.yaml` version синхрон байх
3. App Store/Play Store URL-үүдийг солих
4. Version format: `MAJOR.MINOR.PATCH` (semantic versioning)
5. Alert dialog-г back button дарж хаах боломжгүй (`barrierDismissible: false`)

## Dependencies Used

- `version: ^3.0.2` - Version харьцуулалт
- `url_launcher: ^6.3.0` - Store руу очих
- `cloud_firestore: ^5.6.8` - Firestore integration

## Example Versions

```
Current: 2.0.3
Firestore: 2.1.0
Result: Alert shown ✅

Current: 2.1.0
Firestore: 2.0.3
Result: No alert ❌

Current: 2.1.0
Firestore: 2.1.0
Result: No alert ❌
```
