
"use client";

import { useState } from 'react';
import { Search, MessageCircle, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-supabase-auth';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { NotificationsPanel } from './NotificationsPanel';
import { SearchDialog } from '../SearchDialog';
import { useUnreadMessages } from '@/hooks/use-unread-messages';
import { ProfileDropdown } from '@/components/ProfileDropdown';

export function AppHeader() {
  const { user, profile } = useAuth();
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const unreadMessagesCount = useUnreadMessages();

  const avatar_url = profile?.avatar_url || user?.user_metadata?.avatar_url || `https://placehold.co/100x100.png`;
  const displayName = profile?.name || user?.user_metadata?.name || 'User';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 md:relative z-50 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/home" className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Image 
              src="/yrdly-logo.png" 
              alt="Yrdly Logo" 
              width={32} 
              height={32}
              style={{ width: "auto", height: "auto" }}
            />
            <span className="font-headline">Yrdly</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          {pathname === '/home' && (
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsSearchOpen(true)}>
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          )}
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

          {/* Profile avatar trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setIsProfileOpen((v) => !v)}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatar_url} alt={displayName} data-ai-hint="person portrait" />
              <AvatarFallback
                style={{ background: "#388E3C", color: "#fff", fontFamily: "Raleway, sans-serif", fontWeight: 700 }}
              >
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </header>

      {/* New dark-themed profile dropdown */}
      {isProfileOpen && (
        <ProfileDropdown onClose={() => setIsProfileOpen(false)} />
      )}

      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
}
