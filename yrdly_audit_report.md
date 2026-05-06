# Yrdly — Pre-Launch Technical Audit Report

> **Prepared by:** Senior Full-Stack Engineer (AI Code Review)
> **Scope:** Full codebase review — architecture, features, data, security, gaps & risks
> **Status:** Read-only audit. No code changes were made.

---

## A. Project Overview

Yrdly is a **neighborhood-first community and marketplace platform** targeting Nigerian urban residents. Users can:

- Post to a **community feed** (text, images, videos, polls)
- **Buy and sell** items in a local marketplace backed by an **escrow payment system**
- **Message** neighbors directly or in item-specific marketplace conversations
- Manage a **business profile** with a service catalog and reviews
- Receive **push and in-app notifications** for all major events
- Onboard through a multi-step flow: email verification → profile setup (username, LGA, state) → welcome tour

The platform is built on:

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Styling | Tailwind CSS + Radix UI primitives |
| Backend / DB | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Payments | Flutterwave (SDK + REST API) |
| Monitoring | Sentry |
| Notifications | Supabase Realtime + Web Push (VAPID) |
| Maps | Google Maps API |
| Deployment | Vercel (with Cron Jobs) |
| Fonts | Pacifico, Jersey 25, Raleway (Google Fonts) |

---

## B. Project Structure Map

```
yrdly-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout: fonts, dark mode, AuthProvider, Google Ads
│   │   ├── (app)/                        # Authenticated shell (ProtectedLayout + OnboardingGuard)
│   │   │   ├── layout.tsx
│   │   │   ├── home/page.tsx             # Feed → delegates to <HomeScreen>
│   │   │   ├── marketplace/page.tsx      # Marketplace listing → <MarketplaceScreen>
│   │   │   ├── marketplace/[id]/         # Individual item detail + Buy flow
│   │   │   ├── payment/
│   │   │   │   ├── verify/page.tsx       # Post-Flutterwave redirect handler
│   │   │   │   ├── escrow-confirmation/  # Escrow success confirmation UI
│   │   │   │   ├── redirect/             # Intermediate redirect page
│   │   │   │   └── success/              # Final success state
│   │   │   ├── transactions/[id]/        # Transaction detail + status actions
│   │   │   ├── disputes/page.tsx         # User's own disputes list
│   │   │   ├── disputes/[id]/            # Individual dispute detail
│   │   │   ├── admin/disputes/           # Admin dispute dashboard (NO role guard ⚠️)
│   │   │   ├── admin/disputes/[id]/      # Admin dispute resolution
│   │   │   ├── messages/                 # Conversations + individual thread
│   │   │   ├── neighbors/                # Friends / network management
│   │   │   ├── profile/[id]/             # Public user profiles
│   │   │   ├── business/                 # Business profile + catalog
│   │   │   ├── events/                   # Community events
│   │   │   ├── notifications/            # Notification center
│   │   │   └── settings/page.tsx         # Settings → <SettingsScreen>
│   │   ├── auth/
│   │   │   ├── callback/page.tsx         # OAuth redirect handler (client-side)
│   │   │   └── layout.tsx
│   │   ├── login/page.tsx                # Sign-in / Sign-up combined
│   │   ├── onboarding/
│   │   │   ├── verify-email/             # Email OTP / link verification wait screen
│   │   │   ├── profile/page.tsx          # Username + location setup (598 lines, rich UI)
│   │   │   ├── welcome/                  # Post-profile welcome screen
│   │   │   └── tour/                     # App tour
│   │   ├── maintenance/                  # Maintenance mode page
│   │   └── api/
│   │       ├── payment/initialize/route.ts   # Escrow creation + Flutterwave init
│   │       ├── payment/verify/route.ts       # Payment confirmation + status update
│   │       ├── seller/setup-account/route.ts # Flutterwave subaccount creation
│   │       ├── webhooks/flutterwave/route.ts # Async payment event handler
│   │       └── cron/auto-release/route.ts    # Nightly fund auto-release
│   ├── components/
│   │   ├── HomeScreen.tsx
│   │   ├── MarketplaceScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── OnboardingGuard.tsx
│   │   ├── seller-account/
│   │   │   ├── SellerAccountSettings.tsx
│   │   │   ├── AddAccountDialog.tsx
│   │   │   ├── EditAccountDialog.tsx
│   │   │   ├── VerificationDialog.tsx
│   │   │   └── PayoutHistory.tsx
│   │   ├── onboarding/
│   │   │   ├── OnboardingProgress.tsx
│   │   │   └── LoadingState.tsx
│   │   └── ui/                           # Radix-based component library
│   ├── hooks/
│   │   ├── use-supabase-auth.tsx          # Core auth state + profile + realtime sync
│   │   ├── use-onboarding.tsx             # Onboarding step state machine
│   │   ├── use-location-data.tsx          # Lazy-loaded Nigerian states/LGAs/wards
│   │   ├── use-debounce.ts
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── supabase.ts                   # Anon client + DB type stubs
│   │   ├── supabase-admin.ts             # Service-role client (server only)
│   │   ├── auth-service.ts               # signUp/signIn/profile CRUD
│   │   ├── escrow-service.ts             # State transitions for transactions
│   │   ├── flutterwave-service.ts        # FLW SDK + verification + webhooks
│   │   ├── payout-service.ts             # Automated payout orchestration
│   │   ├── seller-account-service.ts     # KYC + bank/wallet account management
│   │   ├── dispute-service.ts            # Full dispute lifecycle (512 lines)
│   │   ├── notification-service.ts       # In-app notification CRUD + push dispatch (817 lines)
│   │   ├── push-notification-service.ts  # VAPID push subscriptions
│   │   ├── onboarding-analytics.ts       # Analytics tracking for onboarding events
│   │   ├── error-messages.ts             # Friendly error formatter
│   │   └── constants.ts                  # All magic numbers centralised
│   └── types/
│       ├── index.ts                       # User, Post, Business, Conversation types
│       ├── escrow.ts                      # EscrowTransaction, EscrowStatus enum
│       └── seller-account.ts             # SellerAccount, PayoutRequest, BankInfo types
├── middleware.ts                          # Maintenance mode toggle
├── vercel.json                            # Cron job schedule
└── .env                                   # Local env vars (test keys)
```

