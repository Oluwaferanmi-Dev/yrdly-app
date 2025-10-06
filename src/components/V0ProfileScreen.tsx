"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Star,
  Edit,
  Share,
  MessageCircle,
  Heart,
  ShoppingBag,
  Briefcase,
  CalendarDays,
} from "lucide-react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import type { User, Post } from "@/types";

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
  const [profileData, setProfileData] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    friends: 0,
    events: 0,
  });

  // Use provided user, external target user, or current user
  const targetUser = user || externalTargetUser || currentUser;
  const targetProfile = user ? null : currentProfile;
  const isExternalProfile = !!targetUserId && targetUserId !== currentUser?.id;
  
  // Determine if this is the user's own profile
  const actualIsOwnProfile = isOwnProfile !== undefined ? isOwnProfile : !isExternalProfile;

  useEffect(() => {
    if (!targetUser) return;

    const fetchProfileData = async () => {
      try {
        // Fetch user profile data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', targetUser.id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          return;
        }

        setProfileData(userData);

        // Fetch user posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', targetUser.id)
          .order('timestamp', { ascending: false })
          .limit(10);

        if (postsError) {
          console.error('Error fetching posts:', postsError);
        } else {
          setUserPosts(postsData || []);
        }

        // Calculate stats with real data
        const friendsCount = targetProfile?.friends?.length || 0;
        
        // Count events created by this user
        const { data: eventsData } = await supabase
          .from('posts')
          .select('id')
          .eq('user_id', targetUser?.id)
          .eq('category', 'Event');
        
        setStats({
          friends: friendsCount,
          events: eventsData?.length || 0,
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [targetUser]);

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
  const displayProfile = targetProfile;

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

      {/* Profile Header */}
      <Card className="p-6 yrdly-shadow">
        <div className="flex flex-col items-center text-center space-y-4">
          <Avatar className="w-24 h-24">
            <AvatarImage src={displayProfile?.avatar_url || (displayUser as any)?.avatar_url || "/placeholder.svg"} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {displayProfile?.name?.charAt(0) || (displayUser as any)?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-foreground">
              {displayProfile?.name || (displayUser as any)?.name || "Unknown User"}
            </h3>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{displayProfile?.location?.state || "Location not set"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date((displayUser as any)?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          {actualIsOwnProfile && (
            <div className="flex items-center gap-4">
              <Button 
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => router.push("/settings/profile")}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" className="border-border bg-transparent">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center yrdly-shadow">
          <div className="space-y-2">
            <Users className="w-6 h-6 mx-auto text-primary" />
            <p className="text-2xl font-bold text-foreground">{stats.friends}</p>
            <p className="text-sm text-muted-foreground">Friends</p>
          </div>
        </Card>

        <Card className="p-4 text-center yrdly-shadow">
          <div className="space-y-2">
            <Calendar className="w-6 h-6 mx-auto text-accent" />
            <p className="text-2xl font-bold text-foreground">{stats.events}</p>
            <p className="text-sm text-muted-foreground">Events</p>
          </div>
        </Card>
      </div>

      {/* About */}
      {displayProfile?.bio && (
        <Card className="p-6 yrdly-shadow">
          <h4 className="font-semibold text-foreground mb-3">About</h4>
          <p className="text-muted-foreground leading-relaxed">{displayProfile.bio}</p>
        </Card>
      )}

      {/* Interests */}
      {(displayProfile as any)?.interests && (displayProfile as any).interests.length > 0 && (
        <Card className="p-6 yrdly-shadow">
          <h4 className="font-semibold text-foreground mb-3">Interests</h4>
          <div className="flex flex-wrap gap-2">
            {(displayProfile as any).interests.map((interest: string, index: number) => (
              <Badge key={index} className="bg-primary/10 text-primary hover:bg-primary/20">
                {interest}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {isOwnProfile && (
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
            <TabsTrigger
              value="posts"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Heart className="w-4 h-4 mr-1" />
              Posts
            </TabsTrigger>
            <TabsTrigger
              value="items"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <ShoppingBag className="w-4 h-4 mr-1" />
              Items
            </TabsTrigger>
            <TabsTrigger
              value="businesses"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Briefcase className="w-4 h-4 mr-1" />
              Business
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <CalendarDays className="w-4 h-4 mr-1" />
              Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-3 mt-4">
            {userPosts.length > 0 ? (
              userPosts.map((post) => (
                <Card key={post.id} className="p-4 yrdly-shadow">
                  <p className="text-foreground mb-2">{post.text || post.title || "No content"}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {post.liked_by?.length || 0}
                    </span>
                    <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No posts yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="items" className="space-y-3 mt-4">
            <div className="text-center py-8">
              <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No items for sale yet</p>
            </div>
          </TabsContent>

          <TabsContent value="businesses" className="space-y-3 mt-4">
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No businesses yet</p>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-3 mt-4">
            <div className="text-center py-8">
              <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No events posted yet</p>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {!actualIsOwnProfile && (
        <div className="flex gap-3">
          <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
            <Users className="w-4 h-4 mr-2" />
            Add Friend
          </Button>
          <Button variant="outline" className="flex-1 border-border bg-transparent">
            <MessageCircle className="w-4 h-4 mr-2" />
            Message
          </Button>
        </div>
      )}
    </div>
  );
}

