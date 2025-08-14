
"use client";

import { useState, useEffect, useMemo } from "react";
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
import { MessageSquare, UserPlus, MapPin, Check, X, UserMinus } from "lucide-react";
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

export default function NeighborsPage() {
    const { user: currentUser, userDetails } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [allNeighbors, setAllNeighbors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ state: "all", lga: "all" });
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [activeTab, setActiveTab] = useState("all");

    useEffect(() => {
        if (!currentUser) return;

        const usersQuery = query(
            collection(db, "users")
        );

        const unsubscribeUsers = onSnapshot(usersQuery, (querySnapshot) => {
            const usersData = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as User))
                .filter(user => user.uid !== currentUser.uid); // Filter out the current user on the client
            setAllNeighbors(usersData);
            setLoading(false);
        });

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

    const filteredNeighbors = useMemo(() => {
        const blockedByMe = userDetails?.blockedUsers || [];
        return allNeighbors.filter((neighbor) => {
            if (blockedByMe.includes(neighbor.uid)) return false;
            if (neighbor.blockedUsers?.includes(currentUser?.uid || '')) return false;

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
                participantIds: [currentUser.uid, neighbor.uid],
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

    const handleUnfriend = async (e: React.MouseEvent, friendId: string) => {
        e.stopPropagation();
        if (!currentUser) return;
        try {
            await runTransaction(db, async (transaction) => {
                const currentUserRef = doc(db, "users", currentUser.uid);
                const friendUserRef = doc(db, "users", friendId);
                transaction.update(currentUserRef, { friends: arrayRemove(friendId) });
                transaction.update(friendUserRef, { friends: arrayRemove(currentUser.uid) });
            });
            toast({ title: "Friend removed." });
        } catch (error) {
            console.error("Error removing friend: ", error);
            toast({ variant: "destructive", title: "Error", description: "Could not remove friend." });
        }
    };
    
    const handleMessage = async (e: React.MouseEvent, neighbor: User) => {
        e.stopPropagation();
        if (!currentUser) return;

        const conversationQuery = query(
            collection(db, "conversations"),
            where("participantIds", "==", [currentUser.uid, neighbor.uid].sort())
        );

        const querySnapshot = await getDocs(conversationQuery);

        if (!querySnapshot.empty) {
            // Conversation exists
            router.push(`/messages?convId=${neighbor.uid}`);
        } else {
            // Create new conversation
            await addDoc(collection(db, "conversations"), {
                participantIds: [currentUser.uid, neighbor.uid].sort(),
                lastMessage: null,
            });
            router.push(`/messages?convId=${neighbor.uid}`);
        }
    };


    const getFriendshipStatus = (neighborId: string) => {
        if (userDetails?.friends?.includes(neighborId)) return "friends";
        
        const request = friendRequests.find(req => 
            ((req.fromUserId === currentUser?.uid && req.toUserId === neighborId) ||
             (req.fromUserId === neighborId && req.toUserId === currentUser?.uid))
        );

        if (request && request.status === 'pending') {
            return request.fromUserId === currentUser?.uid ? 'request_sent' : 'request_received';
        }

        return "none";
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

    return (
        <div className="max-w-4xl mx-auto space-y-6">
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
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={fromUser?.avatarUrl} alt={fromUser.name}/>
                                                <AvatarFallback>{fromUser.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="cursor-pointer" onClick={() => router.push(`/users/${request.fromUserId}`)}><b>{fromUser?.name || "Someone"}</b> wants to be your friend.</span>
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
                    ) : filteredNeighbors.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredNeighbors.map((neighbor) => {
                                const status = getFriendshipStatus(neighbor.uid);
                                return (
                                    <Card key={neighbor.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/users/${neighbor.uid}`)}>
                                        <CardContent className="p-4 flex flex-col items-center text-center">
                                            <Avatar className="h-20 w-20 border mb-4"><AvatarImage src={neighbor.avatarUrl} alt={neighbor.name} /><AvatarFallback>{neighbor.name.charAt(0)}</AvatarFallback></Avatar>
                                            <h3 className="font-semibold text-lg">{neighbor.name}</h3>
                                            {neighbor.location && (<div className="flex items-center text-xs text-muted-foreground"><MapPin className="h-3 w-3 mr-1" /><span>{displayLocation(neighbor.location)}</span></div>)}
                                            <div className="mt-4">
                                                {status === "friends" ? (
                                                    <Button size="sm" onClick={(e) => handleMessage(e, neighbor)}><MessageSquare className="mr-2 h-4 w-4" /> Message</Button>
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
                                <Card key={friend.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/users/${friend.uid}`)}>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <Avatar className="h-12 w-12 border"><AvatarImage src={friend.avatarUrl} alt={friend.name} /><AvatarFallback>{friend.name.charAt(0)}</AvatarFallback></Avatar>
                                        <div className="flex-1 space-y-1">
                                            <h3 className="font-semibold text-base">{friend.name}</h3>
                                            {friend.location && (<div className="flex items-center text-xs text-muted-foreground"><MapPin className="h-3 w-3 mr-1" /><span>{displayLocation(friend.location)}</span></div>)}
                                        </div>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}><UserMinus className="h-4 w-4 text-destructive" /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will remove {friend.name} from your friends list. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={(e) => handleUnfriend(e, friend.uid)}>Unfriend</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
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
