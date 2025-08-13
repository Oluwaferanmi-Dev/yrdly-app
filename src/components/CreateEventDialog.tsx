"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MapPin, PlusCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(1, "Event title can't be empty.").max(100),
  description: z.string().min(1, "Event description can't be empty.").max(1000),
  location: z.string().min(1, "Location can't be empty."),
  eventDate: z.string().min(1, "Date can't be empty."),
  eventTime: z.string().min(1, "Time can't be empty."),
  eventLink: z.string().optional(),
});

type CreateEventDialogProps = {
    children?: React.ReactNode;
    onOpenChange?: (open: boolean) => void;
}

export function CreateEventDialog({ children, onOpenChange }: CreateEventDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      eventDate: "",
      eventTime: "",
      eventLink: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Not authenticated', description: 'You must be logged in to create an event.' });
        return;
    }
    setLoading(true);

    try {
        let imageUrl = "";
        if (imageFile) {
            const storageRef = ref(storage, `event_images/${user.uid}/${Date.now()}_${imageFile.name}`);
            const snapshot = await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(snapshot.ref);
        }

        const eventData = {
            userId: user.uid,
            authorName: user.displayName || "Anonymous User",
            authorImage: user.photoURL || `https://placehold.co/100x100.png?text=${user.displayName?.charAt(0) || "A"}`,
            category: "Event",
            title: values.title,
            text: values.description,
            location: values.location,
            eventDate: values.eventDate,
            eventTime: values.eventTime,
            eventLink: values.eventLink || "",
            imageUrl: imageUrl,
            timestamp: serverTimestamp(),
            likes: 0,
            likedBy: [],
            commentCount: 0,
            attendees: []
        };

        await addDoc(collection(db, "posts"), eventData);

        toast({ title: 'Event created!', description: 'Your event is now live.' });

        form.reset();
        setImageFile(null);
        setOpen(false);

    } catch(error) {
        console.error("Error creating event:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to create event.' });
    } finally {
        setLoading(false);
    }
  }

  const handleOpenChange = (newOpenState: boolean) => {
    setOpen(newOpenState);
    if(onOpenChange) {
        onOpenChange(newOpenState);
    }
    if (!newOpenState) {
        form.reset();
        setImageFile(null);
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
        setImageFile(e.target.files[0]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        { children ? children : (
            <div className="flex items-center gap-4 w-full">
                <Avatar>
                    <AvatarImage src={user?.photoURL || 'https://placehold.co/100x100.png'} data-ai-hint="person portrait"/>
                    <AvatarFallback>{user?.displayName?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left text-muted-foreground cursor-pointer hover:bg-muted p-2 rounded-md border border-dashed">
                    Organize an event in your neighborhood?
                </div>
                 <Button variant="ghost" size="icon"><PlusCircle className="h-6 w-6 text-primary" /></Button>
            </div>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
          <DialogDescription>
             Plan and share your neighborhood event.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Neighborhood Block Party" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                   <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell everyone about your event..."
                      className="resize-none min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                     <FormLabel>Location</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                            <Input placeholder="Event location" className="pl-8" {...field} />
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="eventDate"
                    render={({ field }) => (
                      <FormItem>
                         <FormLabel>Date</FormLabel>
                        <FormControl>
                           <Input type="date" {...field} />
                        </FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                 <FormField
                    control={form.control}
                    name="eventTime"
                    render={({ field }) => (
                      <FormItem>
                         <FormLabel>Time</FormLabel>
                        <FormControl>
                           <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
            </div>


            <FormField
                control={form.control}
                name="eventLink"
                render={({ field }) => (
                    <FormItem>
                         <FormLabel>Event Link (Optional)</FormLabel>
                        <FormControl>
                            <Input placeholder="Link to tickets or more info" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormItem>
                <FormLabel>Add an image (Optional)</FormLabel>
                <FormControl>
                    <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                </FormControl>
            </FormItem>


            <DialogFooter>
              <Button type="submit" className="w-full" variant="default" disabled={loading}>
                {loading ? 'Creating...' : 'Create Event'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
