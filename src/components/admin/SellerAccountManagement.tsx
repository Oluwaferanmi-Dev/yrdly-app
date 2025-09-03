"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock,
  UserCheck,
  CreditCard,
  Smartphone,
  Wallet
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SellerAccount {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  isVerified: boolean;
  verificationStatus: 'pending' | 'verified' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export function SellerAccountManagement() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<SellerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      // Mock data - in production, fetch from your API
      const mockAccounts: SellerAccount[] = [
        {
          id: '1',
          userId: 'user1',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          bankName: 'Access Bank',
          accountName: 'John Doe',
          accountNumber: '0123456789',
          isVerified: true,
          verificationStatus: 'verified',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20')
        },
        {
          id: '2',
          userId: 'user2',
          userName: 'Jane Smith',
          userEmail: 'jane@example.com',
          bankName: 'GTBank',
          accountName: 'Jane Smith',
          accountNumber: '0234567890',
          isVerified: false,
          verificationStatus: 'pending',
          createdAt: new Date('2024-01-18'),
          updatedAt: new Date('2024-01-19')
        },
        {
          id: '3',
          userId: 'user3',
          userName: 'Mike Johnson',
          userEmail: 'mike@example.com',
          bankName: 'First Bank',
          accountName: 'Mike Johnson',
          accountNumber: '0345678901',
          isVerified: false,
          verificationStatus: 'failed',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-15')
        }
      ];
      setAccounts(mockAccounts);
    } catch (error) {
      console.error('Error fetching seller accounts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load seller accounts."
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.bankName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || account.verificationStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleVerifyAccount = async (accountId: string) => {
    try {
      // In production, call your API to verify the account
      setAccounts(accounts.map(account => 
        account.id === accountId 
          ? { ...account, isVerified: true, verificationStatus: 'verified' as const }
          : account
      ));
      
      toast({
        title: "Success",
        description: "Account verified successfully."
      });
    } catch (error) {
      console.error('Error verifying account:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify account."
      });
    }
  };

  const handleRejectAccount = async (accountId: string) => {
    try {
      // In production, call your API to reject the account
      setAccounts(accounts.map(account => 
        account.id === accountId 
          ? { ...account, isVerified: false, verificationStatus: 'failed' as const }
          : account
      ));
      
      toast({
        title: "Success",
        description: "Account rejected."
      });
    } catch (error) {
      console.error('Error rejecting account:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject account."
      });
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-96 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seller Account Management</h1>
          <p className="text-gray-600">Review and verify seller bank accounts</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.filter(a => a.verificationStatus === 'verified').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.filter(a => a.verificationStatus === 'pending').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.filter(a => a.verificationStatus === 'failed').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Seller Accounts</CardTitle>
          <CardDescription>Review and manage seller bank account verifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by seller name, email, or bank..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Accounts Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead>Bank Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{account.userName}</p>
                        <p className="text-sm text-gray-500">{account.userEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{account.bankName}</p>
                          <p className="text-sm text-gray-500">{account.accountName}</p>
                          <p className="text-sm text-gray-500">****{account.accountNumber.slice(-4)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(account.verificationStatus)}
                        {getStatusBadge(account.verificationStatus)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {formatDate(account.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {account.verificationStatus === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerifyAccount(account.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectAccount(account.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {account.verificationStatus === 'failed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerifyAccount(account.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Re-verify
                          </Button>
                        )}
                        {account.verificationStatus === 'verified' && (
                          <span className="text-sm text-green-600 font-medium">Verified</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredAccounts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No seller accounts found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
