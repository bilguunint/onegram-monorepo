# Onegram Monorepo

Onegram төслийн Flutter app, Angular admin web, Firebase Cloud Functions нэг repo дотор.

## Бүтэц

```
.
├── app/          # Flutter mobile app
├── admin/        # Angular admin dashboard
├── functions/    # Firebase Cloud Functions (Node.js 20)
├── firebase.json # Root Functions deploy config (source: functions)
├── .firebaserc   # Firebase project: grammgold
└── Makefile      # Нийтлэг командууд
```

## Эхлэх

```bash
# Flutter app dependencies
make app-get

# Angular admin dependencies
make admin-install

# Cloud Functions dependencies
make fn-install
```

## Хөгжүүлэлт

```bash
make app-run        # Flutter app ажиллуулах
make admin-run      # Angular admin dev server (http://localhost:4200)
make admin-build    # Angular admin build
make fn-serve       # Functions local emulator
make fn-deploy      # Functions deploy хийх
make help           # Бүх командууд
```

## Тэмдэглэл

- Firebase service account key (`grammgold-firebase.json`) болон database dump-уудыг repo-д commit хийхгүй (`.gitignore`-д бичсэн).
- Admin project нь өөрийн `admin/firebase.json` болон `admin/.firebaserc`-тэй, hosting target нь `admin-omm`.
- Admin app нь Firebase client config ашигладаг тул access control-ийг Firebase Auth/Firestore rules болон admin role guard-аар баталгаажуулах шаардлагатай.
- Functions Node.js 20 шаардана.
