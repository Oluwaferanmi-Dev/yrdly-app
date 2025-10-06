"use client";

import { useState, useEffect } from 'react';

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-supabase-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { PushNotificationService } from '@/lib/push-notification-service';
import type { NotificationSettings } from "../../../../types";

export default function NotificationSettingsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Set up real-time subscription for user settings
        const channel = supabase
            .channel(`user_settings_${user.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'users',
                filter: `id=eq.${user.id}`
            }, (payload) => {
                const userData = payload.new;
                if (userData && userData.notification_settings) {
                    setSettings(userData.notification_settings);
                } else {
                    // Initialize with default settings if none exist
                    setSettings({
                        friendRequests: true,
                        messages: true,
                        postUpdates: true,
                        comments: true,
                        postLikes: true,
                        eventInvites: true,
                    });
                }
                setLoading(false);
            })
            .subscribe();

        // Also fetch settings initially
        const fetchSettings = async () => {
            const { data, error } = await supabase
                .from('users')
                .select('notification_settings')
                .eq('id', user.id)
                .single();
            
            if (data && data.notification_settings) {
                setSettings(data.notification_settings);
            } else {
                // Initialize with default settings if none exist
                setSettings({
                    friendRequests: true,
                    messages: true,
                    postUpdates: true,
                    comments: true,
                    postLikes: true,
                    eventInvites: true,
                });
            }
            setLoading(false);
        };
        
        fetchSettings();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const handleSettingChange = async (key: keyof NotificationSettings, value: boolean) => {
        if (!user || !settings) return;

        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        try {
            const { error } = await supabase
                .from('users')
                .update({ notification_settings: newSettings })
                .eq('id', user.id);
            
            if (error) throw error;
            toast({ title: 'Settings updated successfully.' });
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update settings.' });
        }
    };

    if (loading) {
        return (
            <div className="pt-16">
                <div className="max-w-2xl mx-auto space-y-4">
                    <Link href="/settings">
                        <Button variant="ghost" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Settings
                        </Button>
                    </Link>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Settings</CardTitle>
                            <CardDescription>Manage how you receive notifications.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <Skeleton className="h-5 w-48" />
                                    <Skeleton className="h-6 w-12" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="pt-16">
            <div className="max-w-2xl mx-auto space-y-4">
                <Link href="/settings">
                    <Button variant="ghost" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Settings
                    </Button>
                </Link>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Notification Settings</CardTitle>
                        <CardDescription>Manage how you receive notifications from Yrdly.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="friendRequests" className="flex flex-col space-y-1">
                                <span>Friend Requests</span>
                                <span className="text-sm text-muted-foreground">Notify me about new friend requests and acceptances.</span>
                            </Label>
                            <Switch
                                id="friendRequests"
                                checked={settings?.friendRequests ?? true}
                                onCheckedChange={(value) => handleSettingChange('friendRequests', value)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="messages" className="flex flex-col space-y-1">
                                <span>New Messages</span>
                                <span className="text-sm text-muted-foreground">Notify me when I receive a new message.</span>
                            </Label>
                            <Switch
                                id="messages"
                                checked={settings?.messages ?? true}
                                onCheckedChange={(value) => handleSettingChange('messages', value)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="postUpdates" className="flex flex-col space-y-1">
                                <span>New Posts</span>
                                <span className="text-sm text-muted-foreground">Notify me about new posts in my neighborhood.</span>
                            </Label>
                            <Switch
                                id="postUpdates"
                                checked={settings?.postUpdates ?? true}
                                onCheckedChange={(value) => handleSettingChange('postUpdates', value)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="comments" className="flex flex-col space-y-1">
                                <span>Post Comments & Replies</span>
                                <span className="text-sm text-muted-foreground">Notify me when someone comments on my posts.</span>
                            </Label>
                            <Switch
                                id="comments"
                                checked={settings?.comments ?? true}
                                onCheckedChange={(value) => handleSettingChange('comments', value)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="postLikes" className="flex flex-col space-y-1">
                                <span>Post Likes</span>
                                <span className="text-sm text-muted-foreground">Notify me when someone likes my post.</span>
                            </Label>
                            <Switch
                                id="postLikes"
                                checked={settings?.postLikes ?? true}
                                onCheckedChange={(value) => handleSettingChange('postLikes', value)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="eventInvites" className="flex flex-col space-y-1">
                                <span>Event Invitations</span>
                                <span className="text-sm text-muted-foreground">Notify me when I&apos;m invited to an event.</span>
                            </Label>
                            <Switch
                                id="eventInvites"
                                checked={settings?.eventInvites ?? true}
                                onCheckedChange={(value) => handleSettingChange('eventInvites', value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Test Push Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle>Test Push Notifications</CardTitle>
                        <CardDescription>
                            Test if push notifications are working properly.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button 
                            onClick={async () => {
                                if (!user) return;
                                
                                try {
                                    const success = await PushNotificationService.testNotification(user.id);
                                    if (success) {
                                        toast({
                                            title: "Test Notification Sent",
                                            description: "Check your notifications to see the test message.",
                                        });
                                    } else {
                                        toast({
                                            variant: "destructive",
                                            title: "Test Failed",
                                            description: "Push notifications may not be enabled. Please check your browser settings.",
                                        });
                                    }
                                } catch (error) {
                                    console.error('Error testing push notification:', error);
                                    toast({
                                        variant: "destructive",
                                        title: "Test Failed",
                                        description: "An error occurred while testing push notifications.",
                                    });
                                }
                            }}
                            variant="outline"
                        >
                            Send Test Notification
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
