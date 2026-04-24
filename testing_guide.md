# Yrdly Marketplace: End-to-End Testing Guide

To verify the entire marketplace escrow flow locally in development using Flutterwave's Sandbox Environment, follow this precise order of operations. You will need two separate test accounts (or two browsers, e.g., Chrome and Incognito).

## Step 1: The Seller Registration
1. **Log in** as the Seller (Account A).
2. **Navigate to Settings > Marketplace**: Click on **Payout Settings**.
3. **Link Bank Account (Test Data)**: Because you are using Test API keys, real bank accounts will be rejected. You must use the Flutterwave Sandbox Mock Account:
   - **Bank:** Access Bank (`044`)
   - **Account Number:** `0690000031`
   - **Account Name:** Test Seller
4. **Create a Listing**: Navigate to your profile or the Marketplace tab and create a new catalog item for sale (give it a recognizable name like `Test Item 1` and a price).

## Step 2: The Buyer Checkout (Escrow Hold)
1. **Log in** as the Buyer (Account B) in a totally separate incognito window.
2. **Navigate to the Marketplace** and find `Test Item 1`. 
3. **Click Buy**: This triggers the Flutterwave checkout modal. 
4. **Enter Payment Details (Test Data)**: Do NOT use a real credit card. Use the official Flutterwave Sandbox Card:
   - **Card Number:** `4111 1111 1111 1111`
   - **Expiry:** Any future date (e.g., `12/30`)
   - **CVV:** Any 3 digits (e.g., `123`)
   - **Pin:** Any 4 digits (e.g., `3310`)
   - **OTP:** Any 5-digit number (e.g., `12345`)
5. **Verify Escrow Creation**: The transaction will succeed. Supabase will spawn a new row in your `transactions` table with a status of `ESCROW_HELD`. At this moment, Flutterwave is rigidly holding the funds.

## Step 3: Fulfillment & Release
1. **Switch back to the Seller (Account A)**. 
2. Go to your **Orders/Transactions** tab within messages or your profile.
3. Locate the new order for `Test Item 1` and mark it as **Shipped**. 
   *(In Supabase, the transaction status updates from `ESCROW_HELD` to `SHIPPED`)*
4. **Switch back to the Buyer (Account B)**.
5. In the Buyer's order timeline, a **Confirm Receipt** button will now be active. 
6. Click **Confirm Receipt**. 

## Final Result & Payout
The moment the buyer clicks **Confirm Receipt**, `yrdly-app` executes the core business logic:
- The transaction status becomes `COMPLETED`.
- Yrdly's internal API fires the `POST /api/payment/verify` logic.
- 97% of the funds are instantly released into the Seller's `0690000031` mock Access Bank account!
- *Optional Check:* If you don't click Confirm Receipt, Vercel's Cron job will automatically do it for you when 48 hours is up!
