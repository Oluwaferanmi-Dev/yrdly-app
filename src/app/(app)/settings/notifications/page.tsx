"use client";

import { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import type { NotificationSettings } from '@/types';

export default function NotificationSettingsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const userRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userRef, (doc) => {
            const userData = doc.data();
            if (userData && userData.notificationSettings) {
                setSettings(userData.notificationSettings);
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
        });

        return () => unsubscribe();
    }, [user]);

    const handleSettingChange = async (key: keyof NotificationSettings, value: boolean) => {
        if (!user || !settings) return;

        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                notificationSettings: newSettings
            });
            toast({ title: 'Settings updated successfully.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update settings.' });
            // Revert optimistic update on error
            setSettings(settings);
        }
    };

    if (loading) {
        return (
            <Card className="max-w-2xl mx-auto">
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
        );
    }

    return (
        <Card className="max-w-2xl mx-auto">
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
                        <span className="text-sm text-muted-foreground">Notify me when I'm invited to an event.</span>
                    </Label>
                    <Switch
                        id="eventInvites"
                        checked={settings?.eventInvites ?? true}
                        onCheckedChange={(value) => handleSettingChange('eventInvites', value)}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
