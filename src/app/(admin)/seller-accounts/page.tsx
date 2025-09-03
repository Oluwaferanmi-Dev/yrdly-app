"use client";

import { withAdminAuth } from '@/hooks/use-admin-auth';
import { Permission } from '@/types/user-roles';
import { SellerAccountManagement } from '@/components/admin/SellerAccountManagement';

function AdminSellerAccountsPage() {
  return <SellerAccountManagement />;
}

export default withAdminAuth(AdminSellerAccountsPage, Permission.VIEW_SELLER_ACCOUNTS);
