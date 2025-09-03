"use client";

import { withAdminAuth } from '@/hooks/use-admin-auth';
import { Permission } from '@/types/user-roles';
import { AdminUserManagement } from '@/components/admin/AdminUserManagement';

function AdminAdminsPage() {
  return <AdminUserManagement />;
}

export default withAdminAuth(AdminAdminsPage, Permission.MANAGE_ADMINS);
