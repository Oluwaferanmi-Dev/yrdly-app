import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { EscrowStatus } from '@/types/escrow';
import { createClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    // ── Authenticate the caller ────────────────────────
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (!authUser || authError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // transactionReference = Flutterwave's numeric transaction_id (preferred)
    // txRef = our UUID tx_ref (fallback when FLW doesn't append transaction_id)
    const { transactionReference, txRef: bodyTxRef } = await request.json();

    if (!transactionReference && !bodyTxRef) {
      return NextResponse.json(
        { error: 'Transaction reference is required' },
        { status: 400 }
      );
    }

    // ── Check DB first — webhook may have already marked it PAID ──
    if (bodyTxRef) {
      const { data: existing } = await supabaseAdmin
        .from('escrow_transactions')
        .select('buyer_id, item_id, seller_id, status, total_amount')
        .eq('id', bodyTxRef)
        .single();

      if (existing?.buyer_id !== authUser.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      if (existing?.status === EscrowStatus.PAID) {
        return NextResponse.json({
          success: true,
          message: 'Payment already verified',
          transactionId: bodyTxRef,
          amount: existing.total_amount,
        });
      }
    }

    // ── Verify with Flutterwave using numeric transaction_id ──
    // If only tx_ref (UUID) was provided we cannot call the verify endpoint —
    // rely on the webhook to have updated the status, then re-check.
    if (!transactionReference) {
      return NextResponse.json(
        { error: 'Flutterwave transaction_id not available. Payment may still be processing — please wait a moment and retry.' },
        { status: 202 }
      );
    }

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
      return NextResponse.json(
        { error: flwData.message || 'Payment verification failed' },
        { status: 400 }
      );
    }

    const txRef: string = flwData.data.tx_ref;          // our UUID
    const flwTxId: string = String(flwData.data.id);    // FLW numeric ID
    const amount: number = parseFloat(flwData.data.amount);

    // ── Verify the authenticated user is the buyer ────────
    const { data: txRow } = await supabaseAdmin
      .from('escrow_transactions')
      .select('buyer_id, item_id, seller_id, status')
      .eq('id', txRef)
      .single();

    if (!txRow) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (txRow.buyer_id !== authUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized: you cannot verify this transaction' },
        { status: 403 }
      );
    }

    // ── Skip if already paid (idempotent) ──────────────
    if (txRow.status === EscrowStatus.PAID) {
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
        payment_reference: flwTxId,   // store FLW numeric ID, not our UUID
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', txRef);

    if (updateError) {
      console.error('Escrow update error:', updateError);
      // Don't fail — payment was real, log and continue
    }

    // ── Mark item as sold ──────────────────────────────────
    if (txRow.item_id) {
      await supabaseAdmin
        .from('posts')
        .update({ is_sold: true, updated_at: new Date().toISOString() })
        .eq('id', txRow.item_id);
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

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      transactionId: txRef,
      amount,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
