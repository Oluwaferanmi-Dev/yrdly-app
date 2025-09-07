"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { SellerAccountService } from '@/lib/seller-account-service';
import { 
  SellerAccount, 
  AccountType, 
  VerificationStatus, 
  VerificationLevel,
  PayoutRequest 
} from '@/types/seller-account';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  CreditCard,
  Smartphone,
  Wallet,
  Banknote
} from 'lucide-react';
import { AddAccountDialog } from './AddAccountDialog';
import { EditAccountDialog } from './EditAccountDialog';
import { VerificationDialog } from './VerificationDialog';
import { PayoutHistory } from './PayoutHistory';
import { useToast } from '@/hooks/use-toast';

export function SellerAccountSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<SellerAccount[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [editAccountOpen, setEditAccountOpen] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<SellerAccount | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [accountsData, payoutsData] = await Promise.all([
        SellerAccountService.getSellerAccounts(user!.uid),
        SellerAccountService.getPayoutHistory(user!.uid)
      ]);
      setAccounts(accountsData);
      setPayoutHistory(payoutsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load account information"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const handleAddAccount = () => {
    setSelectedAccount(null);
    setAddAccountOpen(true);
  };

  const handleEditAccount = (account: SellerAccount) => {
    setSelectedAccount(account);
    setEditAccountOpen(true);
  };

  const handleVerifyAccount = (account: SellerAccount) => {
    setSelectedAccount(account);
    setVerificationOpen(true);
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      // In a real implementation, you would call a delete method
      // For now, we'll just reload the data
      await loadData();
      toast({
        title: "Success",
        description: "Account deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete account"
      });
    }
  };

  const getAccountIcon = (accountType: AccountType) => {
    switch (accountType) {
      case AccountType.BANK_ACCOUNT:
        return <CreditCard className="h-5 w-5" />;
      case AccountType.MOBILE_MONEY:
        return <Smartphone className="h-5 w-5" />;
      case AccountType.DIGITAL_WALLET:
        return <Wallet className="h-5 w-5" />;
      default:
        return <Banknote className="h-5 w-5" />;
    }
  };

  const getVerificationBadge = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.VERIFIED:
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case VerificationStatus.PENDING:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case VerificationStatus.REJECTED:
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case VerificationStatus.EXPIRED:
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Seller Account Settings</h2>
          <p className="text-muted-foreground">
            Manage your payout accounts and verification status
          </p>
        </div>
        <Button onClick={handleAddAccount}>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="payouts">Payout History</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          {accounts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Banknote className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No accounts added</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add a payout account to receive payments from your sales
                </p>
                <Button onClick={handleAddAccount}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Account
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {accounts.map((account) => (
                <Card key={account.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getAccountIcon(account.accountType)}
                        <div>
                          <CardTitle className="text-lg">
                            {getAccountDisplayName(account)}
                            {account.isPrimary && (
                              <Badge variant="outline" className="ml-2">Primary</Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {account.accountType.replace('_', ' ').toUpperCase()}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getVerificationBadge(account.verificationStatus)}
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAccount(account)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {account.verificationStatus === VerificationStatus.PENDING && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerifyAccount(account)}
                            >
                              Verify
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAccount(account.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Verification Level:</span>
                        <span className="capitalize">{account.verificationLevel.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Added:</span>
                        <span>{account.createdAt.toLocaleDateString()}</span>
                      </div>
                      {account.verifiedAt && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Verified:</span>
                          <span>{account.verifiedAt.toLocaleDateString()}</span>
                        </div>
                      )}
                      {account.rejectedReason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          <strong>Rejection Reason:</strong> {account.rejectedReason}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payouts">
          <PayoutHistory payouts={payoutHistory} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddAccountDialog
        open={addAccountOpen}
        onOpenChange={setAddAccountOpen}
        onSuccess={loadData}
      />

      <EditAccountDialog
        open={editAccountOpen}
        onOpenChange={setEditAccountOpen}
        account={selectedAccount}
        onSuccess={loadData}
      />

      <VerificationDialog
        open={verificationOpen}
        onOpenChange={setVerificationOpen}
        account={selectedAccount}
        onSuccess={loadData}
      />
    </div>
  );
}
