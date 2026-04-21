import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/seller/setup-account
 *
 * Creates a Flutterwave subaccount for the seller and stores
 * the details in the `seller_accounts` table. This enables
 * automatic split payments where the seller receives 97%
 * directly to their bank account.
 */
export async function POST(request: NextRequest) {
  try {
    // ── Authenticate ─────────────────────────────────────
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { bankCode, accountNumber, accountName } = body;

    if (!bankCode || !accountNumber || !accountName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ── Create Flutterwave subaccount ─────────────────────
    const flwRes = await fetch('https://api.flutterwave.com/v3/subaccounts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_bank: bankCode,
        account_number: accountNumber,
        business_name: accountName,
        business_email: user.email,
        business_contact: accountName,
        business_contact_mobile: user.phone || '',
        business_mobile: user.phone || '',
        country: 'NG',
        split_type: 'percentage',
        split_value: 0.97, // Seller gets 97%
      }),
    });

    const flwData = await flwRes.json();

    if (flwData.status !== 'success') {
      console.error('Flutterwave subaccount error:', flwData);
      return NextResponse.json(
        { error: flwData.message || 'Failed to create subaccount' },
        { status: 502 }
      );
    }

    const subaccountId = flwData.data.subaccount_id;

    // ── Deactivate any existing accounts ──────────────────
    await supabaseAdmin
      .from('seller_accounts')
      .update({ is_primary: false, is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    // ── Store in seller_accounts ──────────────────────────
    const { error: insertError } = await supabaseAdmin
      .from('seller_accounts')
      .insert({
        user_id: user.id,
        account_type: 'bank_account',
        account_details: {
          bank_code: bankCode,
          account_number: accountNumber,
          account_name: accountName,
        },
        flutterwave_subaccount_id: subaccountId,
        is_primary: true,
        is_active: true,
        verification_status: 'verified',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error storing seller account:', insertError);
      return NextResponse.json({ error: 'Failed to store account' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      subaccountId,
      message: 'Bank account linked successfully',
    });
  } catch (error) {
    console.error('Seller account setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/seller/setup-account
 *
 * Returns the current seller's bank account info.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('seller_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('is_primary', true)
      .single();

    if (error || !data) {
      return NextResponse.json({ account: null });
    }

    return NextResponse.json({
      account: {
        accountName: data.account_details?.account_name || '',
        accountNumber: data.account_details?.account_number || '',
        bankCode: data.account_details?.bank_code || '',
        isVerified: data.verification_status === 'verified',
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error('Get seller account error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
