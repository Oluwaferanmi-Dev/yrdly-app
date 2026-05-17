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
import { AccountType, BankAccountDetails, MobileMoneyDetails } from '@/types/seller-account';
import { useToast } from '@/hooks/use-toast';
import { Building2, Smartphone } from 'lucide-react';
import nigerianBanks from '@/data/nigerian-banks.json';

const accountFormSchema = z.object({
  accountType: z.enum(['bank_account', 'mobile_money']),
  isPrimary: z.boolean().default(false),
  
  // Bank account fields
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
  bankCode: z.string().optional(),
  accountTypeBank: z.enum(['savings', 'current']).optional(),
  
  // Mobile money fields
  provider: z.enum(['mtn', 'airtel', 'glo', '9mobile', 'opay', 'palmpay']).optional(),
  phoneNumber: z.string().optional(),
  
}).refine((data) => {
  if (data.accountType === 'bank_account') {
    return data.accountNumber && data.accountName && data.bankCode && data.accountTypeBank;
  }
  if (data.accountType === 'mobile_money') {
    return data.provider && data.phoneNumber;
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
      
      let accountDetails: BankAccountDetails | MobileMoneyDetails;
      
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
        return <Building2 className="h-5 w-5" />;
      case 'mobile_money':
        return <Smartphone className="h-5 w-5" />;
      default:
        return <Building2 className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-lg w-[95vw] p-0 border-none bg-transparent shadow-2xl overflow-hidden"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <div 
          className="relative w-full max-h-[90vh] overflow-y-auto rounded-[32px] p-8 space-y-8 animate-in zoom-in-95 duration-300"
          style={{ 
            background: "var(--card)",
            border: "1px solid rgba(255,255,255,0.05)"
          }}
        >
          {/* Decorative Header Gradient */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#388E3C]/10 to-transparent pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-black text-foreground tracking-tight">Add Payout Account</h2>
              <div className="w-10 h-10 rounded-2xl bg-[#388E3C]/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#388E3C]" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              Choose your preferred method to receive payments from your neighborhood sales.
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="relative z-10 space-y-8">
            {/* Account Type Selection */}
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground ml-1">
                Preferred Method
              </label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'bank_account', label: 'Bank Account', icon: Building2, desc: '97% Payout • Direct to local bank' },
                  { id: 'mobile_money', label: 'Mobile Money', icon: Smartphone, desc: 'Fast processing • Carrier wallets' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => form.setValue('accountType', type.id as any)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                      watchedAccountType === type.id 
                        ? 'bg-[#388E3C]/10 border-[#388E3C]/50 ring-1 ring-[#388E3C]/50' 
                        : 'bg-white/5 border-border hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      watchedAccountType === type.id ? 'bg-[#388E3C] text-white' : 'bg-white/10 text-muted-foreground group-hover:text-foreground'
                    }`}>
                      <type.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={`font-black text-sm ${watchedAccountType === type.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {type.label}
                      </p>
                      <p className="text-[10px] font-medium opacity-60">{type.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Fields Section */}
            <div className="space-y-6 pt-4 border-t border-border">
              {watchedAccountType === 'bank_account' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.15em] font-black text-muted-foreground ml-1">Bank</label>
                      <div className="relative">
                        <select 
                          className="w-full h-12 rounded-xl bg-white/5 border border-border px-4 text-base text-foreground focus:border-[#388E3C]/50 focus:outline-none appearance-none"
                          onChange={(e) => form.setValue('bankCode', e.target.value)}
                        >
                          <option value="" className="bg-card">Select...</option>
                          {nigerianBanks.map((bank) => (
                            <option key={bank.code} value={bank.code} className="bg-card">{bank.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.15em] font-black text-muted-foreground ml-1">Type</label>
                      <select 
                        className="w-full h-12 rounded-xl bg-white/5 border border-border px-4 text-base text-foreground focus:border-[#388E3C]/50 focus:outline-none appearance-none"
                        onChange={(e) => form.setValue('accountTypeBank', e.target.value as any)}
                      >
                        <option value="savings" className="bg-card">Savings</option>
                        <option value="current" className="bg-card">Current</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.15em] font-black text-muted-foreground ml-1">Account Number</label>
                    <input
                      className="w-full h-12 rounded-xl bg-white/5 border border-border px-4 text-base text-foreground focus:border-[#388E3C]/50 focus:outline-none placeholder:text-muted-foreground"
                      placeholder="0123456789"
                      {...form.register('accountNumber')}
                    />
                  </div>
                </div>
              )}

              {watchedAccountType === 'mobile_money' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.15em] font-black text-muted-foreground ml-1">Provider</label>
                      <select 
                        className="w-full h-12 rounded-xl bg-white/5 border border-border px-4 text-base text-foreground focus:border-[#388E3C]/50 focus:outline-none appearance-none"
                        onChange={(e) => form.setValue('provider', e.target.value as any)}
                      >
                        <option value="mtn" className="bg-card">MTN</option>
                        <option value="airtel" className="bg-card">Airtel</option>
                        <option value="opay" className="bg-card">Opay</option>
                        <option value="palmpay" className="bg-card">PalmPay</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.15em] font-black text-muted-foreground ml-1">Phone</label>
                      <input
                        className="w-full h-12 rounded-xl bg-white/5 border border-border px-4 text-base text-foreground focus:border-[#388E3C]/50 focus:outline-none placeholder:text-muted-foreground"
                        placeholder="08012345678"
                        {...form.register('phoneNumber')}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.15em] font-black text-muted-foreground ml-1">Account Holder Name</label>
                <input
                  className="w-full h-12 rounded-xl bg-white/5 border border-border px-4 text-base text-foreground focus:border-[#388E3C]/50 focus:outline-none placeholder:text-muted-foreground"
                  placeholder="e.g. John Doe"
                  {...form.register('accountName')}
                />
              </div>

              {/* Primary Checkbox */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    {...form.register('isPrimary')}
                  />
                  <div className="w-5 h-5 rounded border border-border bg-white/5 peer-checked:bg-[#388E3C] peer-checked:border-[#388E3C] transition-all" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                </div>
                <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">Set as primary payout method</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-[#388E3C] text-white font-black text-sm transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                style={{ boxShadow: "0 10px 20px -5px rgba(56,142,60,0.3)" }}
              >
                {loading ? 'Adding Account...' : 'Link Account'}
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-full h-12 rounded-2xl bg-white/5 text-muted-foreground font-black text-xs uppercase tracking-widest hover:text-foreground transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
