import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { EscrowStatus } from '@/types/escrow';
import { createClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const { transactionReference } = await request.json();

    if (!transactionReference) {
      return NextResponse.json(
        { error: 'Transaction reference is required' },
        { status: 400 }
      );
    }

    console.log(`[PaymentVerify] Verifying transaction: ${transactionReference}`);

    // ── Verify payment with Flutterwave directly ──────────
    // This is a direct call to Flutterwave, no user auth needed yet
    const flwRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionReference}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        },
      }
    );
    const flwData = await flwRes.json();

    if (flwData.status !== 'success' || flwData.data?.status !== 'successful') {
      console.error(`[PaymentVerify] Flutterwave verification failed:`, flwData.message);
      return NextResponse.json(
        { error: flwData.message || 'Payment verification failed' },
        { status: 400 }
      );
    }

    const txRef: string = flwData.data.tx_ref;
    const amount: number = parseFloat(flwData.data.amount);

    console.log(`[PaymentVerify] Flutterwave confirmed payment for txRef: ${txRef}`);

    // ── Lookup the transaction ────────────────────────────
    const { data: txRow } = await supabaseAdmin
      .from('escrow_transactions')
      .select('buyer_id, item_id, seller_id, status')
      .eq('id', txRef)
      .single();

    if (!txRow) {
      console.error(`[PaymentVerify] Transaction not found: ${txRef}`);
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // ── Optional: Verify authenticated user is the buyer (for logged-in users) ────
    // But don't require auth — Flutterwave has already verified the payment
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (authUser && txRow.buyer_id !== authUser.id) {
      console.warn(`[PaymentVerify] User ${authUser.id} tried to verify transaction for buyer ${txRow.buyer_id}`);
      return NextResponse.json(
        { error: 'Unauthorized: you cannot verify this transaction' },
        { status: 403 }
      );
    }

    console.log(`[PaymentVerify] Transaction ${txRef} ownership verified`);

    // ── Skip if already paid (idempotent) ──────────────
    if (txRow.status === EscrowStatus.PAID) {
      console.log(`[PaymentVerify] Transaction ${txRef} already marked as PAID (idempotent)`);
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        transactionId: txRef,
        amount,
      });
    }

    // ── Update escrow transaction status (admin bypasses RLS) ──
    const { error: updateError } = await supabaseAdmin
      .from('escrow_transactions')
      .update({
        status: EscrowStatus.PAID,
        payment_reference: transactionReference,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', txRef);

    if (updateError) {
      console.error(`[PaymentVerify] Failed to update escrow transaction ${txRef}:`, updateError);
      // Don't fail — payment was real, log and continue
    } else {
      console.log(`[PaymentVerify] Successfully updated transaction ${txRef} to PAID`);
    }

    // ── Mark item as sold ──────────────────────────────────
    if (txRow.item_id) {
      const { error: saleError } = await supabaseAdmin
        .from('posts')
        .update({ is_sold: true, updated_at: new Date().toISOString() })
        .eq('id', txRow.item_id);
      
      if (saleError) {
        console.error(`[PaymentVerify] Failed to mark item ${txRow.item_id} as sold:`, saleError);
      } else {
        console.log(`[PaymentVerify] Item ${txRow.item_id} marked as sold`);
      }
    }

    // ── Send notification to seller ────────────────────────
    try {
      const { data: buyer } = await supabaseAdmin
        .from('users')
        .select('name')
        .eq('id', txRow.buyer_id)
        .single();

      const { data: item } = await supabaseAdmin
        .from('posts')
        .select('title, text')
        .eq('id', txRow.item_id)
        .single();

      const buyerName = buyer?.name || 'A buyer';
      const itemTitle = item?.title || item?.text || 'an item';

      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: txRow.seller_id,
          type: 'payment_successful',
          title: 'Payment Received! 💰',
          message: `${buyerName} has paid for "${itemTitle}". Arrange handover with the buyer.`,
          related_id: txRef,
          related_type: 'escrow_transaction',
          data: { buyerName, itemTitle, transactionId: txRef, amount },
        });
    } catch (notificationError) {
      console.error('Failed to send payment notification:', notificationError);
      // Don't fail the response — payment is confirmed
    }

    console.log(`[PaymentVerify] Payment verification completed successfully for transaction ${txRef}`);
    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      transactionId: txRef,
      amount,
    });
  } catch (error) {
    console.error('[PaymentVerify] Critical error during payment verification:', error);
    console.error('[PaymentVerify] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
