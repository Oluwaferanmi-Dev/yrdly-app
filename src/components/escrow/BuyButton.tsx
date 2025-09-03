"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DeliverySelector } from './DeliverySelector';
import { DeliveryOption, DeliveryDetails, PaymentMethod } from '@/types/escrow';
import { EscrowService } from '@/lib/escrow-service';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface BuyButtonProps {
  itemId: string;
  itemTitle: string;
  price: number;
  sellerId: string;
  sellerName: string;
}

export function BuyButton({ itemId, itemTitle, price, sellerId, sellerName }: BuyButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CARD);
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>(DeliveryOption.FACE_TO_FACE);
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>({
    option: DeliveryOption.FACE_TO_FACE
  });

  const paymentMethods = [
    { value: PaymentMethod.CARD, label: 'Credit/Debit Card', icon: '💳' },
    { value: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer', icon: '🏦' },
    { value: PaymentMethod.MOBILE_MONEY, label: 'Mobile Money', icon: '📱' }
  ];

  const handleBuy = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to purchase items",
        variant: "destructive",
      });
      return;
    }

    if (user.uid === sellerId) {
      toast({
        title: "Error",
        description: "You cannot buy your own item",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create escrow transaction
      const transactionId = await EscrowService.createTransaction(
        itemId,
        user.uid,
        sellerId,
        price,
        selectedPaymentMethod,
        deliveryDetails
      );

      toast({
        title: "Success",
        description: "Transaction created successfully! Redirecting to payment...",
      });
      
      // Here you would integrate with your payment gateway (Paystack/Flutterwave)
      // For now, we'll just close the dialog
      setIsOpen(false);
      
      // TODO: Redirect to payment gateway
      console.log('Redirecting to payment for transaction:', transactionId);
      
    } catch (error) {
      console.error('Failed to create transaction:', error);
      toast({
        title: "Error",
        description: "Failed to create transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeliveryDetailsChange = (details: Partial<DeliveryDetails>) => {
    setDeliveryDetails(prev => ({ ...prev, ...details }));
  };

  const commission = price * 0.02; // 2% commission
  const totalAmount = price; // Buyer pays the full item price
  const sellerAmount = price - commission; // Seller receives amount minus commission

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
          Buy Now - ₦{price.toLocaleString()}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900">{itemTitle}</h3>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-600">Item Price:</span>
              <span className="font-semibold text-gray-900">₦{price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-gray-600">Platform Fee (2%):</span>
              <span className="text-gray-600">₦{commission.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-gray-600">Seller Receives:</span>
              <span className="text-gray-600">₦{sellerAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-900">You Pay:</span>
              <span className="font-bold text-lg text-green-600">₦{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.value}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPaymentMethod === method.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPaymentMethod(method.value)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{method.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{method.label}</h4>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPaymentMethod === method.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedPaymentMethod === method.value && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Options */}
          <DeliverySelector
            selectedOption={deliveryOption}
            onOptionChange={setDeliveryOption}
            deliveryDetails={deliveryDetails}
            onDetailsChange={handleDeliveryDetailsChange}
          />

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="text-blue-600 text-xl">🔒</div>
              <div>
                <h4 className="font-medium text-blue-900">Secure Escrow Protection</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Your payment is held securely until you receive the item. 
                  The seller only gets paid after you confirm delivery.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBuy}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Processing...' : `Pay ₦${totalAmount.toLocaleString()}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
