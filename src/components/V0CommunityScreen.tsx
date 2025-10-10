"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Search, 
  MapPin, 
  MessageCircle, 
  Heart,
  Share,
  Calendar,
  Bell,
  TrendingUp
} from "lucide-react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Post } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { CommentSection } from "./CommentSection";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Image from "next/image";

interface V0CommunityScreenProps {
  className?: string;
}

const PostSkeleton = () => (
  <Card className="yrdly-shadow">
    <CardContent className="p-4">
      <div className="flex items-start gap-3 mb-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex items-center gap-4 pt-3 border-t border-border">
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-6 w-12" />
      </div>
    </CardContent>
  </Card>
);

export function V0CommunityScreen({ className }: V0CommunityScreenProps) {
  const { user: currentUser, profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    newPosts24h: 0
  });

  // Fetch community posts and stats from Supabase
  useEffect(() => {
    if (!currentUser) return;

    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('timestamp', { ascending: false });

        if (error) {
          console.error('Error fetching posts:', error);
          return;
        }

        setPosts(data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        // Get total users count
        const { count: totalUsers, error: usersError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        if (usersError) {
          console.error('Error fetching users count:', usersError);
        }

        // Get users active today (last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const { count: activeToday, error: activeError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('last_seen', yesterday.toISOString());

        if (activeError) {
          console.error('Error fetching active users:', activeError);
        }

        // Get posts from last 24 hours
        const { count: newPosts24h, error: postsError } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .gte('timestamp', yesterday.toISOString());

        if (postsError) {
          console.error('Error fetching new posts:', postsError);
        }

        setStats({
          totalUsers: totalUsers || 0,
          activeToday: activeToday || 0,
          newPosts24h: newPosts24h || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchPosts();
    fetchStats();

    // Set up real-time subscription for posts
    const channel = supabase
      .channel('community_posts')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'posts'
      }, (payload) => {
        console.log('Community posts realtime change received!', payload);
        fetchPosts(); // Refresh posts
        fetchStats(); // Refresh stats
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const filteredPosts = useMemo(() => {
    if (!searchQuery) return posts;
    
    return posts.filter(post => 
      post.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [posts, searchQuery]);

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      setShowUserSearch(false);
      return;
    }

    setUserSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, avatar_url, created_at')
        .ilike('name', `%${query}%`)
        .limit(10);

      if (error) throw error;
      setUsers(data || []);
      setShowUserSearch(true);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    } finally {
      setUserSearchLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      searchUsers(value);
    } else {
      setShowUserSearch(false);
      setUsers([]);
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) return;

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
      const userHasLiked = currentLikedBy.includes(currentUser.id);

      let newLikedBy;
      if (userHasLiked) {
        // Remove user from liked_by array
        newLikedBy = currentLikedBy.filter((id: string) => id !== currentUser.id);
      } else {
        // Add user to liked_by array
        newLikedBy = [...currentLikedBy, currentUser.id];
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

  const handleComment = async (postId: string) => {
    // For now, just show a toast - comment functionality would need a modal or expanded view
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

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

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={`p-4 space-y-6 ${className}`}>
      {/* Page Header */}
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Community</h2>
          <p className="text-muted-foreground">What&apos;s happening in your neighborhood</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search for neighbors..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center yrdly-shadow">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="text-lg font-bold text-foreground">{stats.totalUsers.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Neighbors</div>
        </Card>
        <Card className="p-4 text-center yrdly-shadow">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-lg font-bold text-foreground">{stats.activeToday.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Active Today</div>
        </Card>
        <Card className="p-4 text-center yrdly-shadow">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
            <Bell className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-lg font-bold text-foreground">{stats.newPosts24h.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">New Posts</div>
        </Card>
      </div>

      {/* User Search Results */}
      {showUserSearch && (
        <div className="space-y-4 mb-6">
          <h3 className="font-semibold text-foreground">Users</h3>
          {userSearchLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-2">
              {users.map((user) => (
                <Card 
                  key={user.id} 
                  className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/profile/${user.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.name?.substring(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">
                        {user.name || "Unknown User"}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">No users found</p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Community Feed</h3>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-block bg-muted p-4 rounded-full mb-4">
              <MessageCircle className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No posts match your search" : "Be the first to share something with your community"}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <Card key={post.id} className="p-4 yrdly-shadow">
              <div className="flex items-start gap-3 mb-3">
                <Avatar 
                  className="w-10 h-10 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    if (post.user_id) {
                      router.push(`/profile/${post.user_id}`);
                    }
                  }}
                >
                  <AvatarImage src={post.author_image || "/placeholder.svg"} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {post.author_name?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 
                      className="font-semibold text-foreground truncate cursor-pointer hover:underline"
                      onClick={() => {
                        if (post.user_id) {
                          router.push(`/profile/${post.user_id}`);
                        }
                      }}
                    >
                      {post.author_name || "Unknown User"}
                    </h4>
                    {post.category === "Event" && (
                      <Badge className="bg-primary text-primary-foreground flex-shrink-0">Event</Badge>
                    )}
                    {post.category === "Business" && (
                      <Badge className="bg-accent text-accent-foreground flex-shrink-0">Business</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(post.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                {/* Post Image */}
                {(post.image_url || (post.image_urls && post.image_urls.length > 0)) && (
                  <div className="mb-3">
                    <Image
                      src={post.image_url || post.image_urls?.[0] || "/placeholder.svg"}
                      alt={post.title || "Post image"}
                      width={400}
                      height={192}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                {post.title && (
                  <h3 className="font-semibold text-foreground">{post.title}</h3>
                )}
                <p className="text-muted-foreground text-sm leading-relaxed">{post.text}</p>

                {post.category === "Event" && post.event_date && (
                  <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-foreground">{post.event_date}</span>
                    </div>
                    {post.event_location?.address && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground">{post.event_location.address}</span>
                      </div>
                    )}
                  </div>
                )}

                {post.event_location?.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{post.event_location.address}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 pt-3 border-t border-border">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`text-muted-foreground hover:text-red-500 ${post.liked_by?.includes(currentUser?.id || '') ? 'text-red-500' : ''}`}
                  onClick={() => handleLike(post.id)}
                >
                  <Heart className={`w-4 h-4 mr-1 ${post.liked_by?.includes(currentUser?.id || '') ? 'fill-current' : ''}`} />
                  <span className="text-sm">{post.liked_by?.length || 0}</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => handleComment(post.id)}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm">{post.comment_count || 0}</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-accent"
                  onClick={() => handleShare(post.id)}
                >
                  <Share className="w-4 h-4 mr-1" />
                  <span className="text-sm">Share</span>
                </Button>
              </div>

              {/* Comments Section */}
              <Collapsible 
                open={expandedComments.has(post.id)}
                onOpenChange={() => handleComment(post.id)}
              >
                <CollapsibleContent>
                  <div className="pt-3 border-t border-border">
                    <CommentSection postId={post.id} />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}