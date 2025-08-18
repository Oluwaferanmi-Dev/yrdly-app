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
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { PlusCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { LocationPicker } from "./LocationPicker";
import { useIsMobile } from "@/hooks/use-mobile";

const formSchema = z.object({
  title: z.string().min(1, "Event title can't be empty.").max(100),
  description: z.string().min(1, "Event description can't be empty.").max(1000),
  eventDate: z.string().min(1, "Date can't be empty."),
  eventTime: z.string().min(1, "Time can't be empty."),
  eventLink: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  image: z.any().refine((files) => {
    if (typeof window === 'undefined') return true;
    return files instanceof FileList && files.length > 0;
  }, "An image is required for the event."),
});

type CreateEventDialogProps = {
    children?: React.ReactNode;
    onOpenChange?: (open: boolean) => void;
}

export function CreateEventDialog({ children, onOpenChange }: CreateEventDialogProps) {
  const { user, userDetails } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eventLocation, setEventLocation] = useState<{ address: string; latitude: number; longitude: number; } | null>(null);
  const isMobile = useIsMobile();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      eventDate: "",
      eventTime: "",
      eventLink: "",
      image: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !userDetails) {
        toast({ variant: 'destructive', title: 'Not authenticated' });
        return;
    }
    if (!eventLocation) {
        toast({ variant: 'destructive', title: 'Location required', description: 'Please select a location for the event.' });
        return;
    }
    setLoading(true);

    try {
        const imageUrls: string[] = [];
        const imageFiles = values.image as FileList;
        if (imageFiles && imageFiles.length > 0) {
            for (const file of Array.from(imageFiles)) {
                const storageRef = ref(storage, `event_images/${user.uid}/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                const downloadUrl = await getDownloadURL(snapshot.ref);
                imageUrls.push(downloadUrl);
            }
        }

        const eventData = {
            authorId: user.uid,
            authorName: userDetails.name,
            authorImage: userDetails.avatarUrl,
            category: "Event",
            text: values.description,
            title: values.title,
            eventLocation: eventLocation,
            eventDate: values.eventDate,
            eventTime: values.eventTime,
            eventLink: values.eventLink || "",
            imageUrls: imageUrls,
            imageUrl: imageUrls[0] || "",
            timestamp: serverTimestamp(),
            likedBy: [],
            commentCount: 0,
            attendees: []
        };

        await addDoc(collection(db, "posts"), eventData);
        toast({ title: 'Event created!' });
        form.reset();
        setEventLocation(null);
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
    if(onOpenChange) onOpenChange(newOpenState);
    if (!newOpenState) {
        form.reset();
        setEventLocation(null);
    }
  }

  const FormContent = () => (
     <Form {...form}>
          <form className="space-y-4 px-1">
             <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title</FormLabel>
                    <FormControl><Input placeholder="e.g. Neighborhood Block Party" {...field} /></FormControl>
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
                  <FormControl><Textarea placeholder="Tell everyone about your event..." className="resize-none min-h-[100px]" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl><LocationPicker onLocationSelect={setEventLocation} /></FormControl>
                <FormMessage />
            </FormItem>
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="eventDate"
                    render={({ field }) => (
                      <FormItem>
                         <FormLabel>Date</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
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
                        <FormControl><Input type="time" {...field} /></FormControl>
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
                        <FormControl><Input placeholder="Link to tickets or more info" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Image</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => field.onChange(e.target.files)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
  );

  const Trigger = () => (
     <div className="flex items-center gap-4 w-full">
        <Avatar>
            <AvatarImage src={userDetails?.avatarUrl || 'https://placehold.co/100x100.png'}/>
            <AvatarFallback>{userDetails?.name?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 text-left text-muted-foreground cursor-pointer hover:bg-muted p-2 rounded-md border border-dashed">
            Organize an event in your neighborhood?
        </div>
         <Button variant="ghost" size="icon"><PlusCircle className="h-6 w-6 text-primary" /></Button>
    </div>
  );

  if (isMobile) {
    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>{children ? children : <Trigger />}</SheetTrigger>
            <SheetContent side="bottom" className="max-h-screen overflow-y-auto">
                <SheetHeader className="px-4"><SheetTitle>Create Event</SheetTitle></SheetHeader>
                <div className="py-4"><FormContent /></div>
                <SheetFooter className="px-4 pb-4">
                    <Button onClick={form.handleSubmit(onSubmit)} className="w-full" variant="default" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Event'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children ? children : <Trigger />}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
          <DialogDescription>Plan and share your neighborhood event.</DialogDescription>
        </DialogHeader>
        <div className="py-4"><FormContent /></div>
        <DialogFooter>
          <Button onClick={form.handleSubmit(onSubmit)} className="w-full" variant="default" disabled={loading}>
            {loading ? 'Creating...' : 'Create Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
