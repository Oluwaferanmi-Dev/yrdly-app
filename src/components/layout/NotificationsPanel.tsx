"use client";

import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { timeAgo } from "@/lib/utils"; // Assuming you have a timeAgo utility

export function NotificationsPanel() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const router = useRouter();

    const handleNotificationClick = (notification: any) => {
        markAsRead(notification.id);
        // Navigate to the related content
        switch (notification.type) {
            case 'friend_request':
            case 'friend_request_accepted':
                router.push('/neighbors');
                break;
            case 'message':
                router.push(`/messages?convId=${notification.relatedId}`);
                break;
            case 'post_like':
            case 'comment':
                router.push(`/posts/${notification.relatedId}`);
                break;
            case 'event_invite':
                router.push('/events');
                break;
            case 'post_update':
                router.push('/home');
                break;
            default:
                break;
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
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto py-0 px-2">
                            <CheckCheck className="h-4 w-4 mr-1" /> Mark all as read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-96">
                    <DropdownMenuGroup>
                        {notifications.length > 0 ? (
                            notifications.map((notif) => (
                                <DropdownMenuItem
                                    key={notif.id}
                                    onSelect={() => handleNotificationClick(notif)}
                                    className={`flex items-start gap-3 whitespace-normal ${!notif.isRead ? 'bg-muted/50' : ''}`}
                                >
                                    <div className={`mt-1 h-2 w-2 rounded-full ${!notif.isRead ? 'bg-primary' : 'bg-transparent'}`} />
                                    <div className="flex-1">
                                        <p className="text-sm">{notif.message}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {timeAgo(notif.createdAt?.toDate())}
                                        </p>
                                    </div>
                                </DropdownMenuItem>
                            ))
                        ) : (
                            <div className="text-center text-sm text-muted-foreground py-10">
                                You have no notifications.
                            </div>
                        )}
                    </DropdownMenuGroup>
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
