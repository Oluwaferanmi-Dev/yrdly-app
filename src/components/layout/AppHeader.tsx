
"use client";

import { Search, Bell, LogOut, Home, ShoppingCart, Calendar, Briefcase, MessageSquare } from 'lucide-react';
import {
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function AppHeader() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  }

  const menuItems = [
    { href: '/home', label: 'Newsfeed', icon: Home },
    { href: '/marketplace', label: 'Marketplace', icon: ShoppingCart },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/businesses', label: 'Businesses', icon: Briefcase },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
  ];


  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
       <div className="flex items-center gap-2">
         <SidebarTrigger className="md:hidden" />
         <Link href="/home" className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Image src="/yrdly-logo.png" alt="Yrdly Logo" width={32} height={32} />
           <span className="font-headline hidden md:inline-block">Yardly</span>
         </Link>
       </div>
      
       <nav className="hidden md:flex items-center gap-4 mx-auto">
        {menuItems.map(item => (
           <Button key={item.label} variant="ghost" asChild className={cn("text-muted-foreground", pathname === item.href && "text-primary bg-accent")}>
             <Link href={item.href}>
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
             </Link>
           </Button>
        ))}
       </nav>
      
      <div className="flex w-full items-center gap-4 md:w-auto md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial md:ml-0">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-background"
            />
          </div>
        </form>
         <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Toggle notifications</span>
          </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL || `https://placehold.co/100x100.png`} alt={user?.displayName || 'User'} data-ai-hint="person portrait" />
                <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.displayName || 'My Account'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/settings">Settings</Link></DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
