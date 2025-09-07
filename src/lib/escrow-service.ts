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
import { db } from '@/lib/firebase';
import { 
  EscrowTransaction, 
  EscrowStatus, 
  PaymentMethod, 
  DeliveryOption, 
  DeliveryDetails,
  EscrowStats 
} from '@/types/escrow';

const COMMISSION_RATE = 0.02; // 2% commission

export class EscrowService {
  // Create a new escrow transaction
  static async createTransaction(
    itemId: string,
    buyerId: string,
    sellerId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    deliveryDetails: DeliveryDetails
  ): Promise<string> {
    const commission = amount * COMMISSION_RATE;
    const totalAmount = amount; // Buyer pays the full item price
    const sellerAmount = amount - commission; // Seller receives amount minus commission

    const transactionData: Omit<EscrowTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      itemId,
      buyerId,
      sellerId,
      amount,
      commission,
      totalAmount,
      sellerAmount,
      status: EscrowStatus.PENDING,
      paymentMethod,
      deliveryDetails,
      paidAt: undefined,
      shippedAt: undefined,
      deliveredAt: undefined,
      completedAt: undefined,
      disputeReason: undefined,
      disputeResolvedAt: undefined
    };

    const docRef = await addDoc(collection(db, 'escrow_transactions'), {
      ...transactionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  }

  // Update transaction status
  static async updateStatus(
    transactionId: string,
    status: EscrowStatus,
    additionalData?: Partial<EscrowTransaction>
  ): Promise<void> {
    const transactionRef = doc(db, 'escrow_transactions', transactionId);
    
    const updateData: any = {
      status,
      updatedAt: serverTimestamp()
    };

    // Add timestamp based on status
    switch (status) {
      case EscrowStatus.PAID:
        updateData.paidAt = serverTimestamp();
        break;
      case EscrowStatus.SHIPPED:
        updateData.shippedAt = serverTimestamp();
        break;
      case EscrowStatus.DELIVERED:
        updateData.deliveredAt = serverTimestamp();
        break;
      case EscrowStatus.COMPLETED:
        updateData.completedAt = serverTimestamp();
        break;
    }

    // Add any additional data
    if (additionalData) {
      Object.assign(updateData, additionalData);
    }

    await updateDoc(transactionRef, updateData);
  }

  // Get transaction by ID
  static async getTransaction(transactionId: string): Promise<EscrowTransaction | null> {
    const docRef = doc(db, 'escrow_transactions', transactionId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate(),
        paidAt: data.paidAt ? (data.paidAt as Timestamp).toDate() : undefined,
        shippedAt: data.shippedAt ? (data.shippedAt as Timestamp).toDate() : undefined,
        deliveredAt: data.deliveredAt ? (data.deliveredAt as Timestamp).toDate() : undefined,
        completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined,
        disputeResolvedAt: data.disputeResolvedAt ? (data.disputeResolvedAt as Timestamp).toDate() : undefined
      } as EscrowTransaction;
    }

    return null;
  }

  // Get user's transactions
  static async getUserTransactions(userId: string): Promise<EscrowTransaction[]> {
    const q = query(
      collection(db, 'escrow_transactions'),
      where('buyerId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const transactions: EscrowTransaction[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate(),
        paidAt: data.paidAt ? (data.paidAt as Timestamp).toDate() : undefined,
        shippedAt: data.shippedAt ? (data.shippedAt as Timestamp).toDate() : undefined,
        deliveredAt: data.deliveredAt ? (data.deliveredAt as Timestamp).toDate() : undefined,
        completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined,
        disputeResolvedAt: data.disputeResolvedAt ? (data.disputeResolvedAt as Timestamp).toDate() : undefined
      } as EscrowTransaction);
    });

    return transactions;
  }

  // Get seller's transactions
  static async getSellerTransactions(sellerId: string): Promise<EscrowTransaction[]> {
    const q = query(
      collection(db, 'escrow_transactions'),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const transactions: EscrowTransaction[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate(),
        paidAt: data.paidAt ? (data.paidAt as Timestamp).toDate() : undefined,
        shippedAt: data.shippedAt ? (data.shippedAt as Timestamp).toDate() : undefined,
        deliveredAt: data.deliveredAt ? (data.deliveredAt as Timestamp).toDate() : undefined,
        completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined,
        disputeResolvedAt: data.disputeResolvedAt ? (data.disputeResolvedAt as Timestamp).toDate() : undefined
      } as EscrowTransaction);
    });

    return transactions;
  }

  // Update delivery details
  static async updateDeliveryDetails(
    transactionId: string,
    deliveryDetails: DeliveryDetails
  ): Promise<void> {
    const transactionRef = doc(db, 'escrow_transactions', transactionId);
    
    await updateDoc(transactionRef, {
      deliveryDetails,
      updatedAt: serverTimestamp()
    });
  }

  // Dispute a transaction
  static async disputeTransaction(
    transactionId: string,
    reason: string
  ): Promise<void> {
    await this.updateStatus(transactionId, EscrowStatus.DISPUTED, {
      disputeReason: reason
    });
  }

  // Resolve a dispute
  static async resolveDispute(
    transactionId: string,
    resolution: string
  ): Promise<void> {
    const transactionRef = doc(db, 'escrow_transactions', transactionId);
    
    await updateDoc(transactionRef, {
      disputeReason: resolution,
      disputeResolvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  // Get escrow statistics
  static async getStats(): Promise<EscrowStats> {
    const q = query(collection(db, 'escrow_transactions'));
    const querySnapshot = await getDocs(q);
    
    let totalTransactions = 0;
    let totalVolume = 0;
    let totalCommission = 0;
    let pendingTransactions = 0;
    let completedTransactions = 0;
    let disputedTransactions = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      totalTransactions++;
      totalVolume += data.amount;
      totalCommission += data.commission;

      switch (data.status) {
        case EscrowStatus.PENDING:
          pendingTransactions++;
          break;
        case EscrowStatus.COMPLETED:
          completedTransactions++;
          break;
        case EscrowStatus.DISPUTED:
          disputedTransactions++;
          break;
      }
    });

    return {
      totalTransactions,
      totalVolume,
      totalCommission,
      pendingTransactions,
      completedTransactions,
      disputedTransactions
    };
  }
}
