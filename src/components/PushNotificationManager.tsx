"use client";

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function PushNotificationManager() {
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            const messaging = getMessaging(app);

            const requestPermission = async () => {
                try {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted' && user) {
                        const currentToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
                        if (currentToken) {
                            // Save the token to the user's document in Firestore
                            const userRef = doc(db, 'users', user.uid);
                            await updateDoc(userRef, { fcmToken: currentToken });
                        } else {
                            console.log('No registration token available. Request permission to generate one.');
                        }
                    }
                } catch (error) {
                    console.error('An error occurred while retrieving token. ', error);
                }
            };

            if (user) {
                requestPermission();
            }

            // Handle incoming messages when the app is in the foreground
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('Message received. ', payload);
                toast({
                    title: payload.notification?.title,
                    description: payload.notification?.body,
                });
            });

            return () => {
                unsubscribe();
            };
        }
    }, [user, toast]);

    return null; // This component does not render anything
}
