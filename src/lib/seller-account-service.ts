import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  SellerAccount, 
  AccountType, 
  VerificationStatus, 
  VerificationLevel,
  VerificationDocument,
  PayoutRequest,
  BankAccountDetails,
  MobileMoneyDetails,
  DigitalWalletDetails
} from '@/types/seller-account';

export class SellerAccountService {
  private static readonly COLLECTION = 'seller_accounts';
  private static readonly DOCUMENTS_COLLECTION = 'verification_documents';
  private static readonly PAYOUTS_COLLECTION = 'payout_requests';

  // Create or update seller account
  static async saveAccount(
    userId: string,
    accountType: AccountType,
    accountDetails: BankAccountDetails | MobileMoneyDetails | DigitalWalletDetails,
    isPrimary: boolean = false
  ): Promise<string> {
    try {
      // If this is set as primary, unset other primary accounts
      if (isPrimary) {
        await this.unsetPrimaryAccounts(userId);
      }

      const accountData: Omit<SellerAccount, 'id'> = {
        userId,
        accountType,
        accountDetails,
        verificationStatus: VerificationStatus.PENDING,
        verificationLevel: VerificationLevel.BASIC,
        isPrimary,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        verificationData: {
          microDepositAmount: 0,
          microDepositVerified: false,
          documentUploaded: false,
          documentVerified: false,
          addressVerified: false,
          phoneVerified: false,
          emailVerified: false
        }
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...accountData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error saving seller account:', error);
      throw new Error('Failed to save account information');
    }
  }

  // Get seller accounts
  static async getSellerAccounts(userId: string): Promise<SellerAccount[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId),
        where('isActive', '==', true),
        orderBy('isPrimary', 'desc'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        verifiedAt: doc.data().verifiedAt?.toDate()
      })) as SellerAccount[];
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
      const accountRef = doc(db, this.COLLECTION, accountId);
      const updateData: any = {
        verificationStatus: status,
        verificationLevel: level,
        updatedAt: serverTimestamp()
      };

      if (status === VerificationStatus.VERIFIED) {
        updateData.verifiedAt = serverTimestamp();
      }

      if (status === VerificationStatus.REJECTED && rejectedReason) {
        updateData.rejectedReason = rejectedReason;
      }

      await updateDoc(accountRef, updateData);
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
      const documentData: Omit<VerificationDocument, 'id'> = {
        userId,
        documentType,
        documentUrl,
        status: VerificationStatus.PENDING,
        uploadedAt: new Date()
      };

      const docRef = await addDoc(collection(db, this.DOCUMENTS_COLLECTION), {
        ...documentData,
        uploadedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error uploading verification document:', error);
      throw new Error('Failed to upload document');
    }
  }

  // Get verification documents
  static async getVerificationDocuments(userId: string): Promise<VerificationDocument[]> {
    try {
      const q = query(
        collection(db, this.DOCUMENTS_COLLECTION),
        where('userId', '==', userId),
        orderBy('uploadedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate() || new Date(),
        verifiedAt: doc.data().verifiedAt?.toDate()
      })) as VerificationDocument[];
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

      const payoutData: Omit<PayoutRequest, 'id'> = {
        sellerId,
        accountId,
        amount,
        status: 'pending',
        requestedAt: new Date()
      };

      const docRef = await addDoc(collection(db, this.PAYOUTS_COLLECTION), {
        ...payoutData,
        requestedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error requesting payout:', error);
      throw new Error('Failed to request payout');
    }
  }

  // Get payout history
  static async getPayoutHistory(sellerId: string): Promise<PayoutRequest[]> {
    try {
      const q = query(
        collection(db, this.PAYOUTS_COLLECTION),
        where('sellerId', '==', sellerId),
        orderBy('requestedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate() || new Date(),
        processedAt: doc.data().processedAt?.toDate()
      })) as PayoutRequest[];
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
          updateDoc(doc(db, this.COLLECTION, account.id), {
            isPrimary: false,
            updatedAt: serverTimestamp()
          })
        );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error unsetting primary accounts:', error);
    }
  }

  private static async getAccountById(accountId: string): Promise<SellerAccount | null> {
    try {
      const docRef = doc(db, this.COLLECTION, accountId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
          verifiedAt: docSnap.data().verifiedAt?.toDate()
        } as SellerAccount;
      }
      return null;
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
      const accountRef = doc(db, this.COLLECTION, accountId);
      await updateDoc(accountRef, {
        'verificationData.microDepositAmount': microDepositAmount,
        updatedAt: serverTimestamp()
      });

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
        await updateDoc(doc(db, this.COLLECTION, accountId), {
          'verificationData.microDepositVerified': true,
          updatedAt: serverTimestamp()
        });
      }

      return isCorrect;
    } catch (error) {
      console.error('Error verifying micro-deposit:', error);
      return false;
    }
  }
}
