import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { EscrowStatus } from '@/types/escrow';

export async function POST(request: NextRequest) {
  try {
    const { transactionReference } = await request.json();

    if (!transactionReference) {
      return NextResponse.json(
        { error: 'Transaction reference is required' },
        { status: 400 }
      );
    }

    // ── Verify payment with Flutterwave directly ──────────
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

    const txRef: string = flwData.data.tx_ref;
    const amount: number = parseFloat(flwData.data.amount);

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
      console.error('Escrow update error:', updateError);
      // Don't fail — payment was real, log and continue
    }

    // ── Mark item as sold ──────────────────────────────────
    const { data: txRow } = await supabaseAdmin
      .from('escrow_transactions')
      .select('item_id, buyer_id')
      .eq('id', txRef)
      .single();

    if (txRow) {
      await supabaseAdmin
        .from('posts')
        .update({ is_sold: true, updated_at: new Date().toISOString() })
        .eq('id', txRow.item_id);
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
