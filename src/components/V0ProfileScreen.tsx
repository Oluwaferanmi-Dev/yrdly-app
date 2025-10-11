"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Star,
  Share,
  MessageCircle,
  Heart,
  ShoppingBag,
  Briefcase,
  CalendarDays,
  Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import type { User, Post } from "@/types";
import { FriendsList } from "./FriendsList";
import { useToast } from "@/hooks/use-toast";
import { shortenAddress } from "@/lib/utils";
import Image from "next/image";

interface V0ProfileScreenProps {
  onBack?: () => void;
  user?: User;
  isOwnProfile?: boolean;
  targetUserId?: string;
  targetUser?: any;
}

export function V0ProfileScreen({ onBack, user, isOwnProfile = true, targetUserId, targetUser: externalTargetUser }: V0ProfileScreenProps) {
  const router = useRouter();
  const { user: currentUser, profile: currentProfile } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userItems, setUserItems] = useState<any[]>([]);
  const [userBusinesses, setUserBusinesses] = useState<any[]>([]);
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [isFriendRequestSent, setIsFriendRequestSent] = useState(false);
  const [stats, setStats] = useState({
    friends: 0,
    events: 0,
  });

  // Use provided user, external target user, or current user
  const targetUser = externalTargetUser || user || currentUser;
  const targetProfile = externalTargetUser ? null : (user ? null : currentProfile);
  const isExternalProfile = !!targetUserId && targetUserId !== currentUser?.id;
  
  // Determine if this is the user's own profile
  const actualIsOwnProfile = isOwnProfile !== undefined ? isOwnProfile : !isExternalProfile;

  useEffect(() => {
    if (!targetUser) return;

    const fetchProfileData = async () => {
      try {
        // Fetch user profile data including friends
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*, friends')
          .eq('id', targetUser.id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          return;
        }

        setProfileData(userData);

        // Fetch user posts (only General category posts, not items or events)
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', targetUser.id)
          .eq('category', 'General')
          .order('timestamp', { ascending: false })
          .limit(10);

        if (postsError) {
          console.error('Error fetching posts:', postsError);
        } else {
          setUserPosts(postsData || []);
        }

        // Fetch user items (marketplace items)
        const { data: itemsData, error: itemsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', targetUser.id)
          .eq('category', 'For Sale')
          .order('timestamp', { ascending: false })
          .limit(10);

        if (itemsError) {
          console.error('Error fetching items:', itemsError);
        } else {
          setUserItems(itemsData || []);
        }

        // Fetch user businesses
        const { data: businessesData, error: businessesError } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', targetUser.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (businessesError) {
          console.error('Error fetching businesses:', businessesError);
        } else {
          setUserBusinesses(businessesData || []);
        }

        // Fetch user events
        const { data: eventsData, error: eventsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', targetUser.id)
          .eq('category', 'Event')
          .order('timestamp', { ascending: false })
          .limit(10);

        if (eventsError) {
          console.error('Error fetching events:', eventsError);
        } else {
          setUserEvents(eventsData || []);
        }

        // Calculate stats with real data
        const friendsCount = userData?.friends?.length || 0;
        console.log('👥 Profile friends data:', {
          userId: targetUser?.id,
          friends: userData?.friends,
          friendsCount: friendsCount
        });
        
        // Count events created by this user
        const { data: eventsCountData } = await supabase
          .from('posts')
          .select('id')
          .eq('user_id', targetUser?.id)
          .eq('category', 'Event');
        
        setStats({
          friends: friendsCount,
          events: eventsCountData?.length || 0,
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [targetUser, targetProfile]);

  // Real-time subscription for user data updates (including friends list)
  useEffect(() => {
    if (!targetUser) return;

    console.log('🔄 Setting up real-time subscription for user:', targetUser.id);
    
    const channel = supabase
      .channel(`user_${targetUser.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${targetUser.id}`
      }, (payload) => {
        console.log('🔄 User data updated via real-time:', payload);
        // Refresh the profile data when user data changes
        const refreshData = async () => {
          try {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', targetUser.id)
              .single();

            if (userData) {
              console.log('🔄 Refreshed user data:', userData);
              const friendsCount = userData?.friends?.length || 0;
              setStats(prev => ({
                ...prev,
                friends: friendsCount
              }));
            }
          } catch (error) {
            console.error('Error refreshing user data:', error);
          }
        };
        refreshData();
      })
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [targetUser]);

  // Refresh data when user returns to the page (e.g., after editing profile)
  useEffect(() => {
    const handleFocus = () => {
      if (targetUser && !loading) {
        // Refresh profile data when user returns to the page
        const refreshData = async () => {
          try {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', targetUser.id)
              .single();
            
            if (userData) {
              setProfileData(userData);
            }
          } catch (error) {
            console.error('Error refreshing profile data:', error);
          }
        };
        
        refreshData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [targetUser, loading]);

  // Check if users are friends
  useEffect(() => {
    if (!currentUser || !targetUser || actualIsOwnProfile) return;

    const checkFriendship = async () => {
      try {
        const { data: currentUserData } = await supabase
          .from('users')
          .select('friends')
          .eq('id', currentUser.id)
          .single();

        const isAlreadyFriend = currentUserData?.friends?.includes(targetUser.id) || false;
        setIsFriend(isAlreadyFriend);

        // Check if friend request was already sent
        const { data: friendRequest } = await supabase
          .from('friend_requests')
          .select('id, status')
          .or(`and(from_user_id.eq.${currentUser.id},to_user_id.eq.${targetUser.id}),and(from_user_id.eq.${targetUser.id},to_user_id.eq.${currentUser.id})`)
          .single();

        setIsFriendRequestSent(!!friendRequest && friendRequest.status === 'pending');
      } catch (error) {
        console.error('Error checking friendship:', error);
      }
    };

    checkFriendship();
  }, [currentUser, targetUser, actualIsOwnProfile]);

  const handleAddFriend = async () => {
    if (!currentUser || !targetUser) return;

    try {
      if (isFriend) {
        // Remove friend
        const { data: currentUserData } = await supabase
          .from('users')
          .select('friends')
          .eq('id', currentUser.id)
          .single();

        const updatedFriends = currentUserData?.friends?.filter((id: string) => id !== targetUser.id) || [];

        await supabase
          .from('users')
          .update({ friends: updatedFriends })
          .eq('id', currentUser.id);

        // Also remove from target user's friends list
        const { data: targetUserData } = await supabase
          .from('users')
          .select('friends')
          .eq('id', targetUser.id)
          .single();

        const targetUpdatedFriends = targetUserData?.friends?.filter((id: string) => id !== currentUser.id) || [];

        await supabase
          .from('users')
          .update({ friends: targetUpdatedFriends })
          .eq('id', targetUser.id);

        setIsFriend(false);
        toast({
          title: "Friend Removed",
          description: `You are no longer friends with ${targetUser.name || 'this user'}.`,
        });
      } else if (isFriendRequestSent) {
        // Cancel friend request
        await supabase
          .from('friend_requests')
          .delete()
          .eq('from_user_id', currentUser.id)
          .eq('to_user_id', targetUser.id);

        setIsFriendRequestSent(false);
        toast({
          title: "Friend Request Cancelled",
          description: "Friend request has been cancelled.",
        });
      } else {
        // Send friend request
        await supabase
          .from('friend_requests')
          .insert({
            from_user_id: currentUser.id,
            to_user_id: targetUser.id,
            status: 'pending',
            created_at: new Date().toISOString(),
          });

        setIsFriendRequestSent(true);
        toast({
          title: "Friend Request Sent",
          description: `Friend request sent to ${targetUser.name || 'this user'}.`,
        });
        
        // Trigger notification for friend request
        try {
          const { NotificationTriggers } = await import('@/lib/notification-triggers');
          await NotificationTriggers.onFriendRequestSent(currentUser.id, targetUser.id);
        } catch (error) {
          console.error('Error creating friend request notification:', error);
        }
      }
    } catch (error) {
      console.error('Error handling friend request:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process friend request. Please try again.",
      });
    }
  };

  const handleMessageUser = async () => {
    if (!currentUser || !targetUser) return;

    try {
      // Check if conversation already exists
      const sortedParticipantIds = [currentUser.id, targetUser.id].sort();
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

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Card className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4 text-center">
              <Skeleton className="h-6 w-6 mx-auto mb-2" />
              <Skeleton className="h-8 w-12 mx-auto mb-1" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const displayUser = profileData || targetUser;
  const displayProfile = isExternalProfile ? profileData : targetProfile;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="p-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <h2 className="text-2xl font-bold text-foreground">Profile</h2>
      </div>

      {/* Profile Header - Modern Card Design */}
      <Card className="relative overflow-hidden yrdly-shadow">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        <div className="absolute inset-0 bg-slate-800/20"></div>
        
        <div className="relative p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Avatar with enhanced styling */}
            <div className="relative">
              <Avatar className="w-32 h-32 ring-4 ring-white/20 ring-offset-4 ring-offset-slate-900">
                <AvatarImage 
                  src={(displayProfile as any)?.avatarUrl || (displayProfile as any)?.avatar_url || (displayUser as any)?.avatarUrl || (displayUser as any)?.avatar_url || "/placeholder.svg"} 
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-bold">
                  {displayProfile?.name?.charAt(0) || (displayUser as any)?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator for friends */}
              {actualIsOwnProfile && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-slate-900 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="space-y-3">
              <h3 className="text-3xl font-bold text-white">
                {displayProfile?.name || (displayUser as any)?.name || "Unknown User"}
              </h3>
              
              {/* Bio/Tagline */}
              {displayProfile?.bio && (
                <p className="text-slate-300 text-lg max-w-md">
                  {displayProfile.bio}
                </p>
              )}
              
              {/* Location and Join Date */}
              <div className="flex flex-col sm:flex-row items-center gap-4 text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {displayProfile?.location?.state && displayProfile?.location?.lga 
                      ? `${displayProfile.location.state}, ${displayProfile.location.lga}`
                      : displayProfile?.location?.state || "Location not set"
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date((displayUser as any)?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons for Other Users */}
            {!actualIsOwnProfile && (
              <div className="flex items-center gap-4 px-4 py-2">
                <Button 
                  className={`flex-1 ${isFriend ? "bg-red-500 hover:bg-red-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"} px-6 py-2`}
                  onClick={handleAddFriend}
                >
                  <Users className="w-4 h-4 mr-2" />
                  {isFriend ? "Remove Friend" : isFriendRequestSent ? "Request Sent" : "Add Friend"}
                </Button>
                {isFriend && (
                  <Button 
                    variant="outline" 
                    className="flex-1 border-white/30 bg-white/10 text-white hover:bg-white/20 px-6 py-2"
                    onClick={handleMessageUser}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Stats - Modern Design */}
      <div className="grid grid-cols-2 gap-6">
        <Card 
          className="p-6 text-center yrdly-shadow cursor-pointer hover:bg-muted/50 transition-all duration-200 hover:scale-105"
          onClick={() => setShowFriendsList(true)}
        >
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.friends}</p>
            <p className="text-sm font-medium text-muted-foreground">Friends</p>
          </div>
        </Card>

        <Card className="p-6 text-center yrdly-shadow">
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.events}</p>
            <p className="text-sm font-medium text-muted-foreground">Events</p>
          </div>
        </Card>
      </div>

      {/* Interests Section */}
      {displayProfile?.interests && displayProfile.interests.length > 0 && (
        <Card className="p-6 yrdly-shadow">
          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Interests
          </h4>
          <div className="flex flex-wrap gap-2">
            {displayProfile.interests.map((interest: string, index: number) => (
              <Badge 
                key={index} 
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 px-3 py-1"
              >
                {interest}
              </Badge>
            ))}
          </div>
        </Card>
      )}


      {/* Public Posts for External Profiles */}
      {!actualIsOwnProfile && userPosts.length > 0 && (
        <Card className="p-6 yrdly-shadow">
          <h4 className="font-semibold text-foreground mb-4">Recent Posts</h4>
          <div className="space-y-4">
            {userPosts.slice(0, 3).map((post) => (
              <div key={post.id} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                <p className="text-foreground mb-2">{post.text || post.title || "No content"}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {post.liked_by?.length || 0}
                  </span>
                  <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}


      {actualIsOwnProfile && (
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-background border border-border rounded-xl p-0.5 gap-0.1">
            <TabsTrigger
              value="posts"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-muted/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-sm"
            >
              <Heart className="w-4 h-4" />
              <span className="font-medium">Posts</span>
              <span className="text-xs opacity-70">({userPosts.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="items"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-muted/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="font-medium">Items</span>
              <span className="text-xs opacity-70">({userItems.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="businesses"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-muted/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-sm"
            >
              <Briefcase className="w-4 h-4" />
              <span className="font-medium">Business</span>
              <span className="text-xs opacity-70">({userBusinesses.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-muted/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-sm"
            >
              <CalendarDays className="w-4 h-4" />
              <span className="font-medium">Events</span>
              <span className="text-xs opacity-70">({userEvents.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            {userPosts.length > 0 ? (
              <div className="grid gap-4">
                {userPosts.map((post) => (
                  <Card key={post.id} className="p-5 yrdly-shadow hover:shadow-lg transition-shadow duration-200">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground text-base mb-2 line-clamp-2">
                            {post.text || post.title || "No content"}
                          </h4>
                          {post.image_url && (
                            <div className="mt-3 rounded-lg overflow-hidden">
                              <Image
                                src={post.image_url} 
                                alt={post.text || post.title || "Post image"}
                                width={400}
                                height={200}
                                className="w-full h-48 object-cover"
                                style={{ height: "auto" }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span className="font-medium">{post.liked_by?.length || 0}</span>
                          </span>
                          <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50">
                            <MessageCircle className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">{post.comment_count || 0}</span>
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.timestamp).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 yrdly-shadow">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-muted/30 rounded-full flex items-center justify-center">
                    <Heart className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">No posts yet</h3>
                    <p className="text-sm text-muted-foreground">Share your thoughts and experiences with the community</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push('/home')}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Create your first post
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="items" className="mt-6">
            {userItems.length > 0 ? (
              <div className="grid gap-4">
                {userItems.map((item) => (
                  <Card key={item.id} className="p-5 yrdly-shadow hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-start gap-4">
                      {item.image_urls && item.image_urls.length > 0 ? (
                        <div className="relative">
                          <Image 
                            src={item.image_urls[0]} 
                            alt={item.text || item.title}
                            width={80}
                            height={80}
                            className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                          />
                          <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1">
                            For Sale
                          </Badge>
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-muted/30 rounded-xl flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-foreground text-base line-clamp-1">
                            {item.text || item.title || "Untitled Item"}
                          </h4>
                          {item.price && (
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">₦{item.price.toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.description || "No description available"}
                        </p>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {item.category || 'General'}
                            </Badge>
                            {item.condition && (
                              <Badge variant="secondary" className="text-xs">
                                {item.condition}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.timestamp).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 yrdly-shadow">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-muted/30 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">No items for sale yet</h3>
                    <p className="text-sm text-muted-foreground">Start selling items in your neighborhood</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push('/marketplace')}
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    List your first item
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="businesses" className="mt-6">
            {userBusinesses.length > 0 ? (
              <div className="grid gap-4">
                {userBusinesses.map((business) => (
                  <Card key={business.id} className="p-5 yrdly-shadow hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-start gap-4">
                      {business.image_urls && business.image_urls.length > 0 ? (
                        <div className="relative">
                          <Image 
                            src={business.image_urls[0]} 
                            alt={business.name}
                            width={80}
                            height={80}
                            className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                          />
                          <Badge className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1">
                            Business
                          </Badge>
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-muted/30 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-foreground text-base line-clamp-1">
                            {business.name}
                          </h4>
                          {business.rating && (
                            <div className="flex items-center gap-1 text-sm">
                              <span className="text-yellow-500">★</span>
                              <span className="font-medium">{business.rating}</span>
                              <span className="text-muted-foreground">({business.review_count || 0})</span>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {business.description || "No description available"}
                        </p>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {business.category || 'General'}
                            </Badge>
                            {business.location && (
                              <Badge variant="secondary" className="text-xs" title={typeof business.location === 'string' ? business.location : business.location?.address || 'Location not specified'}>
                                📍 {typeof business.location === 'string' 
                                  ? shortenAddress(business.location, 30)
                                  : shortenAddress(business.location?.address || 'Location not specified', 30)
                                }
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(business.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 yrdly-shadow">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-muted/30 rounded-full flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">No businesses yet</h3>
                    <p className="text-sm text-muted-foreground">Create a business profile to reach more customers</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push('/businesses')}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Create your business
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            {userEvents.length > 0 ? (
              <div className="grid gap-4">
                {userEvents.map((event) => (
                  <Card key={event.id} className="p-5 yrdly-shadow hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-start gap-4">
                      {event.image_urls && event.image_urls.length > 0 ? (
                        <div className="relative">
                          <Image 
                            src={event.image_urls[0]} 
                            alt={event.text || event.title}
                            width={80}
                            height={80}
                            className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                          />
                          <Badge className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1">
                            Event
                          </Badge>
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-muted/30 rounded-xl flex items-center justify-center flex-shrink-0">
                          <CalendarDays className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-foreground text-base line-clamp-1">
                            {event.text || event.title || "Untitled Event"}
                          </h4>
                          {event.event_date && (
                            <div className="text-right">
                              <p className="text-sm font-medium text-primary">
                                {new Date(event.event_date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {event.description || "No description available"}
                        </p>
                        
                        <div className="space-y-1">
                          {event.event_date && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(event.event_date).toLocaleDateString('en-US', { 
                                weekday: 'long',
                                month: 'long', 
                                day: 'numeric',
                                year: 'numeric'
                              })}</span>
                            </div>
                          )}
                          {event.event_time && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{event.event_time}</span>
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span className="line-clamp-1">
                                {typeof event.location === 'string' 
                                  ? event.location 
                                  : event.location?.address || 'Location not specified'
                                }
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {event.category || 'General'}
                            </Badge>
                            {event.attendees && event.attendees.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                👥 {event.attendees.length} attending
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Posted {new Date(event.timestamp).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 yrdly-shadow">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-muted/30 rounded-full flex items-center justify-center">
                    <CalendarDays className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">No events posted yet</h3>
                    <p className="text-sm text-muted-foreground">Create events to bring your community together</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push('/events')}
                  >
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Create your first event
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}


      {/* Friends List Modal */}
      {showFriendsList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
            <CardContent className="p-0">
              <FriendsList 
                userId={targetUser?.id || ''} 
                onBack={() => setShowFriendsList(false)} 
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

