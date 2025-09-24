
"use client";

import { Button } from "@/components/ui/button";

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

import { Plus, CalendarDays } from "lucide-react";
import { CreateEventDialog } from "@/components/CreateEventDialog";
import { useState, useEffect } from "react";
import type { Post as PostType } from "@/types";
import { supabase } from "@/lib/supabase";
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
            {/* The button is now only in the header */}
        </div>
    )
}

export default function EventsPage() {
    const [posts, setPosts] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const { data, error } = await supabase
                    .from('posts')
                    .select('*')
                    .eq('category', 'Event')
                    .order('timestamp', { ascending: false });

                if (error) {
                    console.error('Error fetching events:', error);
                    return;
                }

                setPosts(data as PostType[]);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching events:', error);
                setLoading(false);
            }
        };

        fetchEvents();

        // Set up real-time subscription
        const channel = supabase
            .channel('events')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'posts',
                filter: 'category=eq.Event'
            }, (payload) => {
                console.log('Events realtime change received!', payload);
                
                if (payload.eventType === 'INSERT') {
                    // Add new event to the beginning of the list
                    const newEvent = payload.new as PostType;
                    setPosts(prevPosts => [newEvent, ...prevPosts]);
                } else if (payload.eventType === 'UPDATE') {
                    // Update existing event in the list
                    const updatedEvent = payload.new as PostType;
                    setPosts(prevPosts => 
                        prevPosts.map(post => 
                            post.id === updatedEvent.id ? updatedEvent : post
                        )
                    );
                } else if (payload.eventType === 'DELETE') {
                    // Remove deleted event from the list
                    const deletedId = payload.old.id;
                    setPosts(prevPosts => 
                        prevPosts.filter(post => post.id !== deletedId)
                    );
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

  return (
    <div className="space-y-6 pt-16 pb-20">
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
        ) : posts.length > 0 ? (
            <div className="space-y-4 max-w-2xl mx-auto">
                {posts.map(event => (
                    <EventCard key={event.id} event={event} />
                ))}
            </div>
        ) : (
            <EmptyEvents />
        )}

    </div>
  );
}
