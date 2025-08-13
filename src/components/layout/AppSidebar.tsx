'use client';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Home, ShoppingCart, Calendar, Briefcase, MessageSquare, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const menuItems = [
    { href: '/home', label: 'Newsfeed', icon: Home },
    { href: '/marketplace', label: 'Marketplace', icon: ShoppingCart },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/businesses', label: 'Businesses', icon: Briefcase },
    { href: '/neighbors', label: 'Neighbors', icon: Users },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/home" className="flex items-center gap-2">
            <Image src="/yrdly-logo.png" alt="Yrdly Logo" width={32} height={32} />
            <span className="font-bold text-lg font-headline">Yardly</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.label, side: 'right' }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
         <SidebarMenu>
          <SidebarMenuItem>
             <SidebarMenuButton
                asChild
                isActive={pathname === '/settings'}
                 tooltip={{ children: 'Settings', side: 'right' }}
              >
                <Link href="/settings">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
