export enum AccountType {
  BANK_ACCOUNT = 'bank_account',
  MOBILE_MONEY = 'mobile_money',
  DIGITAL_WALLET = 'digital_wallet'
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export enum VerificationLevel {
  BASIC = 'basic',           // Name, email, phone
  BANK_ACCOUNT = 'bank_account', // Bank account verification
  IDENTITY = 'identity',     // Government ID verification
  ADDRESS = 'address'        // Address verification
}

export interface BankAccountDetails {
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
  accountType: 'savings' | 'current';
}

export interface MobileMoneyDetails {
  provider: 'mtn' | 'airtel' | 'glo' | '9mobile' | 'opay' | 'palmpay';
  phoneNumber: string;
  accountName: string;
}

export interface DigitalWalletDetails {
  provider: 'paystack' | 'flutterwave' | 'interswitch';
  email: string;
  accountName: string;
}

export interface SellerAccount {
  id: string;
  userId: string;
  accountType: AccountType;
  accountDetails: BankAccountDetails | MobileMoneyDetails | DigitalWalletDetails;
  verificationStatus: VerificationStatus;
  verificationLevel: VerificationLevel;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  verifiedAt?: Date;
  rejectedReason?: string;
  
  // Verification data
  verificationData?: {
    microDepositAmount?: number;
    microDepositVerified?: boolean;
    documentUploaded?: boolean;
    documentVerified?: boolean;
    addressVerified?: boolean;
    phoneVerified?: boolean;
    emailVerified?: boolean;
  };
}

export interface VerificationDocument {
  id: string;
  userId: string;
  documentType: 'government_id' | 'utility_bill' | 'bank_statement';
  documentUrl: string;
  status: VerificationStatus;
  uploadedAt: Date;
  verifiedAt?: Date;
  rejectedReason?: string;
}

export interface PayoutRequest {
  id: string;
  sellerId: string;
  accountId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requestedAt: Date;
  processedAt?: Date;
  failureReason?: string;
  transactionReference?: string;
}

export interface BankInfo {
  code: string;
  name: string;
  slug: string;
}
