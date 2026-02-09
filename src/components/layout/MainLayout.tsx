"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Home,
  Users,
  ShoppingBag,
  Calendar,
  Briefcase,
  MapPin,
  MessageCircle,
  Bell,
  Search,
  Plus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Suspense } from "react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { SearchDialog } from "@/components/SearchDialog";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { supabase } from "@/lib/supabase";
import { HomeRightSidebar } from "./HomeRightSidebar";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/neighbors", label: "Community", icon: Users },
  { href: "/marketplace", label: "Market", icon: ShoppingBag },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/businesses", label: "Business", icon: Briefcase },
];

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const isHomePage = pathname === "/home";
  const isPostDetailPage = pathname.startsWith("/posts/") && pathname.split("/").filter(Boolean).length === 2;
  const showRightSidebar = (isHomePage || isPostDetailPage);
  const isChatPage =
    (pathname.startsWith("/messages/") && pathname !== "/messages") ||
    pathname.includes("/chat");

  const handleProfileAction = (action: string) => {
    setShowProfile(false);
    if (action === "profile") router.push("/profile");
    else if (action === "settings") router.push("/settings");
  };

  useEffect(() => {
    if (!user) return;
    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (!error) setUnreadCount(count || 0);
    };
    fetchUnreadCount();
    const ch = supabase
      .channel("notification_count")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, fetchUnreadCount)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchUnreadMessagesCount = async () => {
      try {
        const { data, error } = await supabase
          .from("conversations")
          .select("id, type, participant_ids")
          .contains("participant_ids", [user.id]);
        if (error) return;
        let unreadChatsCount = 0;
        for (const conv of data || []) {
          if (conv.type === "marketplace") {
            const { data: msgs } = await supabase
              .from("chat_messages")
              .select("sender_id")
              .eq("chat_id", conv.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (msgs && msgs.sender_id !== user.id) unreadChatsCount++;
          } else {
            const { data: msgs } = await supabase
              .from("messages")
              .select("sender_id, read_by")
              .eq("conversation_id", conv.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (msgs && msgs.sender_id !== user.id && !msgs.read_by?.includes(user.id)) unreadChatsCount++;
          }
        }
        setUnreadMessagesCount(unreadChatsCount);
      } catch {
        // ignore
      }
    };
    fetchUnreadMessagesCount();
    const ch = supabase
      .channel("conversations_count")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, fetchUnreadMessagesCount)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  return (
    <>
      <div className="min-h-screen bg-[#15181D] dark" role="application">
        {/* Top header - dark bar */}
        {!isChatPage && (
          <Suspense fallback={null}>
            <header
              className="fixed top-0 left-0 right-0 z-50 h-16 md:h-[84px] flex items-center px-4 md:px-6"
              style={{ background: "#1B2B3A" }}
            >
              <div className="w-full max-w-7xl mx-auto flex items-center gap-4">
                {/* Logo */}
                <Link href="/home" className="flex items-center gap-1.5 flex-shrink-0">
                  <Image
                    src="/yrdly-logo.png"
                    alt="Yrdly"
                    width={39}
                    height={37}
                    className="h-8 w-8 object-contain md:h-[37px] md:w-[39px]"
                  />
                  <span
                    className="text-white text-xl md:text-2xl leading-tight"
                    style={{ fontFamily: 'var(--font-jersey25), "Jersey 25", sans-serif' }}
                  >
                    rdly
                  </span>
                </Link>

                {/* Centered search - visible on md+ */}
                <div className="hidden md:flex flex-1 justify-center max-w-xl">
                  <button
                    type="button"
                    onClick={() => setShowSearch(true)}
                    className="w-full max-w-md h-10 rounded-full border flex items-center gap-3 px-4 text-left"
                    style={{ borderColor: "#388E3C" }}
                  >
                    <Search className="h-5 w-5 flex-shrink-0 text-[#BBBBBB]" />
                    <span
                      className="font-raleway font-light italic text-xs text-white placeholder:text-[#BBBBBB] truncate"
                      style={{ fontFamily: '"Raleway", sans-serif' }}
                    >
                      Search for events, items
                    </span>
                  </button>
                </div>

                {/* Right icons */}
                <div className="flex items-center gap-1 ml-auto md:gap-2">
                  <Link href="/map">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
                      <MapPin className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/messages">
                    <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10 rounded-full">
                      <MessageCircle className="w-5 h-5" />
                      {unreadMessagesCount > 0 && (
                        <span
                          className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full"
                          style={{ background: "#388E3C", border: "1px solid #020817" }}
                        />
                      )}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-white hover:bg-white/10 rounded-full"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span
                        className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full"
                        style={{ background: "#388E3C", border: "1px solid #020817" }}
                      />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full overflow-hidden p-0.5"
                    onClick={() => setShowProfile(!showProfile)}
                  >
                    <Avatar className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#D9D9D9]">
                      <AvatarImage src={profile?.avatar_url || "/diverse-user-avatars.png"} />
                      <AvatarFallback className="bg-[#D9D9D9] text-[#15181D] text-sm">
                        {profile?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </div>
              </div>
            </header>
          </Suspense>
        )}

        <div
          className={cn(
            "flex flex-col lg:flex-row min-h-screen",
            !isChatPage && "pt-16 md:pt-[84px]",
            !isChatPage && "pb-16 lg:pb-0"
          )}
        >
          {/* Left navigation - desktop only */}
          <nav
            className="hidden lg:flex lg:flex-col lg:w-[184px] lg:flex-shrink-0 lg:fixed lg:left-0 lg:top-[84px] lg:bottom-0 lg:pt-6 lg:px-4 lg:pb-6"
            style={{ background: "#15181D" }}
          >
            <div className="flex flex-col gap-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || (href !== "/home" && pathname.startsWith(href));
                return (
                  <Link key={href} href={href}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-[21.5px] transition",
                        isActive && "bg-[#181F30]"
                      )}
                    >
                      <span
                        className={cn(
                          "w-1 h-6 rounded-sm flex-shrink-0",
                          isActive && "bg-[#388E3C]"
                        )}
                      />
                      <Icon className={cn("w-6 h-6 flex-shrink-0", isActive ? "text-[#388E3C]" : "text-white")} />
                      <span
                        className="text-white text-xl leading-[35px]"
                        style={{ fontFamily: '"Pacifico", cursive' }}
                      >
                        {label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
            <Link href="/home" className="mt-auto pt-4">
              <Button
                className="w-full h-11 rounded-full text-white font-raleway font-medium text-sm"
                style={{ background: "#388E3C" }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Post
              </Button>
            </Link>
          </nav>

          {/* Main content */}
          <main
            className={cn(
              "flex-1 w-full min-w-0",
              !isChatPage && "px-3 sm:px-4 md:px-6 py-4",
              !isChatPage && "lg:pl-[200px]",
            )}
          >
            <ErrorBoundary>
              {isChatPage ? (
                <div className="w-full h-full">{children}</div>
              ) : (
                <div className="w-full max-w-2xl mx-auto lg:max-w-none">
                  {children}
                </div>
              )}
            </ErrorBoundary>
          </main>

          {/* Right sidebar - desktop only (hidden on mobile via HomeRightSidebar's hidden lg:flex) */}
          {showRightSidebar && <HomeRightSidebar />}
        </div>

        {/* Bottom navigation - mobile/tablet only */}
        {!isChatPage && (
          <Suspense fallback={null}>
            <nav
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-14 flex items-center justify-around px-2"
              style={{ background: "#1B2B3A", paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || (href !== "/home" && pathname.startsWith(href));
                return (
                  <Link key={href} href={href} className="flex flex-col items-center justify-center flex-1 py-2">
                    <Icon className={cn("w-6 h-6 mb-0.5", isActive ? "text-[#388E3C]" : "text-white/80")} />
                    <span
                      className={cn(
                        "text-[10px] leading-tight",
                        isActive ? "text-white font-medium" : "text-white/70"
                      )}
                      style={{ fontFamily: '"Raleway", sans-serif' }}
                    >
                      {label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </Suspense>
        )}
      </div>

      {showProfile && (
        <ProfileDropdown onClose={() => setShowProfile(false)} onAction={handleProfileAction} />
      )}
      <NotificationsDropdown isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
      <SearchDialog open={showSearch} onOpenChange={setShowSearch} />
    </>
  );
}
