import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { EscrowStatus } from '@/types/escrow';
import crypto from 'crypto';

/**
 * POST /api/webhooks/flutterwave
 *
 * Server-authoritative webhook handler for Flutterwave payment events.
 * This ensures payment confirmation even if the buyer closes their browser
 * after paying on Flutterwave.
 *
 * Flutterwave sends `charge.completed` events here with the transaction details.
 * We verify the webhook signature using FLUTTERWAVE_SECRET_HASH.
 */
export async function POST(request: NextRequest) {
  try {
    // ── Verify webhook signature ──────────────────────────
    const signature = request.headers.get('verif-hash');
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;

    if (!secretHash || signature !== secretHash) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload = await request.json();
    const { event, data } = payload;

    // ── Handle charge.completed ───────────────────────────
    if (event === 'charge.completed' && data?.status === 'successful') {
      const txRef = data.tx_ref;       // Our escrow transaction ID
      const flwRef = data.flw_ref;     // Flutterwave's reference
      const amount = parseFloat(data.amount);

      if (!txRef) {
        console.error('Webhook missing tx_ref');
        return NextResponse.json({ status: 'ok' }); // Ack to prevent retries
      }

      // ── Check current transaction state (idempotent) ────
      const { data: txRow, error: fetchError } = await supabaseAdmin
        .from('escrow_transactions')
        .select('id, status, item_id, buyer_id, seller_id')
        .eq('id', txRef)
        .single();

      if (fetchError || !txRow) {
        console.error('Webhook: transaction not found:', txRef);
        return NextResponse.json({ status: 'ok' }); // Ack anyway
      }

      // Already paid or beyond — skip
      if (txRow.status !== EscrowStatus.PENDING) {
        console.log(`Webhook: transaction ${txRef} already ${txRow.status}, skipping`);
        return NextResponse.json({ status: 'ok' });
      }

      // ── Update to PAID ──────────────────────────────────
      const { error: updateError } = await supabaseAdmin
        .from('escrow_transactions')
        .update({
          status: EscrowStatus.PAID,
          payment_reference: flwRef,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', txRef);

      if (updateError) {
        console.error('Webhook: escrow update error:', updateError);
      }

      // ── Mark item as sold ───────────────────────────────
      if (txRow.item_id) {
        await supabaseAdmin
          .from('posts')
          .update({ is_sold: true, updated_at: new Date().toISOString() })
          .eq('id', txRow.item_id);
      }

      // ── Notify seller ───────────────────────────────────
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
        console.error('Webhook: notification error:', notificationError);
      }

      console.log(`Webhook: transaction ${txRef} marked as PAID`);
    }

    // Always return 200 to acknowledge receipt (prevents Flutterwave retries)
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 even on errors to prevent infinite retries
    return NextResponse.json({ status: 'ok' });
  }
}
