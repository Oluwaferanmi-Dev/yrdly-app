"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-supabase-auth";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useHaptics } from "@/hooks/use-haptics";
import { supabase } from "@/lib/supabase";
import type { Post as PostType } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyFeed } from "@/components/EmptyFeed";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { PostCard } from "@/components/PostCard";

interface V0HomeScreenProps {
  onViewProfile?: (user: any) => void;
}

export function V0HomeScreen({ onViewProfile }: V0HomeScreenProps) {
  const { user, profile } = useAuth();
  const { triggerHaptic } = useHaptics();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch posts from Supabase
  const fetchPosts = useCallback(async () => {
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
  }, []);

  // Pull-to-refresh functionality
  const { containerRef, isRefreshing } = usePullToRefresh({
    onRefresh: async () => {
      triggerHaptic('medium');
      await fetchPosts();
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
  }, [user, fetchPosts]);

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
        if (payload.eventType === 'INSERT') {
          const newPost = payload.new as PostType;
          setPosts(prevPosts => [newPost, ...prevPosts]);
        } else if (payload.eventType === 'UPDATE') {
          const updatedPost = payload.new as PostType;
          setPosts(prevPosts => 
            prevPosts.map(post => 
              post.id === updatedPost.id ? updatedPost : post
            )
          );
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id;
          setPosts(prevPosts => 
            prevPosts.filter(post => post.id !== deletedId)
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);


  return (
    <div ref={containerRef} className="p-3 sm:p-4 space-y-3 sm:space-y-4 pb-20 sm:pb-24 max-w-2xl mx-auto">
      {/* Email verification banner removed - users verify during registration */}

      {/* Welcome banner removed as requested */}

      {/* Create Post Card */}
      <Card className="p-3 sm:p-4 yrdly-shadow">
        <div className="flex items-center gap-2 sm:gap-3">
          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
            <AvatarImage src={profile?.avatar_url || "/diverse-user-avatars.png"} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
              {profile?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <CreatePostDialog>
            <Button
              variant="outline"
              className="flex-1 justify-start text-muted-foreground bg-transparent text-left px-2 sm:px-3 py-2 h-auto min-h-[36px] sm:min-h-[40px]"
            >
              <span className="truncate text-xs sm:text-sm">What&apos;s happening in your neighborhood?</span>
            </Button>
          </CreatePostDialog>
        </div>
      </Card>

      {/* Feed Posts */}
      <div className="space-y-3 sm:space-y-4">
        {loading ? (
          <div className="space-y-3 sm:space-y-4">
            <Skeleton className="h-40 sm:h-48 w-full rounded-lg" />
            <Skeleton className="h-40 sm:h-48 w-full rounded-lg" />
            <Skeleton className="h-40 sm:h-48 w-full rounded-lg" />
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
  );
}

