"use client";

import React from 'react';
import { PayoutRequest } from '@/types/seller-account';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Banknote,
  Calendar,
  DollarSign
} from 'lucide-react';

interface PayoutHistoryProps {
  payouts: PayoutRequest[];
}

export function PayoutHistory({ payouts }: PayoutHistoryProps) {
  const getStatusIcon = (status: PayoutRequest['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: PayoutRequest['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'processing':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  if (payouts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Banknote className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No payout history</h3>
          <p className="text-muted-foreground text-center mb-4">
            Your payout requests will appear here once you start selling items
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {payouts.map((payout) => (
        <Card key={payout.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(payout.status)}
                <div>
                  <CardTitle className="text-lg">
                    {formatPrice(payout.amount)}
                  </CardTitle>
                  <CardDescription>
                    Payout Request #{payout.id.slice(-8)}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(payout.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">Requested:</span>
                    <p className="font-medium">{formatDate(payout.requestedAt)}</p>
                  </div>
                </div>
                
                {payout.processedAt && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Processed:</span>
                      <p className="font-medium">{formatDate(payout.processedAt)}</p>
                    </div>
                  </div>
                )}
              </div>

              {payout.transactionReference && (
                <div className="flex items-center space-x-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">Transaction Ref:</span>
                    <p className="font-mono text-xs">{payout.transactionReference}</p>
                  </div>
                </div>
              )}

              {payout.failureReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Failure Reason:</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">{payout.failureReason}</p>
                </div>
              )}

              {payout.status === 'pending' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Processing Time:</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Payouts are typically processed within 1-3 business days
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
