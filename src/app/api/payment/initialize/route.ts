import { NextRequest, NextResponse } from "next/server";
import { EscrowService } from "@/lib/escrow-service";
import { ItemTrackingService } from "@/lib/item-tracking-service";
import { DeliveryOption, PaymentMethod } from "@/types/escrow";

/**
 * POST /api/payment/initialize
 *
 * Creates an escrow transaction in Supabase + initialises a Flutterwave
 * Standard payment link, then returns the link to the client.
 *
 * This is the server-side entry-point so that the FLW secret key is
 * never exposed to the browser.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      itemId,
      buyerId,
      sellerId,
      price,
      buyerEmail,
      buyerName,
      itemTitle,
      sellerName,
    } = body as {
      itemId: string;
      buyerId: string;
      sellerId: string;
      price: number;
      buyerEmail: string;
      buyerName: string;
      itemTitle: string;
      sellerName: string;
    };

    // ── Validate ──────────────────────────────────────────
    if (!itemId || !buyerId || !sellerId || !price || !buyerEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (buyerId === sellerId) {
      return NextResponse.json(
        { error: "You cannot buy your own item" },
        { status: 400 }
      );
    }

    // ── Check availability ────────────────────────────────
    const isAvailable = await ItemTrackingService.isItemAvailable(itemId);
    if (!isAvailable) {
      return NextResponse.json(
        { error: "This item is no longer available" },
        { status: 409 }
      );
    }

    // ── Create escrow transaction ─────────────────────────
    const transactionId = await EscrowService.createTransaction(
      itemId,
      buyerId,
      sellerId,
      price,
      PaymentMethod.CARD,
      { option: DeliveryOption.FACE_TO_FACE }
    );

    // ── Commission (3%) ───────────────────────────────────
    const commission = Math.round(price * 0.03);
    const totalAmount = price + commission;

    // ── Build Flutterwave Standard payment payload ────────
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:9002";

    const flwPayload = {
      tx_ref: transactionId,
      amount: totalAmount,
      currency: "NGN",
      redirect_url: `${appUrl}/payment/verify?tx_ref=${transactionId}`,
      payment_options: "card,banktransfer,ussd",
      customer: {
        email: buyerEmail,
        name: buyerName,
      },
      customizations: {
        title: "Yrdly Marketplace",
        description: `Payment for ${itemTitle} from ${sellerName}`,
        logo: `${appUrl}/yrdly-logo.png`,
      },
      meta: {
        transaction_id: transactionId,
        item_title: itemTitle,
        seller_name: sellerName,
        commission,
        item_price: price,
      },
    };

    // ── Call Flutterwave Standard API ─────────────────────
    const flwRes = await fetch(
      "https://api.flutterwave.com/v3/payments",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(flwPayload),
      }
    );

    const flwData = await flwRes.json();

    if (flwData.status !== "success" || !flwData.data?.link) {
      console.error("Flutterwave error:", flwData);
      return NextResponse.json(
        { error: flwData.message || "Failed to initialize payment" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentLink: flwData.data.link,
      transactionId,
    });
  } catch (error) {
    console.error("Payment initialization error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
