"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bell, 
  Search, 
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

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Notification {
  id: string;
  type: 'friend_request' | 'message' | 'post_like' | 'post_comment' | 'event_invite' | 'system';
  title: string;
  body: string;
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

  const handleAction = async (action: string) => {
    if (action === 'accept_friend') {
      // TODO: Implement accept friend request
      toast({ title: "Friend request accepted!" });
    } else if (action === 'decline_friend') {
      // TODO: Implement decline friend request
      toast({ title: "Friend request declined." });
    } else if (action === 'reply_message') {
      // TODO: Navigate to messages
      toast({ title: "Opening conversation..." });
    }
  };

  return (
    <div className={`p-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors ${!notification.is_read ? 'bg-primary/5' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          <NotificationIcon type={notification.type} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-foreground">{notification.title}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.body}</p>
              
              {/* From User */}
              {notification.from_user_name && (
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="w-5 h-5">
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
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNowStrict(new Date(notification.created_at), { addSuffix: true })}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
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
  const [searchQuery, setSearchQuery] = useState('');

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
          type: notif.type,
          title: notif.title,
          body: notif.body,
          data: notif.data,
          is_read: notif.is_read,
          created_at: notif.created_at,
          from_user_id: notif.data?.from_user_id,
          from_user_name: notif.data?.from_user_name,
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
            type: newNotification.type,
            title: newNotification.title,
            body: newNotification.body,
            data: newNotification.data,
            is_read: newNotification.is_read,
            created_at: newNotification.created_at,
            from_user_id: newNotification.data?.from_user_id,
            from_user_name: newNotification.data?.from_user_name,
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

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notif => {
      const matchesSearch = searchQuery === '' || 
        notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notif.body.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [notifications, searchQuery]);

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

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute top-16 right-4 w-80 max-h-96 bg-background border border-border rounded-lg shadow-lg yrdly-shadow" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-foreground">Notifications</h3>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
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
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
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
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
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
        {filteredNotifications.length > 0 && (
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