---

## C. Current State of the Codebase

### ✅ Fully Implemented & Functional

| Feature | Files | Notes |
|---------|-------|-------|
| Auth (email/password) | `auth-service.ts`, `login/page.tsx` | Supabase Auth, profile auto-creation on sign-up |
| Auth (Google OAuth) | `auth/callback/page.tsx`, `use-supabase-auth.tsx` | Client-side token exchange in callback page |
| Login lockout / rate limiting | `login/page.tsx` | 5 attempts → 15-min client-side lockout |
| Onboarding guard | `OnboardingGuard.tsx`, `use-onboarding.tsx` | State machine with `redirectInitiated` guard to prevent loops |
| Profile setup | `onboarding/profile/page.tsx` | Real-time username availability check, username suggestions, location picker (State → LGA → Ward) |
| Maintenance mode | `middleware.ts` | `MAINTENANCE_MODE=true` env var redirects all traffic |
| Payment initialization | `api/payment/initialize/route.ts` | Server-side: validates item, creates escrow row, inits Flutterwave session |
| Payment verification | `api/payment/verify/route.ts` | Server-side: verifies with FLW API, updates escrow, marks post sold, notifies seller |
| Flutterwave webhook | `api/webhooks/flutterwave/route.ts` | Idempotent; verifies `verif-hash` header; handles `charge.completed` fallback |
| Escrow state machine | `escrow-service.ts` | `PENDING → PAID → SHIPPED → DELIVERED → COMPLETED → DISPUTED/CANCELLED` |
| Auto-release cron | `api/cron/auto-release/route.ts` | Runs nightly at 00:00 UTC; releases SHIPPED transactions older than 48h |
| Seller account setup | `api/seller/setup-account/route.ts` | Creates FLW subaccount, deactivates old accounts, stores in `seller_accounts` |
| Payout orchestration | `payout-service.ts` | Auto-payout on completion, balance calculation, manual admin trigger |
| Dispute lifecycle | `dispute-service.ts` | Open, evidence submission, admin resolution, refund re-listing |
| In-app notifications | `notification-service.ts` | 25+ typed notification methods; RPC-first with direct-insert fallback |
| Push notifications | `push-notification-service.ts` | VAPID-based Web Push via service worker |
| Notification routing | `notification-service.ts` | `getNotificationUrl()` routes all notification types to correct in-app pages |
| Admin dispute dashboard | `admin/disputes/page.tsx` | Filter by status, search, stats summary |
| User dispute list | `disputes/page.tsx` | Full user-facing dispute management |
| Marketplace messaging | `marketplace/page.tsx` | Creates or retrieves item-specific conversation, deduplicates |

