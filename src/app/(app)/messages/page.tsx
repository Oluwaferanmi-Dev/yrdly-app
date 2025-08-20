
"use client";

import { ChatLayout, NoFriendsEmptyState } from '@/components/messages/ChatLayout';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect, useMemo } from 'react';
import type { Conversation, User } from '@/types';
import { collection, query, where, onSnapshot, getDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, useSearchParams } from 'next/navigation';

const MessagesLoading = () => (
    <div className="p-4 space-y-4">
        <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
        </div>
        <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
        </div>
    </div>
);


export default function MessagesPage({ params }: { params?: { convId?: string } }) {
    console.log("MessagesPage rendered. Params:", params);
    const { user, userDetails } = useAuth();
    const [loading, setLoading] = useState(true);
    const selectedConversationId = params?.convId;

    const currentUser = useMemo(() => user ? {
        id: user.uid,
        uid: user.uid,
        name: user.displayName || 'Anonymous',
        avatarUrl: user.photoURL || `https://placehold.co/100x100.png`,
    } as User : null, [user]);

    // Simulate loading for a moment, as conversations are now fetched within ChatLayout
    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 500); // Adjust as needed
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return <MessagesLoading />;
    }

    if (!currentUser) {
         return <NoFriendsEmptyState 
            title="Please log in"
            description="You need to be logged in to view your messages."
            buttonText="Login"
            buttonLink="/login"
        />;
    }

    // No need for conversations.length === 0 check here, ChatLayout handles it

    return (
        <div className="h-[calc(100vh_-_8rem)] md:h-auto">
            <ChatLayout currentUser={currentUser} selectedConversationId={selectedConversationId} />
        </div>
    );
}
