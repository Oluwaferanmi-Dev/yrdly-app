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
import { useToast } from "@/hooks/use-toast";
import { useHaptics } from "@/hooks/use-haptics";
import { useRouter } from "next/navigation";

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

function EventCard({ event, onLike, onComment, onShare, onClick, onRSVP, isRSVPLoading, currentUser }: { 
  event: PostType; 
  onLike: (eventId: string) => void;
  onComment: (eventId: string) => void;
  onShare: (eventId: string) => void;
  onClick: (eventId: string) => void;
  onRSVP: (eventId: string) => void;
  isRSVPLoading: boolean;
  currentUser: any;
}) {
  
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
  const isLiked = event.liked_by?.includes(currentUser?.id || '') || false;

  return (
    <Card className="p-4 yrdly-shadow cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onClick(event.id)}>
      {/* Event Image */}
      {(event.image_url || (event.image_urls && event.image_urls.length > 0)) && (
        <div className="mb-4">
          <img
            src={event.image_url || event.image_urls?.[0] || "/placeholder.svg"}
            alt={event.title || "Event image"}
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>
      )}
      
      <div className="flex items-start gap-4">
        <Avatar className="w-10 h-10">
          <AvatarImage src={event.author_image || "/placeholder.svg"} />
          <AvatarFallback className="bg-accent text-accent-foreground">
            {event.author_name?.slice(0, 2).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground truncate flex-1">{event.title || "Event"}</h4>
            <Badge variant={badge.variant} className={badge.className}>
              {badge.text}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{event.text || "No description available"}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {event.event_location?.address && (
              <div className="flex items-center gap-1 min-w-0">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{event.event_location.address}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{event.attendees?.length || 0} attending</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className={`border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent ${
                currentUser && event.attendees?.includes(currentUser.id) 
                  ? 'bg-primary text-primary-foreground' 
                  : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onRSVP(event.id);
              }}
              disabled={isRSVPLoading}
            >
              {isRSVPLoading ? 'Loading...' : 
               currentUser && event.attendees?.includes(currentUser.id) ? 'Attending' : 'RSVP'}
            </Button>
          </div>
          
          {/* Like, Comment, Share buttons */}
          <div className="flex items-center gap-4 pt-2 border-t border-border">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`text-muted-foreground hover:text-red-500 ${isLiked ? 'text-red-500' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onLike(event.id);
              }}
            >
              <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{event.liked_by?.length || 0}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                onComment(event.id);
              }}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              <span className="text-sm">{event.comment_count || 0}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-accent"
              onClick={(e) => {
                e.stopPropagation();
                onShare(event.id);
              }}
            >
              <Share className="w-4 h-4 mr-1" />
              <span className="text-sm">Share</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function V0EventsScreen({ className }: V0EventsScreenProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { triggerHaptic } = useHaptics();
  const router = useRouter();
  const [events, setEvents] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [rsvpLoading, setRsvpLoading] = useState<Set<string>>(new Set());

  // Handle RSVP functionality
  const handleRSVP = async (eventId: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "Please log in to RSVP for events.",
      });
      return;
    }

    setRsvpLoading(prev => new Set(prev).add(eventId));
    triggerHaptic('light');

    try {
      // Get current event data
      const { data: eventData, error: fetchError } = await supabase
        .from('posts')
        .select('attendees')
        .eq('id', eventId)
        .single();

      if (fetchError) {
        console.error('Error fetching event:', fetchError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to RSVP. Please try again.",
        });
        return;
      }

      const currentAttendees = eventData.attendees || [];
      const userHasRSVPed = currentAttendees.includes(user.id);

      let newAttendees;
      if (userHasRSVPed) {
        // Remove user from attendees array
        newAttendees = currentAttendees.filter((id: string) => id !== user.id);
      } else {
        // Add user to attendees array
        newAttendees = [...currentAttendees, user.id];
      }

      // Update the event
      const { error: updateError } = await supabase
        .from('posts')
        .update({ attendees: newAttendees })
        .eq('id', eventId);

      if (updateError) {
        console.error('Error updating event:', updateError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to RSVP. Please try again.",
        });
      } else {
        toast({
          title: userHasRSVPed ? "RSVP Cancelled" : "RSVP Confirmed",
          description: userHasRSVPed 
            ? "You're no longer attending this event." 
            : "You're now attending this event!",
        });
      }
    } catch (error) {
      console.error('Error handling RSVP:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to RSVP. Please try again.",
      });
    } finally {
      setRsvpLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }
  };

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

  // Handle like functionality
  const handleLike = async (eventId: string) => {
    if (!user) return;
    
    triggerHaptic('light');
    
    try {
      // Get current event data
      const { data: eventData, error: fetchError } = await supabase
        .from('posts')
        .select('liked_by')
        .eq('id', eventId)
        .single();

      if (fetchError) {
        console.error('Error fetching event:', fetchError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to like event. Please try again.",
        });
        return;
      }

      const currentLikedBy = eventData.liked_by || [];
      const userHasLiked = currentLikedBy.includes(user.id);

      let newLikedBy;
      if (userHasLiked) {
        // Remove user from liked_by array
        newLikedBy = currentLikedBy.filter((id: string) => id !== user.id);
      } else {
        // Add user to liked_by array
        newLikedBy = [...currentLikedBy, user.id];
      }

      // Update the event
      const { error: updateError } = await supabase
        .from('posts')
        .update({ liked_by: newLikedBy })
        .eq('id', eventId);

      if (updateError) {
        console.error('Error updating event:', updateError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to like event. Please try again.",
        });
      }
    } catch (error) {
      console.error('Error handling like:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to like event. Please try again.",
      });
    }
  };

  // Handle comment functionality
  const handleComment = (eventId: string) => {
    // Navigate to event detail page for comments
    router.push(`/posts/${eventId}`);
  };

  // Handle share functionality
  const handleShare = async (eventId: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this event on Yrdly',
          text: 'Check out this event on Yrdly',
          url: window.location.origin + `/posts/${eventId}`
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.origin + `/posts/${eventId}`);
        toast({
          title: "Link copied",
          description: "Event link has been copied to clipboard.",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Handle event card click for detailed view
  const handleEventClick = (eventId: string) => {
    router.push(`/posts/${eventId}`);
  };

  const filteredEvents = useMemo(() => {
    let filtered = events;
    
    if (searchQuery) {
      filtered = events.filter(event =>
        event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.event_location?.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort by timestamp (most recent first)
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [events, searchQuery]);

  // Get the most recent event for featured section
  const featuredEvent = filteredEvents.length > 0 ? filteredEvents[0] : null;
  // Get remaining events for the list
  const remainingEvents = filteredEvents.slice(1);

  return (
    <div className={`p-4 space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Events</h2>
          <p className="text-muted-foreground">Discover and create community events</p>
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

      {/* Featured Event - Most Recent */}
      {featuredEvent && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Featured Event</h3>
          <EventCard 
            event={featuredEvent} 
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onClick={handleEventClick}
            onRSVP={handleRSVP}
            isRSVPLoading={rsvpLoading.has(featuredEvent.id)}
            currentUser={user}
          />
        </div>
      )}

      {/* Events List */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      ) : remainingEvents.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">More Events</h3>
          {remainingEvents.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onClick={handleEventClick}
              onRSVP={handleRSVP}
              isRSVPLoading={rsvpLoading.has(event.id)}
              currentUser={user}
            />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyEvents />
      ) : null}

      {/* Floating Create Button */}
      <div className="fixed bottom-20 right-4 z-50">
        <CreateEventDialog>
          <Button 
            size="lg" 
            className="rounded-full w-14 h-14 bg-primary text-primary-foreground hover:bg-primary/90 yrdly-shadow-lg"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </CreateEventDialog>
      </div>
    </div>
  );
}