---

### ⚠️ Partially Implemented / Stubbed

| Feature | File | Issue |
|---------|------|-------|
| Mobile Money payouts | `payout-service.ts` | Logic marked as `// TODO: Implement mobile money transfer via Flutterwave`. Falls through to error |
| Digital Wallet payouts | `payout-service.ts` | Same — stubbed with no FLW API call |
| Delete seller account | `SellerAccountSettings.tsx` (line 91) | Comment: `// In a real implementation, you would call a delete method` — currently just reloads data |
| Admin role guard | `admin/disputes/page.tsx` (line 70) | `// TODO: Add admin role check` — any authenticated user can access `/admin/disputes` |
| Apple OAuth | `use-supabase-auth.tsx` | Referenced in auth constants but no `signInWithApple` button implemented in login UI |
| Notification stats | `notification-service.ts` (line 314) | Queries a `notification_stats` view; this view must exist in Supabase — not confirmed |

---

### ❌ Missing / Not Yet Built

| Feature | Impact | Notes |
|---------|--------|-------|
| Admin role system | **Critical** | No `role` field checks on admin routes. Any logged-in user can view `/admin/disputes` |
| `SellerAccountService.deleteAccount()` | Medium | UI has delete button but service method doesn't exist |
| Webhook endpoint registration | **Critical** | `FLUTTERWAVE_SECRET_HASH` env var is not in `.env`. Must be configured in Vercel before production |
| Apple Sign-In | Low | `signInWithApple` hook exists but no UI button. Minor gap |
| Password reset flow | Medium | `login/page.tsx` links to `/forgot-password` but this page was not found in the directory |
| `notification_stats` DB view | Unknown | `getNotificationStats()` queries this view — needs verification |
| `create_notification` RPC | Unknown | Used as primary notification path — must exist in Supabase or fallback is used every time |

---

## D. Data Layer Analysis

### Data Flow — Payment Lifecycle

```
User clicks "Buy" on item
   ↓
POST /api/payment/initialize
   → Validates: item exists, not sold, buyer ≠ seller
   → Creates escrow_transactions row (status: PENDING)
   → Calls Flutterwave API → gets payment_link
   → Returns payment_link to browser
   ↓
User completes payment on Flutterwave
   ↓ (Two parallel paths)
[Path A] Browser redirect → /payment/verify
   → POST /api/payment/verify (with Flutterwave transaction_id)
   → Verifies with FLW API, updates escrow → PAID
   → Marks post.is_sold = true
   → Inserts seller notification
   → Redirects → /payment/escrow-confirmation

[Path B] Webhook → POST /api/webhooks/flutterwave
   → Validates verif-hash header
   → Idempotency check (skips if already PAID)
   → Same updates as Path A
   (This fires even if user closes browser)
   ↓
Seller marks as shipped → escrow → SHIPPED
   ↓
Buyer confirms delivery → escrow → DELIVERED → COMPLETED
   (OR cron at midnight → auto-complete if >48h in SHIPPED)
   ↓
On COMPLETED → PayoutService.processPayout()
   → Fetches seller's primary bank account
   → Calls Flutterwave transfer API
   → Updates payout record
   → Notifies seller
```

### Client ↔ Supabase Data Access

- **Client-side (anon key):** Used in all page components and hooks — subject to RLS policies
- **Server-side (service key):** Used exclusively in `/api/*` routes via `supabase-admin.ts` — bypasses RLS correctly
- **Realtime:** Auth state sync uses `supabase.channel()` for profile changes in `use-supabase-auth.tsx`

> [!IMPORTANT]
> The `supabaseAdmin` client is properly isolated in `src/lib/supabase-admin.ts` and only imported in `src/app/api/` routes. This is the correct pattern and must be maintained.

---

## E. Security Assessment

