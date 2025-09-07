"use client";

import { useAdminAuth } from '@/hooks/use-admin-auth-simple';
import { Button } from '@/components/ui/button';
import { LogOut, Bell, User } from 'lucide-react';

export function AdminHeader() {
  const { adminUser } = useAdminAuth();

  const handleLogout = () => {
    // Implement logout logic
    window.location.href = '/';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Welcome back, {adminUser?.name}
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          
          {/* User menu */}
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">
                {adminUser?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-700">{adminUser?.name}</p>
              <p className="text-xs text-gray-500">{adminUser?.role.replace('_', ' ')}</p>
            </div>
          </div>
          
          {/* Logout button */}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
