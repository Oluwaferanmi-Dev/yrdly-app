"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, UserPlus, MessageCircle, Heart, Calendar, Check, X, MoreHorizontal, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNowStrict } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import * as Sentry from "@sentry/nextjs";

const GREEN = "#388E3C";
const GREEN_LIGHT = "#82DB7E";
const CARD = "#1E2126";
const SURFACE = "#101418";
const FONT = "Work Sans, sans-serif";
const RALEWAY = "Raleway, sans-serif";

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationCountChange?: (count: number) => void;
}

interface Notification {
  id: string;
  user_id: string;
  type: 'friend_request' | 'message' | 'post_like' | 'post_comment' | 'event_invite' | 'system';
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
  from_user_id?: string;
  from_user_name?: string;
  from_user_avatar?: string;
}

// Map types to circular badge colors and icons
function getNotificationBadge(type: string) {
  switch (type) {
    case 'friend_request':
      return { icon: UserPlus, bg: "#006ec9", fg: "#ffffff" }; // Blue
    case 'post_like':
      return { icon: Heart, bg: "#ffb4ab", fg: "#690005", fill: true }; // Red
    case 'message':
      return { icon: MessageSquare, bg: "#4da24e", fg: "#ffffff" }; // Green
    case 'post_comment':
      return { icon: MessageCircle, bg: "#a5c8ff", fg: "#00315f" }; // Light Blue
    case 'event_invite':
      return { icon: Calendar, bg: "#fbbc04", fg: "#3f2b00" }; // Yellow/Orange
    default:
      return { icon: Bell, bg: "#32353a", fg: "#e1e2e9" }; // Gray
  }
}

