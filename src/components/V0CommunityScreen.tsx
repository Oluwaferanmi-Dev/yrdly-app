"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Search, 
  MapPin, 
  MessageCircle, 
  UserPlus, 
  Check, 
  X,
  UserMinus,
  ShieldBan
} from "lucide-react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { supabase } from "@/lib/supabase";
import type { User, FriendRequest } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { allStates, lgasByState } from "@/lib/geo-data";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { OnlineStatusService } from "@/lib/online-status";
import { AvatarOnlineIndicator } from "@/components/ui/online-indicator";
import { cn } from "@/lib/utils";

interface V0CommunityScreenProps {
  className?: string;
}

const NeighborSkeleton = () => (
  <Card className="yrdly-shadow">
    <CardContent className="p-4 flex items-center gap-4">
      <Skeleton className="h-16 w-16 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-10 w-28" />
    </CardContent>
  </Card>
);

type FriendshipStatus = 'friends' | 'request_sent' | 'request_received' | 'none';

export function V0CommunityScreen({ className }: V0CommunityScreenProps) {
  const { user: currentUser, profile } = useAuth();
  const { toast } = useToast();
  const [allNeighbors, setAllNeighbors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ state: "all", lga: "all" });
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [onlineStatuses, setOnlineStatuses] = useState<{ [userId: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize online status tracking for current user
  useEffect(() => {
    if (currentUser?.id) {
      OnlineStatusService.getInstance().initialize(currentUser.id);
      
      return () => {
        OnlineStatusService.getInstance().cleanup();
      };
    }
  }, [currentUser?.id]);

  // Track online status of friends
  useEffect(() => {
    if (!currentUser?.id) return;

    const friends = allNeighbors.filter(neighbor => 
      neighbor.friends?.includes(currentUser.id) || 
      profile?.friends?.includes(neighbor.id)
    );

    const unsubscribeFunctions: (() => void)[] = [];

    friends.forEach(friend => {
      const unsubscribe = OnlineStatusService.getInstance().listenToUserOnlineStatus(friend.id, (status) => {
        setOnlineStatuses(prev => ({
          ...prev,
          [friend.id]: status.isOnline
        }));
      });
      unsubscribeFunctions.push(unsubscribe);
    });

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [currentUser?.id, allNeighbors, profile?.friends]);

  const loadUsers = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .neq('id', currentUser.id);

      if (usersError) {
        console.error('Error loading users:', usersError);
        return;
      }

      const users = (usersData || []).map(user => ({
        id: user.id,
        uid: user.id,
        name: user.name,
        avatarUrl: user.avatar_url || 'https://placehold.co/100x100.png',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || { state: '', lga: '' },
        friends: user.friends || [],
        blockedUsers: user.blocked_users || [],
        notificationSettings: user.notification_settings || {},
        isOnline: user.is_online || false,
        lastSeen: user.last_seen || null,
        timestamp: user.created_at || null,
      } as User));

      setAllNeighbors(users);
      setLoading(false);
    } catch (error) {
      console.error('Error loading users:', error);
      setLoading(false);
    }
  }, [currentUser]);

  const loadFriendRequests = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      const { data: requestsData, error: requestsError } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`from_user_id.eq.${currentUser.id},to_user_id.eq.${currentUser.id}`);

      if (requestsError) {
        console.error('Error loading friend requests:', requestsError);
        return;
      }

      const requests = (requestsData || []).map(req => ({
        id: req.id,
        fromUserId: req.from_user_id,
        toUserId: req.to_user_id,
        participantIds: req.participant_ids,
        status: req.status,
        timestamp: req.created_at || null,
      } as FriendRequest));

      setFriendRequests(requests);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    loadUsers();
    loadFriendRequests();

    // Set up real-time subscriptions
    const usersChannel = supabase
      .channel('users')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'users',
        filter: `id=neq.${currentUser.id}`
      }, () => {
        loadUsers();
      })
      .subscribe();

    const requestsChannel = supabase
      .channel('friend_requests')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'friend_requests',
        filter: `or(from_user_id.eq.${currentUser.id},to_user_id.eq.${currentUser.id})`
      }, () => {
        loadFriendRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(requestsChannel);
    };
  }, [currentUser, loadUsers, loadFriendRequests]);

  const handleFilterChange = (type: "state" | "lga", value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [type]: value };
      if (type === "state") newFilters.lga = "all";
      return newFilters;
    });
  };

  const getFriendshipStatus = useCallback((neighborId: string): FriendshipStatus => {
    if (profile?.friends?.includes(neighborId)) return "friends";

    const request = friendRequests.find(req =>
      req.status === 'pending' &&
      ((req.fromUserId === currentUser?.id && req.toUserId === neighborId) ||
       (req.fromUserId === neighborId && req.toUserId === currentUser?.id))
    );

    if (request) {
      return request.fromUserId === currentUser?.id ? 'request_sent' : 'request_received';
    }

    return "none";
  }, [profile, friendRequests, currentUser]);

  const filteredAndSortedNeighbors = useMemo(() => {
    if (!currentUser) return [];
    
    const blockedByMe = profile?.blocked_users || [];
    const filtered = allNeighbors.filter((neighbor) => {
      // Basic filters
      if (neighbor.id === currentUser.id) return false;
      if (blockedByMe.includes(neighbor.id)) return false;
      if (neighbor.blockedUsers?.includes(currentUser.id)) return false;

      // Location filters
      const stateMatch = filters.state === "all" || neighbor.location?.state === filters.state;
      const lgaMatch = filters.lga === "all" || neighbor.location?.lga === filters.lga;

      // Search filter
      const searchMatch = searchQuery === "" || 
        neighbor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        neighbor.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        neighbor.location?.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        neighbor.location?.lga?.toLowerCase().includes(searchQuery.toLowerCase());

      return stateMatch && lgaMatch && searchMatch;
    });
    
    return filtered;
  }, [allNeighbors, filters, profile, currentUser, searchQuery]);

  const handleAddFriend = async (e: React.MouseEvent, neighbor: User) => {
    e.stopPropagation();
    if (!currentUser) return;
    try {
      const { error: requestError } = await supabase
        .from('friend_requests')
        .insert({
          from_user_id: currentUser.id,
          to_user_id: neighbor.id,
          participant_ids: [currentUser.id, neighbor.id].sort(),
          status: "pending",
          created_at: new Date().toISOString(),
        });

      if (requestError) {
        console.error("Error sending friend request:", requestError);
        toast({ variant: "destructive", title: "Error", description: "Could not send friend request." });
        return;
      }

      toast({ title: "Friend request sent!" });
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not send friend request." });
    }
  };

  const handleAcceptRequest = async (e: React.MouseEvent, request: FriendRequest) => {
    e.stopPropagation();
    if (!currentUser) return;
    try {
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', request.id);

      if (updateError) {
        console.error("Error updating friend request:", updateError);
        toast({ variant: "destructive", title: "Error", description: "Could not accept friend request." });
        return;
      }

      // Add friend to both users' friends list
      const { error: addFriendError } = await supabase
        .from('users')
        .update({ 
          friends: [...(profile?.friends || []), request.fromUserId]
        })
        .eq('id', currentUser.id);

      if (addFriendError) {
        console.error("Error adding friend:", addFriendError);
      }

      // Add current user to the other user's friends list
      const { error: addFriendToOtherError } = await supabase
        .from('users')
        .update({ 
          friends: [...(allNeighbors.find(n => n.id === request.fromUserId)?.friends || []), currentUser.id]
        })
        .eq('id', request.fromUserId);

      if (addFriendToOtherError) {
        console.error("Error adding friend to other user:", addFriendToOtherError);
      }

      toast({ title: "Friend request accepted!" });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not accept friend request." });
    }
  };

  const handleDeclineRequest = async (e: React.MouseEvent, request: FriendRequest) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: "declined" })
        .eq('id', request.id);

      if (error) {
        console.error("Error declining friend request:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not decline friend request." });
        return;
      }

      toast({ title: "Friend request declined." });
    } catch (error) {
      console.error("Error declining friend request:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not decline friend request." });
    }
  };

  const handleMessage = async (e: React.MouseEvent, friendId: string) => {
    e.stopPropagation();
    if (!currentUser) return;

    try {
      // Check if conversation already exists
      const { data: allConversations, error: fetchError } = await supabase
        .from('conversations')
        .select('id, participant_ids')
        .contains('participant_ids', [currentUser.id]);

      if (fetchError) {
        console.error("Error fetching conversations:", fetchError);
        toast({ variant: "destructive", title: "Error", description: "Could not open conversation." });
        return;
      }

      // Filter for conversation with the specific friend
      const existingConversations = allConversations?.filter(conv => 
        conv.participant_ids.includes(currentUser.id) && 
        conv.participant_ids.includes(friendId) &&
        conv.participant_ids.length === 2
      );

      let conversationId: string;

      if (existingConversations && existingConversations.length > 0) {
        conversationId = existingConversations[0].id;
      } else {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            participant_ids: [currentUser.id, friendId].sort(),
            created_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (createError) {
          console.error("Error creating conversation:", createError);
          toast({ variant: "destructive", title: "Error", description: "Could not create conversation." });
          return;
        }

        conversationId = newConversation.id;
      }

      window.location.href = `/messages/${conversationId}`;
    } catch (error) {
      console.error("Error handling message action:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not open conversation." });
    }
  };

  const displayLocation = (location?: User['location']) => {
    if (!location) return null;
    return [location.city, location.lga, location.state].filter(Boolean).join(", ");
  };

  const currentLgas = useMemo(() => {
    if (filters.state === "all" || !lgasByState[filters.state]) return [];
    return lgasByState[filters.state] || [];
  }, [filters.state]);

  const incomingRequests = useMemo(() => {
    const blockedByMe = profile?.blocked_users || [];
    return friendRequests.filter(req =>
      req.toUserId === currentUser?.id &&
      req.status === 'pending' &&
      !blockedByMe.includes(req.fromUserId)
    );
  }, [friendRequests, currentUser, profile]);

  const friends = useMemo(() => {
    const blockedByMe = profile?.blocked_users || [];
    return allNeighbors.filter(n =>
      profile?.friends?.includes(n.id) &&
      !blockedByMe.includes(n.id)
    );
  }, [allNeighbors, profile]);

  const handleProfileDialogClose = useCallback((wasChanged: boolean) => {
    if (wasChanged && selectedUser) {
      const blockedId = selectedUser.id;
      setAllNeighbors(prev => prev.filter(n => n.id !== blockedId));
    }
    setSelectedUser(null);
  }, [selectedUser]);

  return (
    <div className={`p-4 space-y-6 ${className}`}>
      {selectedUser && <UserProfileDialog user={selectedUser} open={!!selectedUser} onOpenChange={handleProfileDialogClose} />}
      
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Community</h2>
          <p className="text-muted-foreground">Connect with neighbors in your area</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search neighbors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border focus:border-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select onValueChange={(val) => handleFilterChange("state", val)} value={filters.state}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {allStates.map((state) => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={(val) => handleFilterChange("lga", val)} value={filters.lga} disabled={filters.state === "all"}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by LGA" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All LGAs</SelectItem>
              {currentLgas.map((lga) => (
                <SelectItem key={lga} value={lga}>{lga}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Friend Requests */}
      {incomingRequests.length > 0 && (
        <Card className="yrdly-shadow">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Friend Requests</h3>
            <div className="space-y-3">
              {incomingRequests.map(request => {
                const fromUser = allNeighbors.find(n => n.uid === request.fromUserId);
                if (!fromUser) return null;
                return (
                  <div key={request.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedUser(fromUser)} className="cursor-pointer">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={fromUser?.avatarUrl} alt={fromUser.name}/>
                          <AvatarFallback>{fromUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </button>
                      <div>
                        <button onClick={() => setSelectedUser(fromUser)} className="cursor-pointer hover:underline">
                          <b>{fromUser?.name || "Someone"}</b>
                        </button> wants to be your friend.
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" onClick={(e) => handleAcceptRequest(e, request)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={(e) => handleDeclineRequest(e, request)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card border border-border">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            All Neighbors
          </TabsTrigger>
          <TabsTrigger value="friends" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            My Friends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              <NeighborSkeleton />
              <NeighborSkeleton />
              <NeighborSkeleton />
            </div>
          ) : filteredAndSortedNeighbors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedNeighbors.map((neighbor) => {
                const status = getFriendshipStatus(neighbor.id);
                return (
                  <Card key={neighbor.id} className="cursor-pointer hover:bg-muted/50 yrdly-shadow" onClick={() => setSelectedUser(neighbor)}>
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <Avatar className="h-20 w-20 border mb-4">
                        <AvatarImage src={neighbor.avatarUrl} alt={neighbor.name} />
                        <AvatarFallback>{neighbor.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-lg">{neighbor.name}</h3>
                      {neighbor.location && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{displayLocation(neighbor.location)}</span>
                        </div>
                      )}
                      <div className="mt-4">
                        {status === "friends" ? (
                          <Button size="sm" onClick={(e) => handleMessage(e, neighbor.id)}>
                            <MessageCircle className="mr-2 h-4 w-4" /> Message
                          </Button>
                        ) : status === "request_sent" ? (
                          <Button size="sm" disabled onClick={(e) => e.stopPropagation()}>
                            Request Sent
                          </Button>
                        ) : (
                          <Button size="sm" onClick={(e) => handleAddFriend(e, neighbor)}>
                            <UserPlus className="mr-2 h-4 w-4" /> Add Friend
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="text-center p-16 yrdly-shadow">
              <div className="flex justify-center mb-4">
                <UserPlus className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No neighbors found</h2>
              <p className="text-muted-foreground">No neighbors match the current filters. Try selecting a different location.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="friends" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              <NeighborSkeleton />
              <NeighborSkeleton />
              <NeighborSkeleton />
            </div>
          ) : friends.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map((friend) => {
                const isOnline = onlineStatuses[friend.id] || false;
                
                return (
                  <Card key={friend.id} className="cursor-pointer hover:bg-muted/50 yrdly-shadow" onClick={() => setSelectedUser(friend)}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border">
                          <AvatarImage src={friend.avatarUrl} alt={friend.name} />
                          <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <AvatarOnlineIndicator isOnline={isOnline} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-base">{friend.name}</h3>
                        {friend.location && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span>{displayLocation(friend.location)}</span>
                          </div>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMessage(e, friend.id);
                        }}
                      >
                        <MessageCircle className="mr-2 h-4 w-4" /> 
                        Message
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="text-center p-16 yrdly-shadow">
              <div className="flex justify-center mb-4">
                <UserPlus className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No friends yet</h2>
              <p className="text-muted-foreground">Your friends list is empty. Find neighbors to connect with.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
