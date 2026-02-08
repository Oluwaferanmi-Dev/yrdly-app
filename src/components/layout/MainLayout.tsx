"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  HomeIcon, 
  UsersIcon, 
  ShoppingCartIcon, 
  CalendarIcon, 
  BriefcaseIcon, 
  MagnifyingGlassIcon, 
  MapIcon, 
  ChatBubbleLeftRightIcon, 
  BellIcon 
} from "@heroicons/react/24/outline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Suspense } from "react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { SearchDialog } from "@/components/SearchDialog";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";
import Image from "next/image";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Add error boundary for this component
  if (renderError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive mb-4">Error Loading Layout</p>
          <p className="text-sm text-muted-foreground mb-4">{renderError}</p>
          <Button onClick={() => {
            setRenderError(null);
            window.location.reload();
          }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const handleProfileAction = (action: string) => {
    setShowProfile(false);
    if (action === "profile") {
      router.push("/profile");
    } else if (action === "settings") {
      router.push("/settings");
    }
  };


  // Fetch unread notification count
  useEffect(() => {
    if (!user || !user.id) return;

    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);

        if (error) {
          console.error('[v0] Error fetching unread count:', error);
          return;
        }

        setUnreadCount(count || 0);
      } catch (error) {
        console.error('[v0] Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Set up real-time subscription for notifications
    const channel = supabase
      .channel('notification_count')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        // Refetch count when notifications change
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Fetch unread messages count
  useEffect(() => {
    if (!user || !user.id) return;

    const fetchUnreadMessagesCount = async () => {
      try {
        // Get conversations where user is a participant
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select(`
            id,
            type,
            participant_ids,
            messages(
              id,
              sender_id,
              is_read,
              read_by
            )
          `)
          .contains('participant_ids', [user.id]);

        if (conversationsError) {
          console.error('[v0] Error fetching conversations:', conversationsError);
          return;
        }

        // Calculate number of chats with unread messages (not total message count)
        let unreadChatsCount = 0;
        
        // Process each conversation
        for (const conv of (conversationsData || [])) {
          let hasUnreadMessages = false;
          
          // For marketplace conversations, check chat_messages table
          if (conv.type === 'marketplace') {
            const { data: chatMessages, error: chatMessagesError } = await supabase
              .from('chat_messages')
              .select('sender_id, created_at')
              .eq('chat_id', conv.id)
              .order('created_at', { ascending: true });

            if (chatMessagesError) {
              continue;
            }

            // If no messages exist, consider the chat as read
            if (!chatMessages || chatMessages.length === 0) {
              continue; // Skip this chat - it's considered read
            }

            const lastMessage = chatMessages?.[chatMessages.length - 1];
            const lastMessageSentByUser = lastMessage?.sender_id === user.id;
            
            // If the user sent the last message, the chat should be considered read
            if (lastMessageSentByUser) {
              continue; // Skip this chat - it's considered read
            }
            
            // For marketplace conversations, since chat_messages doesn't have is_read column,
            // we'll check if there are any messages from other users
            hasUnreadMessages = chatMessages?.some((msg: { sender_id: string }) => 
              msg.sender_id !== user.id
            ) || false;
            
          } else {
            // For other conversation types, use the existing logic
            const lastMessage = conv.messages?.[conv.messages.length - 1];
            const lastMessageSentByUser = lastMessage?.sender_id === user.id;
            
            // If the user sent the last message, the chat should be considered read
            if (lastMessageSentByUser) {
              continue; // Skip this chat - it's considered read
            }
            
            // Otherwise, check if there are unread messages from other users
            hasUnreadMessages = conv.messages?.some((msg: { sender_id: string; is_read?: boolean; read_by?: string[] }) => 
              msg.sender_id !== user.id && 
              (!msg.is_read || !msg.read_by?.includes(user.id))
            ) || false;
          }
          
          if (hasUnreadMessages) {
            unreadChatsCount++;
          }
        }

        // Debug: Check if any conversations are marketplace type
        const marketplaceConversations = conversationsData?.filter(c => c.type === 'marketplace') || [];
        
        setUnreadMessagesCount(unreadChatsCount);
      } catch (error) {
        // Error fetching unread messages count
      }
    };

    fetchUnreadMessagesCount();

    // Set up real-time subscription for conversations
    const channel = supabase
      .channel('conversations_count')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'conversations',
        filter: `participant_ids.cs.{${user.id}}`
      }, () => {
        // Refetch count when conversations change
        fetchUnreadMessagesCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Check if we're on the home page
  const isHomePage = pathname === "/home";
  
  // Check if we're in a chat conversation or business chat
  const isChatPage = (pathname.startsWith("/messages/") && pathname !== "/messages") || 
                     pathname.includes("/chat");

  return (
    <>
      {/* Fixed Header - Hidden in chat */}
      {!isChatPage && (
        <Suspense fallback={<div>Loading...</div>}>
          <div className="fixed top-0 left-0 right-0 w-full bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-border z-50 h-16 sm:h-20" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            <div className="max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 py-2">
              <div className="flex items-center justify-between h-full">
                {/* Yrdly Logo - Top Left */}
                <Link href="/" className="flex items-center">
                  <Image 
                    src="/yrdly-logo.png" 
                    alt="Yrdly" 
                    width={60}
                    height={60}
                    className="object-contain"
                    style={{ width: "auto", height: "auto" }}
                  />
                </Link>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 sm:gap-2">
                  {isHomePage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground p-2"
                      onClick={() => setShowSearch(true)}
                    >
                      <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  )}
                  <Link href="/map">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground p-2">
                      <MapIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </Link>
                  <Link href="/messages">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground relative p-2">
                      <ChatBubbleLeftRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      {unreadMessagesCount > 0 && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold leading-none">
                            {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                          </span>
                        </div>
                      )}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground relative p-2"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <BellIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    {unreadCount > 0 && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" className="p-1" onClick={() => setShowProfile(!showProfile)}>
                    <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                      <AvatarImage src={profile?.avatar_url || "/diverse-user-avatars.png"} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                        {profile?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          </Suspense>
        )}

      {/* Screen Content */}
      <div className={`min-h-screen ${isChatPage ? 'pt-0 pb-0' : 'pt-16 pb-16 sm:pt-20 sm:pb-20'}`}>
        <ErrorBoundary>
          {isChatPage ? (
            <div className="w-full h-full">
              {children}
            </div>
          ) : (
            <div className="w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto">
              <div className="px-3 sm:px-4 md:px-6">
                {children}
              </div>
            </div>
          )}
        </ErrorBoundary>
      </div>

      {/* Fixed Bottom Navigation - Hidden in chat */}
      {!isChatPage && (
        <Suspense fallback={<div>Loading...</div>}>
          <div className="fixed bottom-0 left-0 right-0 w-full bg-background/80 dark:bg-background/80 backdrop-blur-md border-t border-border/50 z-50 h-12 safe-area-bottom">
            <div className="max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto h-full">
              <div className="flex items-center justify-around h-full px-1">
                <Link href="/" className="flex-1 flex items-center justify-center h-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex flex-col gap-0.5 w-full h-full py-1 px-1 ${pathname === "/" ? "text-primary" : "text-muted-foreground"}`}
                  >
                    <HomeIcon className="w-5 h-5" />
                    <span className="text-[10px] leading-tight">Home</span>
                  </Button>
                </Link>
                <Link href="/neighbors" className="flex-1 flex items-center justify-center h-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex flex-col gap-0.5 w-full h-full py-1 px-1 ${pathname === "/neighbors" ? "text-primary" : "text-muted-foreground"}`}
                  >
                    <UsersIcon className="w-5 h-5" />
                    <span className="text-[10px] leading-tight">Community</span>
                  </Button>
                </Link>
                <Link href="/marketplace" className="flex-1 flex items-center justify-center h-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex flex-col gap-0.5 w-full h-full py-1 px-1 ${pathname === "/marketplace" ? "text-primary" : "text-muted-foreground"}`}
                  >
                    <ShoppingCartIcon className="w-5 h-5" />
                    <span className="text-[10px] leading-tight">Market</span>
                  </Button>
                </Link>
                <Link href="/events" className="flex-1 flex items-center justify-center h-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex flex-col gap-0.5 w-full h-full py-1 px-1 ${pathname === "/events" ? "text-primary" : "text-muted-foreground"}`}
                  >
                    <CalendarIcon className="w-5 h-5" />
                    <span className="text-[10px] leading-tight">Events</span>
                  </Button>
                </Link>
                <Link href="/businesses" className="flex-1 flex items-center justify-center h-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex flex-col gap-0.5 w-full h-full py-1 px-1 ${pathname === "/businesses" ? "text-primary" : "text-muted-foreground"}`}
                  >
                    <BriefcaseIcon className="w-5 h-5" />
                    <span className="text-[10px] leading-tight">Businesses</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          </Suspense>
        )}

      {/* Profile Dropdown */}
      {showProfile && (
        <ProfileDropdown
          onClose={() => setShowProfile(false)}
          onAction={handleProfileAction}
        />
      )}

      {/* Notifications Dropdown */}
      <NotificationsDropdown 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Search Dialog */}
      <SearchDialog 
        open={showSearch}
        onOpenChange={setShowSearch}
      />
    </>
  );
}

