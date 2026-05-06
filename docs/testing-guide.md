# Yrdly End-to-End Testing Guide

**Date Generated:** 2026-05-06
**App URL:** [https://app.yrdly.ng](https://app.yrdly.ng)
**Stack:** Next.js 15, Supabase, Flutterwave

---

## 🧪 Setup & Sandbox Credentials

All payment and payout tests **MUST** use sandbox credentials. Never use real banking or card details.

### Sandbox Card (Buyer)
- **Number:** `4111 1111 1111 1111`
- **Expiry:** `12/30`
- **CVV:** `123`
- **PIN:** `3310`
- **OTP:** `12345`

### Sandbox Bank Account (Seller Payout)
- **Bank:** Access Bank (Code: `044`)
- **Account Number:** `0690000031`

### Multi-Account Testing Setup
To test end-to-end flows (Marketplace, Messaging, Friends), you need three browser profiles or different browsers:
1. **Account A (Seller):** Primary test account.
2. **Account B (Buyer):** Secondary test account.
3. **Admin Account:** Any account with `is_admin = true` in the `users` table.

---

## Module 1 — Authentication

### Test 1.1 — Full Onboarding Flow
**Accounts needed:** New Email
**Preconditions:** None
**Steps:**
1. Navigate to `/login`.
2. Enter a new email address.
3. Check email for the Supabase magic link/confirmation (or check Supabase dashboard).
4. Upon return, verify you are at `/onboarding/welcome`.
5. Step 1 (Username): Enter a unique username. Verify availability check works.
6. Step 2 (Location): Select a Ward and LGA.
7. Step 3 (Profile): Upload an avatar image.
8. Complete onboarding.
**Expected result:** User is redirected to `/home`. `users` table row updated with username, location, and avatar.
**Pass criteria:** Dashboard loads and shows "Welcome [Username]".
**If it fails:** Check `src/app/onboarding/profile/page.tsx` or Supabase `users` table constraints.

### Test 1.2 — Password Reset
**Accounts needed:** Existing Account
**Steps:**
1. Navigate to `/forgot-password`.
2. Enter email and submit.
3. Click reset link in email.
4. Enter new password on `/reset-password`.
5. Attempt login with new password.
**Expected result:** Password updates successfully; user can log in.
**Pass criteria:** User reaches `/home` with the new password.

---

## Module 2 — Social Feed

### Test 2.1 — Post Creation & Feed
**Accounts needed:** Account A
**Steps:**
1. On `/home`, click the "Create Post" area.
2. Enter text and attach an image.
3. Submit post.
**Expected result:** Post appears instantly at the top of the feed. Image is served correctly from Supabase Storage.
**Pass criteria:** Post is visible and image loads without 404.
**If it fails:** Check `posts` table and Supabase Storage bucket permissions.

---

## Module 3 — Messaging

### Test 3.1 — Real-time Direct Messaging
**Accounts needed:** Account A & Account B
**Steps:**
1. Account A: Go to Account B's profile and click "Message".
2. Account A: Send "Hello Neighbor!".
3. Account B: Navigate to `/messages`.
**Expected result:** Account B sees the message instantly without a page refresh.
**Pass criteria:** Message appears in both chat windows in real-time.
**If it fails:** Check Supabase Realtime replication settings for `messages` table.

---

## Module 4 — Marketplace & Escrow (Critical)

### Test 4.1 — Seller Listing & Buyer Checkout
**Accounts needed:** Account A (Seller), Account B (Buyer)
**Steps:**
1. **Seller:** Go to `/profile/payout-settings` and add the sandbox bank account (Access Bank, 0690000031).
2. **Seller:** Navigate to `/marketplace` -> "List Item". Upload image, set price (e.g., ₦1,000), title, and description.
3. **Buyer:** Locate the item in `/marketplace`. Click "Buy Now".
4. **Buyer:** Complete the Flutterwave modal using the sandbox card details.
**Expected result:** Buyer is redirected to a success page. `escrow_transactions` row created with status `paid`.
**Pass criteria:** Transaction status in Supabase is `paid`.

### Test 4.2 — Escrow Lifecycle to Completion
**Accounts needed:** Account A (Seller), Account B (Buyer)
**Preconditions:** Transaction status is `paid`.
**Steps:**
1. **Seller:** Go to `/transactions/[ID]` (or "Sold Items"). Click "Mark as Shipped".
2. **Buyer:** Go to `/transactions/[ID]` (or "Purchases"). Click "Confirm Receipt".
**Expected result:** 
- Status transitions: `paid` -> `shipped` -> `completed`.
- Payout service triggers: 97% of funds sent to Seller's sandbox account.
- Yrdly receives 3% commission.
**Pass criteria:** Transaction status is `completed`. Seller receives a "Funds Released" notification.

### Test 4.3 — Auto-Release Cron (48h Protection)
**Accounts needed:** Account A (Seller), Account B (Buyer)
**Preconditions:** Transaction status is `shipped`.
**Steps:**
1. Manually update the `shipped_at` column for the transaction in Supabase to `current_timestamp - interval '49 hours'`.
2. Use a tool like Postman or `curl` to POST to `https://app.yrdly.ng/api/cron/auto-release` with header `Authorization: Bearer [CRON_SECRET]`.
**Expected result:** Transaction status transitions to `completed`. Payout is triggered automatically.
**Pass criteria:** Supabase response shows `count: 1` released.

### Test 4.4 — Dispute Resolution (Refund)
**Accounts needed:** Account A (Seller), Account B (Buyer), Admin
**Preconditions:** Transaction status is `shipped`.
**Steps:**
1. **Buyer:** On transaction page, click "Dispute". Enter reason "Item never arrived".
2. **Admin:** Log in to `/admin/disputes`. Find the dispute.
3. **Admin:** Select "Resolve in favor of Buyer (Refund)".
**Expected result:** Transaction status transitions to `cancelled`. Funds are returned to buyer (simulated in sandbox).
**Pass criteria:** Transaction status is `cancelled`.

---

## Module 5 — Notifications

### Test 5.1 — Notification Triggers
**Steps:**
1. Have Account B "Like" Account A's post.
2. Have Account B "Comment" on Account A's post.
**Expected result:** Account A sees a red badge on the navigation bar and new entries in `/notifications`.
**Pass criteria:** Clicking the notification takes you to the specific post.

---

## Module 6 — PWA & Offline

### Test 6.1 — Offline Fallback
**Steps:**
1. Open the app in Chrome on Android/iOS.
2. Install the PWA to the home screen.
3. Open the PWA.
4. Turn off Wi-Fi/Data.
5. Navigate to a new internal page.
**Expected result:** The app should display a custom "Offline" message rather than the browser's "No Internet" error.
**Pass criteria:** The custom offline UI is visible.

---

## Module 7 — Security Spot Checks

### Test 7.1 — Unauthenticated API Block
**Steps:** 
1. Open a private window (unlogged).
2. Attempt to `POST` to `/api/payment/initialize` using a tool like Postman.
**Expected result:** `401 Unauthorized`.

### Test 7.2 — Admin Guard
**Steps:**
1. Log in as a regular user (`is_admin = false`).
2. Manually type `/admin/disputes` into the address bar.
**Expected result:** Automatic redirect to `/home`.

---

## Results Tracker

| # | Module | Test | Result | Notes |
|---|---|---|---|---|
| 1.1 | Auth | Onboarding Flow | | |
| 1.2 | Auth | Password Reset | | |
| 2.1 | Social | Post Creation | | |
| 3.1 | Messaging | Real-time Chat | | |
| 4.1 | Escrow | Sandbox Payment | | |
| 4.2 | Escrow | Flow to Completion | | |
| 4.3 | Escrow | Auto-Release Cron | | |
| 4.4 | Escrow | Dispute Refund | | |
| 5.1 | Notifications | Trigger & Badge | | |
| 6.1 | PWA | Offline Fallback | | |
| 7.1 | Security | API Auth Check | | |
| 7.2 | Security | Admin Redirect | | |
