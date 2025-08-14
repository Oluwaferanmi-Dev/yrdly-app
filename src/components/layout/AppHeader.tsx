
"use client";

import { useState } from 'react';
import { Search, LogOut, MessageCircle } from 'lucide-react';
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

export function AppHeader() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 md:relative z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4">
         <div className="flex items-center gap-2">
           <Link href="/home" className="flex items-center gap-2 text-xl font-bold text-foreground">
              <Image src="/yrdly-logo.png" alt="Yrdly Logo" width={32} height={32} />
             <span className="font-headline">Yrdly</span>
           </Link>
         </div>
        
        <div className="flex w-full items-center gap-2 md:w-auto ml-auto">
          <Button variant="ghost" size="icon" className="rounded-full ml-auto" onClick={() => setIsSearchOpen(true)}>
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
          </Button>
          <Link href="/messages">
              <Button variant="ghost" size="icon" className="rounded-full">
                  <MessageCircle className="h-5 w-5" />
                  <span className="sr-only">Messages</span>
              </Button>
          </Link>
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
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
}
