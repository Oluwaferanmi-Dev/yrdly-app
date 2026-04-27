import { supabase } from './supabase';
import { 
  SellerAccount, 
  AccountType, 
  VerificationStatus, 
  VerificationLevel,
  VerificationDocument,
  PayoutRequest,
  BankAccountDetails,
  MobileMoneyDetails
} from '@/types/seller-account';

export class SellerAccountService {
  private static readonly TABLE = 'seller_accounts';
  private static readonly DOCUMENTS_TABLE = 'verification_documents';
  private static readonly PAYOUTS_TABLE = 'payout_requests';

  // Create or update seller account
  static async saveAccount(
    userId: string,
    accountType: AccountType,
    accountDetails: BankAccountDetails | MobileMoneyDetails,
    isPrimary: boolean = false
  ): Promise<string> {
    try {
      // If this is set as primary, unset other primary accounts
      if (isPrimary) {
        await this.unsetPrimaryAccounts(userId);
      }

      const accountData = {
        user_id: userId,
        account_type: accountType,
        account_details: accountDetails,
        verification_status: VerificationStatus.PENDING,
        verification_level: VerificationLevel.BASIC,
        is_primary: isPrimary,
        is_active: true,
        verification_data: {
          micro_deposit_amount: 0,
          micro_deposit_verified: false,
          document_uploaded: false,
          document_verified: false,
          address_verified: false,
          phone_verified: false,
          email_verified: false
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(this.TABLE)
        .insert(accountData)
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving seller account:', error);
      throw new Error('Failed to save account information');
    }
  }

  // Get seller accounts
  static async getSellerAccounts(userId: string): Promise<SellerAccount[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SellerAccount[];
    } catch (error) {
      console.error('Error fetching seller accounts:', error);
      throw new Error('Failed to fetch account information');
    }
  }

  // Get primary account
  static async getPrimaryAccount(userId: string): Promise<SellerAccount | null> {
    try {
      const accounts = await this.getSellerAccounts(userId);
      return accounts.find(account => account.isPrimary) || null;
    } catch (error) {
      console.error('Error fetching primary account:', error);
      return null;
    }
  }

  // Update account verification status
  static async updateVerificationStatus(
    accountId: string,
    status: VerificationStatus,
    level: VerificationLevel,
    rejectedReason?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        verification_status: status,
        verification_level: level,
        updated_at: new Date().toISOString()
      };

      if (status === VerificationStatus.VERIFIED) {
        updateData.verified_at = new Date().toISOString();
      }

      if (status === VerificationStatus.REJECTED && rejectedReason) {
        updateData.rejected_reason = rejectedReason;
      }

      const { error } = await supabase
        .from(this.TABLE)
        .update(updateData)
        .eq('id', accountId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating verification status:', error);
      throw new Error('Failed to update verification status');
    }
  }

  // Upload verification document
  static async uploadVerificationDocument(
    userId: string,
    documentType: VerificationDocument['documentType'],
    documentUrl: string
  ): Promise<string> {
    try {
      const documentData = {
        user_id: userId,
        document_type: documentType,
        document_url: documentUrl,
        status: VerificationStatus.PENDING,
        uploaded_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(this.DOCUMENTS_TABLE)
        .insert(documentData)
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error uploading verification document:', error);
      throw new Error('Failed to upload document');
    }
  }

  // Get verification documents
  static async getVerificationDocuments(userId: string): Promise<VerificationDocument[]> {
    try {
      const { data, error } = await supabase
        .from(this.DOCUMENTS_TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as VerificationDocument[];
    } catch (error) {
      console.error('Error fetching verification documents:', error);
      throw new Error('Failed to fetch verification documents');
    }
  }

  // Request payout
  static async requestPayout(
    sellerId: string,
    accountId: string,
    amount: number
  ): Promise<string> {
    try {
      // Validate account is verified
      const account = await this.getAccountById(accountId);
      if (!account || account.verificationStatus !== VerificationStatus.VERIFIED) {
        throw new Error('Account must be verified before requesting payout');
      }

      if (account.userId !== sellerId) {
        throw new Error('Unauthorized payout request');
      }

      const payoutData = {
        seller_id: sellerId,
        account_id: accountId,
        amount,
        status: 'pending',
        requested_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(this.PAYOUTS_TABLE)
        .insert(payoutData)
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error requesting payout:', error);
      throw new Error('Failed to request payout');
    }
  }

  // Get payout history
  static async getPayoutHistory(sellerId: string): Promise<PayoutRequest[]> {
    try {
      const { data, error } = await supabase
        .from(this.PAYOUTS_TABLE)
        .select('*')
        .eq('seller_id', sellerId)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data as PayoutRequest[];
    } catch (error) {
      console.error('Error fetching payout history:', error);
      throw new Error('Failed to fetch payout history');
    }
  }

  // Private helper methods
  private static async unsetPrimaryAccounts(userId: string): Promise<void> {
    try {
      const accounts = await this.getSellerAccounts(userId);
      const updatePromises = accounts
        .filter(account => account.isPrimary)
        .map(account => 
          supabase
            .from(this.TABLE)
            .update({
              is_primary: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', account.id)
        );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error unsetting primary accounts:', error);
    }
  }

  private static async getAccountById(accountId: string): Promise<SellerAccount | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .select('*')
        .eq('id', accountId)
        .single();

      if (error) throw error;
      return data as SellerAccount;
    } catch (error) {
      console.error('Error fetching account by ID:', error);
      return null;
    }
  }

  // Verification helper methods
  static async initiateMicroDepositVerification(accountId: string): Promise<number> {
    // This would integrate with your payment provider (Paystack, Flutterwave, etc.)
    // For now, return a mock amount
    const microDepositAmount = Math.floor(Math.random() * 5) + 1; // ₦1-₦5
    
    try {
      const { error } = await supabase
        .from(this.TABLE)
        .update({
          verification_data: {
            micro_deposit_amount: microDepositAmount
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId);

      if (error) throw error;

      // Here you would call your payment provider to send the micro-deposit
      // await PaymentProvider.sendMicroDeposit(accountDetails, microDepositAmount);
      
      return microDepositAmount;
    } catch (error) {
      console.error('Error initiating micro-deposit verification:', error);
      throw new Error('Failed to initiate micro-deposit verification');
    }
  }

  static async verifyMicroDeposit(accountId: string, enteredAmount: number): Promise<boolean> {
    try {
      const account = await this.getAccountById(accountId);
      if (!account || !account.verificationData?.microDepositAmount) {
        return false;
      }

      const isCorrect = account.verificationData.microDepositAmount === enteredAmount;
      
      if (isCorrect) {
        const { error } = await supabase
          .from(this.TABLE)
          .update({
            verification_data: {
              micro_deposit_verified: true
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', accountId);

        if (error) throw error;
      }

      return isCorrect;
    } catch (error) {
      console.error('Error verifying micro-deposit:', error);
      return false;
    }
  }
}