"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Users, ShoppingCart, Calendar, Briefcase, Search, Map, MessageCircle, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Suspense } from "react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";

interface V0MainLayoutProps {
  children: React.ReactNode;
}

export function V0MainLayout({ children }: V0MainLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

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
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);

        if (error) {
          console.error('Error fetching unread count:', error);
          return;
        }

        setUnreadCount(count || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
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
    if (!user) return;

    const fetchUnreadMessagesCount = async () => {
      try {
        // Get conversations where user is a participant
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select(`
            id,
            messages(
              id,
              sender_id,
              is_read,
              read_by
            )
          `)
          .contains('participant_ids', [user.id.toString()]);

        if (conversationsError) {
          console.error('Error fetching conversations for unread count:', conversationsError);
          return;
        }

        // Calculate total unread messages across all conversations
        let totalUnread = 0;
        (conversationsData || []).forEach(conv => {
          const unreadInConv = conv.messages?.filter((msg: any) => 
            msg.sender_id !== user.id && 
            (!msg.is_read || !msg.read_by?.includes(user.id.toString()))
          ).length || 0;
          totalUnread += unreadInConv;
        });

        setUnreadMessagesCount(totalUnread);
      } catch (error) {
        console.error('Error fetching unread messages count:', error);
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
        filter: `participant_ids.cs.{${user.id.toString()}}`
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
  const isHomePage = pathname === "/";
  
  // Check if we're in a chat conversation
  const isChatPage = pathname.startsWith("/messages/") && pathname !== "/messages";

  return (
    <>
      {/* Fixed Header - Hidden in chat */}
      {!isChatPage && (
        <Suspense fallback={<div>Loading...</div>}>
          <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-border z-50 h-20">
          <div className="flex items-center justify-between p-4">
            {/* Yrdly Logo - Top Left */}
            <Link href="/" className="flex items-center">
              <img 
                src="/yrdly-logo.png" 
                alt="Yrdly" 
                className="w-12 h-12 object-contain"
              />
            </Link>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {isHomePage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {/* TODO: Implement search */}}
                >
                  <Search className="w-5 h-5" />
                </Button>
              )}
              <Link href="/map">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Map className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/messages">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground relative">
                  <MessageCircle className="w-5 h-5" />
                  {unreadMessagesCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{unreadMessagesCount}</span>
                    </div>
                  )}
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </Button>
              <Button variant="ghost" size="sm" className="p-0" onClick={() => setShowProfile(!showProfile)}>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile?.avatar_url || "/diverse-user-avatars.png"} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {profile?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </div>
          </div>
        </div>
        </Suspense>
      )}

      {/* Screen Content */}
      <div className={`min-h-screen ${isChatPage ? 'pt-0 pb-0' : 'pt-20 pb-20'}`}>
        {isChatPage ? (
          <div className="w-full h-full">
            {children}
          </div>
        ) : (
          <div className="max-w-sm mx-auto w-full">
            <div className="px-4 sm:px-6">
              {children}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Navigation - Hidden in chat */}
      {!isChatPage && (
        <Suspense fallback={<div>Loading...</div>}>
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-t border-border z-50 h-20">
          <div className="flex items-center justify-around py-3">
            <Link href="/" className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col gap-1 w-full ${pathname === "/" ? "text-primary" : "text-muted-foreground"}`}
              >
                <Home className="w-5 h-5" />
                <span className="text-xs">Home</span>
              </Button>
            </Link>
            <Link href="/neighbors" className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col gap-1 w-full ${pathname === "/neighbors" ? "text-primary" : "text-muted-foreground"}`}
              >
                <Users className="w-5 h-5" />
                <span className="text-xs">Community</span>
              </Button>
            </Link>
            <Link href="/marketplace" className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col gap-1 w-full ${pathname === "/marketplace" ? "text-primary" : "text-muted-foreground"}`}
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="text-xs">Market</span>
              </Button>
            </Link>
            <Link href="/events" className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col gap-1 w-full ${pathname === "/events" ? "text-primary" : "text-muted-foreground"}`}
              >
                <Calendar className="w-5 h-5" />
                <span className="text-xs">Events</span>
              </Button>
            </Link>
            <Link href="/businesses" className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col gap-1 w-full ${pathname === "/businesses" ? "text-primary" : "text-muted-foreground"}`}
              >
                <Briefcase className="w-5 h-5" />
                <span className="text-xs">Businesses</span>
              </Button>
            </Link>
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
    </>
  );
}

