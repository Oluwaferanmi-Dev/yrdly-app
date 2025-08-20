
"use client";

import { useState } from 'react';
import { Search, LogOut, MessageCircle, Map, Settings, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { SearchDialog } from '../SearchDialog';
import { useUnreadMessages } from '@/hooks/use-unread-messages';
import { cn } from '@/lib/utils';

export function AppHeader() {
  const { user, userDetails } = useAuth();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const unreadMessagesCount = useUnreadMessages();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const avatarUrl = userDetails?.avatarUrl || user?.photoURL || `https://placehold.co/100x100.png`;
  const displayName = userDetails?.name || user?.displayName || 'User';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 md:relative z-10 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4">
        <div className="flex items-center gap-4">
          <Link href="/home" className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Image src="/yrdly-logo.png" alt="Yrdly Logo" width={32} height={32} />
            <span className="font-headline">Yrdly</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsSearchOpen(true)}>
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
          <Link href="/map" className="md:hidden">
            <Button variant="ghost" size="icon" className="rounded-full">
                <Map className="h-5 w-5" />
                <span className="sr-only">Map</span>
            </Button>
          </Link>
          <Link href="/messages">
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <MessageCircle className="h-5 w-5" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full h-4 w-4 flex items-center justify-center text-xs font-bold">
                  {unreadMessagesCount}
                </span>
              )}
              <span className="sr-only">Messages</span>
            </Button>
          </Link>
          <NotificationsPanel />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                 <Avatar className="h-8 w-8">
                   <AvatarImage src={avatarUrl} alt={displayName} data-ai-hint="person portrait" />
                   <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                 </Avatar>
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/profile">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
               <DropdownMenuItem asChild>
                 <Link href="/settings">
                   <Settings className="mr-2 h-4 w-4" />
                   <span>Settings</span>
                 </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
}
