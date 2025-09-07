
"use client";

import { PostCard } from "@/components/PostCard";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useHaptics } from "@/hooks/use-haptics";
import useSWR from 'swr';
import { firestoreFetcher, createSWRKey } from "@/hooks/use-swr-fetcher";

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

import { CreatePostDialog } from "@/components/CreatePostDialog";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Post as PostType } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyFeed } from "@/components/EmptyFeed";
import { WelcomeBanner } from "@/components/WelcomeBanner";
import { SuggestedNeighbors } from "@/components/SuggestedNeighbors";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";

export default function Home() {
  const { triggerHaptic } = useHaptics();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);

  // SWR data fetching for posts
  const { data: swrPosts, error, mutate } = useSWR(
    createSWRKey.posts({ limit: 50 }),
    firestoreFetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Pull-to-refresh functionality
  const { containerRef, isRefreshing } = usePullToRefresh({
    onRefresh: async () => {
      // Trigger haptic feedback
      triggerHaptic('medium');
      
      // Refresh data
      await mutate();
      
      // Show success feedback
      triggerHaptic('success');
    },
    threshold: 80,
    enabled: true
  });

  // Update local state when SWR data changes
  useEffect(() => {
    if (swrPosts) {
      setPosts(swrPosts as PostType[]);
      setLoading(false);
    }
  }, [swrPosts]);

  // Fallback to real-time listener if SWR fails
  useEffect(() => {
    if (error) {
      console.log('SWR failed, falling back to real-time listener');
      
      const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const postsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
          } as PostType;
        });
        setPosts(postsData);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [error]);

  return (
    <div ref={containerRef} className="space-y-6 pt-12 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Content - 2 columns on large screens */}
        <div className="lg:col-span-2 space-y-6">
          <EmailVerificationBanner />
          <WelcomeBanner />
          
          <Card>
            <CardContent className="p-4">
               <CreatePostDialog />
            </CardContent>
          </Card>
          
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-48 w-full rounded-lg" />
              </div>
            ) : posts.length > 0 ? (
              posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <EmptyFeed />
            )}
          </div>
        </div>

        {/* Right Sidebar - 1 column on large screens, hidden on smaller screens */}
        <aside className="hidden lg:block space-y-6 sticky top-20">
          <SuggestedNeighbors />
          {/* You can add more widgets here later, like "Upcoming Events" */}
        </aside>
      </div>
    </div>
  );
}