| Area | Status | Detail |
|------|--------|--------|
| Secret key isolation | ✅ Good | `SUPABASE_SERVICE_ROLE_KEY` and `FLUTTERWAVE_SECRET_KEY` only used server-side |
| Webhook signature | ✅ Good | `verif-hash` header validated against `FLUTTERWAVE_SECRET_HASH` |
| Self-purchase prevention | ✅ Good | `initialize` route explicitly checks `buyer_id === seller_id` |
| Idempotent webhook | ✅ Good | Checks `status !== PENDING` before updating |
| Auth on API routes | ✅ Good | Bearer token pattern used; validated via Supabase `getUser()` |
| Admin route guard | ❌ **Missing** | `/admin/disputes` has a TODO comment instead of a role check |
| CRON authentication | ✅ Good | `auto-release` checks `Authorization: Bearer <CRON_SECRET>` |
| Rate limiting | ⚠️ Client-only | Login lockout is client-side only — a determined attacker bypasses it. No server-side rate limit |
| `FLUTTERWAVE_SECRET_HASH` in env | ❌ Not in `.env` | Must be added to Vercel before production webhook is registered |
| RLS policies | ❓ Not reviewed | Client-side queries depend on RLS — these must be audited in the Supabase dashboard |

---

## F. Environment Variables Audit

| Variable | In `.env` | Required | Notes |
|----------|-----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Yes | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Yes | |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Yes | Server-only |
| `FLUTTERWAVE_SECRET_KEY` | ✅ | Yes | Currently TEST key |
| `FLUTTERWAVE_PUBLIC_KEY` | ✅ | Yes | |
| `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY` | ✅ | Yes | |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | ✅ | Yes | |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | ✅ | Yes | |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ✅ | Yes | Push notifications |
| `VAPID_PRIVATE_KEY` | ✅ | Yes | Server-only |
| `CRON_SECRET` | ✅ | Yes | Cron auth |
| `FLUTTERWAVE_SECRET_HASH` | ❌ **Missing** | Yes | Webhook signature — must be added |
| `MAINTENANCE_MODE` | ❌ Not in `.env` | Optional | Defaults to disabled |

---

## G. Critical Bugs & Risks

### 🔴 P0 — Must Fix Before Launch

1. **Admin route has no role guard**
   - File: `src/app/(app)/admin/disputes/page.tsx`, line 70
   - Risk: Any authenticated user can navigate to `/admin/disputes` and view all disputes
   - Fix: Add a `user.role === 'admin'` check. This requires an `is_admin` column or a roles table in Supabase, plus an RLS policy.

2. **`FLUTTERWAVE_SECRET_HASH` is missing from environment**
   - Risk: Without this, the webhook signature check at line 22 of `webhooks/flutterwave/route.ts` will **always fail** (`signature !== secretHash`). Every webhook will return 401, so payment confirmation will fall entirely on the browser redirect path. Users who close their browser after paying will have stuck `PENDING` transactions.
   - Fix: Register your Flutterwave webhook URL in the FLW dashboard, get the secret hash, and add it to Vercel env vars.

3. **Flutterwave keys are in TEST mode**
   - The `.env` file shows `FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-...`. Production launch requires live keys and a corresponding live webhook registration.

---

### 🟠 P1 — Fix Before Full Production Traffic

4. **Mobile money & digital wallet payouts are stubbed**
   - File: `payout-service.ts`
   - The `processPayout()` function has a `switch` on account type. `mobile_money` and `digital_wallet` branches exist but contain no actual API call — they just throw or return errors. Any seller who adds these account types will never receive a payout.

5. **`/forgot-password` page does not exist**
   - `login/page.tsx` links to `/forgot-password` but no such route was found in the codebase. Users clicking "Forgot Password?" will hit a 404.

6. **Delete account button is a no-op**
   - File: `SellerAccountSettings.tsx`, `handleDeleteAccount()`, line 91
   - The delete button calls `loadData()` instead of an actual delete service method. Users believe they deleted the account but it remains in the database.

---

### 🟡 P2 — Improvements for Stability

7. **Client-only login rate limiting**
   - The 5-attempt lockout in `login/page.tsx` is stored in React state, meaning it resets on page refresh. No server-side protection exists.

8. **`notification_stats` view dependency**
   - `NotificationService.getNotificationStats()` queries `notification_stats` which must be a Supabase view. If it doesn't exist, this will silently throw.

9. **`create_notification` RPC dependency**
   - Every notification creation first tries `supabase.rpc('create_notification')`. If this Postgres function doesn't exist, every call falls back to a direct insert. Verify this RPC exists in Supabase.

10. **Type safety gaps**
    - `SellerAccountSettings.tsx` casts `account.accountDetails as any` (lines 136, 139)
    - `dispute-service.ts` and `seller-account-service.ts` use `any` for `dispute_evidence` and `verification_data` JSON fields
    - `onboarding/profile/page.tsx` passes `any` to `calculateLocationCompleteness()`

