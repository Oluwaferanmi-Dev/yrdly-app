
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, collection, query, where, addDoc, serverTimestamp, updateDoc, arrayUnion, runTransaction, arrayRemove } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { User, FriendRequest, Location } from '../../../../types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, MessageSquare, UserPlus, Check, X, Clock, MoreHorizontal, ShieldBan } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ProfileSkeleton = () => (
    <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex flex-col items-center text-center p-6 bg-muted/50">
            <Skeleton className="h-24 w-24 rounded-full mb-4" />
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="p-6">
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-5 w-3/4" />
        </CardContent>
        <CardFooter className="p-6 justify-center">
            <Skeleton className="h-10 w-32" />
        </CardFooter>
    </Card>
);

export default function UserProfilePage() {
    const { userId } = useParams();
    const { user: currentUser, userDetails } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
    const [friendRequest, setFriendRequest] = useState<FriendRequest | null>(null);
    const [isBlocked, setIsBlocked] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId || !currentUser) return;

        // Check if the user is trying to view their own profile
        if (userId === currentUser.uid) {
            // Optionally, redirect to a dedicated "my profile" page
            // For now, just load their data without friendship logic
            const userDocRef = doc(db, 'users', currentUser.uid);
            const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    setProfileUser({ id: doc.id, ...doc.data() } as User);
                }
                setLoading(false);
            });
            return () => unsubscribeUser();
        }


        // Check if the profile user is blocked by the current user
        if (userDetails?.blockedUsers?.includes(userId as string)) {
            setIsBlocked(true);
        }
        
        // Fetch profile user's data
        const userDocRef = doc(db, 'users', userId as string);
        const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                setProfileUser({ id: doc.id, ...doc.data() } as User);
            }
            setLoading(false);
        });

        // Determine friendship status
        if (userDetails?.friends?.some(f => f.uid === userId)) {
            setFriendshipStatus('friends');
        } else {
            const requestsQuery = query(
                collection(db, 'friend_requests'),
                where('fromUserId', 'in', [currentUser.uid, userId]),
                where('toUserId', 'in', [currentUser.uid, userId])
            );

            const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
                const requestDoc = snapshot.docs.find(doc => {
                    const data = doc.data();
                    return (data.fromUserId === currentUser.uid && data.toUserId === userId) || (data.fromUserId === userId && data.toUserId === currentUser.uid)
                });

                if (requestDoc) {
                    const requestData = { id: requestDoc.id, ...requestDoc.data() } as FriendRequest;
                    setFriendRequest(requestData);
                    if (requestData.status === 'pending') {
                        setFriendshipStatus(requestData.fromUserId === currentUser.uid ? 'request_sent' : 'request_received');
                    } else {
                        setFriendshipStatus('none');
                    }
                } else {
                    setFriendshipStatus('none');
                    setFriendRequest(null);
                }
            });
            return () => unsubscribeRequests();
        }

        return () => unsubscribeUser();

    }, [userId, currentUser, userDetails]);

    const handleAddFriend = async () => {
        if (!currentUser || !profileUser || isBlocked) return;
        try {
            await addDoc(collection(db, "friend_requests"), { fromUserId: currentUser.uid, toUserId: profileUser.uid, status: "pending", timestamp: serverTimestamp() });
            toast({ title: "Friend request sent!" });
        } catch {
            toast({ variant: "destructive", title: "Error", description: "Could not send friend request." });
        }
    };

    const handleAcceptRequest = async () => {
        if (!currentUser || !friendRequest) return;
        try {
            const acceptFriendRequest = httpsCallable(functions, 'acceptfriendrequest');
            await acceptFriendRequest({ friendRequestId: friendRequest.id });
            toast({ title: "Friend request accepted!" });
        } catch {
            toast({ variant: "destructive", title: "Error", description: "Could not accept friend request." });
        }
    };

    const handleDeclineRequest = async () => {
        if (!friendRequest) return;
        const requestRef = doc(db, "friend_requests", friendRequest.id);
        await updateDoc(requestRef, { status: "declined" });
        toast({ title: "Friend request declined." });
    };

    const handleUnfriend = async () => {
        if (!currentUser || !profileUser) return;
        try {
            await runTransaction(db, async (transaction) => {
                const currentUserRef = doc(db, "users", currentUser.uid);
                const friendUserRef = doc(db, "users", profileUser.uid);
                transaction.update(currentUserRef, { friends: arrayRemove(profileUser.uid) });
                transaction.update(friendUserRef, { friends: arrayRemove(currentUser.uid) });
            });
            toast({ title: "Friend removed." });
        } catch {
            toast({ variant: "destructive", title: "Error", description: "Could not remove friend." });
        }
    };

    const handleBlockUser = async () => {
        if (!currentUser || !profileUser) return;
        const currentUserRef = doc(db, "users", currentUser.uid);
        try {
            await updateDoc(currentUserRef, { blockedUsers: arrayUnion(profileUser.uid) });
            // Also remove friend if they are friends
            if (friendshipStatus === 'friends') {
                await handleUnfriend();
            }
            setIsBlocked(true);
            toast({ title: "User blocked." });
        } catch {
            toast({ variant: "destructive", title: "Error", description: "Could not block user." });
        }
    };

    const handleUnblockUser = async () => {
        if (!currentUser || !profileUser) return;
        const currentUserRef = doc(db, "users", currentUser.uid);
        try {
            await updateDoc(currentUserRef, { blockedUsers: arrayRemove(profileUser.uid) });
            setIsBlocked(false);
            toast({ title: "User unblocked." });
        } catch {
            toast({ variant: "destructive", title: "Error", description: "Could not unblock user." });
        }
    };

    const displayLocation = (location?: Location) => {
        if (!location) return "Location not set";
        return [location.city, location.lga, location.state].filter(Boolean).join(", ");
    };

    const renderActionButtons = () => {
        if (!profileUser || profileUser.uid === currentUser?.uid) return null;
        if (isBlocked) {
            return <Button onClick={handleUnblockUser} variant="destructive"><ShieldBan className="mr-2 h-4 w-4" /> Unblock User</Button>;
        }

        switch (friendshipStatus) {
            case 'friends':
                return <Button onClick={() => router.push(`/messages?convId=${profileUser.uid}`)}><MessageSquare className="mr-2 h-4 w-4" /> Message</Button>;
            case 'request_sent':
                return <Button disabled><Clock className="mr-2 h-4 w-4" /> Request Sent</Button>;
            case 'request_received':
                return (
                    <div className="flex gap-2">
                        <Button onClick={handleAcceptRequest}><Check className="mr-2 h-4 w-4" /> Accept Request</Button>
                        <Button variant="outline" onClick={handleDeclineRequest}><X className="mr-2 h-4 w-4" /> Decline</Button>
                    </div>
                );
            case 'none':
            default:
                return <Button onClick={handleAddFriend}><UserPlus className="mr-2 h-4 w-4" /> Add Friend</Button>;
        }
    };

    if (loading) return <ProfileSkeleton />;
    if (!profileUser) return <div className="text-center py-10">User not found.</div>;

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader className="flex flex-col items-center text-center p-6 bg-muted/50 relative">
                {profileUser.uid !== currentUser?.uid && (
                    <div className="absolute top-4 right-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-5 w-5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                            <ShieldBan className="mr-2 h-4 w-4" /> {isBlocked ? "Unblock" : "Block"} User
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                {isBlocked ? `This will unblock ${profileUser.name}.` : `This will block ${profileUser.name}. You will no longer see their content or be able to interact with them.`}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={isBlocked ? handleUnblockUser : handleBlockUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                {isBlocked ? "Unblock" : "Block"}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
                <Avatar className="h-24 w-24 mb-4 border-2 border-background"><AvatarImage src={profileUser.avatarUrl} alt={profileUser.name} /><AvatarFallback>{profileUser.name.charAt(0)}</AvatarFallback></Avatar>
                <h1 className="text-2xl font-bold">{profileUser.name}</h1>
                {profileUser.location && (<div className="flex items-center text-sm text-muted-foreground mt-1"><MapPin className="h-4 w-4 mr-1" /><span>{displayLocation(profileUser.location)}</span></div>)}
            </CardHeader>
            <CardContent className="p-6">
                <h2 className="font-semibold text-lg mb-2">Bio</h2>
                <p className="text-muted-foreground">{profileUser.bio || "This user hasn't written a bio yet."}</p>
            </CardContent>
            <CardFooter className="p-6 justify-center">
                {renderActionButtons()}
            </CardFooter>
        </Card>
    );
}
