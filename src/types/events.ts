// Events & Ticketing — TypeScript types

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
export type EventVisibility = 'PUBLIC' | 'WARD_ONLY' | 'LGA_ONLY' | 'UNLISTED';
export type PayoutMode = 'INSTANT' | 'POST_EVENT';
export type TicketStatus = 'PAID' | 'USED' | 'REFUNDED' | 'CANCELLED';
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Event {
  id: string;
  organizer_id: string;
  title: string;
  description?: string;
  category: string;
  cover_image_url?: string;
  location_address?: string;
  location_online: boolean;
  online_link?: string;
  lat?: number;
  lng?: number;
  ward?: string;
  lga?: string;
  state?: string;
  start_time: string;
  end_time?: string;
  timezone: string;
  status: EventStatus;
  visibility: EventVisibility;
  payout_mode: PayoutMode;
  payout_released_at?: string;
  flutterwave_subaccount_id?: string;
  published_at?: string;
  scheduled_publish_at?: string;
  attendee_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  organizer?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  ticket_tiers?: TicketTier[];
}

export interface TicketTier {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  price: number;
  capacity?: number;   // null = unlimited
  sold: number;
  is_visible: boolean;
  sale_ends_at?: string;
  created_at: string;
  updated_at: string;
  // Computed
  available?: number;
  is_sold_out?: boolean;
}

export interface Ticket {
  id: string;           // UUID = QR token
  buyer_id: string;
  event_id: string;
  tier_id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
  status: TicketStatus;
  flutterwave_tx_ref?: string;
  flutterwave_flw_ref?: string;
  amount_paid: number;
  scanned_at?: string;
  scanned_by?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  event?: Event;
  tier?: TicketTier;
}

export interface EventPayout {
  id: string;
  event_id: string;
  organizer_id: string;
  gross_amount: number;
  commission_amount: number;
  net_amount: number;
  flutterwave_transfer_id?: string;
  status: PayoutStatus;
  failure_reason?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

// For ticket checkout initialization
export interface TicketCheckoutRequest {
  eventId: string;
  tierId: string;
  quantity: number;
  attendees: {
    name: string;
    email: string;
    phone?: string;
  }[];
}

// Scan result returned from /api/tickets/scan
export interface ScanResult {
  success: boolean;
  reason?: 'UNAUTHORIZED' | 'INVALID_TICKET' | 'WRONG_EVENT' | 'ALREADY_USED' | 'INVALID_STATUS';
  attendee_name?: string;
  tier_id?: string;
  scanned_at?: string;
  status?: string;
}
