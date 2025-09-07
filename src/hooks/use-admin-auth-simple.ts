"use client";

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { AdminUser, UserRole, Permission } from '@/types/user-roles';

export function useAdminAuth() {
  const { user } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) {
      setAdminUser(null);
      setLoading(false);
      return;
    }

    // For now, just set a mock admin user
    // In production, you would fetch from your admin service
    setAdminUser({
      id: '1',
      email: user.email,
      name: 'Admin User',
      role: UserRole.SUPER_ADMIN,
      permissions: {},
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    setLoading(false);
  }, [user?.email]);

  const hasPermission = (permission: Permission): boolean => {
    if (!adminUser) return false;
    return adminUser.role === UserRole.SUPER_ADMIN;
  };

  const isAdmin = adminUser?.role === UserRole.ADMIN || adminUser?.role === UserRole.SUPER_ADMIN;
  const isSuperAdmin = adminUser?.role === UserRole.SUPER_ADMIN;

  return {
    adminUser,
    loading,
    isAdmin,
    isSuperAdmin,
    hasPermission
  };
}
