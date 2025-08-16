
"use client";

import { ChatLayout, NoFriendsEmptyState } from '@/components/messages/ChatLayout';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect, useMemo } from 'react';
import type { Conversation, User } from '@/types';
import { collection, query, where, onSnapshot, getDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

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
    const { user, userDetails } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const selectedConversationId = params?.convId;

    const currentUser = useMemo(() => user ? {
        id: user.uid,
        uid: user.uid,
        name: user.displayName || 'Anonymous',
        avatarUrl: user.photoURL || `https://placehold.co/100x100.png`,
    } as User : null, [user]);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'conversations'),
            where('participantIds', 'array-contains', user.uid),
            orderBy('lastMessage.timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const convsPromises = querySnapshot.docs.map(async (docSnap) => {
                const convData = docSnap.data();
                const otherParticipantId = convData.participantIds.find((id: string) => id !== user.uid);
                
                if (!otherParticipantId) return null;

                const userDoc = await getDoc(doc(db, 'users', otherParticipantId));
                if (!userDoc.exists()) return null;
                const participant = { id: userDoc.id, ...userDoc.data() } as User;

                const lastMessage = convData.lastMessage;

                return {
                    id: docSnap.id,
                    participantIds: convData.participantIds,
                    participant,
                    lastMessage: lastMessage ? {
                        id: 'last',
                        senderId: lastMessage.senderId,
                        text: lastMessage.text,
                        timestamp: (lastMessage.timestamp as Timestamp)?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '...',
                        isRead: lastMessage.readBy?.includes(user.uid),
                    } : undefined,
                } as Conversation;
            });

            const resolvedConvs = (await Promise.all(convsPromises)).filter(Boolean) as Conversation[];
            
            // If a specific conversation is selected but not in the list (e.g., brand new), fetch it directly
            if (selectedConversationId && !resolvedConvs.some(c => c.id === selectedConversationId)) {
                const convDocRef = doc(db, 'conversations', selectedConversationId);
                const convDocSnap = await getDoc(convDocRef);
                if (convDocSnap.exists()) {
                    const convData = convDocSnap.data();
                    const otherParticipantId = convData.participantIds.find((id: string) => id !== user.uid);
                    if (otherParticipantId) {
                        const userDoc = await getDoc(doc(db, 'users', otherParticipantId));
                        if(userDoc.exists()){
                            const participant = { id: userDoc.id, ...userDoc.data() } as User;
                             resolvedConvs.unshift({ // Add to the top of the list
                                id: convDocSnap.id,
                                participantIds: convData.participantIds,
                                participant,
                             } as Conversation);
                        }
                    }
                }
            }


            setConversations(resolvedConvs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, selectedConversationId]);

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

    if (conversations.length === 0) {
        return <NoFriendsEmptyState 
            title="No Conversations Yet"
            description="You haven't started any conversations yet. Find neighbors and send them a friend request to start chatting!"
            buttonText="Find Neighbors"
            buttonLink="/neighbors"
        />;
    }

    return <ChatLayout conversations={conversations} currentUser={currentUser} selectedConversationId={selectedConversationId} />;
}
