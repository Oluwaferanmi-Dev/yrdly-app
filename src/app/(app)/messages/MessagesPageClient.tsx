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
        <div className="h-[calc(100vh_-_4rem)] md:h-[calc(100vh_-_5rem)] pt-16 md:pt-20">
            <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <Tabs defaultValue={tab === 'marketplace' ? 'marketplace' : 'neighbors'} className="h-full">
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
                        <div className="max-w-7xl mx-auto px-4 py-3">
                            <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 dark:bg-slate-700">
                                <TabsTrigger 
                                    value="neighbors" 
                                    className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600 data-[state=active]:shadow-sm"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    <span className="hidden sm:inline">Neighbor Chats</span>
                                    <span className="sm:hidden">Neighbors</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="marketplace" 
                                    className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600 data-[state=active]:shadow-sm"
                                >
                                    <ShoppingBag className="h-4 w-4" />
                                    <span className="hidden sm:inline">Marketplace Chats</span>
                                    <span className="sm:hidden">Marketplace</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>
                    </div>
                    <TabsContent value="neighbors" className="h-[calc(100%-4rem)] mt-0">
                        <NeighborChatLayout selectedConversationId={selectedConversationId} />
                    </TabsContent>
                    <TabsContent value="marketplace" className="h-[calc(100%-4rem)] mt-0">
                        <MarketplaceChatLayout selectedChatId={selectedConversationId} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
