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
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(event.liked_by?.length || 0);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    const newLikes = isLiked
      ? (event.liked_by || []).filter(id => id !== user.id)
      : [...(event.liked_by || []), user.id];

    try {
      const { error } = await supabase
        .from('posts')
        .update({ liked_by: newLikes })
        .eq('id', event.id);

      if (error) throw error;

      setIsLiked(!isLiked);
      setLikeCount(newLikes.length);
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: event.title || 'Event',
        text: event.text || '',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const eventDate = event.event_date ? new Date(event.event_date) : null;
  const eventTime = event.event_time || '';

  return (
    <Card className="yrdly-shadow hover:shadow-lg transition-all">
      <CardContent className="p-4 space-y-4">
        {/* Event Image */}
        {event.image_urls && event.image_urls.length > 0 && (
          <div className="relative h-48 w-full rounded-lg overflow-hidden">
            <Image
              src={event.image_urls[0]}
              alt={event.title || 'Event'}
              fill
              className="object-cover"
            />
            <div className="absolute top-2 right-2">
              <Badge className="bg-primary text-primary-foreground">
                {event.category}
              </Badge>
            </div>
          </div>
        )}

        {/* Event Details */}
        <div className="space-y-3">
          <div>
            <h3 className="text-xl font-bold text-foreground">{event.title}</h3>
            <p className="text-muted-foreground line-clamp-2">{event.text}</p>
          </div>

          {/* Event Info */}
          <div className="space-y-2">
            {eventDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>{eventDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            )}
            
            {eventTime && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{eventTime}</span>
              </div>
            )}

            {event.event_location?.address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{event.event_location.address}</span>
              </div>
            )}

            {event.attendees && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{event.attendees.length} attending</span>
              </div>
            )}
          </div>

          {/* Author */}
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={event.author_image || "/placeholder.svg"} />
              <AvatarFallback>{event.author_name?.charAt(0) || 'E'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{event.author_name}</p>
              <p className="text-xs text-muted-foreground">
                {event.timestamp ? formatDistanceToNowStrict(new Date(event.timestamp), { addSuffix: true }) : 'Unknown time'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : ''}`}
                onClick={handleLike}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500' : ''}`} />
                <span>{likeCount}</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                <span>{event.comment_count || 0}</span>
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
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

      {/* Events List */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
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
