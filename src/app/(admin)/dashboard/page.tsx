"use client";

import { withAdminAuth } from '@/hooks/use-admin-auth';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

function AdminDashboardPage() {
  return <AdminDashboard />;
}

export default withAdminAuth(AdminDashboardPage);
