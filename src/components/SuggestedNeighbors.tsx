"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from './ui/skeleton';

export function SuggestedNeighbors() {
    const { user, userDetails } = useAuth();
    const [suggestions, setSuggestions] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!user || !userDetails?.location?.lga) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Fetch users from the same LGA, excluding the current user and existing friends
                const friendsAndSelf = [...(userDetails.friends?.map(f => f.uid) || []), user.uid];
                
                const q = query(
                    collection(db, 'users'),
                    where('location.lga', '==', userDetails.location.lga),
                    where('uid', 'not-in', friendsAndSelf),
                    limit(5)
                );

                const querySnapshot = await getDocs(q);
                const suggestionsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
                setSuggestions(suggestionsData);

            } catch (error) {
                console.error("Error fetching suggestions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, [user, userDetails]);

    if (loading) {
        return (
            <Card>
                <CardHeader><CardTitle>People You May Know</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
    }

    if (suggestions.length === 0) {
        return null; // Don't show the card if there are no suggestions
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>People You May Know</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {suggestions.map(neighbor => (
                    <div key={neighbor.id} className="flex items-center gap-4">
                        <Avatar>
                            <AvatarImage src={neighbor.avatarUrl} alt={neighbor.name} />
                            <AvatarFallback>{neighbor.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">{neighbor.name}</p>
                            <p className="text-xs text-muted-foreground">{neighbor.location?.lga}</p>
                        </div>
                        <Button asChild size="icon" variant="outline" className="rounded-full">
                            <Link href={`/users/${neighbor.uid}`}>
                                <Plus className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
