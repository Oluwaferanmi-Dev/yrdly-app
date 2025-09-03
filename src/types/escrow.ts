export enum EscrowStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_MONEY = 'mobile_money'
}

export enum DeliveryOption {
  FACE_TO_FACE = 'face_to_face',
  PARTNERED_SERVICE = 'partnered_service',
  OWN_LOGISTICS = 'own_logistics'
}

export interface DeliveryDetails {
  option: DeliveryOption;
  address?: string;
  meetingPoint?: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  notes?: string;
}

export interface EscrowTransaction {
  id: string;
  itemId: string;
  buyerId: string;
  sellerId: string;
  amount: number; // Original item price
  commission: number; // Commission deducted from seller
  totalAmount: number; // Amount buyer pays (same as amount)
  sellerAmount: number; // Amount seller receives (amount - commission)
  status: EscrowStatus;
  paymentMethod: PaymentMethod;
  deliveryDetails: DeliveryDetails;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  completedAt?: Date;
  disputeReason?: string;
  disputeResolvedAt?: Date;
}

export interface EscrowStats {
  totalTransactions: number;
  totalVolume: number;
  totalCommission: number;
  pendingTransactions: number;
  completedTransactions: number;
  disputedTransactions: number;
}
