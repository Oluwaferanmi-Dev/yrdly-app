"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

export interface Notification {
    id: string;
    userId: string;
    type: string;
    senderId: string;
    relatedId: string;
    message: string;
    isRead: boolean;
    createdAt: unknown;
}

export const useNotifications = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        const notificationsQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
            const newNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
            // Sort client-side to ensure descending order without needing a new index
            newNotifications.sort((a, b) => (b.createdAt as any)?.seconds - (a.createdAt as any)?.seconds);
            
            const newUnreadCount = newNotifications.filter(n => !n.isRead).length;

            // Optional: Show a toast for new, unread notifications
            if (newUnreadCount > unreadCount) {
                 const latestNotification = newNotifications[0];
                 if (latestNotification && !latestNotification.isRead) {
                    // Check if this notification was already seen in this session
                    const seenNotifs = sessionStorage.getItem('seenNotifications');
                    const seen = seenNotifs ? JSON.parse(seenNotifs) : [];
                    if (!seen.includes(latestNotification.id)) {
                        toast({
                            title: "New Notification",
                            description: latestNotification.message,
                        });
                        sessionStorage.setItem('seenNotifications', JSON.stringify([...seen, latestNotification.id]));
                    }
                 }
            }
            
            setNotifications(newNotifications);
            setUnreadCount(newUnreadCount);
            setLoading(false);
        });

        return () => unsubscribe();

    }, [user, toast, unreadCount]);

    const markAsRead = async (notificationId: string) => {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, { isRead: true });
    };

    const markAllAsRead = async () => {
        if (!user) return;
        const unread = notifications.filter(n => !n.isRead);
        const promises = unread.map(n => markAsRead(n.id));
        await Promise.all(promises);
    };

    return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
};
