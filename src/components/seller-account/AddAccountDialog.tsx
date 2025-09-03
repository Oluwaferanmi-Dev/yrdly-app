"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SellerAccountService } from '@/lib/seller-account-service';
import { AccountType, BankAccountDetails, MobileMoneyDetails, DigitalWalletDetails } from '@/types/seller-account';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Smartphone, Wallet } from 'lucide-react';
import nigerianBanks from '@/data/nigerian-banks.json';

const accountFormSchema = z.object({
  accountType: z.enum(['bank_account', 'mobile_money', 'digital_wallet']),
  isPrimary: z.boolean().default(false),
  
  // Bank account fields
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
  bankCode: z.string().optional(),
  accountTypeBank: z.enum(['savings', 'current']).optional(),
  
  // Mobile money fields
  provider: z.enum(['mtn', 'airtel', 'glo', '9mobile', 'opay', 'palmpay']).optional(),
  phoneNumber: z.string().optional(),
  
  // Digital wallet fields
  walletProvider: z.enum(['paystack', 'flutterwave', 'interswitch']).optional(),
  email: z.string().email().optional(),
}).refine((data) => {
  if (data.accountType === 'bank_account') {
    return data.accountNumber && data.accountName && data.bankCode && data.accountTypeBank;
  }
  if (data.accountType === 'mobile_money') {
    return data.provider && data.phoneNumber;
  }
  if (data.accountType === 'digital_wallet') {
    return data.walletProvider && data.email;
  }
  return false;
}, {
  message: "Please fill in all required fields for the selected account type",
  path: ["accountType"]
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddAccountDialog({ open, onOpenChange, onSuccess }: AddAccountDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      accountType: 'bank_account',
      isPrimary: false,
    },
  });

  const watchedAccountType = form.watch('accountType');

  const onSubmit = async (data: AccountFormValues) => {
    try {
      setLoading(true);
      
      let accountDetails: BankAccountDetails | MobileMoneyDetails | DigitalWalletDetails;
      
      switch (data.accountType) {
        case 'bank_account':
          const selectedBank = nigerianBanks.find(bank => bank.code === data.bankCode);
          accountDetails = {
            accountNumber: data.accountNumber!,
            accountName: data.accountName!,
            bankCode: data.bankCode!,
            bankName: selectedBank?.name || '',
            accountType: data.accountTypeBank!
          } as BankAccountDetails;
          break;
          
        case 'mobile_money':
          accountDetails = {
            provider: data.provider!,
            phoneNumber: data.phoneNumber!,
            accountName: data.accountName || ''
          } as MobileMoneyDetails;
          break;
          
        case 'digital_wallet':
          accountDetails = {
            provider: data.walletProvider!,
            email: data.email!,
            accountName: data.accountName || ''
          } as DigitalWalletDetails;
          break;
          
        default:
          throw new Error('Invalid account type');
      }

      await SellerAccountService.saveAccount(
        'current-user-id', // This should come from auth context
        data.accountType as AccountType,
        accountDetails,
        data.isPrimary
      );

      toast({
        title: "Success",
        description: "Account added successfully. Please complete verification to receive payouts."
      });

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error adding account:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add account. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'bank_account':
        return <CreditCard className="h-5 w-5" />;
      case 'mobile_money':
        return <Smartphone className="h-5 w-5" />;
      case 'digital_wallet':
        return <Wallet className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Payout Account</DialogTitle>
          <DialogDescription>
            Add a bank account, mobile money, or digital wallet to receive payments from your sales.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Account Type Selection */}
          <div className="space-y-3">
            <Label>Account Type</Label>
            <RadioGroup
              value={watchedAccountType}
              onValueChange={(value) => form.setValue('accountType', value as any)}
              className="grid grid-cols-1 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bank_account" id="bank_account" />
                <Label htmlFor="bank_account" className="flex items-center space-x-2 cursor-pointer">
                  <CreditCard className="h-4 w-4" />
                  <span>Bank Account</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mobile_money" id="mobile_money" />
                <Label htmlFor="mobile_money" className="flex items-center space-x-2 cursor-pointer">
                  <Smartphone className="h-4 w-4" />
                  <span>Mobile Money</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="digital_wallet" id="digital_wallet" />
                <Label htmlFor="digital_wallet" className="flex items-center space-x-2 cursor-pointer">
                  <Wallet className="h-4 w-4" />
                  <span>Digital Wallet</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Bank Account Fields */}
          {watchedAccountType === 'bank_account' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Bank Account Details</span>
                </CardTitle>
                <CardDescription>
                  Enter your Nigerian bank account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankCode">Bank</Label>
                    <Select onValueChange={(value) => form.setValue('bankCode', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {nigerianBanks.map((bank) => (
                          <SelectItem key={bank.code} value={bank.code}>
                            {bank.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountTypeBank">Account Type</Label>
                    <Select onValueChange={(value) => form.setValue('accountTypeBank', value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="current">Current</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="Enter your account number"
                    {...form.register('accountNumber')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    placeholder="Enter account holder name"
                    {...form.register('accountName')}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mobile Money Fields */}
          {watchedAccountType === 'mobile_money' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5" />
                  <span>Mobile Money Details</span>
                </CardTitle>
                <CardDescription>
                  Enter your mobile money account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Select onValueChange={(value) => form.setValue('provider', value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mtn">MTN</SelectItem>
                        <SelectItem value="airtel">Airtel</SelectItem>
                        <SelectItem value="glo">Glo</SelectItem>
                        <SelectItem value="9mobile">9mobile</SelectItem>
                        <SelectItem value="opay">Opay</SelectItem>
                        <SelectItem value="palmpay">PalmPay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="08012345678"
                      {...form.register('phoneNumber')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    placeholder="Enter account holder name"
                    {...form.register('accountName')}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Digital Wallet Fields */}
          {watchedAccountType === 'digital_wallet' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5" />
                  <span>Digital Wallet Details</span>
                </CardTitle>
                <CardDescription>
                  Enter your digital wallet information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="walletProvider">Provider</Label>
                    <Select onValueChange={(value) => form.setValue('walletProvider', value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paystack">Paystack</SelectItem>
                        <SelectItem value="flutterwave">Flutterwave</SelectItem>
                        <SelectItem value="interswitch">Interswitch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter wallet email"
                      {...form.register('email')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    placeholder="Enter account holder name"
                    {...form.register('accountName')}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Primary Account Option */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPrimary"
              {...form.register('isPrimary')}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isPrimary">Set as primary payout account</Label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
