# 🚀 Yrdly App — Full Launch-Readiness Audit

**Date:** 2026-04-20  
**Status:** Pre-Launch Review  
**Stack:** Next.js 15 (App Router) · Supabase · Flutterwave · Sentry · Brevo · Vercel  

---

## Executive Summary

Yrdly is a **neighborhood social network** (PWA) targeting Nigeria. It includes community feeds, messaging, a marketplace with escrow/Flutterwave payments, business directories, events, and friend management. 

TypeScript compiles cleanly (`tsc --noEmit` passes) and the project structure is generally well-organized, but there are **multiple critical and high-priority issues** that must be resolved before launch.

---

## 🔴 CRITICAL — Must Fix Before Launch

### 1. Security — API Routes Lack Authentication

> [!CAUTION]
> **Payment API routes have NO auth checks.** Any anonymous user can call `POST /api/payment/initialize` and `POST /api/payment/verify` without being logged in. An attacker could create fake escrow transactions or manipulate payment verification.

| File | Issue |
|------|-------|
| [route.ts](file:///c:/Users/HP%202026/Music/yrdly-app/src/app/api/payment/initialize/route.ts) | No `Authorization` header / session verification |
| [route.ts](file:///c:/Users/HP%202026/Music/yrdly-app/src/app/api/payment/verify/route.ts) | No session check — anyone can verify any transaction |

**Fix:** Add Supabase server-side auth (via `createRouteHandlerClient` or manual JWT verification from the `Authorization` header) to validate the logged-in user matches the `buyerId`.

---

### 2. Security — Supabase Client Uses Placeholder Fallback

> [!CAUTION]
> The Supabase client in [supabase.ts](file:///c:/Users/HP%202026/Music/yrdly-app/src/lib/supabase.ts#L10) falls back to `'https://placeholder.supabase.co'` and `'placeholder-key'` when env vars are missing. If the build runs without env vars, a live client gets created with an invalid URL — this causes **silent failure and confusing errors** at runtime.

**Fix:** Validate env vars exist at startup. Throw a clear error during build if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing.

---

### 3. Security — Sentry DSN Hardcoded in Multiple Files

> [!WARNING]
> The Sentry DSN (`https://eee6693f041b...`) is **hardcoded** in 4 files: `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and `.cursorrules`. The DSN is also committed in `.cursorrules` which is in version control.

**Fix:** Move the DSN to an environment variable `SENTRY_DSN` and reference it in all config files.

---

### 4. Security — `sendDefaultPii: true` in Sentry

Sentry is configured with `sendDefaultPii: true` in all 3 config files. This sends Personally Identifiable Information (IP addresses, cookies, user data) to Sentry. For a social network handling Nigerian user data, this presents **privacy and regulatory risk**.

**Fix:** Set `sendDefaultPii: false` in production, or ensure your privacy policy explicitly discloses PII collection by telemetry providers.

---

### 5. Security — `tracesSampleRate: 1` in Production

All Sentry configs set `tracesSampleRate: 1` (100% tracing). This will:
- Dramatically increase Sentry costs at scale
- Degrade app performance

**Fix:** Lower to `0.1` – `0.3` for production. Keep `1.0` only in development.

---

### 6. Missing `/reset-password` Route

[auth-service.ts](file:///c:/Users/HP%202026/Music/yrdly-app/src/lib/auth-service.ts#L248) and [forgot-password/page.tsx](file:///c:/Users/HP%202026/Music/yrdly-app/src/app/forgot-password/page.tsx) both redirect to `/reset-password` after a password reset email — **but this route does not exist**. Users clicking the reset link in their email will get a 404.

**Fix:** Create `src/app/reset-password/page.tsx` that handles the Supabase auth token and lets users set a new password.

---

### 7. Missing PWA Icons

[manifest.json](file:///c:/Users/HP%202026/Music/yrdly-app/public/manifest.json) references `/icon-192x192.png` and `/icon-512x512.png` — **neither file exists in `/public`**. The only image present is `yrdly-logo.png` (1.5KB — very small).

This means:
- PWA "Add to Home Screen" will show a broken icon
- Chrome will not pass the PWA installability check

**Fix:** Generate proper 192×192 and 512×512 PNG icons and place them in `/public`.

---

## 🟠 HIGH PRIORITY — Should Fix Before Launch

### 8. Duplicate Route: `/neighbors` vs `/neighbours`

Two separate routes exist:
- `/neighbors` → renders `CommunityScreen`
- `/neighbours` → renders `NeighboursListScreen`

These are different pages (not aliases), which is confusing for users and for internal linking. The notification service links to `/neighbors`, but internal references may be inconsistent.

**Fix:** Pick one spelling, redirect the other, and consolidate the components.

---

### 9. Dual `AuthProvider` Wrapping

The root layout (`src/app/layout.tsx`) wraps everything in `<AuthProvider>`, and the `(app)/layout.tsx` wraps in **another** `<AuthProvider>`. This results in:
- Two Supabase auth listeners running simultaneously
- Duplicate profile creation attempts
- Potential race conditions on session state

**Fix:** Remove `<AuthProvider>` from `(app)/layout.tsx` since it's already provided by the root layout.

---

### 10. Duplicate `supabaseAdmin` Client

Two admin client exports exist:
- [supabase.ts](file:///c:/Users/HP%202026/Music/yrdly-app/src/lib/supabase.ts#L25) — conditionally created
- [supabase-admin.ts](file:///c:/Users/HP%202026/Music/yrdly-app/src/lib/supabase-admin.ts) — unconditionally uses `!` assertion

The API routes import from `supabase-admin.ts`, but some services import from `supabase.ts`. This creates inconsistency and potential bugs when one is `null`.

**Fix:** Consolidate into a single `supabase-admin.ts` module and remove the admin client from `supabase.ts`.

---

### 11. Escrow Service — Inconsistent Commission Rate

| Location | Commission |
|----------|------------|
| [escrow-service.ts](file:///c:/Users/HP%202026/Music/yrdly-app/src/lib/escrow-service.ts#L11) | **2%** (`COMMISSION_RATE = 0.02`) |
| [payment/initialize/route.ts](file:///c:/Users/HP%202026/Music/yrdly-app/src/app/api/payment/initialize/route.ts#L64) | **3%** (`price * 0.03`) |

Additionally, the escrow service says "buyer pays full item price" while the API route adds commission on top (`totalAmount = price + commission`).

**Fix:** Centralize the commission rate in `constants.ts` and ensure both API and client-side service agree on the calculation logic.

---

### 12. `images.unoptimized: true` in Next.js Config

[next.config.mjs](file:///c:/Users/HP%202026/Music/yrdly-app/next.config.mjs#L8) sets `images: { unoptimized: true }`. This **disables** Next.js Image Optimization entirely — every image is served at full size. This is extremely bad for mobile performance, especially for a PWA targeting Nigeria where bandwidth may be limited.

**Fix:** Set `unoptimized: false` and configure `remotePatterns` for your Supabase storage URLs.

---

### 13. Sentry Test & Example Pages in Production

These routes are accessible in production:
- `/sentry-example-page`
- `/test-sentry`
- `/api/sentry-example-api`

They expose debugging components and error-triggering functionality to end users.

**Fix:** Remove these pages and the corresponding `SentryExampleComponent.tsx` before launch.

---

### 14. Service Worker — Stub Offline Sync

The service worker's `getOfflineActions()`, `performOfflineAction()`, and `removeOfflineAction()` functions are **empty stubs** that return `[]` or just `console.log()`. The SW caches API routes (`/api/posts`, `/api/users`, etc.) that **don't exist** — the app uses Supabase directly, not REST API routes.

**Fix:** Either implement real IndexedDB offline queuing, or simplify the SW to only cache static assets and show the offline page.

---

### 15. Duplicate Service Worker `message` Event Listeners

[sw.js](file:///c:/Users/HP%202026/Music/yrdly-app/public/sw.js) has **two** `message` event listeners (lines 292 and 334). The second one will shadow/race with the first.

**Fix:** Merge into a single `message` handler with a switch/if on `event.data.type`.

---

### 16. No `robots.txt` or `sitemap.xml`

No `robots.txt` or `sitemap.xml` files exist in the app. The middleware allows them through, but they'll 404. This hurts SEO and PWA discoverability.

**Fix:** Add `src/app/robots.ts` and `src/app/sitemap.ts` using Next.js's metadata API.

---

## 🟡 MEDIUM PRIORITY — Launch Quality

### 17. Excessive `console.log` Statements

`console.log` calls are present in **9+ files** including critical services:
- `storage-service.ts` (20+ debug logs with emoji prefixes)
- `notification-service.ts`, `notification-triggers.ts`
- `payout-service.ts`
- `FriendshipContext.tsx`

While `removeConsole` is set in `next.config.mjs` for production, this only affects the compiled bundle — server-side logs (API routes, services) will still appear in Vercel logs, generating noise.

**Fix:** Replace with Sentry logger (as documented in `.cursorrules`) or remove debug logs from services.

---

### 18. Copyright Year is "2024" in All Emails

All email templates in [brevo-service.ts](file:///c:/Users/HP%202026/Music/yrdly-app/src/lib/brevo-service.ts) and [email-templates.ts](file:///c:/Users/HP%202026/Music/yrdly-app/src/lib/email-templates.ts) say `© 2024 Yrdly`. It's now 2026.

**Fix:** Use `new Date().getFullYear()` or update to `© 2026`.

---

### 19. `package.json` Name is `"nextn"` not `"yrdly-app"`

The package name is `"nextn"` (line 2 of `package.json`) — clearly a scaffold leftover.

**Fix:** Change to `"yrdly-app"` or `"yrdly"`.

---

### 20. Both `pnpm-lock.yaml` and `package-lock.json` Exist

Two lock files from different package managers are present:
- `package-lock.json` (npm)
- `pnpm-lock.yaml` (pnpm)

This causes confusion about which package manager is canonical. The `vercel.json` uses `npm`.

**Fix:** Delete `pnpm-lock.yaml` and commit only `package-lock.json`. Add `pnpm-lock.yaml` to `.gitignore`.

---

### 21. PWA Manifest — `background_color` and `theme_color` Mismatch

The [manifest.json](file:///c:/Users/HP%202026/Music/yrdly-app/public/manifest.json) has:
- `background_color: "#ffffff"` (white)
- `theme_color: "#10b981"` (green)

But the app forces dark mode. The splash screen during PWA launch will flash white before dark mode loads.

**Fix:** Set `background_color` to match your dark background (`#030712` or similar).

---

### 22. `user-scalable=no` in Viewport Meta

The viewport in [layout.tsx](file:///c:/Users/HP%202026/Music/yrdly-app/src/app/layout.tsx#L25) includes `user-scalable=no, maximum-scale=1`. This prevents users from zooming — which is an **accessibility violation** (WCAG 1.4.4). Some app stores may also reject this.

**Fix:** Remove `user-scalable=no` and `maximum-scale=1`. Use CSS `touch-action: manipulation` (already present) for a similar effect without blocking zoom.

---

### 23. `assetPrefix` Set to Empty String

```js
assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
```
This line does nothing — both branches are identical empty strings. It's dead code.

**Fix:** Remove the line entirely.

---

### 24. Deprecated Sentry Config — Duplicate `sentryWebpackPluginOptions`

[next.config.mjs](file:///c:/Users/HP%202026/Music/yrdly-app/next.config.mjs#L36-L52) defines `sentryWebpackPluginOptions` with `tunnelRoute: "/monitoring"` — but this variable is **never used**. The actual config passed to `withSentryConfig` on line 54 has `tunnelRoute` commented out. This is dead code and a maintenance hazard.

**Fix:** Remove the unused `sentryWebpackPluginOptions` variable.

---

### 25. Google Ads Script on All Pages

Google AdSense script (`ca-pub-7576498244677518`) loads on every page, including auth pages (login, signup, onboarding). This degrades first-load performance and creates a poor UX for logged-out users.

**Fix:** Move AdSense script to only load within the `(app)` layout for authenticated pages.

---

## 🔵 LOW PRIORITY — Nice to Have

### 26. Type Definitions — Inline vs Generated

[supabase.ts](file:///c:/Users/HP%202026/Music/yrdly-app/src/lib/supabase.ts#L34) has manually defined `Database` types with a comment "we'll generate these later". The type definitions only cover the `users` table. This means all other table queries (posts, businesses, escrow_transactions, notifications, etc.) are **untyped**.

**Fix:** Run `supabase gen types typescript` to generate complete types.

---

### 27. Missing `.env.example`

No `.env.example` or `.env.template` file exists. The project requires **12+ environment variables** across Supabase, Flutterwave, Brevo, Sentry, and Google Maps. A new developer would have no reference.

**Fix:** Create `.env.example` with all required variables listed (with placeholder values).

---

### 28. No Rate Limiting on API Routes

The payment API routes have no rate limiting. An attacker could spam `POST /api/payment/initialize` to create millions of pending escrow transactions.

**Fix:** Add Vercel's `@vercel/edge-rate-limit` or implement simple IP-based rate limiting via middleware.

---

### 29. No Webhook Endpoint for Flutterwave

The `FlutterwaveService.handleWebhook()` method exists in [flutterwave-service.ts](file:///c:/Users/HP%202026/Music/yrdly-app/src/lib/flutterwave-service.ts#L119), but there's **no corresponding API route** (`/api/webhooks/flutterwave`). Payment confirmations rely solely on client-side verification, which is unreliable.

**Fix:** Create a `POST /api/webhooks/flutterwave/route.ts` endpoint that Flutterwave can call to confirm payments.

---

### 30. `public/index.html` — Why?

A static `public/index.html` exists alongside the Next.js app. This file will be served directly by the static file server, potentially conflicting with the Next.js root page.

**Fix:** Remove `public/index.html`.

---

### 31. npm Vulnerabilities

The `npm install` output reported **14 vulnerabilities (4 moderate, 10 high)**. These should be reviewed and addressed.

**Fix:** Run `npm audit fix` and review remaining issues.

---

## Environment Variables Checklist

Based on code analysis, these env vars are required:

| Variable | Used In | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | supabase.ts, supabase-admin.ts | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | supabase.ts | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | supabase-admin.ts | ✅ |
| `FLUTTERWAVE_PUBLIC_KEY` | flutterwave-service.ts | ✅ |
| `FLUTTERWAVE_SECRET_KEY` | payment API routes | ✅ |
| `FLUTTERWAVE_SECRET_HASH` | flutterwave-service.ts (webhooks) | ⚠️ |
| `NEXT_PUBLIC_APP_URL` | payment routes, email links | ✅ |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | (app)/layout.tsx | ✅ |
| `BREVO_API_KEY` | brevo-service.ts | ✅ |
| `BREVO_FROM_EMAIL` | brevo-service.ts | ✅ |
| `MAINTENANCE_MODE` | middleware.ts | Optional |
| `SENTRY_DSN` | Should be used (currently hardcoded) | ✅ |

---

## Summary Scorecard

| Category | Score | Notes |
|----------|-------|-------|
| **Security** | 🔴 Poor | Unauthenticated API routes, hardcoded secrets |
| **Architecture** | 🟡 Fair | Clean structure, but duplication issues |
| **Type Safety** | 🟢 Good | TypeScript compiles cleanly |
| **Error Handling** | 🟢 Good | Dedicated error messages, Sentry integration |
| **SEO** | 🔴 Poor | No robots.txt, no sitemap, minimal metadata |
| **PWA** | 🟠 Needs Work | Missing icons, stale manifest, stub offline |
| **Performance** | 🟠 Needs Work | Unoptimized images, 100% Sentry tracing |
| **Accessibility** | 🟠 Needs Work | User-scalable blocked |
| **DevOps** | 🟡 Fair | No .env.example, dual lock files |
| **Code Quality** | 🟡 Fair | Excessive console.logs, dead code |

---

## Recommended Priority Order

1. **Add auth to payment API routes** (Critical security)
2. **Create `/reset-password` route** (Broken user flow)
3. **Fix PWA icons** (Broken PWA install)
4. **Remove Sentry test pages** (Security/UX)
5. **Fix commission rate inconsistency** (Financial accuracy)
6. **Remove duplicate AuthProvider** (Race condition risk)
7. **Consolidate admin client** (Consistency)
8. **Fix neighbors/neighbours duplication** (UX confusion)
9. **Enable image optimization** (Performance)
10. **Create .env.example** (Developer experience)
11. **Add robots.txt and sitemap** (SEO)
12. **Fix copyright years** (Professionalism)
13. **Fix package name** (Cleanliness)
14. **Clean duplicate lock file** (DevOps)
15. **Add Flutterwave webhook route** (Payment reliability)