function NotificationItem({ notification, onMarkAsRead, onDelete }: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const badgeConfig = getNotificationBadge(notification.type);
  const Icon = badgeConfig.icon;

  const handleAction = async (action: string) => {
    if (action === 'accept_friend') {
      try {
        await Sentry.startSpan(
          { op: "http.client", name: "NotificationsDropdown: Accept Friend" },
          async (span) => {
            const toUserId = notification.user_id || currentUser?.id || "";
            let senderId = notification.from_user_id || "";
            if (!senderId && toUserId) {
              const { data: pending } = await supabase
                .from('friend_requests')
                .select('id, from_user_id')
                .eq('to_user_id', toUserId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(1);
              if (pending && pending.length >= 1) senderId = pending[0].from_user_id;
            }
            span.setAttribute("fromUserId", senderId || "");
            span.setAttribute("toUserId", toUserId);
            if (!senderId || !toUserId) throw new Error("Missing user identifiers");

            const { data: currentUserDataCheck } = await supabase.from('users').select('friends').eq('id', toUserId).single();
            if (currentUserDataCheck?.friends?.includes(senderId)) {
              toast({ title: "Already friends" });
              return;
            }

            const { data: allRequests } = await supabase.from('friend_requests').select('*').eq('from_user_id', senderId).eq('to_user_id', toUserId).order('created_at', { ascending: false }).limit(1);
            if (!allRequests || allRequests.length === 0) {
              await onMarkAsRead(notification.id);
              toast({ title: "Request not found", variant: "destructive" });
              return;
            }

            const requestData = allRequests[0];
            if (requestData.status === 'accepted') {
              await onMarkAsRead(notification.id);
              toast({ title: "Already friends" });
              return;
            }
            if (requestData.status !== 'pending') {
              await onMarkAsRead(notification.id);
              toast({ title: "Request already handled", variant: "destructive" });
              return;
            }

            const { error: updateError } = await supabase.from('friend_requests').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', requestData.id);
            if (updateError) throw updateError;

            const { data: currentUserData } = await supabase.from('users').select('friends').eq('id', toUserId).single();
            const { data: senderUserData } = await supabase.from('users').select('friends').eq('id', senderId).single();
            
            const currentUserFriends = Array.isArray(currentUserData?.friends) ? currentUserData.friends : [];
            const senderUserFriends = Array.isArray(senderUserData?.friends) ? senderUserData.friends : [];

            await supabase.from('users').update({ friends: Array.from(new Set([...currentUserFriends, senderId])) }).eq('id', toUserId);
            await supabase.from('users').update({ friends: Array.from(new Set([...senderUserFriends, toUserId])) }).eq('id', senderId);

            try {
              const { NotificationTriggers } = await import('@/lib/notification-triggers');
              if (senderId) await NotificationTriggers.onFriendRequestAccepted(senderId, toUserId);
            } catch (error) { console.error(error); }

            await onMarkAsRead(notification.id);
            toast({ title: "Friend request accepted!" });
          }
        );
      } catch (error: any) {
        Sentry.captureException(error);
        toast({ variant: "destructive", title: "Error", description: error?.message || "Failed" });
      }
    } else if (action === 'decline_friend') {
      try {
        await Sentry.startSpan(
          { op: "http.client", name: "NotificationsDropdown: Decline Friend" },
          async (span) => {
            const toUserId = notification.user_id || currentUser?.id || "";
            let senderId = notification.from_user_id || "";
            if (!senderId && toUserId) {
              const { data: pending } = await supabase
                .from('friend_requests')
                .select('id, from_user_id')
                .eq('to_user_id', toUserId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(1);
              if (pending && pending.length >= 1) senderId = pending[0].from_user_id;
            }
            span.setAttribute("fromUserId", senderId || "");
            span.setAttribute("toUserId", toUserId);
            if (!senderId || !toUserId) throw new Error("Missing identifiers");

            const { error } = await supabase.from('friend_requests').delete().eq('from_user_id', senderId).eq('to_user_id', toUserId).eq('status', 'pending');
            if (error) throw error;
            await onMarkAsRead(notification.id);
            toast({ title: "Friend request declined." });
          }
        );
      } catch (error: any) {
        Sentry.captureException(error);
        toast({ variant: "destructive", title: "Error", description: error?.message || "Failed" });
      }
    } else if (action === 'reply_message') {
      toast({ title: "Opening conversation..." });
    }
  };

  return (
    <div
      className="px-4 py-4 flex gap-3 relative transition-colors"
      style={{
        background: notification.is_read ? "transparent" : "rgba(56,142,60,0.08)",
        borderBottom: "0.2px solid rgba(64,73,61,0.2)",
        opacity: notification.is_read ? 0.8 : 1,
      }}
    >
      {/* Avatar + Badge */}
      <div className="relative flex-shrink-0">
        <Avatar className="w-10 h-10 ring-1 ring-white/10">
          <AvatarImage src={notification.from_user_avatar || "/placeholder.svg"} className="object-cover" />
          <AvatarFallback style={{ background: "#272a2f", color: "#fff", fontSize: 14 }}>
            {notification.from_user_name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2"
          style={{ background: badgeConfig.bg, borderColor: CARD }}
        >
          <Icon className="w-3 h-3" style={{ color: badgeConfig.fg, fill: badgeConfig.fill ? badgeConfig.fg : "none" }} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <span className="text-[10px]" style={{ color: "#bfcab9", fontFamily: FONT }}>
            from{" "}
            <span className="font-semibold text-white">
              {notification.from_user_name || "Someone"}
            </span>
          </span>
          <div className="flex items-center gap-2">
            {!notification.is_read && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ background: "#1B0F16", color: GREEN_LIGHT, fontFamily: FONT }}>
                New
              </span>
            )}
            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-[#899485] hover:text-white transition-colors">
                  <MoreHorizontal className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" style={{ background: SURFACE, border: "1px solid rgba(130,219,126,0.2)", fontFamily: FONT }}>
                {!notification.is_read && (
                  <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)} className="text-white hover:bg-[#1E2126] cursor-pointer">
                    <Check className="w-4 h-4 mr-2" style={{ color: GREEN_LIGHT }} /> Mark as Read
                  </DropdownMenuItem>
                )}
                {notification.type === 'friend_request' && (
                  <>
                    <DropdownMenuItem onClick={() => handleAction('accept_friend')} className="text-white hover:bg-[#1E2126] cursor-pointer">
                      <UserPlus className="w-4 h-4 mr-2" style={{ color: "#006ec9" }} /> Accept
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction('decline_friend')} className="text-[#E53935] hover:bg-[#1E2126] cursor-pointer">
                      <X className="w-4 h-4 mr-2" /> Decline
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onClick={() => onDelete(notification.id)} className="text-[#E53935] hover:bg-[#1E2126] cursor-pointer">
                  <X className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <p className="text-sm text-white line-clamp-2 leading-tight" style={{ fontFamily: FONT }}>
          {notification.message}
        </p>

        <span className="text-[9px] mt-2 block" style={{ color: "#899485", fontFamily: FONT }}>
          {formatDistanceToNowStrict(new Date(notification.created_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}

export function NotificationsDropdown({ isOpen, onClose, onNotificationCountChange }: NotificationsDropdownProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
        if (data) {
          const formatted = data.map(notif => ({
            id: notif.id, user_id: notif.user_id, type: notif.type, title: notif.title,
            message: notif.message, data: notif.data, is_read: notif.is_read, created_at: notif.created_at,
            from_user_id: notif.sender_id || notif.data?.from_user_id,
            from_user_name: notif.data?.fromUserName || notif.data?.from_user_name,
            from_user_avatar: notif.data?.from_user_avatar,
          }));
          setNotifications(formatted as Notification[]);
        }
        setLoading(false);
      } catch (e) { setLoading(false); }
    };

    fetchNotifications();

    const channel = supabase.channel('notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const n = payload.new as any;
          setNotifications(prev => [{
            id: n.id, user_id: n.user_id, type: n.type, title: n.title, message: n.message, data: n.data,
            is_read: n.is_read, created_at: n.created_at, from_user_id: n.sender_id || n.data?.from_user_id,
            from_user_name: n.data?.fromUserName || n.data?.from_user_name, from_user_avatar: n.data?.from_user_avatar,
          }, ...prev.slice(0, 9)]);
        } else if (payload.eventType === 'UPDATE') {
          const u = payload.new as any;
          setNotifications(prev => prev.map(notif => notif.id === u.id ? { ...notif, is_read: u.is_read } : notif));
        } else if (payload.eventType === 'DELETE') {
          setNotifications(prev => prev.filter(notif => notif.id !== payload.old.id));
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Report count up
  useEffect(() => {
    if (onNotificationCountChange) onNotificationCountChange(unreadCount);
  }, [unreadCount, onNotificationCountChange]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      setNotifications(prev => prev.map(notif => notif.id === id ? { ...notif, is_read: true } : notif));
    } catch { toast({ title: "Error", description: "Failed to mark read.", variant: "destructive" }); }
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    const promises = unreadIds.map(id => supabase.from('notifications').update({ is_read: true }).eq('id', id));
    await Promise.all(promises);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('notifications').delete().eq('id', id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    } catch { toast({ title: "Error", description: "Failed to delete.", variant: "destructive" }); }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[55]" onClick={onClose} />
      <div 
        className="fixed top-20 right-4 w-[320px] shadow-[0_20px_40px_rgba(0,0,0,0.6)] z-[60] overflow-hidden rounded-[11px]"
        style={{ background: CARD, border: "1px solid rgba(64,73,61,0.2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-4 border-b" style={{ borderColor: "rgba(64,73,61,0.1)" }}>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-[15px] text-white" style={{ fontFamily: RALEWAY }}>Notifications</h2>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#4da24e", color: "#003207", fontFamily: FONT }}>
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="text-[10px] font-bold uppercase tracking-tight px-3 py-1 rounded-full transition-colors"
              style={{ color: GREEN_LIGHT, border: `1px solid rgba(130,219,126,0.3)`, fontFamily: FONT }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(130,219,126,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Mark All Read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {loading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-16 w-full rounded-[11px]" style={{ background: SURFACE }} />
              <Skeleton className="h-16 w-full rounded-[11px]" style={{ background: SURFACE }} />
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style={{ background: "rgba(56,142,60,0.1)" }}>
                <Bell className="h-6 w-6" style={{ color: GREEN_LIGHT, opacity: 0.7 }} />
              </div>
              <h3 className="text-sm font-semibold text-white" style={{ fontFamily: RALEWAY }}>No notifications</h3>
              <p className="text-[11px] mt-1" style={{ color: "#899485", fontFamily: FONT }}>You&apos;re all caught up.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-3 text-center" style={{ background: "#272a2f" }}>
            <button className="font-bold text-xs hover:underline" style={{ color: "#a5c8ff", fontFamily: FONT }}>
              View All Notifications
            </button>
          </div>
        )}
      </div>
    </>
  );
}
