
"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, where, onSnapshot, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import type { User, Location } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, UserPlus, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { allStates, lgasByState } from "@/lib/geo-data";

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
)

export default function NeighborsPage() {
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [allNeighbors, setAllNeighbors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ state: "all", lga: "all" });

    useEffect(() => {
        if (!currentUser) return;
        
        const q = query(collection(db, "users"), where("uid", "!=", currentUser.uid));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const usersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as User));
            setAllNeighbors(usersData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleFilterChange = (type: 'state' | 'lga', value: string) => {
        setFilters(prev => {
            const newFilters = {...prev, [type]: value};
            if (type === 'state') {
                newFilters.lga = 'all'; // Reset LGA filter when state changes
            }
            return newFilters;
        });
    }

    const filteredNeighbors = useMemo(() => {
        return allNeighbors.filter(neighbor => {
            const stateMatch = filters.state === 'all' || neighbor.location?.state === filters.state;
            const lgaMatch = filters.lga === 'all' || neighbor.location?.lga === filters.lga;
            return stateMatch && lgaMatch;
        });
    }, [allNeighbors, filters]);

    const handleStartConversation = async (neighbor: User) => {
        if (!currentUser) {
            toast({ variant: "destructive", title: "You must be logged in." });
            return;
        }

        const conversationsRef = collection(db, "conversations");
        const existingConvQuery = query(
            conversationsRef,
            where('participantIds', 'array-contains', currentUser.uid)
        );

        const querySnapshot = await getDocs(existingConvQuery);
        let existingConvId: string | null = null;
        
        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.participantIds.includes(neighbor.uid)) {
                existingConvId = doc.id;
            }
        });

        if (existingConvId) {
            router.push(`/messages?convId=${existingConvId}`);
        } else {
            try {
                const newConvDoc = await addDoc(conversationsRef, {
                    participantIds: [currentUser.uid, neighbor.uid],
                    createdAt: serverTimestamp(),
                    lastMessage: null,
                });
                router.push(`/messages?convId=${newConvDoc.id}`);
            } catch (error) {
                console.error("Error creating conversation: ", error);
                toast({ variant: "destructive", title: "Error", description: "Could not start a conversation." });
            }
        }
    };

    const displayLocation = (location?: Location) => {
        if (!location) return null;
        return [location.city, location.lga, location.state].filter(Boolean).join(', ');
    }
    
    const currentLgas = useMemo(() => {
        if (filters.state === 'all' || !lgasByState[filters.state]) {
            return [];
        }
        return lgasByState[filters.state] || [];
    }, [filters.state]);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold font-headline">Find Neighbors</h1>
                    <p className="text-muted-foreground">Connect with other members of your community.</p>
                </div>
                <div className="flex w-full md:w-auto md:flex-row gap-2">
                    <Select onValueChange={(val) => handleFilterChange('state', val)} value={filters.state}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Filter by State" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="all">All States</SelectItem>
                            {allStates.map(state => (
                                <SelectItem key={state} value={state}>
                                    {state}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <Select onValueChange={(val) => handleFilterChange('lga', val)} value={filters.lga} disabled={filters.state === 'all'}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Filter by LGA" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All LGAs</SelectItem>
                            {currentLgas.map(lga => (
                               <SelectItem key={lga} value={lga}>{lga}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    <NeighborSkeleton />
                    <NeighborSkeleton />
                    <NeighborSkeleton />
                </div>
            ) : filteredNeighbors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredNeighbors.map(neighbor => (
                        <Card key={neighbor.id}>
                            <CardContent className="p-4 flex items-start gap-4">
                                <Avatar className="h-16 w-16 border">
                                    <AvatarImage src={neighbor.avatarUrl} alt={neighbor.name} />
                                    <AvatarFallback>{neighbor.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <h3 className="font-semibold text-lg">{neighbor.name}</h3>
                                    {neighbor.location && (
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <MapPin className="h-4 w-4 mr-1"/>
                                            <span>{displayLocation(neighbor.location)}</span>
                                        </div>
                                    )}
                                    <p className="text-sm text-muted-foreground pt-1">{neighbor.bio || "No bio yet."}</p>
                                </div>
                                <Button size="sm" onClick={() => handleStartConversation(neighbor)}>
                                    <MessageSquare className="mr-2 h-4 w-4" /> Message
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="text-center p-16">
                     <div className="flex justify-center mb-4">
                        <UserPlus className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">No neighbors found</h2>
                    <p className="text-muted-foreground">
                       No neighbors match the current filters. Try selecting a different location.
                    </p>
                </Card>
            )}
        </div>
    );
}
