"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CalendarDays, 
  Search, 
  MapPin, 
  Clock, 
  Users, 
  Plus,
  Heart,
  Share,
  MessageCircle
} from "lucide-react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { supabase } from "@/lib/supabase";
import type { Post as PostType } from "@/types";
import { CreateEventDialog } from "@/components/CreateEventDialog";
import { formatDistanceToNowStrict } from 'date-fns';
import Image from "next/image";

interface V0EventsScreenProps {
  className?: string;
}

function EmptyEvents() {
  return (
    <div className="text-center py-16">
      <div className="inline-block bg-muted p-4 rounded-full mb-4">
        <CalendarDays className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold">No upcoming events</h2>
      <p className="text-muted-foreground mt-2 mb-6">Be the first to organize something in your neighborhood!</p>
    </div>
  );
}

function EventCard({ event }: { event: PostType }) {
  const getEventBadge = (eventDate: string | undefined) => {
    if (!eventDate) return { text: "TBD", variant: "outline" as const, className: "text-muted-foreground border-muted-foreground" };
    
    const eventDateTime = new Date(eventDate);
    const now = new Date();
    const diffDays = Math.ceil((eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { text: "Today", variant: "outline" as const, className: "text-accent border-accent bg-accent/10" };
    if (diffDays === 1) return { text: "Tomorrow", variant: "outline" as const, className: "text-accent border-accent bg-accent/10" };
    if (diffDays <= 7) return { text: "This Week", variant: "outline" as const, className: "text-primary border-primary bg-primary/10" };
    if (diffDays <= 14) return { text: "Next Week", variant: "outline" as const, className: "text-muted-foreground border-muted-foreground" };
    return { text: "Upcoming", variant: "outline" as const, className: "text-muted-foreground border-muted-foreground" };
  };

  const badge = getEventBadge(event.event_date);

  return (
    <Card className="p-4 yrdly-shadow">
      <div className="flex items-start gap-4">
        <Avatar className="w-10 h-10">
          <AvatarImage src={event.author_image || "/placeholder.svg"} />
          <AvatarFallback className="bg-accent text-accent-foreground">
            {event.author_name?.slice(0, 2).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">{event.title || "Event"}</h4>
            <Badge variant={badge.variant} className={badge.className}>
              {badge.text}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{event.text || "No description available"}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {event.event_location?.address && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{event.event_location.address}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{event.attendees?.length || 0} attending</span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
          >
            RSVP
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function V0EventsScreen({ className }: V0EventsScreenProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*, users(name, avatar_url)')
          .eq('category', 'Event')
          .order('timestamp', { ascending: false });

        if (error) {
          console.error('Error fetching events:', error);
          return;
        }

        const formattedEvents = (data || []).map(event => ({
          ...event,
          author_name: event.users?.name || 'Anonymous',
          author_image: event.users?.avatar_url || '/placeholder.svg',
        })) as PostType[];

        setEvents(formattedEvents);
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
      }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          const newEvent = payload.new as PostType;
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('name, avatar_url')
            .eq('id', newEvent.user_id)
            .single();

          setEvents(prevEvents => [{
            ...newEvent,
            author_name: userData?.name || 'Anonymous',
            author_image: userData?.avatar_url || '/placeholder.svg',
          }, ...prevEvents]);
        } else if (payload.eventType === 'UPDATE') {
          const updatedEvent = payload.new as PostType;
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('name, avatar_url')
            .eq('id', updatedEvent.user_id)
            .single();

          setEvents(prevEvents => 
            prevEvents.map(event => 
              event.id === updatedEvent.id ? {
                ...updatedEvent,
                author_name: userData?.name || 'Anonymous',
                author_image: userData?.avatar_url || '/placeholder.svg',
              } : event
            )
          );
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id;
          setEvents(prevEvents => prevEvents.filter(event => event.id !== deletedId));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events;
    
    return events.filter(event =>
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.event_location?.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [events, searchQuery]);

  return (
    <div className={`p-4 space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Events</h2>
            <p className="text-muted-foreground">Discover and create community events</p>
          </div>
          <Button 
            className="bg-primary text-primary-foreground hover:bg-primary/90 yrdly-shadow"
            onClick={() => setIsCreateEventDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border focus:border-primary"
          />
        </div>
      </div>

      {/* Featured Event */}
      {filteredEvents.length > 0 && (
        <Card className="p-0 overflow-hidden yrdly-shadow-lg border-0">
          <div className="yrdly-gradient p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-12 h-12 border-2 border-white/20">
                <AvatarImage src={filteredEvents[0].author_image || "/placeholder.svg"} />
                <AvatarFallback className="bg-white/20 text-white">
                  {filteredEvents[0].author_name?.slice(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{filteredEvents[0].author_name || "Event Organizer"}</h3>
                <p className="text-white/80 text-sm">
                  {formatDistanceToNowStrict(new Date(filteredEvents[0].timestamp), { addSuffix: true })}
                </p>
              </div>
              <Badge className="ml-auto bg-white/20 text-white border-white/20">Featured</Badge>
            </div>
            <h4 className="text-xl font-bold mb-2">{filteredEvents[0].title || "Featured Event"}</h4>
            <p className="text-white/90 mb-4">
              {filteredEvents[0].text || "Join us for this amazing event in your neighborhood!"}
            </p>
          </div>
          <div className="p-6 bg-white space-y-4">
            {filteredEvents[0].event_location?.address && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm">{filteredEvents[0].event_location.address}</span>
              </div>
            )}
            {filteredEvents[0].event_date && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <CalendarDays className="w-4 h-4 text-accent" />
                <span className="text-sm">
                  {new Date(filteredEvents[0].event_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  {filteredEvents[0].event_time && ` at ${filteredEvents[0].event_time}`}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  {filteredEvents[0].attendees?.length || 0} attending
                </span>
              </div>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">RSVP</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Upcoming Events */}
      {filteredEvents.length > 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Upcoming Events</h3>
        </div>
      )}

      {/* Events List */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="space-y-4">
          {filteredEvents.slice(1).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <EmptyEvents />
      )}

      {/* Create Event Dialog - handled by header button */}
    </div>
  );
}
