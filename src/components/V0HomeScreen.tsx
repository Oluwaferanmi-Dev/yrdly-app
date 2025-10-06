"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  Trash2,
  MoreVertical,
} from "lucide-react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useHaptics } from "@/hooks/use-haptics";
import { supabase } from "@/lib/supabase";
import type { Post as PostType } from "@/types";
import { DeleteService } from "@/lib/delete-service";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyFeed } from "@/components/EmptyFeed";
import { WelcomeBanner } from "@/components/WelcomeBanner";
import { SuggestedNeighbors } from "@/components/SuggestedNeighbors";
// Email verification banner removed - users verify during registration
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { PostCard } from "@/components/PostCard";
import { CommentSection } from "@/components/CommentSection";

interface V0HomeScreenProps {
  onViewProfile?: (user: any) => void;
}

export function V0HomeScreen({ onViewProfile }: V0HomeScreenProps) {
  const { user, profile } = useAuth();
  const { triggerHaptic } = useHaptics();
  const { toast } = useToast();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
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

  // Handle like functionality
  const handleLike = async (postId: string) => {
    if (!user) return;
    
    triggerHaptic('light');
    
    try {
      // Get current post data
      const { data: postData, error: fetchError } = await supabase
        .from('posts')
        .select('liked_by')
        .eq('id', postId)
        .single();

      if (fetchError) {
        console.error('Error fetching post:', fetchError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to like post. Please try again.",
        });
        return;
      }

      const currentLikedBy = postData.liked_by || [];
      const userHasLiked = currentLikedBy.includes(user.id);

      let newLikedBy;
      if (userHasLiked) {
        // Remove user from liked_by array
        newLikedBy = currentLikedBy.filter((id: string) => id !== user.id);
      } else {
        // Add user to liked_by array
        newLikedBy = [...currentLikedBy, user.id];
      }

      // Update the post
      const { error: updateError } = await supabase
        .from('posts')
        .update({ liked_by: newLikedBy })
        .eq('id', postId);

      if (updateError) {
        console.error('Error updating post:', updateError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to like post. Please try again.",
        });
      }
    } catch (error) {
      console.error('Error handling like:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to like post. Please try again.",
      });
    }
  };

  // Handle comment toggle
  const handleCommentToggle = (postId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedComments(newExpanded);
  };

  // Handle share functionality
  const handleShare = async (postId: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this post on Yrdly',
          text: 'Check out this post on Yrdly',
          url: window.location.origin + `/posts/${postId}`
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.origin + `/posts/${postId}`);
        toast({
          title: "Link copied",
          description: "Post link has been copied to clipboard.",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Handle delete functionality
  const handleDelete = async (postId: string) => {
    if (!user) return;

    try {
      const success = await DeleteService.deletePost(postId, user.id, {
        showToast: true,
        onSuccess: () => {
          // Remove post from local state
          setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
          toast({
            title: "Post Deleted",
            description: "Your post has been deleted successfully.",
          });
          triggerHaptic('medium');
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Delete Failed",
            description: error,
          });
        }
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "An unexpected error occurred.",
      });
    }
  };

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
            <Card key={post.id} className="p-3 sm:p-4 yrdly-shadow">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                    <AvatarImage src={post.author_image || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                      {post.author_name?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-foreground truncate cursor-pointer hover:text-primary text-sm sm:text-base">
                      {post.author_name || "Unknown User"}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {new Date(post.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  {post.category === "For Sale" && (
                    <Badge className="bg-accent text-accent-foreground text-xs">For Sale</Badge>
                  )}
                  {post.user_id === user?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-1 sm:p-2">
                          <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleDelete(post.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Post
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              <div className="mb-2 sm:mb-3">
                {(post.image_url || (post.image_urls && post.image_urls.length > 0)) && (
                  <img
                    src={post.image_url || post.image_urls?.[0] || "/placeholder.svg"}
                    alt={post.title || "Post image"}
                    className="w-full h-40 sm:h-48 object-cover rounded-lg mb-2 sm:mb-3"
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

              <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-border flex-wrap gap-2">
                <div className="flex items-center gap-2 sm:gap-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`text-muted-foreground hover:text-red-500 p-2 ${post.liked_by?.includes(user?.id || '') ? 'text-red-500' : ''}`}
                    onClick={() => handleLike(post.id)}
                  >
                    <Heart className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 ${post.liked_by?.includes(user?.id || '') ? 'fill-current' : ''}`} />
                    <span className="text-xs sm:text-sm">{post.liked_by?.length || 0}</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-primary p-2"
                    onClick={() => handleCommentToggle(post.id)}
                  >
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="text-xs sm:text-sm">{post.comment_count || 0}</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-accent p-2"
                    onClick={() => handleShare(post.id)}
                  >
                    <Share className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="text-xs sm:text-sm hidden xs:inline">Share</span>
                  </Button>
                </div>
                {post.category === "For Sale" && (
                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs sm:text-sm px-3 py-1">
                    Contact Seller
                  </Button>
                )}
              </div>
              
              {/* Comments Section */}
              {expandedComments.has(post.id) && (
                <div className="mt-4 pt-4 border-t border-border">
                  <CommentSection postId={post.id} />
                </div>
              )}
            </Card>
          ))
        ) : (
          <EmptyFeed />
        )}
      </div>

    </div>
  );
}

