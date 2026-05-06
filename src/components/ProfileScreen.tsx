"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, MapPin, Calendar, Users, MessageCircle, ShoppingBag,
  Briefcase, CalendarDays, Clock, Heart,
} from "lucide-react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User, Post } from "@/types";
import { FriendsList } from "./FriendsList";
import { useToast } from "@/hooks/use-toast";
import { shortenAddress } from "@/lib/utils";
import { ActivityIndicator } from "@/components/ActivityIndicator";
import Image from "next/image";

const GREEN = "#388E3C";
const GREEN_LIGHT = "#82DB7E";
const CARD = "#1E2126";
const SURFACE = "#1d2025";
const BG = "#101418";
const FONT = "Work Sans, sans-serif";
const RALEWAY = "Raleway, sans-serif";
const JAKARTA = "Plus Jakarta Sans, sans-serif";

interface ProfileScreenProps {
  onBack?: () => void;
  user?: User;
  isOwnProfile?: boolean;
  targetUserId?: string;
  targetUser?: any;
}

// ─── Tab pill bar ────────────────────────────────────────────────────────────
const TABS = [
  { key: "posts", label: "Posts" },
  { key: "items", label: "Items" },
  { key: "businesses", label: "Business" },
  { key: "events", label: "Events" },
];

function TabBar({ active, onChange }: { active: string; onChange: (k: string) => void }) {
  return (
    <nav
      className="flex p-1"
      style={{
        background: "#191c21",
        borderRadius: 9999,
        border: "0.5px solid rgba(130,219,126,0.2)",
      }}
    >
      {TABS.map(({ key, label }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-full transition-colors"
            style={{
              background: isActive ? "#1B2B3A" : "transparent",
              color: isActive ? GREEN_LIGHT : "#bfcab9",
              fontFamily: JAKARTA,
            }}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState({ icon, label, action, onAction }: { icon: React.ReactNode; label: string; action: string; onAction: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center rounded-[11px]"
      style={{ background: SURFACE }}
    >
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(56,142,60,0.1)" }}>
        {icon}
      </div>
      <p className="text-white font-semibold mb-1 text-sm" style={{ fontFamily: RALEWAY }}>{label}</p>
      <button
        onClick={onAction}
        className="mt-3 rounded-full px-5 py-2 text-xs font-bold"
        style={{ background: GREEN, color: "#fff", fontFamily: FONT }}
      >
        {action}
      </button>
    </div>
  );
}

// ─── Mini card ───────────────────────────────────────────────────────────────
function MiniCard({ title, sub, img, badge, onClick }: { title: string; sub?: string; img?: string | null; badge?: string; onClick?: () => void }) {
  return (
    <div
      className="flex items-center gap-3 p-4 cursor-pointer transition-colors rounded-[11px]"
      style={{ background: SURFACE }}
      onClick={onClick}
    >
      <div className="w-14 h-14 rounded-[10px] overflow-hidden flex-shrink-0 relative" style={{ background: CARD }}>
        {img ? (
          <Image src={img} alt={title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Briefcase className="w-6 h-6" style={{ color: GREEN, opacity: 0.4 }} />
          </div>
        )}
        {badge && (
          <span
            className="absolute top-0.5 right-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
            style={{ background: GREEN }}
          >{badge}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate" style={{ fontFamily: RALEWAY }}>{title}</p>
        {sub && <p className="text-xs truncate mt-0.5" style={{ color: "#899485", fontFamily: FONT }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ProfileScreen({ onBack, user, isOwnProfile = true, targetUserId, targetUser: externalTargetUser }: ProfileScreenProps) {
  const router = useRouter();
  const { user: currentUser, profile: currentProfile } = useAuth();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userItems, setUserItems] = useState<any[]>([]);
  const [userBusinesses, setUserBusinesses] = useState<any[]>([]);
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [isFriendRequestSent, setIsFriendRequestSent] = useState(false);
  const [stats, setStats] = useState({ friends: 0, events: 0 });

  const targetUser = externalTargetUser || user || currentUser;
  const targetProfile = externalTargetUser ? null : (user ? null : currentProfile);
  const isExternalProfile = !!targetUserId && targetUserId !== currentUser?.id;
  const actualIsOwnProfile = isOwnProfile !== undefined ? isOwnProfile : !isExternalProfile;

  const refreshProfileData = useCallback(async () => {
    if (!targetUser) return;
    const { data } = await supabase.from("users").select("*, friends").eq("id", targetUser.id).single();
    if (data) { setStats((p) => ({ ...p, friends: data.friends?.length || 0 })); setProfileData(data); }
  }, [targetUser]);

  useEffect(() => { if (targetUser) refreshProfileData(); }, [targetUser?.id, refreshProfileData, targetUser]);

  useEffect(() => {
    if (!targetUser) return;
    const fetch = async () => {
      const { data: userData } = await supabase.from("users").select("*, friends").eq("id", targetUser.id).single();
      if (userData) setProfileData(userData);

      const [postsRes, itemsRes, bizRes, eventsRes, eventsCountRes] = await Promise.all([
        supabase.from("posts").select("*").eq("user_id", targetUser.id).eq("category", "General").order("timestamp", { ascending: false }).limit(10),
        supabase.from("posts").select("*").eq("user_id", targetUser.id).eq("category", "For Sale").order("timestamp", { ascending: false }).limit(10),
        supabase.from("businesses").select("*").eq("owner_id", targetUser.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("posts").select("*").eq("user_id", targetUser.id).eq("category", "Event").order("timestamp", { ascending: false }).limit(10),
        supabase.from("posts").select("id").eq("user_id", targetUser.id).eq("category", "Event"),
      ]);

      setUserPosts(postsRes.data || []);
      setUserItems(itemsRes.data || []);
      setUserBusinesses(bizRes.data || []);
      setUserEvents(eventsRes.data || []);
      setStats({ friends: userData?.friends?.length || 0, events: eventsCountRes.data?.length || 0 });
      setLoading(false);
    };
    fetch();
  }, [targetUser, targetProfile]);

  // Real-time sub
  useEffect(() => {
    if (!targetUser) return;
    const ch = supabase.channel(`user_${targetUser.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "users", filter: `id=eq.${targetUser.id}` },
        async () => {
          const { data } = await supabase.from("users").select("*, friends").eq("id", targetUser.id).single();
          if (data) setStats((p) => ({ ...p, friends: data.friends?.length || 0 }));
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [targetUser]);

  // Window focus refresh
  useEffect(() => {
    const h = async () => {
      if (!targetUser || loading) return;
      const { data } = await supabase.from("users").select("*").eq("id", targetUser.id).single();
      if (data) setProfileData(data);
    };
    window.addEventListener("focus", h);
    return () => window.removeEventListener("focus", h);
  }, [targetUser, loading]);

  // Friendship check
  useEffect(() => {
    if (!currentUser || !targetUser || actualIsOwnProfile) return;
    const check = async () => {
      const { data: cu } = await supabase.from("users").select("friends").eq("id", currentUser.id).single();
      setIsFriend(cu?.friends?.includes(targetUser.id) || false);
      const { data: req } = await supabase.from("friend_requests").select("id, status")
        .or(`and(from_user_id.eq.${currentUser.id},to_user_id.eq.${targetUser.id}),and(from_user_id.eq.${targetUser.id},to_user_id.eq.${currentUser.id})`)
        .single();
      setIsFriendRequestSent(!!req && req.status === "pending");
    };
    check();
    window.addEventListener("refresh-profile", check);
    return () => window.removeEventListener("refresh-profile", check);
  }, [currentUser, targetUser, actualIsOwnProfile]);

  const handleAddFriend = async () => {
    if (!currentUser || !targetUser) return;
    try {
      if (isFriend) {
        const { data: cu } = await supabase.from("users").select("friends").eq("id", currentUser.id).single();
        await supabase.from("users").update({ friends: cu?.friends?.filter((id: string) => id !== targetUser.id) || [] }).eq("id", currentUser.id);
        const { data: tu } = await supabase.from("users").select("friends").eq("id", targetUser.id).single();
        await supabase.from("users").update({ friends: tu?.friends?.filter((id: string) => id !== currentUser.id) || [] }).eq("id", targetUser.id);
        setIsFriend(false);
        await refreshProfileData();
        toast({ title: "Friend Removed" });
      } else if (isFriendRequestSent) {
        await supabase.from("friend_requests").delete().eq("from_user_id", currentUser.id).eq("to_user_id", targetUser.id);
        setIsFriendRequestSent(false);
        toast({ title: "Request Cancelled" });
      } else {
        await supabase.from("friend_requests").insert({
          from_user_id: currentUser.id, to_user_id: targetUser.id,
          participant_ids: [currentUser.id, targetUser.id].sort(),
          status: "pending", created_at: new Date().toISOString(),
        });
        setIsFriendRequestSent(true);
        toast({ title: "Friend Request Sent" });
        try {
          const { NotificationTriggers } = await import("@/lib/notification-triggers");
          await NotificationTriggers.onFriendRequestSent(currentUser.id, targetUser.id);
        } catch { }
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed. Please try again." });
    }
  };

  const handleMessageUser = async () => {
    if (!currentUser || !targetUser) return;
    try {
      const sorted = [currentUser.id, targetUser.id].sort();
      const { data: existing } = await supabase.from("conversations").select("id").contains("participant_ids", sorted).eq("type", "friend");
      let convId: string;
      if (existing && existing.length > 0) {
        convId = existing[0].id;
      } else {
        const { data: newConv } = await supabase.from("conversations").insert({
          participant_ids: sorted, type: "friend",
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }).select("id").single();
        convId = newConv!.id;
      }
      router.push(`/messages/${convId}`);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not open conversation." });
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-5" style={{ background: BG }}>
        <Skeleton className="h-64 w-full rounded-[11px]" style={{ background: CARD }} />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-[11px]" style={{ background: CARD }} />
          <Skeleton className="h-24 rounded-[11px]" style={{ background: CARD }} />
        </div>
        <Skeleton className="h-16 rounded-[11px]" style={{ background: CARD }} />
      </div>
    );
  }

  const displayUser = profileData || targetUser;
  const displayProfile = isExternalProfile ? profileData : (targetProfile ?? profileData);
  const name = (displayProfile as any)?.name || (displayUser as any)?.name || "Unknown";
  const bio = (displayProfile as any)?.bio;
  const interests = (displayProfile as any)?.interests as string[] | undefined;
  const avatarUrl = (displayProfile as any)?.avatar_url || (displayUser as any)?.avatar_url;
  const locationStr = (displayProfile as any)?.location?.state && (displayProfile as any)?.location?.lga
    ? `${(displayProfile as any).location.state}, ${(displayProfile as any).location.lga}`
    : (displayProfile as any)?.location?.state || "";
  const joinedDate = new Date((displayUser as any)?.created_at || Date.now()).toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return (
    <div className="pb-28 space-y-4 max-w-5xl mx-auto px-4 pt-4" style={{ background: BG }}>
      {/* Back arrow (if external) */}
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm mb-1" style={{ color: GREEN_LIGHT, fontFamily: FONT }}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      )}

      {/* ── Hero Card ── */}
      <section
        className="flex flex-col items-center text-center p-8 relative overflow-hidden"
        style={{ background: CARD, borderRadius: 11 }}
      >
        {/* Subtle green wash at top */}
        <div className="absolute top-0 left-0 w-full h-24 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, rgba(130,219,126,0.08), transparent)" }} />

        <div className="relative z-10">
          {/* Avatar with spinning dashed ring */}
          <div className="relative inline-block">
            <div
              className="w-32 h-32 rounded-full overflow-hidden shadow-2xl border-4 relative z-10"
              style={{ borderColor: BG }}
            >
              <Avatar className="w-full h-full">
                <AvatarImage src={avatarUrl || "/placeholder.svg"} className="object-cover" />
                <AvatarFallback style={{ background: GREEN, color: "#fff", fontSize: 40, fontFamily: RALEWAY, fontWeight: 800 }}>
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div
              className="absolute -inset-2 rounded-full border-2 border-dashed"
              style={{ borderColor: "rgba(130,219,126,0.4)", animation: "spin 20s linear infinite" }}
            />
            {/* ActivityIndicator for other's profiles */}
            {!actualIsOwnProfile && targetUser && (
              <div className="absolute bottom-0 right-0 z-20">
                <ActivityIndicator userId={targetUser.id} size="md" />
              </div>
            )}
          </div>

          <h1 className="mt-6 text-2xl text-white font-extrabold tracking-tight" style={{ fontFamily: RALEWAY }}>
            {name}
          </h1>
          {bio && (
            <p className="mt-2 text-[13px] font-light italic max-w-sm" style={{ fontFamily: RALEWAY, color: "#BBBBBB" }}>
              {bio}
            </p>
          )}

          {/* Location + Join date */}
          <div className="mt-5 flex items-center justify-center gap-5 flex-wrap text-[11px] font-bold uppercase tracking-widest" style={{ color: "#899485" }}>
            {locationStr && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {locationStr}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Joined {joinedDate}
            </div>
          </div>

          {/* Action buttons for external profile */}
          {!actualIsOwnProfile && (
            <div className="flex flex-row items-center justify-center gap-4 mt-8 w-full max-w-[400px] mx-auto px-4">
              <button
                onClick={handleAddFriend}
                className="flex-1 flex items-center justify-center gap-2 rounded-full h-14 text-sm font-bold text-white transition-all active:scale-95 shadow-lg"
                style={{ 
                  background: isFriend ? "#E53935" : GREEN, 
                  fontFamily: FONT,
                  boxShadow: isFriend ? "0 8px 20px rgba(229,57,53,0.2)" : "0 8px 20px rgba(56,142,60,0.2)"
                }}
              >
                <Users className="w-5 h-5" />
                {isFriend ? "Remove Friend" : isFriendRequestSent ? "Request Sent" : "Add Friend"}
              </button>
              {isFriend && (
                <button
                  onClick={handleMessageUser}
                  className="flex-1 flex items-center justify-center gap-2 rounded-full h-14 text-sm font-bold text-white transition-all active:scale-95 border shadow-lg"
                  style={{ 
                    background: "#1B2B3A", 
                    borderColor: "rgba(130,219,126,0.3)", 
                    fontFamily: FONT,
                    boxShadow: "0 8px 20px rgba(0,0,0,0.2)"
                  }}
                >
                  <MessageCircle className="w-5 h-5 text-[#82DB7E]" />
                  Message
                </button>
              )}
            </div>
          )}
        </div>
      </section>
      {/* Spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-4">
        <button
          className="flex items-center gap-4 p-5 text-left rounded-[11px] transition-colors"
          style={{ background: SURFACE }}
          onClick={() => setShowFriendsList(true)}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(56,142,60,0.2)" }}>
            <Users className="w-6 h-6" style={{ color: GREEN_LIGHT }} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.friends.toLocaleString()}</p>
            <p className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: "#899485" }}>Connections</p>
          </div>
        </button>
        <div
          className="flex items-center gap-4 p-5 rounded-[11px]"
          style={{ background: SURFACE }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(56,142,60,0.2)" }}>
            <CalendarDays className="w-6 h-6" style={{ color: GREEN_LIGHT }} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.events}</p>
            <p className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: "#899485" }}>Events</p>
          </div>
        </div>
      </div>

      {/* ── Interests ── */}
      {interests && interests.length > 0 && (
        <section className="p-6 rounded-[11px]" style={{ background: CARD }}>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "#bfcab9", fontFamily: FONT }}>
            Interests &amp; Expertise
          </h3>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest, i) => (
              <span
                key={i}
                className="px-4 py-1.5 rounded-full text-xs font-medium"
                style={{ background: "#06171B", border: "1px solid rgba(130,219,126,0.3)", color: GREEN_LIGHT, fontFamily: FONT }}
              >
                {interest}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Tabs ── */}
      {actualIsOwnProfile ? (
        <>
          <TabBar active={activeTab} onChange={setActiveTab} />

          {/* Posts tab */}
          {activeTab === "posts" && (
            userPosts.length > 0 ? (
              <div className="bento-section space-y-4">
                {/* Large feature card for first post */}
                {userPosts[0] && (
                  <div
                    className="relative overflow-hidden cursor-pointer group rounded-[11px]"
                    style={{ background: SURFACE }}
                    onClick={() => router.push(`/posts/${userPosts[0].id}`)}
                  >
                    {userPosts[0].image_url && (
                      <div className="relative h-48 overflow-hidden">
                        <Image src={userPosts[0].image_url} alt={userPosts[0].text || "Post"} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #1d2025 0%, transparent 60%)" }} />
                        <div className="absolute bottom-4 left-4 right-4">
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                            style={{ background: "rgba(110,223,81,0.1)", color: "#6edf51" }}>Article</span>
                          <h4 className="text-white font-bold mt-1 text-lg leading-tight">{userPosts[0].text}</h4>
                        </div>
                      </div>
                    )}
                    {!userPosts[0].image_url && (
                      <div className="p-5">
                        <p className="text-white text-sm" style={{ fontFamily: FONT }}>{userPosts[0].text}</p>
                        <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: "#899485" }}>
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{userPosts[0].liked_by?.length || 0}</span>
                          <span>{new Date(userPosts[0].timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Grid for rest */}
                <div className="grid grid-cols-2 gap-4">
                  {userPosts.slice(1).map((post) => (
                    <div
                      key={post.id}
                      className="p-4 rounded-[11px] cursor-pointer"
                      style={{ background: SURFACE }}
                      onClick={() => router.push(`/posts/${post.id}`)}
                    >
                      <p className="text-white text-xs line-clamp-3" style={{ fontFamily: FONT }}>{post.text || post.title}</p>
                      <div className="flex items-center gap-2 mt-2 text-[10px]" style={{ color: "#899485" }}>
                        <Heart className="w-3 h-3" />{post.liked_by?.length || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState icon={<Heart className="w-7 h-7" style={{ color: GREEN_LIGHT, opacity: 0.6 }} />}
                label="No posts yet" action="Create your first post" onAction={() => router.push("/home")} />
            )
          )}

          {/* Items tab */}
          {activeTab === "items" && (
            userItems.length > 0 ? (
              <div className="space-y-3">
                {userItems.map((item) => (
                  <MiniCard
                    key={item.id}
                    title={item.text || item.title || "Untitled"}
                    sub={item.price ? `₦${item.price.toLocaleString()}` : item.condition}
                    img={item.image_urls?.[0] || null}
                    badge="Sale"
                    onClick={() => router.push(`/posts/${item.id}`)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState icon={<ShoppingBag className="w-7 h-7" style={{ color: GREEN_LIGHT, opacity: 0.6 }} />}
                label="No items for sale" action="List your first item" onAction={() => router.push("/marketplace")} />
            )
          )}

          {/* Businesses tab */}
          {activeTab === "businesses" && (
            userBusinesses.length > 0 ? (
              <div className="space-y-3">
                {userBusinesses.map((biz) => (
                  <MiniCard
                    key={biz.id}
                    title={biz.name}
                    sub={biz.category}
                    img={biz.image_urls?.[0] || null}
                    badge="Biz"
                    onClick={() => router.push(`/businesses/${biz.id}`)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState icon={<Briefcase className="w-7 h-7" style={{ color: GREEN_LIGHT, opacity: 0.6 }} />}
                label="No businesses yet" action="Create your business" onAction={() => router.push("/businesses")} />
            )
          )}

          {/* Events tab */}
          {activeTab === "events" && (
            userEvents.length > 0 ? (
              <div className="space-y-3">
                {userEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 rounded-[11px] cursor-pointer"
                    style={{ background: SURFACE }}
                    onClick={() => router.push(`/posts/${event.id}`)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#6edf51" }} />
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#bfcab9", fontFamily: FONT }}>Event</span>
                    </div>
                    <h4 className="text-white font-bold text-sm" style={{ fontFamily: RALEWAY }}>
                      {event.text || event.title || "Untitled Event"}
                    </h4>
                    {event.event_date && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: "#899485", fontFamily: FONT }}>
                        <Calendar className="w-3 h-3" />
                        {new Date(event.event_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        {event.event_time && <><Clock className="w-3 h-3 ml-2" /> {event.event_time}</>}
                      </div>
                    )}
                    {event.attendees?.length > 0 && (
                      <p className="text-xs mt-1 italic" style={{ color: "#899485", fontFamily: FONT }}>
                        {event.attendees.length} participants joined
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<CalendarDays className="w-7 h-7" style={{ color: GREEN_LIGHT, opacity: 0.6 }} />}
                label="No events posted" action="Create your first event" onAction={() => router.push("/events")} />
            )
          )}
        </>
      ) : (
        /* External profile – show recent posts inline */
        userPosts.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#bfcab9", fontFamily: FONT }}>
              Recent Posts
            </h3>
            {userPosts.slice(0, 3).map((post) => (
              <div key={post.id} className="p-5 rounded-[11px]" style={{ background: SURFACE }}>
                <p className="text-white text-sm leading-relaxed" style={{ fontFamily: FONT }}>{post.text || post.title}</p>
                <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: "#899485" }}>
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.liked_by?.length || 0}</span>
                  <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </section>
        )
      )}

      {/* ── Friends List Modal ── */}
      {showFriendsList && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setShowFriendsList(false)}
        >
          <div
            className="w-full max-w-md max-h-[80vh] overflow-hidden rounded-[20px]"
            style={{ background: CARD }}
            onClick={(e) => e.stopPropagation()}
          >
            <FriendsList userId={targetUser?.id || ""} onBack={() => setShowFriendsList(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
