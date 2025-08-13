
"use client";

import { Button } from "@/components/ui/button";
import { Plus, CalendarDays } from "lucide-react";
import { CreateEventDialog } from "@/components/CreateEventDialog";
import { useState, useEffect } from "react";
import type { Post as PostType } from "@/types";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EventCard } from "@/components/EventCard";
import { Skeleton } from "@/components/ui/skeleton";

function EmptyEvents() {
    return (
        <div className="text-center py-16">
            <div className="inline-block bg-muted p-4 rounded-full mb-4">
                <CalendarDays className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold">No upcoming events</h2>
            <p className="text-muted-foreground mt-2 mb-6">Be the first to organize something in your neighborhood!</p>
 <CreateEventDialog>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Create Event
                </Button>
            </CreateEventDialog>
        </div>
    )
}

export default function EventsPage() {
    const [posts, setPosts] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "posts"), where("category", "==", "Event"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const eventsData = querySnapshot.docs.map(doc => {
                 const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp?.toDate().toLocaleString() ?? new Date().toLocaleString(),
                } as PostType;
            });
            setPosts(eventsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline">Events</h1>
            <p className="text-muted-foreground">Discover and create community events.</p>
        </div>
 <CreateEventDialog>
            <Button>
                <Plus className="mr-2 h-4 w-4" /> Create Event
            </Button>
        </CreateEventDialog>
       </div>
        
        {loading ? (
             <div className="space-y-4 max-w-2xl mx-auto">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
             </div>
        ) : posts.filter(post => post.category === 'Event').length > 0 ? (
            <div className="space-y-4 max-w-2xl mx-auto">
                {posts.filter(post => post.category === 'Event').map(event => (
                    <EventCard key={event.id} event={event} />
                ))}
            </div>
        ) : (
            <EmptyEvents />
        )}

    </div>
  );
}
