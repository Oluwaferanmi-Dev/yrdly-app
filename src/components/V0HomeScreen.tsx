"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Heart,
  MessageCircle,
  Share,
  MoreHorizontal,
  ImageIcon,
  MapPin,
  Calendar,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useHaptics } from "@/hooks/use-haptics";
import { supabase } from "@/lib/supabase";
import type { Post as PostType } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyFeed } from "@/components/EmptyFeed";
import { WelcomeBanner } from "@/components/WelcomeBanner";
import { SuggestedNeighbors } from "@/components/SuggestedNeighbors";
// Email verification banner removed - users verify during registration
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
  const [showCreatePost, setShowCreatePost] = useState(false);
  // Email verification banner removed - users verify during registration
  // Welcome banner removed as requested

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
    <div ref={containerRef} className="p-4 space-y-4 pb-24 max-w-2xl mx-auto">
      {/* Email verification banner removed - users verify during registration */}

      {/* Welcome banner removed as requested */}

      {/* Create Post Card */}
      <Card className="p-4 yrdly-shadow">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={profile?.avatar_url || "/diverse-user-avatars.png"} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {profile?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="outline"
            className="flex-1 justify-start text-muted-foreground bg-transparent"
            onClick={() => setShowCreatePost(true)}
          >
            What&apos;s happening in your neighborhood?
          </Button>
        </div>
      </Card>

      {/* Feed Posts */}
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

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full max-w-2xl mx-auto bg-background rounded-t-xl p-4 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Create Post</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCreatePost(false)}>
                ✕
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={profile?.avatar_url || "/diverse-user-avatars.png"} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {profile?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold text-foreground">{profile?.name || "User"}</h4>
                <p className="text-sm text-muted-foreground">Posting to neighborhood</p>
              </div>
            </div>

            <CreatePostDialog>
              <div className="w-full">
                <Textarea 
                  placeholder="What's happening in your neighborhood?" 
                  className="min-h-[100px] resize-none" 
                />
              </div>
            </CreatePostDialog>

            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm">
                <ImageIcon className="w-4 h-4 mr-2" />
                Photo
              </Button>
              <Button variant="outline" size="sm">
                <MapPin className="w-4 h-4 mr-2" />
                Location
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowCreatePost(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">Post</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

