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
  ShoppingCart,
  Settings,
  Check,
  X,
  MoreHorizontal
} from "lucide-react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNowStrict } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";

interface NotificationsScreenProps {
  className?: string;
}

interface Notification {
  id: string;
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
      return <UserPlus className="w-5 h-5 text-blue-500" />;
    case 'message':
      return <MessageCircle className="w-5 h-5 text-green-500" />;
    case 'post_like':
      return <Heart className="w-5 h-5 text-red-500" />;
    case 'post_comment':
      return <MessageCircle className="w-5 h-5 text-purple-500" />;
    case 'event_invite':
      return <Calendar className="w-5 h-5 text-orange-500" />;
    case 'system':
      return <Bell className="w-5 h-5 text-gray-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
}

function NotificationCard({ notification, onMarkAsRead, onDelete }: { 
  notification: Notification; 
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const handleAction = async (action: string) => {
    if (action === 'accept_friend') {
      try {
        await Sentry.startSpan(
          { op: "http.client", name: "NotificationsScreen: Accept Friend" },
          async (span) => {
            span.setAttribute("notificationId", notification.id);
            const toUserId = currentUser?.id || "";
            // Use sender_id from notification (primary source) or fallback to data field
            let fromUserId = notification.from_user_id || "";
            
            // If still missing, try to find the pending friend request for this notification
            if (!fromUserId && toUserId) {
              // First, try to find any pending request to this user (most recent)
              const { data: pending } = await supabase
                .from('friend_requests')
                .select('id, from_user_id')
                .eq('to_user_id', toUserId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(1);
              if (pending && pending.length >= 1) {
                fromUserId = pending[0].from_user_id;
              }
            }
            span.setAttribute("fromUserId", fromUserId || "");
            span.setAttribute("toUserId", toUserId);

            if (!currentUser) {
              throw new Error("You must be logged in to accept a friend request.");
            }
            if (!fromUserId || !toUserId) {
              throw new Error("Invalid friend request. Missing sender information.");
            }

            // Check if already friends
            const { data: me } = await supabase
              .from('users')
              .select('friends')
              .eq('id', currentUser.id)
              .single();

            if (me?.friends?.includes(fromUserId)) {
              toast({ title: "Already friends", description: "You are already friends with this user." });
              return;
            }

            // Find friend request (check any status first, then specifically pending)
            const { data: allRequests, error: allRequestsError } = await supabase
              .from('friend_requests')
              .select('*')
              .eq('from_user_id', fromUserId)
              .eq('to_user_id', toUserId)
              .order('created_at', { ascending: false })
              .limit(1);

            if (allRequestsError) {
              throw new Error("Failed to check friend request status.");
            }

            if (!allRequests || allRequests.length === 0) {
              // No friend request exists - mark notification as read and inform user
              onMarkAsRead(notification.id);
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
              onMarkAsRead(notification.id);
              toast({ 
                title: "Already accepted", 
                description: "You are already friends with this user." 
              });
              return;
            }

            // If not pending, inform user
            if (requestData.status !== 'pending') {
              onMarkAsRead(notification.id);
              toast({ 
                title: "Request already handled", 
                description: `This friend request was ${requestData.status}.`,
                variant: "destructive"
              });
              return;
            }

            // Accept request
            const { error: updateError } = await supabase
              .from('friend_requests')
              .update({ status: 'accepted', updated_at: new Date().toISOString() })
              .eq('id', requestData.id);

            if (updateError) throw updateError;

            // Update both users' friends lists (dedupe)
            const [{ data: meData }, { data: senderData }] = await Promise.all([
              supabase.from('users').select('friends').eq('id', currentUser.id).single(),
              supabase.from('users').select('friends').eq('id', fromUserId).single(),
            ]);

            const myFriends = Array.isArray(meData?.friends) ? meData!.friends : [];
            const senderFriends = Array.isArray(senderData?.friends) ? senderData!.friends : [];

            const updatedMyFriends = Array.from(new Set([...myFriends, fromUserId]));
            const updatedSenderFriends = Array.from(new Set([...senderFriends, toUserId]));

            await Promise.all([
              supabase.from('users').update({ friends: updatedMyFriends }).eq('id', toUserId),
              supabase.from('users').update({ friends: updatedSenderFriends }).eq('id', fromUserId),
            ]);

            // Mark as read (best-effort)
            onMarkAsRead(notification.id);

            // Notify sender
            try {
              const { NotificationTriggers } = await import('@/lib/notification-triggers');
              await NotificationTriggers.onFriendRequestAccepted(fromUserId, toUserId);
            } catch (notifyErr) {
              // non-fatal
            }

            toast({ title: "Friend request accepted", description: "You are now friends." });
          }
        );
      } catch (error: any) {
        Sentry.captureException(error);
        toast({
          variant: "destructive",
          title: "Unable to accept request",
          description: error?.message || "Please try again.",
        });
      }
    } else if (action === 'decline_friend') {
      try {
        await Sentry.startSpan(
          { op: "http.client", name: "NotificationsScreen: Decline Friend" },
          async (span) => {
            span.setAttribute("notificationId", notification.id);
            span.setAttribute("fromUserId", notification.from_user_id || "");
            span.setAttribute("toUserId", currentUser?.id || "");

            if (!currentUser) {
              throw new Error("You must be logged in to decline a friend request.");
            }
            if (!notification.from_user_id) {
              throw new Error("Invalid friend request. Missing sender information.");
            }

            const { error } = await supabase
              .from('friend_requests')
              .delete()
              .eq('from_user_id', notification.from_user_id)
              .eq('to_user_id', currentUser.id)
              .eq('status', 'pending');

            if (error) throw error;

            onMarkAsRead(notification.id);
            toast({ title: "Friend request declined" });
          }
        );
      } catch (error: any) {
        Sentry.captureException(error);
        toast({
          variant: "destructive",
          title: "Unable to decline request",
          description: error?.message || "Please try again.",
        });
      }
    } else if (action === 'reply_message') {
      // TODO: Navigate to messages
      toast({ title: "Opening conversation..." });
    }
  };

  const handleCardClick = () => {
    Sentry.startSpan(
      { op: "ui.click", name: "Notifications: Open From List" },
      (span) => {
        span.setAttribute("notificationId", notification.id);
        span.setAttribute("notificationType", notification.type);
        span.setAttribute("fromUserId", notification.from_user_id || "");

        // Mark as read on click
        if (!notification.is_read) {
          onMarkAsRead(notification.id);
        }

        // Navigate based on type
        switch (notification.type) {
          case 'friend_request': {
            const targetUserId = notification.from_user_id;
            if (targetUserId) {
              router.push(`/profile/${targetUserId}`);
            } else {
              router.push('/neighbors');
            }
            break;
          }
          case 'message': {
            const conversationId = notification.data?.conversation_id;
            if (conversationId) {
              router.push(`/messages/${conversationId}`);
            } else {
              router.push('/messages');
            }
            break;
          }
          case 'post_like':
          case 'post_comment': {
            const postId = notification.data?.post_id || notification.data?.related_id;
            if (postId) {
              router.push(`/posts/${postId}`);
            } else {
              router.push('/home');
            }
            break;
          }
          case 'event_invite': {
            const eventPostId = notification.data?.post_id || notification.data?.related_id;
            if (eventPostId) {
              router.push(`/posts/${eventPostId}`);
            } else {
              router.push('/events');
            }
            break;
          }
          default: {
            router.push('/home');
          }
        }
      }
    );
  };

  return (
    <Card 
      className={`yrdly-shadow hover:shadow-lg transition-all cursor-pointer ${!notification.is_read ? 'border-primary/50 bg-primary/5' : ''}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            <NotificationIcon type={notification.type} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{notification.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                
                {/* From User */}
                {notification.from_user_name && (
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={notification.from_user_avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">
                        {notification.from_user_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      from {notification.from_user_name}
                    </span>
                  </div>
                )}

                {/* Time */}
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNowStrict(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {!notification.is_read && (
                  <Badge variant="destructive" className="text-xs">
                    New
                  </Badge>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!notification.is_read && (
                      <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
                        <Check className="w-4 h-4 mr-2" />
                        Mark as Read
                      </DropdownMenuItem>
                    )}
                    {notification.type === 'friend_request' && (
                      <>
                        <DropdownMenuItem onClick={() => handleAction('accept_friend')}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Accept
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction('decline_friend')}>
                          <X className="w-4 h-4 mr-2" />
                          Decline
                        </DropdownMenuItem>
                      </>
                    )}
                    {notification.type === 'message' && (
                      <DropdownMenuItem onClick={() => handleAction('reply_message')}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Reply
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => onDelete(notification.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyNotifications() {
  return (
    <div className="text-center py-16">
      <div className="inline-block bg-muted p-4 rounded-full mb-4">
        <Bell className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold">No notifications yet</h2>
      <p className="text-muted-foreground mt-2">You&apos;ll see notifications about your community activity here.</p>
    </div>
  );
}

export function NotificationsScreen({ className }: NotificationsScreenProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching notifications:', error);
          return;
        }

        const formattedNotifications = (data || []).map(notif => ({
          id: notif.id,
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

        // Mark all notifications as read when the screen is opened
        const unreadNotifications = formattedNotifications.filter(n => !n.is_read);
        if (unreadNotifications.length > 0) {
          const unreadIds = unreadNotifications.map(n => n.id);
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds);
          
          // Update local state
          setNotifications(prev => 
            prev.map(notif => 
              unreadIds.includes(notif.id) ? { ...notif, is_read: true } : notif
            )
          );
        }
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
            type: newNotification.type,
            title: newNotification.title,
            message: newNotification.message,
            data: newNotification.data,
            is_read: newNotification.is_read,
            created_at: newNotification.created_at,
            from_user_id: newNotification.sender_id || newNotification.data?.from_user_id,
            from_user_name: newNotification.data?.fromUserName || newNotification.data?.from_user_name,
            from_user_avatar: newNotification.data?.from_user_avatar,
          }, ...prev]);
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
  }, [user]);


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

  return (
    <div className={`p-4 space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Mark all as read
                notifications.forEach(notif => {
                  if (!notif.is_read) {
                    handleMarkAsRead(notif.id);
                  }
                });
              }}
            >
              <Check className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>

        {/* Clear All Notifications */}
        {notifications.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearAllNotifications}
            >
              <X className="w-4 h-4 mr-2" />
              Clear All Notifications
            </Button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <EmptyNotifications />
      )}
    </div>
  );
}
