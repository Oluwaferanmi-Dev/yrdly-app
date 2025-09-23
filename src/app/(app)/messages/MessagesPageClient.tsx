"use client";

import { NeighborChatLayout } from '@/components/messages/NeighborChatLayout';
import { MarketplaceChatLayout } from '@/components/messages/MarketplaceChatLayout';
import { useAuth } from '@/hooks/use-supabase-auth';
import { useState, useEffect, useMemo } from 'react';
import type { User } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, ShoppingBag } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

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

// Client component to handle the interactive parts
export function MessagesPageClient({ selectedConversationId }: { selectedConversationId?: string }) {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab');

    const currentUser = useMemo(() => user ? {
        id: user.id,
        uid: user.id,
        name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous',
        avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || `https://placehold.co/100x100.png`,
    } as User : null, [user, profile]);

    // Simulate loading for a moment, as conversations are now fetched within ChatLayout
    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 500); // Adjust as needed
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return <MessagesLoading />;
    }

    if (!currentUser) {
         return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">Please log in</h2>
                    <p className="text-gray-600">You need to be logged in to view your messages.</p>
                </div>
            </div>
        );
    }

    // No need for conversations.length === 0 check here, ChatLayout handles it

    return (
        <div className="h-[calc(100vh_-_4rem)] md:h-auto pt-16">
            <Tabs defaultValue={tab === 'marketplace' ? 'marketplace' : 'neighbors'} className="h-full">
                <div className="p-4 border-b">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="neighbors" className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            Neighbor Chats
                        </TabsTrigger>
                        <TabsTrigger value="marketplace" className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4" />
                            Marketplace Chats
                        </TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="neighbors" className="h-[calc(100%-3rem)] mt-0">
                    <NeighborChatLayout selectedConversationId={selectedConversationId} />
                </TabsContent>
                <TabsContent value="marketplace" className="h-[calc(100%-3rem)] mt-0">
                    <MarketplaceChatLayout selectedChatId={selectedConversationId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
