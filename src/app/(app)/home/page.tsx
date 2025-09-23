
"use client";

import { PostCard } from "@/components/PostCard";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useHaptics } from "@/hooks/use-haptics";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Post as PostType } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyFeed } from "@/components/EmptyFeed";
import { WelcomeBanner } from "@/components/WelcomeBanner";
import { SuggestedNeighbors } from "@/components/SuggestedNeighbors";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { useAuth } from "@/hooks/use-supabase-auth";

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function Home() {
  const { triggerHaptic } = useHaptics();
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch posts from Supabase
  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      if (data) {
        setPosts(data as PostType[]);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
    }
  };

  // Pull-to-refresh functionality
  const { containerRef, isRefreshing } = usePullToRefresh({
    onRefresh: async () => {
      // Trigger haptic feedback
      triggerHaptic('medium');
      
      // Refresh data
      await fetchPosts();
      
      // Show success feedback
      triggerHaptic('success');
    },
    threshold: 80,
    enabled: true
  });

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  // Real-time subscription for live updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('posts')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'posts' 
      }, (payload) => {
        console.log('Realtime change received!', payload);
        // Refresh posts when changes occur
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
