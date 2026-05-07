import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/tickets/[token]
 * Fetch ticket details by UUID token (the ticket ID itself is the QR token).
 */
export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  const { data: ticket, error } = await supabaseAdmin
    .from('tickets')
    .select(`
      id, status, attendee_name, attendee_email, amount_paid, created_at, scanned_at,
      event:events(id, title, cover_image_url, start_time, end_time, location_address, location_online, online_link, status, lga, state),
      tier:ticket_tiers(id, name, price, description)
    `)
    .eq('id', params.token)
    .single();

  if (error || !ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  return NextResponse.json({ ticket });
}
