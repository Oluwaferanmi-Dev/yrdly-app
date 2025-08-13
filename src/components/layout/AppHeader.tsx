
"use client";

import { Search, Bell, LogOut } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { NotificationsPanel } from './NotificationsPanel';

export function AppHeader() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4">
       <div className="flex items-center gap-2">
         <Link href="/home" className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Image src="/yrdly-logo.png" alt="Yrdly Logo" width={32} height={32} />
           <span className="font-headline">Yardly</span>
         </Link>
       </div>
      
      <div className="flex w-full items-center gap-4 md:w-auto ml-auto">
        <Button variant="ghost" size="icon" className="rounded-full ml-auto">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
        </Button>
        <NotificationsPanel />
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
