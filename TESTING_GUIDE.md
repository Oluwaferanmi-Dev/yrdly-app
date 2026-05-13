# Yrdly Platform: End-to-End Testing Guide

This guide outlines the steps to validate the Marketplace and Event Ticketing flows on the live production/staging environment. Since Flutterwave is in **Test Mode**, use the provided test card details.

---

## 🛠️ 1. Preparation
### Test Accounts
You will need **two separate browser sessions** (or one browser and one Incognito window) to simulate the Buyer and Seller.
*   **Account A (Seller):** Set up a Seller profile.
*   **Account B (Buyer):** A regular user account.

### Flutterwave Test Credentials
When prompted for payment, use these [Flutterwave Test Cards](https://developer.flutterwave.com/docs/integration-guides/testing-helpers):
*   **Card Number:** `4000 0000 0000 0002`
*   **Expiry:** `02/26`
*   **CVV:** `123`
*   **PIN:** `1234`
*   **OTP:** `12345`

---

## 🛍️ 2. Marketplace Testing (Item Sales)

### Phase A: Seller Onboarding & Security
1.  **Setup Payouts**: Go to Settings/Seller Dashboard -> "Add Payout Account".
2.  **Name Match Test (Failure)**:
    *   Enter a bank account number that does NOT belong to the name on your Yrdly profile.
    *   **Expectation**: Paystack should resolve the name, detect the mismatch, and block the addition with an error message.
3.  **Name Match Test (Success)**:
    *   Enter your correct bank details.
    *   **Expectation**: Account is added successfully.
4.  **Verification**: Complete the micro-deposit or manual verification step (if active).

### Phase B: Item Creation
1.  **Create Item**: Use the "Create Item" modal (plus icon on Marketplace).
2.  **Mobile UX Check**: On a mobile device, focus on the Title and Price inputs.
    *   **Expectation**: No automatic zooming on iOS Safari.
3.  **Publish**: Upload an image and set a price.

### Phase C: Purchase Flow
1.  **Switch to Account B (Buyer)**: Find the item in the Marketplace.
2.  **Buy Now**: Click the "Buy" button.
3.  **Cooling-off Guard (Test)**:
    *   If Account A just updated their bank details < 48 hours ago, try to pay.
    *   **Expectation**: Payment should be blocked with a message: *"Seller recently updated account. Payouts held for 48 hours."*
4.  **Complete Payment**: Use the Flutterwave Test Card.
5.  **Success**: You should be redirected back to Yrdly with a "Payment Successful" confirmation.

---

## 🎫 3. Event Ticketing Testing

### Phase A: Event Creation
1.  **Create Event**: Go to the Events tab -> "Create Event".
2.  **Redesign Check**: Verify the modal matches the new premium layout (p-0 padding, structured sections).
3.  **Tickets**: Add at least two ticket types (e.g., "Regular" and "VIP").

### Phase B: Ticketing Flow
1.  **Switch to Account B (Buyer)**: Open the event page.
2.  **Select Tickets**: Choose quantities for the tickets.
3.  **Checkout**: Proceed to payment.
4.  **Verification**: Complete payment via Flutterwave.
5.  **Ticket Delivery**: Check the "My Tickets" section in the app.
    *   **Expectation**: Ticket QR codes/details should be visible and downloadable.

---

## 📱 4. Mobile UX Final Sweep
On a physical mobile device (preferably iPhone/Safari):
1.  **Keyboard Check**: Open the "Create Post" dialog. Type in the text area.
    *   **Expectation**: The "Post" button remains accessible; the modal doesn't get pushed off-screen in a way that breaks layout.
2.  **Tap Targets**: Go to any Post Card. Tap the three dots (`...`) menu.
    *   **Expectation**: The menu opens consistently on the first tap (the hit area is now 44px).
3.  **Search**: Use the global search bar.
    *   **Expectation**: Input is clear, font size is readable, and no zooming occurs.

---

## 🚨 Troubleshooting
*   **Payment Link doesn't open**: Ensure `NEXT_PUBLIC_APP_URL` is set correctly in Vercel to match your production domain.
*   **Subaccount Error**: Check if the bank code used is correct (verify against `nigerian-banks.json`).
*   **Supabase Errors**: Check the Vercel logs if "Failed to fetch" or "Internal Server Error" appears during account setup.
