"use client";

import { withAdminAuth } from '@/hooks/use-admin-auth';
import { Permission } from '@/types/user-roles';
import { UserManagement } from '@/components/admin/UserManagement';

function AdminUsersPage() {
  return <UserManagement />;
}

export default withAdminAuth(AdminUsersPage, Permission.VIEW_USERS);
