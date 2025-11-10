"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bell, 
  UserPlus, 
  MessageCircle, 
  Heart, 
  Calendar,
  Check,
  X,
  MoreHorizontal
} from "lucide-react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNowStrict } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import * as Sentry from "@sentry/nextjs";

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
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

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case 'friend_request':
      return <UserPlus className="w-4 h-4 text-blue-500" />;
    case 'message':
      return <MessageCircle className="w-4 h-4 text-green-500" />;
    case 'post_like':
      return <Heart className="w-4 h-4 text-red-500" />;
    case 'post_comment':
      return <MessageCircle className="w-4 h-4 text-purple-500" />;
    case 'event_invite':
      return <Calendar className="w-4 h-4 text-orange-500" />;
    case 'system':
      return <Bell className="w-4 h-4 text-gray-500" />;
    default:
      return <Bell className="w-4 h-4 text-gray-500" />;
  }
}

function NotificationItem({ notification, onMarkAsRead, onDelete }: { 
  notification: Notification; 
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const handleAction = async (action: string) => {
    if (action === 'accept_friend') {
      try {
        await Sentry.startSpan(
          { op: "http.client", name: "NotificationsDropdown: Accept Friend" },
          async (span) => {
            const toUserId = notification.user_id || currentUser?.id || "";
            let senderId = notification.from_user_id || "";
            // Fallback: infer sender as the most recent pending request to this user
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

            if (!senderId || !toUserId) {
              throw new Error("Missing user identifiers for friend request");
            }

            // Check if already friends
            const { data: currentUserDataCheck, error: currentUserErrCheck } = await supabase
              .from('users')
              .select('friends')
              .eq('id', toUserId)
              .single();

            if (!currentUserErrCheck && currentUserDataCheck?.friends?.includes(senderId)) {
              toast({ title: "Already friends", description: "You are already friends with this user." });
              return;
            }

        // Find friend request (check any status first, then specifically pending)
        const { data: allRequests, error: allRequestsError } = await supabase
          .from('friend_requests')
          .select('*')
          .eq('from_user_id', senderId)
          .eq('to_user_id', toUserId)
          .order('created_at', { ascending: false })
          .limit(1);

            if (allRequestsError) {
              throw new Error("Failed to check friend request status.");
            }

            if (!allRequests || allRequests.length === 0) {
              // No friend request exists - mark notification as read and inform user
              await onMarkAsRead(notification.id);
              toast({ 
                title: "Friend request not found", 
                description: "This friend request may have been cancelled or already handled.",
                variant: "destructive"
              });
              return;
            }

            const requestData = allRequests[0];

            // If already accepted, just mark notification as read
            if (requestData.status === 'accepted') {
              await onMarkAsRead(notification.id);
              toast({ 
                title: "Already accepted", 
                description: "You are already friends with this user." 
              });
              return;
            }

            // If not pending, inform user
            if (requestData.status !== 'pending') {
              await onMarkAsRead(notification.id);
              toast({ 
                title: "Request already handled", 
                description: `This friend request was ${requestData.status}.`,
                variant: "destructive"
              });
              return;
            }

        // Update friend request status to accepted
        const { error: updateError } = await supabase
          .from('friend_requests')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', requestData.id);

            if (updateError) throw updateError;

        // Add to both users' friends lists
        const { data: currentUserData } = await supabase
          .from('users')
          .select('friends')
          .eq('id', toUserId)
          .single();

        const { data: senderUserData } = await supabase
          .from('users')
          .select('friends')
          .eq('id', senderId)
          .single();

            const currentUserFriends = Array.isArray(currentUserData?.friends) ? currentUserData.friends : [];
            const senderUserFriends = Array.isArray(senderUserData?.friends) ? senderUserData.friends : [];

        // Add sender to current user's friends list
            const updatedCurrentUserFriends = Array.from(new Set([...currentUserFriends, senderId]));
        await supabase
          .from('users')
          .update({ friends: updatedCurrentUserFriends })
          .eq('id', toUserId);

        // Add current user to sender's friends list
            const updatedSenderFriends = Array.from(new Set([...senderUserFriends, toUserId]));
        await supabase
          .from('users')
          .update({ friends: updatedSenderFriends })
          .eq('id', senderId);

        // Create notification for the sender
        try {
          const { NotificationTriggers } = await import('@/lib/notification-triggers');
          if (senderId) {
            await NotificationTriggers.onFriendRequestAccepted(senderId, toUserId);
          }
        } catch (error) {
          console.error('Error creating friend request accepted notification:', error);
        }

        // Mark this notification as read
        await onMarkAsRead(notification.id);

        toast({ title: "Friend request accepted!" });
          }
        );
      } catch (error: any) {
        Sentry.captureException(error);
        const message = error?.message || "Failed to accept friend request.";
        toast({ variant: "destructive", title: "Error", description: message });
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

            if (!senderId || !toUserId) {
              throw new Error("Missing user identifiers for friend request");
            }
        // Delete the friend request
        const { error } = await supabase
          .from('friend_requests')
          .delete()
          .eq('from_user_id', senderId)
          .eq('to_user_id', toUserId)
          .eq('status', 'pending');

            if (error) throw error;

        // Mark this notification as read
        await onMarkAsRead(notification.id);

        toast({ title: "Friend request declined." });
          }
        );
      } catch (error: any) {
        Sentry.captureException(error);
        const message = error?.message || "Failed to decline friend request.";
        toast({ variant: "destructive", title: "Error", description: message });
      }
    } else if (action === 'reply_message') {
      // TODO: Navigate to messages
      toast({ title: "Opening conversation..." });
    }
  };

  return (
    <div className={`p-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors ${!notification.is_read ? 'bg-primary/5' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1 w-5 h-5">
          <NotificationIcon type={notification.type} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-foreground truncate">{notification.title}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
              
              {/* From User */}
              {notification.from_user_name && (
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="w-5 h-5 flex-shrink-0">
                    <AvatarImage src={notification.from_user_avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">
                      {notification.from_user_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate">
                    from {notification.from_user_name}
                  </span>
                </div>
              )}

              {/* Time */}
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNowStrict(new Date(notification.created_at), { addSuffix: true })}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {!notification.is_read && (
                <Badge variant="destructive" className="text-xs px-1 py-0">
                  New
                </Badge>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!notification.is_read && (
                    <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
                      <Check className="w-3 h-3 mr-2" />
                      Mark as Read
                    </DropdownMenuItem>
                  )}
                  {notification.type === 'friend_request' && (
                    <>
                      <DropdownMenuItem onClick={() => handleAction('accept_friend')}>
                        <UserPlus className="w-3 h-3 mr-2" />
                        Accept
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction('decline_friend')}>
                        <X className="w-3 h-3 mr-2" />
                        Decline
                      </DropdownMenuItem>
                    </>
                  )}
                  {notification.type === 'message' && (
                    <DropdownMenuItem onClick={() => handleAction('reply_message')}>
                      <MessageCircle className="w-3 h-3 mr-2" />
                      Reply
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => onDelete(notification.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <X className="w-3 h-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyNotifications() {
  return (
    <div className="text-center py-8">
      <div className="inline-block bg-muted p-3 rounded-full mb-3">
        <Bell className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">No notifications</h3>
      <p className="text-xs text-muted-foreground mt-1">You&apos;re all caught up!</p>
    </div>
  );
}

export function NotificationsDropdown({ isOpen, onClose }: NotificationsDropdownProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isOpen) return;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10); // Limit to 10 most recent

        if (error) {
          console.error('Error fetching notifications:', error);
          return;
        }

        const formattedNotifications = (data || []).map(notif => ({
          id: notif.id,
          user_id: notif.user_id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          data: notif.data,
          is_read: notif.is_read,
          created_at: notif.created_at,
          from_user_id: notif.sender_id || notif.data?.from_user_id,
          from_user_name: notif.data?.fromUserName || notif.data?.from_user_name,
          from_user_avatar: notif.data?.from_user_avatar,
        })) as Notification[];

        setNotifications(formattedNotifications);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newNotification = payload.new as any;
          setNotifications(prev => [{
            id: newNotification.id,
            user_id: newNotification.user_id,
            type: newNotification.type,
            title: newNotification.title,
            message: newNotification.message,
            data: newNotification.data,
            is_read: newNotification.is_read,
            created_at: newNotification.created_at,
            from_user_id: newNotification.sender_id || newNotification.data?.from_user_id,
            from_user_name: newNotification.data?.fromUserName || newNotification.data?.from_user_name,
            from_user_avatar: newNotification.data?.from_user_avatar,
          }, ...prev.slice(0, 9)]); // Keep only 10 most recent
        } else if (payload.eventType === 'UPDATE') {
          const updatedNotification = payload.new as any;
          setNotifications(prev => 
            prev.map(notif => 
              notif.id === updatedNotification.id ? {
                ...notif,
                is_read: updatedNotification.is_read,
              } : notif
            )
          );
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id;
          setNotifications(prev => prev.filter(notif => notif.id !== deletedId));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isOpen]);


  const handleMarkAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => prev.filter(notif => notif.id !== id));
      toast({ title: "Notification deleted" });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification.",
        variant: "destructive",
      });
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;

      setNotifications([]);
      toast({ 
        title: "Success", 
        description: "All notifications cleared" 
      });
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      toast({
        title: "Error",
        description: "Failed to clear all notifications.",
        variant: "destructive",
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute top-16 right-4 w-80 max-h-96 bg-background border border-border rounded-lg shadow-lg yrdly-shadow" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Notifications</h3>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    notifications.forEach(notif => {
                      if (!notif.is_read) {
                        handleMarkAsRead(notif.id);
                      }
                    });
                  }}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Mark All Read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllNotifications}
                  className="h-6 text-xs px-2 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
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
            <EmptyNotifications />
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-border">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              View All Notifications
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
