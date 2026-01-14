// Server-side only - Flutterwave service
// This service should only be used in API routes, not in client components

let flw: any = null;

// Initialize Flutterwave only on server side
if (typeof window === 'undefined') {
  try {
    const Flutterwave = require('flutterwave-node-v3');
    flw = new Flutterwave(
      process.env.FLUTTERWAVE_PUBLIC_KEY!,
      process.env.FLUTTERWAVE_SECRET_KEY!
    );
  } catch (error) {
    console.warn('Flutterwave not available:', error);
  }
}

import { supabase } from './supabase';

export interface PaymentInitiationData {
  transactionId: string;
  amount: number;
  buyerEmail: string;
  buyerName: string;
  itemTitle: string;
  sellerName: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  transactionReference?: string;
  amount?: number;
  status?: string;
  error?: string;
}

export class FlutterwaveService {
  /**
   * Initialize payment for escrow transaction
   */
  static async initializePayment(data: PaymentInitiationData): Promise<string> {
    if (!flw) {
      throw new Error('Flutterwave service not available - this should only be called server-side');
    }

    try {
      const payload = {
        tx_ref: data.transactionId,
        amount: data.amount,
        currency: 'NGN',
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify?tx_ref=${data.transactionId}`,
        payment_options: 'card,banktransfer,mobilemoney',
        customer: {
          email: data.buyerEmail,
          name: data.buyerName,
        },
        customizations: {
          title: 'Yrdly Marketplace',
          description: `Payment for ${data.itemTitle} from ${data.sellerName}`,
          logo: `${process.env.NEXT_PUBLIC_APP_URL}/yrdly-logo.png`,
        },
        meta: {
          transaction_id: data.transactionId,
          item_title: data.itemTitle,
          seller_name: data.sellerName,
        },
      };

      const response = await flw.Payment.initialize(payload);
      
      if (response.status === 'success') {
        return response.data.link;
      } else {
        throw new Error(response.message || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Flutterwave payment initialization error:', error);
      throw new Error('Failed to initialize payment');
    }
  }

  /**
   * Verify payment transaction
   */
  static async verifyPayment(transactionReference: string): Promise<PaymentVerificationResult> {
    if (!flw) {
      throw new Error('Flutterwave service not available - this should only be called server-side');
    }

    try {
      const response = await flw.Transaction.verify({ id: transactionReference });
      
      if (response.status === 'success' && response.data.status === 'successful') {
        return {
          success: true,
          transactionReference: response.data.tx_ref,
          amount: parseFloat(response.data.amount),
          status: response.data.status,
        };
      } else {
        return {
          success: false,
          error: response.message || 'Payment verification failed',
        };
      }
    } catch (error) {
      console.error('Flutterwave payment verification error:', error);
      return {
        success: false,
        error: 'Payment verification failed',
      };
    }
  }

  /**
   * Handle Flutterwave webhook
   */
  static async handleWebhook(payload: any, signature: string): Promise<boolean> {
    try {
      // Verify webhook signature
      const hash = require('crypto')
        .createHmac('sha256', process.env.FLUTTERWAVE_SECRET_HASH!)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (hash !== signature) {
        console.error('Invalid webhook signature');
        return false;
      }

      const { event, data } = payload;

      if (event === 'charge.completed' && data.status === 'successful') {
        // Update escrow transaction status
        await this.updateEscrowTransaction(data.tx_ref, 'paid', data.flw_ref);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Webhook handling error:', error);
      return false;
    }
  }

  /**
   * Update escrow transaction status
   */
  private static async updateEscrowTransaction(
    transactionId: string,
    status: string,
    paymentReference: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('escrow_transactions')
        .update({
          status: status,
          payment_reference: paymentReference,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId)
        .eq('status', 'pending'); // 🛡️ Guard: Only update if still pending

      if (error) {
        console.error('Error updating escrow transaction:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to update escrow transaction:', error);
      throw error;
    }
  }

  /**
   * Create seller subaccount for direct payouts (optional)
   */
  static async createSubaccount(sellerData: {
    accountName: string;
    email: string;
    bankCode: string;
    accountNumber: string;
  }): Promise<string> {
    try {
      const payload = {
        account_name: sellerData.accountName,
        email: sellerData.email,
        mobilenumber: '', // Optional
        bank_code: sellerData.bankCode,
        account_number: sellerData.accountNumber,
        business_name: sellerData.accountName,
        business_mobile: '', // Optional
        business_email: sellerData.email,
        business_contact: sellerData.accountName,
        business_contact_mobile: '', // Optional
        business_address: '', // Optional
        meta: {
          seller_id: sellerData.email, // Use email as identifier
        },
      };

      const response = await flw.Subaccount.create(payload);
      
      if (response.status === 'success') {
        return response.data.subaccount_id;
      } else {
        throw new Error(response.message || 'Failed to create subaccount');
      }
    } catch (error) {
      console.error('Subaccount creation error:', error);
      throw new Error('Failed to create seller subaccount');
    }
  }

  /**
   * Transfer funds to seller
   */
  static async transferToSeller(
    sellerSubaccountId: string,
    amount: number,
    reference: string,
    reason: string
  ): Promise<boolean> {
    try {
      const payload = {
        account_bank: 'flutterwave', // For subaccount transfers
        account_number: sellerSubaccountId,
        amount: amount,
        narration: reason,
        currency: 'NGN',
        reference: reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/transfer-callback`,
        debit_currency: 'NGN',
      };

      const response = await flw.Transfer.initiate(payload);
      
      return response.status === 'success';
    } catch (error) {
      console.error('Transfer to seller error:', error);
      return false;
    }
  }
}
