"use client";

import type { Post as PostType } from "@/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, LinkIcon } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface EventCardProps {
  event: PostType;
}

export function EventCard({ event }: EventCardProps) {
  const { user } = useAuth();
  const [attendeeCount, setAttendeeCount] = useState(event.attendees?.length || 0);
  const [isAttending, setIsAttending] = useState(event.attendees?.includes(user?.uid || '') || false);
  const [loadingAttending, setLoadingAttending] = useState(false);

  // Listen for real-time updates to the attendees list
  useEffect(() => {
    const eventRef = doc(db, "posts", event.id);
    const unsubscribe = onSnapshot(eventRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const currentAttendees = (data.attendees as string[]) || [];
        setAttendeeCount(currentAttendees.length);
        setIsAttending(currentAttendees.includes(user?.uid || ''));
      }
    });
    return () => unsubscribe(); // Cleanup the listener
  }, [event.id, user?.uid]);

  const handleAttendingToggle = async () => {
    if (!user) {
      // TODO: Show login prompt or toast
      console.log("User not logged in");
      return;
    }

    setLoadingAttending(true);
    const eventRef = doc(db, "posts", event.id);

    try {
      if (isAttending) {
        // User is currently attending, so unmark them
        await updateDoc(eventRef, {
          attendees: arrayRemove(user.uid)
        });
      } else {
        // User is not attending, so mark them
        await updateDoc(eventRef, {
          attendees: arrayUnion(user.uid)
        });
      }
    } catch (error) {
      console.error("Error updating attendance:", error);
      // TODO: Show error toast
    } finally {
      setLoadingAttending(false);
    }
  };

  return (
    <Card className="flex flex-col">
      {event.imageUrl && (
        <div className="relative w-full h-48 rounded-t-lg overflow-hidden">
          <Image
            src={event.imageUrl}
            alt={event.text}
            fill
            style={{ objectFit: "cover" }}
            data-ai-hint="event image"
          />
        </div>
      )}
      <CardHeader>
         <div className="flex items-center space-x-3 mb-4">
             <Avatar>
                 <AvatarImage src={event.authorImage} alt={event.authorName} data-ai-hint="person portrait"/>
                 <AvatarFallback>{event.authorName.charAt(0)}</AvatarFallback>
             </Avatar>
             <div>
                <p className="text-sm font-semibold">{event.authorName}</p>
                <p className="text-xs text-muted-foreground">{event.timestamp}</p>
             </div>
         </div>
        <h3 className="text-xl font-semibold">{event.text}</h3>
      </CardHeader>
      <CardContent className="space-y-3">
        {event.location && (
          <div className="flex items-center text-muted-foreground text-sm">
            <MapPin className="mr-2 h-4 w-4" /> {event.location}
          </div>
        )}
        {(event.eventDate || event.eventTime) && (
            <div className="flex items-center text-muted-foreground text-sm">
                <Calendar className="mr-2 h-4 w-4" />
                {event.eventDate} {event.eventDate && event.eventTime ? 'at' : ''} {event.eventTime}
            </div>
        )}
        {event.eventLink && (
          <div className="flex items-center text-sm">
            <LinkIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            <a href={event.eventLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
              {event.eventLink}
            </a>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Button
          variant={isAttending ? "secondary" : "default"}
          onClick={handleAttendingToggle}
          disabled={loadingAttending || !user} // Disable if not logged in
        >
          {isAttending ? "Attending" : "Attend"}
        </Button>
        {/* Display attendee count */}
        <span className="text-sm text-muted-foreground">{attendeeCount} {attendeeCount === 1 ? 'attending' : 'attendees'}</span>

        {event.eventLink && !isAttending && ( // Only show More Info if not attending (optional, depends on desired UI)
             <Button variant="outline" asChild>
                <a href={event.eventLink} target="_blank" rel="noopener noreferrer">More Info</a>
             </Button>
        )}
      </CardFooter>
    </Card>
  );
}