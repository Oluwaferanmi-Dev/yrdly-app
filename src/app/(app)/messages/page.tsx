
"use client";

import { ChatLayout, NoFriendsEmptyState } from '@/components/messages/ChatLayout';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import type { Conversation, User, Message as MessageType, UserWithFriends } from '@/types';
import { collection, query, where, onSnapshot, getDoc, doc, DocumentData, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { Skeleton } from '../../../components/ui/skeleton';

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
        <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
        </div>
    </div>
)


export default function MessagesPage() {
    const { user, userDetails } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]); // Conversations with accepted friends
    const [loading, setLoading] = useState(true);

    const currentUser: User | null = user ? {
        id: user.uid,
        uid: user.uid,
        name: user.displayName || 'Anonymous',
        avatarUrl: user.photoURL || `https://placehold.co/100x100.png`,
    } : null;

    useEffect(() => {
        if (!user) {
 setConversations([]);
 setLoading(false);
            return;
        }

        if (!userDetails || !userDetails.friends || userDetails.friends.length === 0) {
 setConversations([]);
 setLoading(false);
 return;
        }
        const q = query(collection(db, 'conversations'), where('participantIds', 'array-contains', user.uid), where('participantIds', 'array-contains-any', userDetails.friends.map(f => f.id)));
        
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
                    participant,
                    messages: lastMessage ? [{
                        id: 'last',
                        senderId: lastMessage.senderId,
                        sender: lastMessage.senderId === currentUser?.id ? currentUser : participant,
                        text: lastMessage.text,
                        timestamp: (lastMessage.timestamp as Timestamp)?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '...',
                        read: lastMessage.read,

                    }] : [],
                } as Conversation;
            });
            
            const resolvedConvs = (await Promise.all(convsPromises)).filter(Boolean) as Conversation[];
            setConversations(resolvedConvs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, userDetails, currentUser]);

    if (loading) {
        return <MessagesLoading />;
    }
    
    if (!currentUser || !userDetails || !userDetails.friends || userDetails.friends.length === 0) {
        return <NoFriendsEmptyState />;
    }

    return <ChatLayout conversations={conversations} currentUser={currentUser} />;
}
