"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Zap, FileText, Search, Plus, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Post } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { PostCard } from "@/components/PostCard";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { usePosts } from "@/hooks/use-posts";
import { useFriendshipGlobal } from "@/hooks/use-friendship-global";

const GREEN = "#388E3C";
const CARD = "#1E2126";
const FONT = "Raleway, sans-serif";
const PACIFICO = "Pacifico, cursive";

interface CommunityScreenProps {
  className?: string;
}

// Sub-component for rendering user action buttons with global friendship state
function UserActionButton({
  userId,
  onFriendAction,
}: {
  userId: string;
  onFriendAction: (userId: string, action: "add" | "remove" | "accept" | "decline", actionFn: () => Promise<void>) => Promise<void>;
}) {
  const friendshipHook = useFriendshipGlobal(userId);
  const status = friendshipHook.status;
  const isLoading = friendshipHook.isLoading;

  switch (status) {
    case "none":
      return (
        <button
          onClick={() => onFriendAction(userId, "add", () => friendshipHook.addFriend())}
          className="rounded-full px-3 py-1 text-[11px] text-white font-bold uppercase disabled:opacity-50"
          style={{ background: GREEN, fontFamily: FONT }}
          disabled={isLoading}
        >
          {isLoading ? "..." : "Add"}
        </button>
      );
    case "request_sent":
      return (
        <button
          className="rounded-full px-3 py-1 text-[11px] text-[#BBBBBB] font-bold uppercase"
          style={{ border: "0.5px solid #388E3C", fontFamily: FONT }}
          disabled
        >
          Sent
        </button>
      );
    case "friends":
      return (
        <button
          onClick={() => onFriendAction(userId, "remove", () => friendshipHook.removeFriend())}
          className="rounded-full px-3 py-1 text-[11px] font-bold uppercase disabled:opacity-50"
          style={{ border: "0.5px solid rgba(229,57,53,0.4)", color: "#E53935", fontFamily: FONT }}
          disabled={isLoading}
        >
          {isLoading ? "..." : "Remove"}
        </button>
      );
    case "request_received":
      return (
        <>
          <button
            onClick={() => onFriendAction(userId, "accept", () => friendshipHook.acceptRequest())}
            className="rounded-full px-3 py-1 text-[11px] text-white font-bold uppercase disabled:opacity-50"
            style={{ background: GREEN, fontFamily: FONT }}
            disabled={isLoading}
          >
            {isLoading ? "..." : "Accept"}
          </button>
          <button
            onClick={() => onFriendAction(userId, "decline", () => friendshipHook.declineRequest())}
            className="rounded-full px-3 py-1 text-[11px] font-bold uppercase disabled:opacity-50"
            style={{ border: "0.5px solid rgba(229,57,53,0.4)", color: "#E53935", fontFamily: FONT }}
            disabled={isLoading}
          >
            {isLoading ? "..." : "Decline"}
          </button>
        </>
      );
  }
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function StatCard({
  icon: Icon,
  value,
  label,
  onClick,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center text-center p-4 space-y-2 ${
        onClick ? "cursor-pointer transition-all hover:opacity-80" : ""
      }`}
      style={{ background: CARD, borderRadius: 11 }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: "rgba(56,142,60,0.2)" }}
      >
        <Icon className="w-5 h-5" style={{ color: GREEN }} />
      </div>
      <div>
        <div className="text-xl font-bold text-white" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
          {value}
        </div>
        <div
          className="text-[10px] uppercase tracking-wider"
          style={{ color: "#899485", fontFamily: FONT }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

export function CommunityScreen({ className }: CommunityScreenProps) {
  const { user: currentUser, profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { posts, loading: postsLoading, createPost, deletePost } = usePosts();
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [pendingFriendRequests, setPendingFriendRequests] = useState<any[]>([]);
  const [friendRequestsLoading, setFriendRequestsLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, activeToday: 0, newPosts24h: 0 });
  const searchRef = useRef<HTMLDivElement>(null);

  /* ── Stats ── */
  useEffect(() => {
    if (!currentUser) return;
    const fetchStats = async () => {
      const { count: totalUsers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { data: activePosters } = await supabase
        .from("posts")
        .select("user_id")
        .gte("timestamp", yesterday.toISOString());
      const { data: activeCommenters } = await supabase
        .from("comments")
        .select("user_id")
        .gte("timestamp", yesterday.toISOString());
      const activeUserIds = new Set([
        ...(activePosters?.map((p) => p.user_id) || []),
        ...(activeCommenters?.map((c) => c.user_id) || []),
      ]);
      const { count: newPosts24h } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .gte("timestamp", yesterday.toISOString());
      setStats({
        totalUsers: totalUsers || 0,
        activeToday: activeUserIds.size,
        newPosts24h: newPosts24h || 0,
      });
    };
    fetchStats();
  }, [currentUser]);

  /* ── Pending Friend Requests ── */
  useEffect(() => {
    if (!currentUser) return;
    const fetch = async () => {
      setFriendRequestsLoading(true);
      const { data } = await supabase
        .from("friend_requests")
        .select(
          `id, from_user_id, created_at,
           users!friend_requests_from_user_id_fkey(id, name, avatar_url, bio, location)`
        )
        .eq("to_user_id", currentUser.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      setPendingFriendRequests(data || []);
      setFriendRequestsLoading(false);
    };
    fetch();
  }, [currentUser]);

  /* ── Click outside search ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowUserSearch(false);
        setUsers([]);
      }
    };
    if (showUserSearch) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showUserSearch]);

  const searchUsers = async (query: string) => {
    if (!query.trim()) { setUsers([]); setShowUserSearch(false); return; }
    setUserSearchLoading(true);
    try {
      const { data } = await supabase
        .from("users")
        .select("id, name, avatar_url, created_at")
        .ilike("name", `%${query}%`)
        .neq("id", currentUser?.id)
        .limit(10);
      const usersData = data || [];
      setUsers(usersData);
      setShowUserSearch(true);
    } catch { /* ignore */ } finally {
      setUserSearchLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) searchUsers(value);
    else { setShowUserSearch(false); setUsers([]); }
  };

  const handleFriendAction = async (
    userId: string,
    action: "add" | "remove" | "accept" | "decline",
    actionFn: () => Promise<void>
  ) => {
    if (!currentUser) return;
    try {
      await actionFn();
      
      // Update pending requests list if needed
      if (action === "accept" || action === "decline") {
        setPendingFriendRequests((p) => p.filter((r) => r.from_user_id !== userId));
      }
    } catch (error) {
      console.error("Error handling friend action:", error);
      toast({ variant: "destructive", title: "Error", description: "Action failed." });
    }
  };

  const getLocation = (loc: unknown): string => {
    if (!loc || typeof loc !== "object") return "";
    const o = loc as Record<string, unknown>;
    if (typeof o.lga === "string" && typeof o.state === "string")
      return `${o.lga}, ${o.state}`;
    if (typeof o.state === "string") return o.state;
    return "";
  };

  const filteredPosts = useMemo(() => {
    if (!searchQuery || showUserSearch) return posts;
    const q = searchQuery.toLowerCase();
    return posts.filter(
      (p) =>
        p.text?.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q) ||
        p.author_name?.toLowerCase().includes(q)
    );
  }, [posts, searchQuery, showUserSearch]);

  return (
    <div className="min-h-screen pb-32" style={{ background: "#15181D" }}>
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-8">

        {/* ── Header ── */}
        <header className="space-y-1">
          <h1 className="text-[20px] text-white" style={{ fontFamily: PACIFICO }}>
            Community
          </h1>
          <p className="text-[12px]" style={{ fontFamily: FONT, fontStyle: "italic", fontWeight: 300, color: "#BBBBBB" }}>
            Connecting neighbors, one story at a time.
          </p>
        </header>

        {/* ── Search ── */}
        <div className="relative" ref={searchRef}>
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#899485" }} />
          <input
            type="text"
            placeholder="Search for neighbors or posts..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-full px-6 pl-11 py-4 text-sm text-white outline-none focus:ring-1 focus:ring-[#388E3C]/50"
            style={{
              background: "#272a2f",
              border: "0.5px solid #388E3C",
              fontFamily: FONT,
            }}
          />

          {/* User search results dropdown */}
          {showUserSearch && users.length > 0 && (
            <div
              className="absolute top-full mt-2 w-full z-20 overflow-hidden"
              style={{ background: CARD, borderRadius: 11, border: "0.5px solid rgba(255,255,255,0.08)" }}
            >
              {userSearchLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" style={{ background: "#272a2f" }} />
                      <Skeleton className="h-4 w-32" style={{ background: "#272a2f" }} />
                    </div>
                  ))}
                </div>
              ) : (
                users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}
                  >
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={u.avatar_url} />
                      <AvatarFallback style={{ background: GREEN, color: "#fff", fontFamily: FONT, fontWeight: 700 }}>
                        {u.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[13px] truncate" style={{ fontFamily: FONT, fontWeight: 600 }}>
                        {u.name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <UserActionButton userId={u.id} onFriendAction={handleFriendAction} />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

  {/* ── Stats Row ── */}
  <div className="grid grid-cols-3 gap-3">
    <StatCard 
      icon={Users} 
      value={fmt(stats.totalUsers)} 
      label="Neighbors"
      onClick={() => router.push('/neighbours')}
    />
    <StatCard icon={Zap} value={fmt(stats.activeToday)} label="Active Today" />
    <StatCard icon={FileText} value={fmt(stats.newPosts24h)} label="New Posts" />
  </div>

        {/* ── Friend Requests ── */}
        {(pendingFriendRequests.length > 0 || friendRequestsLoading) && (
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-white font-semibold text-lg" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                Friend Requests
              </h2>
              <button className="text-[11px] font-bold uppercase tracking-widest" style={{ color: GREEN, fontFamily: FONT }}>
                View All
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {friendRequestsLoading
                ? [1, 2].map((i) => (
                    <div
                      key={i}
                      className="min-w-[180px] flex flex-col items-center p-4 space-y-3"
                      style={{ background: "#1d2025", borderRadius: 11 }}
                    >
                      <Skeleton className="w-16 h-16 rounded-full" style={{ background: "#272a2f" }} />
                      <Skeleton className="h-4 w-24" style={{ background: "#272a2f" }} />
                      <Skeleton className="h-8 w-full rounded-full" style={{ background: "#272a2f" }} />
                    </div>
                  ))
                : pendingFriendRequests.map((req) => {
                    const sender = req.users;
                    if (!sender) return null;
                    const loc = getLocation(sender.location);
                    return (
                      <div
                        key={req.id}
                        className="min-w-[180px] flex flex-col items-center p-4 space-y-3 flex-shrink-0"
                        style={{ background: "#1d2025", borderRadius: 11 }}
                      >
                        <Avatar
                          className="w-16 h-16 cursor-pointer"
                          onClick={() => router.push(`/profile/${sender.id}`)}
                        >
                          <AvatarImage src={sender.avatar_url} />
                          <AvatarFallback
                            style={{ background: GREEN, color: "#fff", fontFamily: FONT, fontWeight: 700, fontSize: 22 }}
                          >
                            {sender.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                          <p className="text-white text-sm font-semibold" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                            {sender.name}
                          </p>
                          {loc && (
                            <p className="text-[10px]" style={{ color: "#899485", fontFamily: FONT }}>
                              {loc}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 w-full">
                          <UserActionButton userId={sender.id} onFriendAction={handleFriendAction} />
                        </div>
                      </div>
                    );
                  })}
            </div>
          </section>
        )}

        {/* ── Recent Updates Feed ── */}
        <section className="space-y-4">
          <h2 className="text-white font-semibold text-lg" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            Recent Updates
          </h2>

          {postsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full rounded-[11px]" style={{ background: CARD }} />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: CARD }}
              >
                <FileText className="w-8 h-8" style={{ color: GREEN, opacity: 0.5 }} />
              </div>
              <h3 className="text-white text-lg mb-2" style={{ fontFamily: PACIFICO }}>
                No posts yet
              </h3>
              <p className="text-[13px]" style={{ color: "#BBBBBB", fontFamily: FONT }}>
                Be the first to share something with your neighbors!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} onDelete={deletePost} onCreatePost={createPost} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── FAB ── */}
      <CreatePostDialog createPost={createPost}>
        <button
          className="fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center z-40 transition-transform active:scale-90"
          style={{
            background: GREEN,
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          }}
        >
          <Plus className="w-7 h-7 text-white" />
        </button>
      </CreatePostDialog>
    </div>
  );
}
