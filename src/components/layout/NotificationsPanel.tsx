"use client";

import { Bell, CheckCheck, Trash2, X, MessageCircle, Heart, UserPlus, Calendar, ShoppingCart, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/use-notifications";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/utils";
import { Notification } from "@/hooks/use-notifications";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import * as Sentry from "@sentry/nextjs";

export function NotificationsPanel() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAllNotifications } = useNotifications();
    const router = useRouter();
    const isMobile = useIsMobile();

    const handleNotificationClick = (notification: Notification) => {
        Sentry.startSpan(
            { op: "ui.click", name: "Notifications: Open Notification" },
            (span) => {
                span.setAttribute("notificationId", notification.id);
                span.setAttribute("notificationType", notification.type);
                span.setAttribute("isRead", String(notification.is_read));
                // Mark as read first
                markAsRead(notification.id);
        
                // Navigate to the related content based on type and related_type
                switch (notification.type) {
                    case 'friend_request':
                    case 'friend_request_accepted':
                    case 'friend_request_declined':
                        router.push('/neighbors');
                        break;
                    case 'message':
                    case 'message_reaction':
                        if (notification.related_id) {
                            router.push(`/messages/${notification.related_id}`);
                        } else {
                            router.push('/messages');
                        }
                        break;
                    case 'post_like':
                    case 'post_comment':
                    case 'post_share':
                        if (notification.related_id) {
                            router.push(`/posts/${notification.related_id}`);
                        } else {
                            router.push('/home');
                        }
                        break;
                    case 'event_invite':
                    case 'event_reminder':
                    case 'event_cancelled':
                    case 'event_updated':
                        if (notification.related_id) {
                            router.push(`/events`);
                        } else {
                            router.push('/events');
                        }
                        break;
                    case 'marketplace_item_sold':
                    case 'marketplace_item_interest':
                    case 'marketplace_message':
                        if (notification.related_id) {
                            router.push(`/marketplace`);
                        } else {
                            router.push('/marketplace');
                        }
                        break;
                    case 'community_update':
                        router.push('/home');
                        break;
                    case 'system_announcement':
                        router.push('/home');
                        break;
                    case 'welcome':
                        router.push('/home');
                        break;
                    case 'profile_view':
                        if (notification.sender_id) {
                            router.push(`/neighbors`);
                        } else {
                            router.push('/neighbors');
                        }
                        break;
                    case 'mention':
                        if (notification.related_id) {
                            router.push(`/posts/${notification.related_id}`);
                        } else {
                            router.push('/home');
                        }
                        break;
                    default:
                        router.push('/home');
                        break;
                }
            }
        );
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'friend_request':
            case 'friend_request_accepted':
            case 'friend_request_declined':
                return <UserPlus className="h-4 w-4" />;
            case 'message':
            case 'message_reaction':
                return <MessageCircle className="h-4 w-4" />;
            case 'post_like':
                return <Heart className="h-4 w-4" />;
            case 'post_comment':
            case 'post_share':
                return <MessageCircle className="h-4 w-4" />;
            case 'event_invite':
            case 'event_reminder':
            case 'event_cancelled':
            case 'event_updated':
                return <Calendar className="h-4 w-4" />;
            case 'marketplace_item_sold':
            case 'marketplace_item_interest':
            case 'marketplace_message':
                return <ShoppingCart className="h-4 w-4" />;
            case 'community_update':
            case 'system_announcement':
            case 'welcome':
                return <AlertCircle className="h-4 w-4" />;
            case 'profile_view':
                return <UserPlus className="h-4 w-4" />;
            case 'mention':
                return <MessageCircle className="h-4 w-4" />;
            default:
                return <Bell className="h-4 w-4" />;
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'friend_request':
            case 'friend_request_accepted':
                return 'text-blue-600 dark:text-blue-400';
            case 'message':
            case 'message_reaction':
                return 'text-green-600 dark:text-green-400';
            case 'post_like':
                return 'text-red-600 dark:text-red-400';
            case 'post_comment':
            case 'post_share':
                return 'text-purple-600 dark:text-purple-400';
            case 'event_invite':
            case 'event_reminder':
                return 'text-orange-600 dark:text-orange-400';
            case 'marketplace_item_sold':
            case 'marketplace_item_interest':
            case 'marketplace_message':
                return 'text-emerald-600 dark:text-emerald-400';
            case 'system_announcement':
                return 'text-yellow-600 dark:text-yellow-400';
            default:
                return 'text-gray-600 dark:text-gray-400';
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                    )}
                    <span className="sr-only">Toggle notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-[360px] sm:w-[380px] p-0 overflow-hidden rounded-xl shadow-xl border border-border z-50"
            >
                <DropdownMenuLabel className="p-0">
                    <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-semibold truncate">Notifications</span>
                            <Badge variant="secondary" className="text-xs shrink-0 whitespace-nowrap">
                                {unreadCount} unread
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs shrink-0 whitespace-nowrap"
                                    onClick={() =>
                                        Sentry.startSpan(
                                            { op: "ui.click", name: "Notifications: Mark All Read" },
                                            (span) => {
                                                span.setAttribute("unreadCount", String(unreadCount));
                                                markAllAsRead();
                                            }
                                        )
                                    }
                                >
                                    <CheckCheck className="h-3 w-3 mr-1" />
                                    Mark All Read
                                </Button>
                            )}
                            {notifications.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive shrink-0 whitespace-nowrap"
                                    onClick={() =>
                                        Sentry.startSpan(
                                            { op: "ui.click", name: "Notifications: Clear All" },
                                            (span) => {
                                                span.setAttribute("totalCount", String(notifications.length));
                                                clearAllNotifications();
                                            }
                                        )
                                    }
                                >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Clear All
                                </Button>
                            )}
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="max-h-80 overscroll-contain">
                    <DropdownMenuGroup>
                        {notifications.length > 0 ? (
                            notifications.map((notif) => (
                                <DropdownMenuItem
                                    key={notif.id}
                                    onSelect={() => handleNotificationClick(notif)}
                                    className={`flex items-start gap-3 whitespace-normal p-3 ${!notif.is_read ? 'bg-muted/50' : ''}`}
                                >
                                    {/* Notification indicator */}
                                    <div className={`mt-1 h-2 w-2 rounded-full ${!notif.is_read ? 'bg-primary' : 'bg-transparent'}`} />
                                    
                                    {/* Icon */}
                                    <div className={`flex-shrink-0 ${getNotificationColor(notif.type)}`}>
                                        {getNotificationIcon(notif.type)}
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{notif.title}</p>
                                                <p className="text-sm text-muted-foreground line-clamp-2">{notif.message}</p>
                                            </div>
                                            
                                            {/* Type badge */}
                                            <Badge variant="outline" className="text-xs shrink-0 whitespace-nowrap">
                                                {notif.type.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                                                {timeAgo(new Date(notif.created_at))}
                                            </p>
                                            
                                            {/* Action buttons */}
                                            <div className="flex items-center gap-1">
                                                {!notif.is_read && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            Sentry.startSpan(
                                                                { op: "ui.click", name: "Notifications: Mark One Read" },
                                                                (span) => {
                                                                    span.setAttribute("notificationId", notif.id);
                                                                    span.setAttribute("notificationType", notif.type);
                                                                    markAsRead(notif.id);
                                                                }
                                                            );
                                                        }}
                                                    >
                                                        <CheckCheck className="h-3 w-3" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Add delete functionality here
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                            ))
                        ) : (
                            <div className="text-center text-sm text-muted-foreground py-10">
                                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>You have no notifications.</p>
                                <p className="text-xs mt-1">We&apos;ll notify you when something happens!</p>
                            </div>
                        )}
                    </DropdownMenuGroup>
                </ScrollArea>
                <DropdownMenuSeparator />
                <div className="px-3 py-2">
                    <Link href="/notifications" className="block">
                        <Button variant="ghost" className="w-full justify-center text-sm whitespace-nowrap">
                            View All Notifications
                        </Button>
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
