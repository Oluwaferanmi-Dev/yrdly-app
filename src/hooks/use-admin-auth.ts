"use client";

import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from './use-auth';
import { AdminService } from '@/lib/admin-service';
import { AdminUser, UserRole, Permission } from '@/types/user-roles';

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasPermission: (permission: Permission) => boolean;
  refreshAdminUser: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminUser = async () => {
    if (!user?.email) {
      setAdminUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const admin = await AdminService.getAdminByEmail(user.email);
      setAdminUser(admin);
      
      if (admin) {
        // Update last login time
        await AdminService.updateLastLogin(admin.id);
      }
    } catch (error) {
      console.error('Error fetching admin user:', error);
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminUser();
  }, [user?.email]);

  const hasPermission = (permission: Permission): boolean => {
    if (!adminUser) return false;
    return AdminService.hasPermission(adminUser.role, permission);
  };

  const isAdmin = adminUser?.role === UserRole.ADMIN || adminUser?.role === UserRole.SUPER_ADMIN;
  const isSuperAdmin = adminUser?.role === UserRole.SUPER_ADMIN;

  const value: AdminAuthContextType = {
    adminUser,
    loading,
    isAdmin,
    isSuperAdmin,
    hasPermission,
    refreshAdminUser: fetchAdminUser
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

// Higher-order component for admin-only routes
export function withAdminAuth<T extends object>(
  Component: React.ComponentType<T>,
  requiredPermission?: Permission
) {
  return function AdminProtectedComponent(props: T) {
    const { adminUser, loading, hasPermission } = useAdminAuth();

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!adminUser) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have admin privileges.</p>
          </div>
        </div>
      );
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Insufficient Permissions</h1>
            <p className="text-gray-600">You don't have the required permissions to access this page.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
