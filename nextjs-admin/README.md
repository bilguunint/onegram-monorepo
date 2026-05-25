# Onegram nextjs-admin

Next.js 16 + Tailwind v4 + shadcn/ui + Firebase Auth + Firebase Admin SDK ашиглан үүсгэсэн админ дашбоард. Angular admin (`../admin/`)-ийг алхам алхмаар орлох зорилготой Phase 1 scaffold.

## Tech stack

- **Next.js 16** App Router + React 19 + TypeScript
- **Tailwind CSS v4** + **shadcn/ui** (New York style, neutral base)
- **Firebase 12** client SDK (Auth + Firestore)
- **firebase-admin 13** server SDK (Node — /api route-уудад зориулсан)
- **next-themes** (dark mode)
- **sonner** (toast notifications)
- **Lucide React** icons

## Эхлэх

```bash
# 1. Dependencies (хэрэв install хийгээгүй бол)
npm install

# 2. Firebase config-ийг бөглөнө
cp .env.local.example .env.local
# .env.local дотор NEXT_PUBLIC_FIREBASE_* утгуудыг бөглө
# (../admin/src/environments/environment.ts-аас хуулж болно)

# 3. Dev server
npm run dev
# http://localhost:3000
```

## Authentication

Angular admin-ийн pattern-г шингээсэн:

1. Firebase `signInWithEmailAndPassword(email, password)` ажиллана
2. Амжилттай нэвтэрсний дараа `admins/{uid}` Firestore doc-оос **role** уншина
3. Role нь `['admin', 'manager', 'accountant']`-ын аль нэг биш бол `signOut()` + toast error
4. Login амжилттай бол:
   - `manager` → `/users`
   - бусад role → `/dashboard`

**Файлууд:**

- `src/lib/auth/AuthProvider.tsx` — React context, `onAuthStateChanged` listener
- `src/lib/auth/roles.ts` — Role constants + `defaultRouteForRole()`
- `src/components/layout/AuthGate.tsx` — Dashboard route-уудад auth шалгалт

## Layout

- **Sidebar** (`src/components/layout/Sidebar.tsx`): collapsible (256px / 64px), 11 Mongolian menu items, active item primary highlight
- **Topbar** (`src/components/layout/Topbar.tsx`): theme toggle, user dropdown, mobile hamburger (`<Sheet>` drawer)
- **Theme** (`src/components/providers/ThemeProvider.tsx`): next-themes — system / light / dark
- **Menu** (`src/lib/menu.ts`): Эхлэл, Хэрэглэгчид, Захиалгууд, Бэлгийн хүсэлтүүд, Хөрөнгө оруулалт, Биетээр авах хүсэлтүүд, Биетээр авах статистик, Мессеж, Мэдэгдэл, Сугалаат аян, AI Ажилтан

## Routes

```
src/app/
├── page.tsx                          # Auth-state-based redirect
├── (auth)/login/page.tsx             # Login page
└── (dashboard)/                      # AuthGate-аар хамгаалсан
    ├── layout.tsx
    ├── dashboard/page.tsx            # Эхлэл (4 stat cards)
    ├── users/page.tsx                # Placeholder
    ├── orders/page.tsx
    ├── gift_orders/page.tsx
    ├── investments/page.tsx
    ├── withdraws/page.tsx
    ├── withdraws_statistics/page.tsx
    ├── messaging/page.tsx
    ├── custom-notifications/page.tsx
    ├── campaigns/page.tsx
    └── ai-worker/page.tsx
```

## Бүс хязгаар (Phase 1)

- Бие даасан page-уудын real UI хараахан хийгдээгүй — placeholder л
- `proxy.ts` (Next.js 16-ийн middleware) хараахан **байхгүй** — Firebase Auth client SDK нь session-ийг IndexedDB-д хадгалдаг тул cookie-d суурилсан proxy шалгалт ажиллахгүй. Server-side session cookie тохиргоо нэмсний дараа `proxy.ts` оруулах боломжтой
- Production deploy config (Firebase Hosting `admin-omm-next` target) гэж бэлдсэн боловч жинхэнэ deploy шалгаагүй. Static export (`output: 'export'`) нь /api route-уудтай зөрчилтэй учир Firebase App Hosting эсвэл Vercel руу deploy хийх бол `next.config.ts`-ыг өөрчилнө

## Deploy (Firebase Hosting, static export)

Хэрэв /api route ашиглахгүй бол:

1. `next.config.ts` дотор `output: 'export'` нэмнэ
2. `npm run build` → `out/` folder үүснэ
3. Firebase Console дээр `admin-omm-next` шинэ site үүсгэнэ
4. `firebase deploy --only hosting:admin-omm-next` (monorepo root-оос)

Хуучин Angular admin-ийн `admin-omm` target-тай мөргөлдөхгүй.

## Linked references

- Angular admin auth utils — `../admin/src/app/authUtils.ts`
- Angular admin menu — `../admin/src/app/layouts/sidebar/menu.ts`
- Role redirect guard — `../admin/src/app/core/guards/role-redirect.guard.ts`
- Firebase config (mirror) — `../admin/src/environments/environment.ts`
