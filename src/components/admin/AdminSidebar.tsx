"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Permission } from '@/types/user-roles';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileText,
  ShoppingBag,
  CreditCard,
  UserCheck,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: Users,
    permission: Permission.VIEW_USERS,
  },
  {
    name: 'Content Management',
    icon: FileText,
    children: [
      {
        name: 'Posts',
        href: '/admin/posts',
        icon: FileText,
        permission: Permission.VIEW_POSTS,
      },
      {
        name: 'Items',
        href: '/admin/items',
        icon: ShoppingBag,
        permission: Permission.VIEW_ITEMS,
      },
    ],
  },
  {
    name: 'Transactions',
    href: '/admin/transactions',
    icon: CreditCard,
    permission: Permission.VIEW_TRANSACTIONS,
  },
  {
    name: 'Seller Accounts',
    href: '/admin/seller-accounts',
    icon: UserCheck,
    permission: Permission.VIEW_SELLER_ACCOUNTS,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    permission: Permission.VIEW_ANALYTICS,
  },
  {
    name: 'System',
    icon: Settings,
    children: [
      {
        name: 'Admin Users',
        href: '/admin/admins',
        icon: Shield,
        permission: Permission.MANAGE_ADMINS,
      },
      {
        name: 'System Logs',
        href: '/admin/logs',
        icon: FileText,
        permission: Permission.VIEW_SYSTEM_LOGS,
      },
    ],
  },
];

export function AdminSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { adminUser, hasPermission } = useAdminAuth();

  const filteredNavigation = navigation.filter(item => {
    if (item.permission) {
      return hasPermission(item.permission);
    }
    if (item.children) {
      return item.children.some(child => 
        !child.permission || hasPermission(child.permission)
      );
    }
    return true;
  });

  const NavItem = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
    const isActive = pathname === item.href;
    const hasActiveChild = item.children?.some(child => pathname === child.href);

    if (item.children) {
      return (
        <div className="space-y-1">
          <div className={cn(
            "flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md",
            level > 0 && "ml-4"
          )}>
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </div>
          <div className="space-y-1">
            {item.children
              .filter(child => !child.permission || hasPermission(child.permission))
              .map((child) => (
                <NavItem key={child.href} item={child} level={level + 1} />
              ))}
          </div>
        </div>
      );
    }

    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
          level > 0 && "ml-4",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        )}
      >
        <item.icon className="mr-3 h-5 w-5" />
        {item.name}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {filteredNavigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {filteredNavigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-foreground">
                    {adminUser?.name?.charAt(0) || 'A'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{adminUser?.name}</p>
                <p className="text-xs text-gray-500">{adminUser?.role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-40"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
}
