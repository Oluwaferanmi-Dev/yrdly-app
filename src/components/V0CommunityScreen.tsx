"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  TrendingUp,
  UserPlus,
  Check,
  X
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
  const [friendshipStatus, setFriendshipStatus] = useState<Record<string, 'friends' | 'request_sent' | 'request_received' | 'none'>>({});
  const [pendingFriendRequests, setPendingFriendRequests] = useState<any[]>([]);
  const [friendRequestsLoading, setFriendRequestsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    newPosts24h: 0
  });
  const searchRef = useRef<HTMLDivElement>(null);

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

        // Get users active today (users who posted or commented in last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Get unique users who posted in last 24 hours
        const { data: activePosters, error: postersError } = await supabase
          .from('posts')
          .select('user_id')
          .gte('timestamp', yesterday.toISOString());
        
        // Get unique users who commented in last 24 hours
        const { data: activeCommenters, error: commentersError } = await supabase
          .from('comments')
          .select('user_id')
          .gte('timestamp', yesterday.toISOString());
        
        // Combine and count unique active users
        const activeUserIds = new Set([
          ...(activePosters?.map(p => p.user_id) || []),
          ...(activeCommenters?.map(c => c.user_id) || [])
        ]);
        
        const activeToday = activeUserIds.size;

        if (postersError || commentersError) {
          console.error('Error fetching active users:', postersError || commentersError);
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
        fetchPosts(); // Refresh posts
        fetchStats(); // Refresh stats
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowUserSearch(false);
        setUsers([]);
      }
    };

    if (showUserSearch) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserSearch]);

  // Fetch pending friend requests
  useEffect(() => {
    if (!currentUser) return;

    const fetchPendingFriendRequests = async () => {
      try {
        setFriendRequestsLoading(true);
        
        // Get friend requests where current user is the recipient
        const { data: requests, error } = await supabase
          .from('friend_requests')
          .select(`
            id,
            from_user_id,
            created_at,
            users!friend_requests_from_user_id_fkey (
              id,
              name,
              avatar_url,
              bio,
              location
            )
          `)
          .eq('to_user_id', currentUser.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching friend requests:', error);
          return;
        }

        setPendingFriendRequests(requests || []);
      } catch (error) {
        console.error('Error fetching friend requests:', error);
      } finally {
        setFriendRequestsLoading(false);
      }
    };

    fetchPendingFriendRequests();
  }, [currentUser]);

  const filteredPosts = useMemo(() => {
    if (!searchQuery) return posts;
    
    return posts.filter(post => 
      post.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [posts, searchQuery]);

  const checkFriendshipStatus = async (userId: string): Promise<'friends' | 'request_sent' | 'request_received' | 'none'> => {
    if (!currentUser || !profile) return 'none';
    
    // Check if they're already friends
    if (profile.friends?.includes(userId)) {
      return 'friends';
    }
    
    // Check for pending friend requests
    const { data: requests, error } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(from_user_id.eq.${currentUser.id},to_user_id.eq.${userId}),and(from_user_id.eq.${userId},to_user_id.eq.${currentUser.id})`)
      .eq('status', 'pending');
    
    if (error) {
      console.error('Error checking friendship status:', error);
      return 'none';
    }
    
    if (requests && requests.length > 0) {
      const request = requests[0];
      return request.from_user_id === currentUser.id ? 'request_sent' : 'request_received';
    }
    
    return 'none';
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      setShowUserSearch(false);
      setFriendshipStatus({});
      return;
    }

    setUserSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, avatar_url, created_at')
        .ilike('name', `%${query}%`)
        .neq('id', currentUser?.id) // Exclude current user from search results
        .limit(10);

      if (error) throw error;
      
      const usersData = data || [];
      setUsers(usersData);
      setShowUserSearch(true);
      
      // Check friendship status for each user
      const statusPromises = usersData.map(async (user) => {
        const status = await checkFriendshipStatus(user.id);
        return { userId: user.id, status };
      });
      
      const statusResults = await Promise.all(statusPromises);
      const statusMap = statusResults.reduce((acc, { userId, status }) => {
        acc[userId] = status;
        return acc;
      }, {} as Record<string, 'friends' | 'request_sent' | 'request_received' | 'none'>);
      
      setFriendshipStatus(statusMap);
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
      setFriendshipStatus({});
    }
  };

  const handleFriendAction = async (userId: string, action: 'add' | 'remove' | 'accept' | 'decline') => {
    if (!currentUser) return;
    
    try {
      if (action === 'add') {
        // Send friend request
        const { error } = await supabase
          .from('friend_requests')
          .insert({
            from_user_id: currentUser.id,
            to_user_id: userId,
            status: 'pending',
            created_at: new Date().toISOString(),
          });
        
        if (error) throw error;
        
        // Update friendship status
        setFriendshipStatus(prev => ({ ...prev, [userId]: 'request_sent' }));
        
        // Trigger notification for friend request
        try {
          const { NotificationTriggers } = await import('@/lib/notification-triggers');
          await NotificationTriggers.onFriendRequestSent(currentUser.id, userId);
        } catch (error) {
          console.error('Error creating friend request notification:', error);
        }
        
        toast({
          title: "Friend Request Sent",
          description: "Your friend request has been sent.",
        });
      } else if (action === 'remove') {
        // Remove friend
        const { data: currentUserData } = await supabase
          .from('users')
          .select('friends')
          .eq('id', currentUser.id)
          .single();

        const updatedFriends = currentUserData?.friends?.filter((id: string) => id !== userId) || [];

        await supabase
          .from('users')
          .update({ friends: updatedFriends })
          .eq('id', currentUser.id);

        // Also remove from target user's friends list
        const { data: targetUserData } = await supabase
          .from('users')
          .select('friends')
          .eq('id', userId)
          .single();

        const targetUpdatedFriends = targetUserData?.friends?.filter((id: string) => id !== currentUser.id) || [];

        await supabase
          .from('users')
          .update({ friends: targetUpdatedFriends })
          .eq('id', userId);
        
        // Update friendship status
        setFriendshipStatus(prev => ({ ...prev, [userId]: 'none' }));
        
        toast({
          title: "Friend Removed",
          description: "You are no longer friends with this user.",
        });
      } else if (action === 'accept') {
        // Accept friend request
        const { data: requestData, error: requestError } = await supabase
          .from('friend_requests')
          .select('*')
          .eq('from_user_id', userId)
          .eq('to_user_id', currentUser.id)
          .eq('status', 'pending')
          .single();

        if (requestError || !requestData) {
          toast({ variant: "destructive", title: "Error", description: "Friend request not found." });
          return;
        }

        // Update friend request status to accepted
        const { error: updateError } = await supabase
          .from('friend_requests')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', requestData.id);

        if (updateError) throw updateError;

        // Add to both users' friends lists
        const { data: currentUserData } = await supabase
          .from('users')
          .select('friends')
          .eq('id', currentUser.id)
          .single();

        const { data: senderUserData } = await supabase
          .from('users')
          .select('friends')
          .eq('id', userId)
          .single();

        const currentUserFriends = currentUserData?.friends || [];
        const senderUserFriends = senderUserData?.friends || [];

        // Add sender to current user's friends list
        const updatedCurrentUserFriends = [...currentUserFriends, userId];
        await supabase
          .from('users')
          .update({ friends: updatedCurrentUserFriends })
          .eq('id', currentUser.id);

        // Add current user to sender's friends list
        const updatedSenderFriends = [...senderUserFriends, currentUser.id];
        await supabase
          .from('users')
          .update({ friends: updatedSenderFriends })
          .eq('id', userId);

        // Create notification for the sender
        try {
          const { NotificationTriggers } = await import('@/lib/notification-triggers');
          await NotificationTriggers.onFriendRequestAccepted(userId, currentUser.id);
        } catch (error) {
          console.error('Error creating friend request accepted notification:', error);
        }

        // Update friendship status
        setFriendshipStatus(prev => ({ ...prev, [userId]: 'friends' }));

        toast({
          title: "Friend Request Accepted",
          description: "You are now friends with this user.",
        });
      } else if (action === 'decline') {
        // Decline friend request
        const { error } = await supabase
          .from('friend_requests')
          .delete()
          .eq('from_user_id', userId)
          .eq('to_user_id', currentUser.id)
          .eq('status', 'pending');

        if (error) throw error;

        // Update friendship status
        setFriendshipStatus(prev => ({ ...prev, [userId]: 'none' }));

        toast({
          title: "Friend Request Declined",
          description: "Friend request has been declined.",
        });
      }
    } catch (error) {
      console.error('Error handling friend action:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process friend request. Please try again.",
      });
    }
  };

  const handleFriendRequestAction = async (requestId: string, fromUserId: string, action: 'accept' | 'decline') => {
    if (!currentUser) return;

    try {
      if (action === 'accept') {
        // Accept friend request
        const { error: updateError } = await supabase
          .from('friend_requests')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', requestId);

        if (updateError) throw updateError;

        // Update friends lists
        const { data: currentUserData } = await supabase
          .from('users')
          .select('friends')
          .eq('id', currentUser.id)
          .single();

        const { data: senderUserData } = await supabase
          .from('users')
          .select('friends')
          .eq('id', fromUserId)
          .single();

        const currentUserFriends = currentUserData?.friends || [];
        const senderUserFriends = senderUserData?.friends || [];

        const updatedCurrentUserFriends = [...currentUserFriends, fromUserId];
        await supabase
          .from('users')
          .update({ friends: updatedCurrentUserFriends })
          .eq('id', currentUser.id);

        const updatedSenderFriends = [...senderUserFriends, currentUser.id];
        await supabase
          .from('users')
          .update({ friends: updatedSenderFriends })
          .eq('id', fromUserId);

        // Create notification for the sender
        try {
          const { NotificationTriggers } = await import('@/lib/notification-triggers');
          await NotificationTriggers.onFriendRequestAccepted(fromUserId, currentUser.id);
        } catch (error) {
          console.error('Error creating friend request accepted notification:', error);
        }

        toast({
          title: "Friend Request Accepted",
          description: "You are now friends with this user.",
        });
      } else if (action === 'decline') {
        // Decline friend request
        const { error } = await supabase
          .from('friend_requests')
          .delete()
          .eq('id', requestId);

        if (error) throw error;

        toast({
          title: "Friend Request Declined",
          description: "Friend request has been declined.",
        });
      }

      // Remove the request from the pending list
      setPendingFriendRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error handling friend request action:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process friend request. Please try again.",
      });
    }
  };

  const handleMessageUser = async (userId: string) => {
    if (!currentUser) return;

    try {
      // Check if conversation already exists
      const sortedParticipantIds = [currentUser.id, userId].sort();
      const { data: existingConversations, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .contains('participant_ids', sortedParticipantIds)
        .eq('type', 'friend');

      if (fetchError) throw fetchError;

      let conversationId: string;

      if (existingConversations && existingConversations.length > 0) {
        conversationId = existingConversations[0].id;
      } else {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            participant_ids: sortedParticipantIds,
            type: 'friend',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (createError) throw createError;
        conversationId = newConv.id;
      }

      router.push(`/messages/${conversationId}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not open conversation. Please try again.",
      });
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

      {/* Pending Friend Requests */}
      {pendingFriendRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Friend Requests ({pendingFriendRequests.length})
          </h3>
          <div className="space-y-2">
            {pendingFriendRequests.map((request) => {
              const sender = request.users;
              return (
                <Card key={request.id} className="p-4 yrdly-shadow">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={sender?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {sender?.name?.substring(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">
                        {sender?.name || "Unknown User"}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {sender?.bio || "No bio available"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFriendRequestAction(request.id, request.from_user_id, 'accept')}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFriendRequestAction(request.id, request.from_user_id, 'decline')}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* User Search Results */}
      {showUserSearch && (
        <div ref={searchRef} className="space-y-4 mb-6">
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
              {users.map((user) => {
                const status = friendshipStatus[user.id] || 'none';
                return (
                  <Card 
                    key={user.id} 
                    className="p-3 hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/profile/${user.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => router.push(`/profile/${user.id}`)}
                      >
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
                      </div>
                      <div className="flex items-center gap-2">
                        {status === 'request_received' ? (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFriendAction(user.id, 'accept');
                              }}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFriendAction(user.id, 'decline');
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (status === 'friends') {
                                handleMessageUser(user.id);
                              } else if (status === 'none') {
                                handleFriendAction(user.id, 'add');
                              } else if (status === 'request_sent') {
                                // Could add cancel request functionality here
                                toast({
                                  title: "Friend Request Pending",
                                  description: "You have already sent a friend request to this user.",
                                });
                              }
                            }}
                          >
                            {status === 'friends' ? (
                              <MessageCircle className="w-4 h-4" />
                            ) : status === 'request_sent' ? (
                              <UserPlus className="w-4 h-4 opacity-50" />
                            ) : (
                              <UserPlus className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
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
                      style={{ height: "auto" }}
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
                    <CommentSection 
                        postId={post.id} 
                        onClose={() => setExpandedComments(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(post.id);
                            return newSet;
                        })}
                    />
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