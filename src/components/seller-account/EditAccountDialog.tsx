"use client";

import React, { useState, useEffect } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SellerAccountService } from '@/lib/seller-account-service';
import { SellerAccount, AccountType, BankAccountDetails, MobileMoneyDetails, DigitalWalletDetails } from '@/types/seller-account';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Smartphone, Wallet } from 'lucide-react';
import nigerianBanks from '@/data/nigerian-banks.json';

const editAccountFormSchema = z.object({
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
});

type EditAccountFormValues = z.infer<typeof editAccountFormSchema>;

interface EditAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: SellerAccount | null;
  onSuccess: () => void;
}

export function EditAccountDialog({ open, onOpenChange, account, onSuccess }: EditAccountDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const form = useForm<EditAccountFormValues>({
    resolver: zodResolver(editAccountFormSchema),
    defaultValues: {
      isPrimary: false,
    },
  });

  useEffect(() => {
    if (account && open) {
      // Populate form with existing account data
      const details = account.accountDetails as any;
      
      form.reset({
        isPrimary: account.isPrimary,
        accountNumber: details.accountNumber || '',
        accountName: details.accountName || '',
        bankCode: details.bankCode || '',
        accountTypeBank: details.accountType || '',
        provider: details.provider || '',
        phoneNumber: details.phoneNumber || '',
        walletProvider: details.provider || '',
        email: details.email || '',
      });
    }
  }, [account, open, form]);

  const onSubmit = async (data: EditAccountFormValues) => {
    if (!account) return;

    try {
      setLoading(true);
      
      // Update account details based on account type
      let updatedDetails: BankAccountDetails | MobileMoneyDetails | DigitalWalletDetails;
      
      switch (account.accountType) {
        case AccountType.BANK_ACCOUNT:
          const selectedBank = nigerianBanks.find(bank => bank.code === data.bankCode);
          updatedDetails = {
            accountNumber: data.accountNumber!,
            accountName: data.accountName!,
            bankCode: data.bankCode!,
            bankName: selectedBank?.name || '',
            accountType: data.accountTypeBank!
          } as BankAccountDetails;
          break;
          
        case AccountType.MOBILE_MONEY:
          updatedDetails = {
            provider: data.provider!,
            phoneNumber: data.phoneNumber!,
            accountName: data.accountName || ''
          } as MobileMoneyDetails;
          break;
          
        case AccountType.DIGITAL_WALLET:
          updatedDetails = {
            provider: data.walletProvider!,
            email: data.email!,
            accountName: data.accountName || ''
          } as DigitalWalletDetails;
          break;
          
        default:
          throw new Error('Invalid account type');
      }

      // In a real implementation, you would call an update method
      // For now, we'll just show success
      console.log('Updating account:', account.id, updatedDetails, data.isPrimary);

      toast({
        title: "Success",
        description: "Account updated successfully"
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating account:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update account. Please try again."
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

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getAccountTypeIcon(account.accountType)}
            <span>Edit Account</span>
          </DialogTitle>
          <DialogDescription>
            Update your account information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Bank Account Fields */}
          {account.accountType === AccountType.BANK_ACCOUNT && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Bank Account Details</span>
                </CardTitle>
                <CardDescription>
                  Update your Nigerian bank account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankCode">Bank</Label>
                    <Select 
                      value={form.watch('bankCode')} 
                      onValueChange={(value) => form.setValue('bankCode', value)}
                    >
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
                    <Select 
                      value={form.watch('accountTypeBank')} 
                      onValueChange={(value) => form.setValue('accountTypeBank', value as any)}
                    >
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
          {account.accountType === AccountType.MOBILE_MONEY && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5" />
                  <span>Mobile Money Details</span>
                </CardTitle>
                <CardDescription>
                  Update your mobile money account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Select 
                      value={form.watch('provider')} 
                      onValueChange={(value) => form.setValue('provider', value as any)}
                    >
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
          {account.accountType === AccountType.DIGITAL_WALLET && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5" />
                  <span>Digital Wallet Details</span>
                </CardTitle>
                <CardDescription>
                  Update your digital wallet information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="walletProvider">Provider</Label>
                    <Select 
                      value={form.watch('walletProvider')} 
                      onValueChange={(value) => form.setValue('walletProvider', value as any)}
                    >
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
              {loading ? 'Updating...' : 'Update Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
