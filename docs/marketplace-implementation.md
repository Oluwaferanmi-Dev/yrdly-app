# Yrdly Marketplace — Implementation Guide

> **Status:** Design & Planning Phase  
> **Payment Provider:** Flutterwave  
> **Commission:** Configurable (currently 3%) — stored in Supabase config, never hardcoded  
> **Delivery:** Not included in V1 — buyers and sellers arrange physical meetup themselves

---

## 1. Overview

Yrdly Marketplace is a hyper-local peer-to-peer buying and selling platform. Users see items first within their **ward**, expanding to **LGA**, then **state** — with filters to see beyond their area. All transactions go through a **Flutterwave escrow** flow with Yrdly taking a configurable platform commission.

---

## 2. Core User Flows

### 2.1 Selling Flow

```
Seller → Create Listing → Item Goes Live (ward-first visibility)
  → Buyer messages → Negotiation in Chat
  → Buyer pays via Flutterwave → Funds locked in escrow
  → Seller marks item as "Sent / Ready for pickup"
  → Buyer marks item as "Received & OK" → Funds released to seller (minus commission)
  → Both parties leave a review
```

### 2.2 Buying Flow

```
Buyer → Browse Marketplace (ward/LGA/state filtered)
  → View Item Detail → Message Seller
  → Agree on price in chat → Tap "Pay Now"
  → Flutterwave payment page → Funds held in escrow
  → Wait for seller to mark "Sent"
  → Inspect item → Mark "Received" OR raise a Dispute
```

---

## 3. Database Schema

### `marketplace_items`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `seller_id` | uuid FK → users | |
| `title` | text | |
| `description` | text | |
| `price` | numeric | in Naira |
| `condition` | enum | `new` `like_new` `used` `fairly_used` |
| `category` | text | see categories list |
| `images` | text[] | Supabase Storage URLs |
| `state` | text | seller's state |
| `lga` | text | seller's LGA |
| `ward` | text | seller's ward |
| `status` | enum | `active` `pending_payment` `in_escrow` `sent` `completed` `disputed` `sold` |
| `is_boosted` | boolean | paid boost active |
| `boost_expires_at` | timestamptz | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `marketplace_transactions`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `item_id` | uuid FK → marketplace_items | |
| `buyer_id` | uuid FK → users | |
| `seller_id` | uuid FK → users | |
| `amount` | numeric | agreed sale price |
| `commission_rate` | numeric | snapshot at time of purchase (e.g. 0.03) |
| `commission_amount` | numeric | `amount × commission_rate` |
| `seller_payout` | numeric | `amount − commission_amount` |
| `flw_tx_ref` | text | Flutterwave transaction reference |
| `flw_transfer_ref` | text | Flutterwave payout reference |
| `status` | enum | `awaiting_payment` `paid` `seller_confirmed` `completed` `disputed` `refunded` |
| `escrow_released_at` | timestamptz | |
| `auto_release_at` | timestamptz | set to NOW()+48h when seller marks sent |
| `created_at` | timestamptz | |

### `platform_config`
| Column | Type | Notes |
|---|---|---|
| `key` | text PK | e.g. `marketplace_commission_rate` |
| `value` | text | e.g. `0.03` |
| `description` | text | human-readable label |
| `updated_at` | timestamptz | |
| `updated_by` | uuid | admin user id |

> ⚠️ Commission is always read from `platform_config` at payment time — never hardcoded.  
> The rate is **snapshotted** into `commission_rate` on each transaction so historical records are never affected by future rate changes.

### `marketplace_boosts`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `item_id` | uuid FK | |
| `seller_id` | uuid FK | |
| `plan` | text | `basic_24h` `standard_72h` `premium_7d` |
| `price_paid` | numeric | |
| `flw_tx_ref` | text | |
| `starts_at` | timestamptz | |
| `expires_at` | timestamptz | |

### `seller_payout_accounts`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `bank_code` | text | CBN bank code |
| `bank_name` | text | |
| `account_number` | text | encrypted |
| `account_name` | text | verified name from FLW |
| `is_verified` | boolean | Flutterwave verified |
| `created_at` | timestamptz | |

---

## 4. Payment & Escrow Flow (Flutterwave)

