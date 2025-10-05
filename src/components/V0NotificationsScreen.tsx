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

interface V0NotificationsScreenProps {
  className?: string;
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
    <Card className={`yrdly-shadow hover:shadow-lg transition-all ${!notification.is_read ? 'border-primary/50 bg-primary/5' : ''}`}>
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
                <p className="text-sm text-muted-foreground mt-1">{notification.body}</p>
                
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
                    <Button variant="ghost" size="sm">
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

export function V0NotificationsScreen({ className }: V0NotificationsScreenProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('all');

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

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notif => {
      const matchesSearch = searchQuery === '' || 
        notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notif.body.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = filterType === 'all' || 
        (filterType === 'unread' && !notif.is_read) ||
        (filterType === 'read' && notif.is_read);
      
      return matchesSearch && matchesFilter;
    });
  }, [notifications, searchQuery, filterType]);

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

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border focus:border-primary"
            />
          </div>
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
          >
            All
          </Button>
          <Button
            variant={filterType === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('unread')}
          >
            Unread
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
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
