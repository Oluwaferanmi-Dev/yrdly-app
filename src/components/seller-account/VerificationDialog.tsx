"use client";

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SellerAccountService } from '@/lib/seller-account-service';
import { SellerAccount, AccountType, VerificationStatus } from '@/types/seller-account';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Smartphone, 
  Wallet, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Upload,
  FileText,
  Shield
} from 'lucide-react';

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: SellerAccount | null;
  onSuccess: () => void;
}

export function VerificationDialog({ open, onOpenChange, account, onSuccess }: VerificationDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [microDepositAmount, setMicroDepositAmount] = useState<number | null>(null);
  const [enteredAmount, setEnteredAmount] = useState('');
  const [verificationStep, setVerificationStep] = useState<'initiate' | 'verify' | 'documents'>('initiate');

  const handleInitiateMicroDeposit = async () => {
    if (!account) return;

    try {
      setLoading(true);
      const amount = await SellerAccountService.initiateMicroDepositVerification(account.id);
      setMicroDepositAmount(amount);
      setVerificationStep('verify');
      
      toast({
        title: "Micro-deposit sent",
        description: `We've sent ₦${amount} to your account. Please check your bank statement and enter the amount.`
      });
    } catch (error) {
      console.error('Error initiating micro-deposit:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send micro-deposit. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMicroDeposit = async () => {
    if (!account || !enteredAmount) return;

    try {
      setLoading(true);
      const isValid = await SellerAccountService.verifyMicroDeposit(account.id, parseInt(enteredAmount));
      
      if (isValid) {
        toast({
          title: "Verification successful",
          description: "Your account has been verified successfully!"
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          variant: "destructive",
          title: "Verification failed",
          description: "The amount you entered is incorrect. Please check your bank statement and try again."
        });
      }
    } catch (error) {
      console.error('Error verifying micro-deposit:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify micro-deposit. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const getAccountTypeIcon = (type: AccountType) => {
    switch (type) {
      case AccountType.BANK_ACCOUNT:
        return <CreditCard className="h-5 w-5" />;
      case AccountType.MOBILE_MONEY:
        return <Smartphone className="h-5 w-5" />;
      case AccountType.DIGITAL_WALLET:
        return <Wallet className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getAccountDisplayName = (account: SellerAccount) => {
    switch (account.accountType) {
      case AccountType.BANK_ACCOUNT:
        const bankDetails = account.accountDetails as any;
        return `${bankDetails.bankName} - ${bankDetails.accountNumber.slice(-4)}`;
      case AccountType.MOBILE_MONEY:
        const mobileDetails = account.accountDetails as any;
        return `${mobileDetails.provider.toUpperCase()} - ${mobileDetails.phoneNumber}`;
      case AccountType.DIGITAL_WALLET:
        const walletDetails = account.accountDetails as any;
        return `${walletDetails.provider} - ${walletDetails.email}`;
      default:
        return 'Unknown Account';
    }
  };

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Verify Account</span>
          </DialogTitle>
          <DialogDescription>
            Complete the verification process for your payout account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {getAccountTypeIcon(account.accountType)}
                <span>Account to Verify</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account:</span>
                  <span className="font-medium">{getAccountDisplayName(account)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="capitalize">{account.accountType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending Verification
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verification Steps */}
          {account.accountType === AccountType.BANK_ACCOUNT && (
            <div className="space-y-4">
              {/* Step 1: Micro-deposit Verification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Step 1: Micro-deposit Verification</span>
                  </CardTitle>
                  <CardDescription>
                    We&apos;ll send a small amount to your account to verify ownership
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {verificationStep === 'initiate' && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Click the button below to send a micro-deposit (₦1-₦5) to your account. 
                        You&apos;ll need to enter the exact amount to complete verification.
                      </p>
                      <Button 
                        onClick={handleInitiateMicroDeposit} 
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? 'Sending...' : 'Send Micro-deposit'}
                      </Button>
                    </div>
                  )}

                  {verificationStep === 'verify' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            Micro-deposit sent!
                          </span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          We&apos;ve sent ₦{microDepositAmount} to your account. 
                          Please check your bank statement and enter the exact amount below.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="amount">Enter the micro-deposit amount</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="Enter amount (e.g., 3)"
                          value={enteredAmount}
                          onChange={(e) => setEnteredAmount(e.target.value)}
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setVerificationStep('initiate')}
                          className="flex-1"
                        >
                          Back
                        </Button>
                        <Button 
                          onClick={handleVerifyMicroDeposit} 
                          disabled={loading || !enteredAmount}
                          className="flex-1"
                        >
                          {loading ? 'Verifying...' : 'Verify Amount'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Step 2: Document Verification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Step 2: Document Verification (Optional)</span>
                  </CardTitle>
                  <CardDescription>
                    Upload additional documents for enhanced verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Upload government-issued ID, utility bill, or bank statement
                      </p>
                      <Button variant="outline" className="mt-2" disabled>
                        Upload Document
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Document verification is optional but recommended for higher transaction limits.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Mobile Money & Digital Wallet Verification */}
          {(account.accountType === AccountType.MOBILE_MONEY || account.accountType === AccountType.DIGITAL_WALLET) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Verification Process</span>
                </CardTitle>
                <CardDescription>
                  Verification for {account.accountType.replace('_', ' ')} accounts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      Manual Verification Required
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    {account.accountType === AccountType.MOBILE_MONEY 
                      ? 'Mobile money accounts require manual verification. Our team will review your account details and contact you if needed.'
                      : 'Digital wallet accounts require manual verification. Our team will review your account details and contact you if needed.'
                    }
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Your account is currently under review. You&apos;ll receive a notification once verification is complete.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
