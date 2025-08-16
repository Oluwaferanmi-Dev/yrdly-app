
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
import { Home, ShoppingCart, Calendar, Briefcase, MessageSquare, Settings, Users, Map } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

export function AppSidebar() {
  const pathname = usePathname();
  const { pendingRequestCount } = useAuth();

  const menuItems = [
    { href: '/home', label: 'Newsfeed', icon: Home },
    { href: '/map', label: 'Map', icon: Map },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/marketplace', label: 'Marketplace', icon: ShoppingCart },
    { href: '/businesses', label: 'Businesses', icon: Briefcase },
    { href: '/neighbors', label: 'Community', icon: Users, badge: pendingRequestCount > 0 ? pendingRequestCount : null },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/home" className="flex items-center gap-2">
            <Image src="/yrdly-logo.png" alt="Yrdly Logo" width={32} height={32} />
            <span className="font-bold text-lg font-headline">Yrdly</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={{ children: item.label, side: 'right' }}
              >
                <Link href={item.href} className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-3">
                    <item.icon />
                    <span>{item.label}</span>
                  </div>
                  {item.badge != null && item.badge > 0 && <Badge className="h-6 w-6 flex items-center justify-center">{item.badge}</Badge>}
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
                isActive={pathname.startsWith('/settings')}
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
