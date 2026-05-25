# Android 16KB Page Size Support Guide

## Өөрчлөгдсөн зүйлүүд

### 1. Version Updates
- **pubspec.yaml**: `2.0.4+25` → `2.0.5+26`
- **version_service.dart**: `currentAppVersion = '2.0.5'`
- **build.gradle**: `versionName = "2.0.5"`, `versionCode = "26"`

### 2. Android Configuration Changes

#### build.gradle (app-level)
```groovy
android {
    compileSdk = 35
    targetSdkVersion = 35
}
```

#### AndroidManifest.xml
```xml
<application
    android:enableOnBackInvokedCallback="true"
    ...>
```

#### gradle.properties
```properties
android.bundle.enableUncompressedNativeLibs=false
```

#### settings.gradle
```groovy
plugins {
    id "com.android.application" version "8.5.2" apply false
}
```

#### build.gradle (project-level)
```groovy
classpath 'com.android.tools.build:gradle:8.5.2'
classpath 'com.google.gms:google-services:4.4.0'
```

## 16KB Page Size Дэмжлэгийн Шаардлагууд

### Google Play Store Requirements (2025 August)
- **targetSdkVersion 35** заавал шаардлагатай
- **16KB page size** дэмжих ёстой
- Predictive Back Gesture дэмжлэг (`enableOnBackInvokedCallback`)

## Build & Release Process

### 1. Clean Build
```bash
cd android
./gradlew clean
cd ..
flutter clean
flutter pub get
```

### 2. Build AAB (App Bundle)
```bash
flutter build appbundle --release
```

Эсвэл specific version-той:
```bash
flutter build appbundle --release --build-name=2.0.5 --build-number=26
```

### 3. AAB файл байрлал
```
build/app/outputs/bundle/release/app-release.aab
```

### 4. Тестлэх (Local)
Debug mode:
```bash
flutter run --debug
```

Release mode device дээр:
```bash
flutter run --release
```

### 5. Google Play Console Upload

#### A. Internal Testing
1. Google Play Console → Testing → Internal testing
2. Create new release
3. Upload `app-release.aab`
4. Review and rollout

#### B. Production Release
1. Google Play Console → Production
2. Create new release
3. Upload `app-release.aab`
4. Add release notes:
```
Bug fixes and performance improvements
16KB memory page size support
Updated to targetSdkVersion 35
```
5. Review and publish

## 16KB Page Size Verification

### Pre-release Testing Tools

1. **16KB Dev Options** (Android Studio):
```bash
adb shell setprop debug.app.16kb.enabled true
adb reboot
```

2. **Check Native Libraries**:
```bash
unzip -l app-release.aab | grep "\.so$"
```

3. **Run 16KB Emulator**:
- Android Studio → Device Manager
- Create Device with 16KB page size support
- Test thoroughly

## Common Issues & Solutions

### Issue 1: Native Library Crashes
**Solution**: Ensure all native dependencies support 16KB
```groovy
android.bundle.enableUncompressedNativeLibs=false
```

### Issue 2: Gradle Sync Failed
**Solution**: Update Gradle version
```bash
cd android
./gradlew wrapper --gradle-version 8.10.2
```

### Issue 3: Build Tools Outdated
**Solution**: Update Android Studio and SDK tools
```bash
sdkmanager --update
```

## Dependencies to Check

### Native Dependencies in Your Project
- ✅ Firebase (supports 16KB)
- ✅ Flutter plugins (most updated)
- ⚠️ Check third-party native libraries

### Verify Each Package
```bash
flutter pub outdated
flutter pub upgrade
```

## Testing Checklist

Before uploading to Play Store:

- [ ] Clean build successful
- [ ] App runs on physical device (release mode)
- [ ] No native library crashes
- [ ] Predictive back gesture works
- [ ] All features functioning normally
- [ ] Memory usage acceptable
- [ ] App bundle < 150MB
- [ ] Version code incremented (26)
- [ ] Version name updated (2.0.5)

## Release Notes Template

### English
```
What's New in v2.0.5:
• Enhanced compatibility with latest Android devices
• Performance improvements and bug fixes
• Updated security features
• Support for 16KB memory page sizes
```

### Mongolian
```
Шинэчлэлт v2.0.5:
• Хамгийн сүүлийн үеийн Android төхөөрөмжүүдтэй нийцтэй
• Хурд, гүйцэтгэлийн сайжруулалт
• Аюулгүй байдлын шинэчлэлт
• 16KB санах ойн дэмжлэг
```

## Monitoring After Release

### Key Metrics to Watch
1. **Crash Rate**: Should remain < 1%
2. **ANR Rate**: Should remain < 0.5%
3. **Installation Success Rate**: Should be > 95%
4. **Device Compatibility**: Check coverage

### Google Play Console Dashboards
- App quality → Android vitals
- Reach and devices → Device catalog
- Pre-launch reports → Review all tests

## Rollback Plan

If issues occur:
1. Halt rollout immediately
2. Create hotfix version (2.0.6+27)
3. Revert problematic changes
4. Test thoroughly
5. Release emergency update

## Important URLs

- [16KB Page Size Guide](https://developer.android.com/guide/practices/page-sizes)
- [targetSdkVersion 35 Requirements](https://developer.android.com/about/versions/15/behavior-changes-15)
- [Play Console](https://play.google.com/console)

## Next Steps

1. ✅ Configuration updated
2. ⏭️ Test on multiple devices
3. ⏭️ Build release AAB
4. ⏭️ Upload to Internal Testing
5. ⏭️ Verify on test devices
6. ⏭️ Promote to Production
7. ⏭️ Monitor metrics

---

**Last Updated**: November 25, 2025  
**Version**: 2.0.5 (Build 26)  
**Target SDK**: 35 (Android 15)