11. **OAuth callback uses `setSession()` with URL hash tokens**
    - `auth/callback/page.tsx` manually extracts `access_token` from the URL hash and calls `supabase.auth.setSession()`. This is a legacy pattern. The modern approach is to rely on `supabase.auth.onAuthStateChange()` + `PKCE` flow with `exchangeCodeForSession()`. The current approach works but is fragile if Supabase changes its OAuth URL format.

---

## H. Architecture Observations

### What's Done Well

- **Dual confirmation for payments:** Both browser redirect AND webhook paths can independently confirm a payment. This is production-grade resilience.
- **Idempotency:** The webhook handler checks the current status before updating — prevents double-processing.
- **Server/client separation:** `supabaseAdmin` is strictly imported only in API routes.
- **Constants centralization:** All magic numbers live in `constants.ts` (commission rate 3%, auto-release 48h, etc.) — easy to change without hunting through the codebase.
- **Notification architecture:** 817-line `notification-service.ts` covers every event in the system with typed methods. RPC-first with direct-insert fallback is a solid resilience pattern.
- **OnboardingGuard:** Uses a `redirectInitiated` ref to prevent React re-render loops during routing — a subtle but important detail.
- **Maintenance mode:** Simple and effective — a single env var gates all traffic.

### Design Concerns

- **Pages are thin shells:** Most pages (`home/page.tsx`, `settings/page.tsx`) are just 9-line wrappers around giant Screen components. Good for separation of concerns, but the screen components likely contain all the state and data fetching — worth verifying they don't become god components.
- **Admin is only one directory deep:** The entire admin system is just `/admin/disputes`. There's no admin layout, no admin dashboard page, no metrics. This is fine for MVP but indicates admin tooling is early-stage.
- **No E2E testing evidence:** No `cypress/`, `playwright/`, or `__tests__/` directories were found in the structure. This is a risk for a financial transaction system.

---

## I. Prioritized Action Plan

### Pre-Launch Blockers (Do These First)

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| 1 | Add admin role guard to `/admin/disputes` | `admin/disputes/page.tsx` | 1–2h |
| 2 | Add `FLUTTERWAVE_SECRET_HASH` to Vercel env | Vercel dashboard | 30min |
| 3 | Swap Flutterwave test keys for live keys | Vercel dashboard + FLW dashboard | 1h |
| 4 | Build `/forgot-password` page (Supabase password reset flow) | New page | 3–4h |
| 5 | Implement mobile money payout in `payout-service.ts` | `payout-service.ts` | 4–6h |
| 6 | Implement actual delete in `handleDeleteAccount` | `SellerAccountSettings.tsx` + service | 2h |

### Post-Launch Stability

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| 7 | Server-side rate limiting on auth routes | New middleware / Upstash | 2–4h |
| 8 | Verify `create_notification` RPC exists in Supabase | Supabase SQL editor | 30min |
| 9 | Verify `notification_stats` view exists | Supabase SQL editor | 30min |
| 10 | Migrate OAuth callback to PKCE/`exchangeCodeForSession` | `auth/callback/page.tsx` | 2–3h |
| 11 | Add RLS policy audit (Supabase dashboard) | Supabase | 4–8h |
| 12 | Write E2E tests for escrow lifecycle | Playwright or Cypress | 2–3 days |

### Code Quality

| # | Task | Effort |
|---|------|--------|
| 13 | Replace `as any` casts in seller account and dispute components | 2–4h |
| 14 | Add digital wallet payout implementation | 4–6h |
| 15 | Evaluate the Screen component sizes (HomeScreen, etc.) for splitting | Ongoing |

---

## J. Summary Verdict

| Domain | Status |
|--------|--------|
| Authentication | ✅ Solid — email + Google OAuth, profile auto-creation, onboarding guard |
| Marketplace & Escrow | ✅ Solid — full state machine, dual confirmation, idempotent webhook |
| Payments | ⚠️ Needs live key swap + secret hash config |
| Payouts | ⚠️ Bank account payouts work; mobile money is stubbed |
| Disputes | ✅ Logic complete; admin UI lacks role guard |
| Notifications | ✅ Comprehensive — in-app + push, 25+ event types |
| Security | ⚠️ One critical gap (admin route), one missing env var |
| Testing | ❌ No automated tests found |
| Overall Launch Readiness | **75% — 6 blockers must be resolved before going live** |

---

*This report reflects the codebase state as of the audit date. No code was modified during this review.*
