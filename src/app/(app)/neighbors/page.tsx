
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc,
    runTransaction,
    arrayRemove,
    getDocs,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import type { User, FriendRequest } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, UserPlus, MapPin, Check, X, UserMinus, MoreHorizontal, ShieldBan } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { allStates, lgasByState } from "@/lib/geo-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserProfileDialog } from "@/components/UserProfileDialog";

const NeighborSkeleton = () => (
    <Card>
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

export default function NeighborsPage() {
    const { user: currentUser, userDetails } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [allNeighbors, setAllNeighbors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ state: "all", lga: "all" });
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [activeTab, setActiveTab] = useState("all");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    useEffect(() => {
        if (!currentUser) return;

        // Base query for users, excluding self
        const usersQuery = query(
            collection(db, "users"),
            where('uid', '!=', currentUser.uid)
        );

        const unsubscribeUsers = onSnapshot(usersQuery, (querySnapshot) => {
            const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setAllNeighbors(usersData);
            setLoading(false);
        });

        // Query for friend requests involving the current user
        const requestsQuery = query(
            collection(db, "friend_requests"),
            where("participantIds", "array-contains", currentUser.uid)
        );

        const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
            setFriendRequests(requests);
        });

        return () => {
            unsubscribeUsers();
            unsubscribeRequests();
        };
    }, [currentUser]);

    const handleFilterChange = (type: "state" | "lga", value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [type]: value };
            if (type === "state") newFilters.lga = "all";
            return newFilters;
        });
    };

    const getFriendshipStatus = useCallback((neighborId: string): FriendshipStatus => {
        if (userDetails?.friends?.includes(neighborId)) return "friends";

        const request = friendRequests.find(req =>
            req.status === 'pending' &&
            ((req.fromUserId === currentUser?.uid && req.toUserId === neighborId) ||
             (req.fromUserId === neighborId && req.toUserId === currentUser?.uid))
        );

        if (request) {
            return request.fromUserId === currentUser?.uid ? 'request_sent' : 'request_received';
        }

        return "none";
    }, [userDetails, friendRequests, currentUser]);

    const filteredAndSortedNeighbors = useMemo(() => {
        if (!currentUser) return [];
        const blockedByMe = userDetails?.blockedUsers || [];

        return allNeighbors.filter((neighbor) => {
            // Basic filters
            if (neighbor.uid === currentUser.uid) return false;
            if (blockedByMe.includes(neighbor.uid)) return false; // Filter out blocked users
            if (neighbor.blockedUsers?.includes(currentUser.uid)) return false; // Filter out users who blocked me

            // Location filters
            const stateMatch = filters.state === "all" || neighbor.location?.state === filters.state;
            const lgaMatch = filters.lga === "all" || neighbor.location?.lga === filters.lga;

            return stateMatch && lgaMatch;
        });
    }, [allNeighbors, filters, userDetails, currentUser]);

    const handleAddFriend = async (e: React.MouseEvent, neighbor: User) => {
        e.stopPropagation();
        if (!currentUser) return;
        try {
            await addDoc(collection(db, "friend_requests"), {
                fromUserId: currentUser.uid,
                toUserId: neighbor.uid,
                participantIds: [currentUser.uid, neighbor.uid].sort(),
                status: "pending",
                timestamp: serverTimestamp(),
            });
            toast({ title: "Friend request sent!" });
        } catch (error) {
            console.error("Error sending friend request: ", error);
            toast({ variant: "destructive", title: "Error", description: "Could not send friend request." });
        }
    };

    const handleAcceptRequest = async (e: React.MouseEvent, request: FriendRequest) => {
        e.stopPropagation();
        if (!currentUser) return;
        try {
            const acceptFriendRequest = httpsCallable(functions, 'acceptfriendrequest');
            await acceptFriendRequest({ friendRequestId: request.id });
            toast({ title: "Friend request accepted!" });
        } catch (error) {
            console.error("Error accepting friend request: ", error);
            toast({ variant: "destructive", title: "Error", description: "Could not accept friend request." });
        }
    };

    const handleDeclineRequest = async (e: React.MouseEvent, request: FriendRequest) => {
        e.stopPropagation();
        const requestRef = doc(db, "friend_requests", request.id);
        await updateDoc(requestRef, { status: "declined" });
        toast({ title: "Friend request declined." });
    };

     const handleMessage = async (e: React.MouseEvent, friendId: string) => {
        e.stopPropagation();
        if (!currentUser) return;

        const sortedParticipantIds = [currentUser.uid, friendId].sort();

        const q = query(
            collection(db, "conversations"),
            where("participantIds", "==", sortedParticipantIds)
        );

        try {
            const querySnapshot = await getDocs(q);
            let conversationId: string;

            if (querySnapshot.empty) {
                // Conversation doesn't exist, create it
                const newConvRef = await addDoc(collection(db, "conversations"), {
                    participantIds: sortedParticipantIds,
                    lastMessage: null,
                    timestamp: serverTimestamp(),
                });
                conversationId = newConvRef.id;
            } else {
                // Conversation exists
                conversationId = querySnapshot.docs[0].id;
            }

            router.push(`/messages/${conversationId}`);
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
        const blockedByMe = userDetails?.blockedUsers || [];
        return friendRequests.filter(req =>
            req.toUserId === currentUser?.uid &&
            req.status === 'pending' &&
            !blockedByMe.includes(req.fromUserId)
        );
    }, [friendRequests, currentUser, userDetails]);

    const friends = useMemo(() => {
        const blockedByMe = userDetails?.blockedUsers || [];
        return allNeighbors.filter(n =>
            userDetails?.friends?.includes(n.uid) &&
            !blockedByMe.includes(n.uid)
        );
    }, [allNeighbors, userDetails]);

    const handleProfileDialogClose = useCallback((wasChanged: boolean) => {
        if (wasChanged && selectedUser) {
            const blockedId = selectedUser.uid;
             setAllNeighbors(prev => prev.filter(n => n.uid !== blockedId));
        }
        setSelectedUser(null)
    }, [selectedUser]);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {selectedUser && <UserProfileDialog user={selectedUser} open={!!selectedUser} onOpenChange={handleProfileDialogClose} />}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold font-headline">Community</h1>
                    <p className="text-muted-foreground">Connect with other members of your community.</p>
                </div>
            </div>

            {incomingRequests.length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <h2 className="text-xl font-semibold mb-4">Friend Requests</h2>
                        <div className="space-y-4">
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
                                            <Button size="sm" variant="default" onClick={(e) => handleAcceptRequest(e, request)}><Check className="h-4 w-4" /></Button>
                                            <Button size="sm" variant="outline" onClick={(e) => handleDeclineRequest(e, request)}><X className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="all">All Neighbors</TabsTrigger>
                    <TabsTrigger value="friends">My Friends</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                    <div className="flex w-full md:w-auto md:flex-row gap-2 my-4">
                        <Select onValueChange={(val) => handleFilterChange("state", val)} value={filters.state}>
                            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by State" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All States</SelectItem>
                                {allStates.map((state) => (<SelectItem key={state} value={state}>{state}</SelectItem>))}
                            </SelectContent>
                        </Select>
                        <Select onValueChange={(val) => handleFilterChange("lga", val)} value={filters.lga} disabled={filters.state === "all"}>
                            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by LGA" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All LGAs</SelectItem>
                                {currentLgas.map((lga) => (<SelectItem key={lga} value={lga}>{lga}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                    {loading ? (
                        <div className="space-y-4"><NeighborSkeleton /><NeighborSkeleton /><NeighborSkeleton /></div>
                    ) : filteredAndSortedNeighbors.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredAndSortedNeighbors.map((neighbor) => {
                                const status = getFriendshipStatus(neighbor.uid);
                                return (
                                    <Card key={neighbor.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedUser(neighbor)}>
                                        <CardContent className="p-4 flex flex-col items-center text-center">
                                            <Avatar className="h-20 w-20 border mb-4"><AvatarImage src={neighbor.avatarUrl} alt={neighbor.name} /><AvatarFallback>{neighbor.name.charAt(0)}</AvatarFallback></Avatar>
                                            <h3 className="font-semibold text-lg">{neighbor.name}</h3>
                                            {neighbor.location && (<div className="flex items-center text-xs text-muted-foreground"><MapPin className="h-3 w-3 mr-1" /><span>{displayLocation(neighbor.location)}</span></div>)}
                                            <div className="mt-4">
                                                {status === "friends" ? (
                                                    <Button size="sm" onClick={(e) => handleMessage(e, neighbor.uid)}><MessageSquare className="mr-2 h-4 w-4" /> Message</Button>
                                                ) : status === "request_sent" ? (
                                                    <Button size="sm" disabled onClick={(e) => e.stopPropagation()}>Request Sent</Button>
                                                ) : (
                                                    <Button size="sm" onClick={(e) => handleAddFriend(e, neighbor)}><UserPlus className="mr-2 h-4 w-4" /> Add Friend</Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <Card className="text-center p-16"><div className="flex justify-center mb-4"><UserPlus className="h-12 w-12 text-muted-foreground" /></div><h2 className="text-2xl font-bold mb-2">No neighbors found</h2><p className="text-muted-foreground">No neighbors match the current filters. Try selecting a different location.</p></Card>
                    )}
                </TabsContent>
                <TabsContent value="friends">
                    {loading ? (
                         <div className="space-y-4"><NeighborSkeleton /><NeighborSkeleton /><NeighborSkeleton /></div>
                    ) : friends.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                            {friends.map((friend) => (
                                <Card key={friend.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedUser(friend)}>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <Avatar className="h-12 w-12 border"><AvatarImage src={friend.avatarUrl} alt={friend.name} /><AvatarFallback>{friend.name.charAt(0)}</AvatarFallback></Avatar>
                                        <div className="flex-1 space-y-1">
                                            <h3 className="font-semibold text-base">{friend.name}</h3>
                                            {friend.location && (<div className="flex items-center text-xs text-muted-foreground"><MapPin className="h-3 w-3 mr-1" /><span>{displayLocation(friend.location)}</span></div>)}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="text-center p-16 mt-4"><div className="flex justify-center mb-4"><UserPlus className="h-12 w-12 text-muted-foreground" /></div><h2 className="text-2xl font-bold mb-2">No friends yet</h2><p className="text-muted-foreground">Your friends list is empty. Find neighbors to connect with.</p></Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
