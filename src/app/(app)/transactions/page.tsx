"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { EscrowService } from '@/lib/escrow-service';
import { EscrowTransaction, EscrowStatus } from '@/types/escrow';
import { EscrowStatusDisplay } from '@/components/escrow/EscrowStatusDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  CreditCard, 
  Truck, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  XCircle 
} from 'lucide-react';

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load both buyer and seller transactions
      const [buyerTransactions, sellerTransactions] = await Promise.all([
        EscrowService.getUserTransactions(user.uid),
        EscrowService.getSellerTransactions(user.uid)
      ]);

      // Combine and sort by date
      const allTransactions = [...buyerTransactions, ...sellerTransactions]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      setTransactions(allTransactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user, loadTransactions]);

  const getFilteredTransactions = () => {
    if (activeTab === 'all') return transactions;
    return transactions.filter(t => t.status === activeTab);
  };

  const getStatusIcon = (status: EscrowStatus) => {
    switch (status) {
      case EscrowStatus.PENDING:
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case EscrowStatus.PAID:
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case EscrowStatus.SHIPPED:
        return <Truck className="w-5 h-5 text-purple-600" />;
      case EscrowStatus.DELIVERED:
        return <Package className="w-5 h-5 text-indigo-600" />;
      case EscrowStatus.COMPLETED:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case EscrowStatus.DISPUTED:
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case EscrowStatus.CANCELLED:
        return <XCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getRole = (transaction: EscrowTransaction) => {
    return user?.uid === transaction.buyerId ? 'Buyer' : 'Seller';
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Transactions</h1>
          <p className="text-gray-600">Please log in to view your transactions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Transactions</h1>
        <p className="text-gray-600">Track your marketplace purchases and sales</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value={EscrowStatus.PENDING}>Pending</TabsTrigger>
          <TabsTrigger value={EscrowStatus.PAID}>Paid</TabsTrigger>
          <TabsTrigger value={EscrowStatus.SHIPPED}>Shipped</TabsTrigger>
          <TabsTrigger value={EscrowStatus.DELIVERED}>Delivered</TabsTrigger>
          <TabsTrigger value={EscrowStatus.COMPLETED}>Completed</TabsTrigger>
          <TabsTrigger value={EscrowStatus.DISPUTED}>Disputed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading transactions...</p>
            </div>
          ) : getFilteredTransactions().length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600">
                {activeTab === 'all' 
                  ? "You haven't made any transactions yet."
                  : `No ${activeTab} transactions found.`
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {getFilteredTransactions().map((transaction) => (
                <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(transaction.status)}
                        <div>
                          <CardTitle className="text-lg">
                            Transaction #{transaction.id.slice(-8)}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {getRole(transaction)}
                            </Badge>
                            <EscrowStatusDisplay status={transaction.status} />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {formatPrice(transaction.amount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getRole(transaction) === 'Buyer' 
                            ? `You paid ${formatPrice(transaction.amount)}`
                            : `You receive ${formatPrice(transaction.sellerAmount || (transaction.amount - transaction.commission))}`
                          }
                        </div>
                        <div className="text-xs text-gray-400">
                          {getRole(transaction) === 'Seller' && `-${formatPrice(transaction.commission)} platform fee`}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Transaction Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Payment Method:</span>
                            <span className="capitalize">{transaction.paymentMethod.replace('_', ' ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Delivery:</span>
                            <span className="capitalize">{transaction.deliveryDetails.option.replace('_', ' ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Created:</span>
                            <span>{formatDate(transaction.createdAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Last Updated:</span>
                            <span>{formatDate(transaction.updatedAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Delivery Information</h4>
                        <div className="space-y-2 text-sm">
                          {transaction.deliveryDetails.address && (
                            <div>
                              <span className="text-gray-600">Address:</span>
                              <p className="text-gray-900">{transaction.deliveryDetails.address}</p>
                            </div>
                          )}
                          {transaction.deliveryDetails.meetingPoint && (
                            <div>
                              <span className="text-gray-600">Meeting Point:</span>
                              <p className="text-gray-900">{transaction.deliveryDetails.meetingPoint}</p>
                            </div>
                          )}
                          {transaction.deliveryDetails.estimatedDelivery && (
                            <div>
                              <span className="text-gray-600">Estimated Delivery:</span>
                              <p className="text-gray-900">{transaction.deliveryDetails.estimatedDelivery}</p>
                            </div>
                          )}
                          {transaction.deliveryDetails.trackingNumber && (
                            <div>
                              <span className="text-gray-600">Tracking:</span>
                              <p className="text-gray-900">{transaction.deliveryDetails.trackingNumber}</p>
                            </div>
                          )}
                          {transaction.deliveryDetails.notes && (
                            <div>
                              <span className="text-gray-600">Notes:</span>
                              <p className="text-gray-900">{transaction.deliveryDetails.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {transaction.disputeReason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-medium text-red-900 mb-1">Dispute Reason</h4>
                        <p className="text-red-700 text-sm">{transaction.disputeReason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