### Step 1 — Buyer Initiates Payment
```
Client  → POST /api/marketplace/initiate-payment
           body: { item_id, agreed_price }

Server:
  1. Read commission_rate from platform_config
  2. Create marketplace_transaction record (status: awaiting_payment)
  3. Generate Flutterwave Hosted Payment link
       amount:   agreed_price
       tx_ref:   transaction.id
       customer: buyer's email + phone
       meta:     { transaction_id, item_id }
  4. Return { payment_url }

Client  → Redirect buyer to payment_url
```

### Step 2 — Flutterwave Webhook (Payment Confirmed)
```
POST /api/webhooks/flutterwave
  (secured by verifying FLW-Signature header)

Server:
  1. Verify webhook signature using FLW_WEBHOOK_SECRET_HASH
  2. Find transaction by tx_ref
  3. Verify amount matches (prevent underpayment)
  4. Update transaction status → "paid"
  5. Update item status       → "in_escrow"
  6. Notify seller: "Payment received — mark as sent when ready"
  7. Notify buyer:  "Payment confirmed — funds secured in escrow"
```

### Step 3 — Seller Marks as Sent
```
Client  → POST /api/marketplace/mark-sent
           body: { transaction_id }

Server:
  1. Verify caller is the seller
  2. Update transaction status  → "seller_confirmed"
  3. Set auto_release_at         = NOW() + 48 hours
  4. Update item status          → "sent"
  5. Notify buyer: "Item is ready. Confirm receipt within 48h or funds auto-release."
```

### Step 4a — Buyer Marks as Received (Normal Flow)
```
Client  → POST /api/marketplace/mark-received
           body: { transaction_id }

Server:
  1. Verify caller is the buyer
  2. Trigger Flutterwave Transfer API:
       amount:    transaction.seller_payout
       account:   seller's bank account
       reference: generate unique flw_transfer_ref
  3. Update transaction status → "completed"
  4. Update item status        → "sold"
  5. Notify seller: "₦X sent to your account"
  6. Prompt both users for reviews
```

### Step 4b — Auto-Release (48h Timeout)
```
Supabase Edge Function (pg_cron — runs hourly):

  SELECT * FROM marketplace_transactions
  WHERE status = 'seller_confirmed'
    AND auto_release_at <= NOW();

  → For each: trigger same payout as Step 4a
  → Notify buyer: "Funds auto-released to seller after 48h"
```

### Step 4c — Buyer Raises Dispute
```
Client  → POST /api/marketplace/raise-dispute
           body: { transaction_id, reason, evidence_urls[] }

Server:
  1. Update transaction status → "disputed"
  2. Pause auto-release (set auto_release_at = NULL)
  3. Create row in disputes table
  4. Notify admin (push + email)
  5. Notify seller: "A dispute has been raised. Funds on hold."
```

---

## 5. Commission Logic

```typescript
// src/lib/marketplace/commission.ts

export async function getCommissionRate(): Promise<number> {
  const { data } = await supabase
    .from('platform_config')
    .select('value')
    .eq('key', 'marketplace_commission_rate')
    .single();
  return parseFloat(data?.value ?? '0.03'); // safe fallback if config missing
}

export function calculateAmounts(salePrice: number, rate: number) {
  const commission  = Math.round(salePrice * rate * 100) / 100;
  const sellerPayout = salePrice - commission;
  return { commission, sellerPayout };
}
```

Admin updates the rate via the admin panel → writes to `platform_config`.

---

## 6. Location Filtering

### Default: Ward-First
```
Visibility priority when browsing:
  1. Same ward  ← shown first
  2. Same LGA
  3. Same state
  4. All Nigeria (opt-in filter)
```

### Filter UI Options
- **My Ward** (default)
- **My LGA**
- **My State**
- **All Nigeria**

### Supabase Query Logic
```sql
SELECT *, CASE
  WHEN ward  = :user_ward  THEN 0
  WHEN lga   = :user_lga   THEN 1
  WHEN state = :user_state THEN 2
  ELSE 3
END AS proximity_rank
FROM marketplace_items
WHERE status = 'active'
  AND (ward = :user_ward OR lga = :user_lga OR state = :user_state)
ORDER BY
  proximity_rank ASC,
  is_boosted DESC,   -- boosted rise within their tier
  created_at DESC;
```

---

## 7. Paid Boosts

