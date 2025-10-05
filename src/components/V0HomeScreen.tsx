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
            <Card key={post.id} className="p-4 yrdly-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="w-10 h-10 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                    <AvatarImage src={post.author_image || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {post.author_name?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-foreground truncate cursor-pointer hover:text-primary">
                      {post.author_name || "Unknown User"}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(post.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {post.category === "For Sale" && (
                  <Badge className="bg-accent text-accent-foreground flex-shrink-0">For Sale</Badge>
                )}
                <Button variant="ghost" size="sm" className="flex-shrink-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>

              <div className="mb-3">
                {(post.image_url || (post.image_urls && post.image_urls.length > 0)) && (
                  <img
                    src={post.image_url || post.image_urls?.[0] || "/placeholder.svg"}
                    alt={post.title || "Post image"}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                )}

                {post.category === "Event" && post.title && (
                  <>
                    <p className="text-foreground mb-2">{post.text}</p>
                    <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="font-semibold text-foreground">{post.title}</span>
                      </div>
                      {post.event_location?.address && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="break-words">{post.event_location.address}</span>
                        </div>
                      )}
                      {post.event_date && (
                        <div className="text-sm text-muted-foreground">
                          {new Date(post.event_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                          {post.event_time && ` at ${post.event_time}`}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {post.category === "For Sale" && post.price && (
                  <>
                    <h4 className="font-semibold text-foreground mb-1">{post.title || "Item for Sale"}</h4>
                    <p className="text-foreground mb-2">{post.text}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-accent text-lg">₦{post.price.toLocaleString()}</span>
                    </div>
                  </>
                )}

                {post.category === "General" && <p className="text-foreground break-words">{post.text}</p>}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border flex-wrap gap-2">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
                    <Heart className="w-4 h-4 mr-1" />
                    <span className="text-sm">{post.liked_by?.length || 0}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm">{post.comment_count || 0}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-accent">
                    <Share className="w-4 h-4 mr-1" />
                    <span className="text-sm">Share</span>
                  </Button>
                </div>
                {post.category === "For Sale" && (
                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Contact Seller
                  </Button>
                )}
              </div>
            </Card>
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