| Plan | Duration | Price |
|---|---|---|
| Basic | 24 hours | ₦500 |
| Standard | 72 hours | ₦1,200 |
| Premium | 7 days | ₦3,500 |

- Boosted items appear at the top within their location tier
- "⚡ Boosted" badge shown on item card
- Boost prices stored in `platform_config` (same pattern as commission — changeable without code deploy)
- Multiple boosts stack (extend, don't duplicate)
- Boost payment goes straight to Yrdly via Flutterwave (no escrow)

---

## 8. Item Status State Machine

```
active
 └─→ pending_payment      buyer initiates payment
       └─→ in_escrow          FLW webhook confirms funds received
             ├─→ disputed          buyer raises dispute
             │     ├─→ refunded        admin rules for buyer
             │     └─→ completed       admin rules for seller → payout
             └─→ seller_confirmed    seller marks item sent/ready
                   ├─→ completed        buyer confirms receipt (or 48h auto-release)
                   └─→ disputed         buyer raises dispute within 48h window

active → sold    seller manually closes listing outside platform
```

---

## 9. Item Categories (V1)

```
Electronics & Gadgets · Phones & Accessories · Clothing & Fashion
Shoes & Bags · Furniture & Home · Food & Groceries
Vehicles & Parts · Books & Education · Baby & Kids
Sports & Fitness · Beauty & Personal Care · Agricultural Products
Building Materials · Services · Other
```

---

## 10. Seller Requirements

| Requirement | Status |
|---|---|
| Verified phone number | Required to list |
| Saved bank account (verified via FLW) | Required to receive payout |
| Min. 1 item photo | Required |
| Max 6 photos per listing | Enforced |
| Max 10 active free listings | Enforced |

---

## 11. Dispute Resolution

```
1. Buyer raises dispute + uploads evidence (photos/messages)
2. Admin reviews chat history, evidence, item description
3. Admin decision (in /admin/disputes):
     (a) Rule for buyer  → Flutterwave refund to original payment method
     (b) Rule for seller → Flutterwave payout to seller
     (c) Partial split   → Manual FLW transfers for each amount
4. Both parties notified of outcome
5. Item status updated; dispute closed
6. Repeat offenders: account flagged, listings hidden
```

---

## 12. Reviews & Trust

- After transaction completes, both users prompted for 1–5 star rating + optional text
- Rating visible on profiles and item cards
- **Trust Score** = avg rating + completed sales count + verified phone + verified bank
- **Verified Seller** badge = 5+ completed sales + verified bank + verified phone

---

## 13. API Routes to Build

| Route | Method | Description |
|---|---|---|
| `/api/marketplace/initiate-payment` | POST | Generate FLW payment link |
| `/api/marketplace/boost-payment` | POST | Generate FLW boost payment link |
| `/api/marketplace/mark-sent` | POST | Seller confirms item sent/ready |
| `/api/marketplace/mark-received` | POST | Buyer confirms receipt → triggers payout |
| `/api/marketplace/raise-dispute` | POST | Buyer opens dispute |
| `/api/marketplace/cancel` | POST | Cancel transaction before payment |
| `/api/webhooks/flutterwave` | POST | FLW webhook handler (payment + payout events) |
| `/api/admin/marketplace/config` | GET/PUT | Read/update commission rate & boost prices |
| `/api/admin/marketplace/dispute/:id` | PUT | Admin resolves dispute |

---

## 14. Environment Variables

```env
FLUTTERWAVE_SECRET_KEY=
FLUTTERWAVE_PUBLIC_KEY=
FLW_WEBHOOK_SECRET_HASH=
NEXT_PUBLIC_FLW_PUBLIC_KEY=
```

---

## 15. V1 vs. Later

| Feature | V1 | V2+ |
|---|---|---|
| Buy/sell + escrow flow | ✅ | |
| Flutterwave integration | ✅ | |
| Configurable commission | ✅ | |
| Location filtering | ✅ | |
| Free listings (max 10) | ✅ | |
| Paid boosts | ✅ | |
| Reviews & trust score | ✅ | |
| Dispute resolution | ✅ | |
| Delivery / logistics | ❌ | V2 |
| Offer / counter-offer in chat | ❌ | V2 |
| Seller subscription plans | ❌ | V2 |
| Buyer protection insurance | ❌ | V2 |
