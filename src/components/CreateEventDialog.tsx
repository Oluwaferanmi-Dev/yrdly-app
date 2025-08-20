
"use client";

import { useForm, UseFormReturn } from "react-hook-form";
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
import { useState, useEffect, memo, useCallback } from "react";
import * as React from 'react';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { LocationInput, LocationValue } from "./LocationInput";
import { useIsMobile } from "@/hooks/use-mobile";
import { Post } from "@/types";

const formSchema = z.object({
  title: z.string().min(1, "Event title can't be empty.").max(100),
  description: z.string().min(1, "Event description can't be empty.").max(1000),
  location: z.custom<LocationValue>().refine(value => value && value.address.length > 0, {
    message: "Location is required.",
  }),
  eventDate: z.string().min(1, "Date can't be empty."),
  eventTime: z.string().min(1, "Time can't be empty."),
  eventLink: z.string().url("Please enter a valid URL.").min(1, "Event link is required."),
  image: z.any().refine((files) => files && (files.length > 0 || (Array.isArray(files) && files.some(f => typeof f === 'string'))), "An image is required for the event."),
});

type CreateEventDialogProps = {
    children?: React.ReactNode;
    onOpenChange?: (open: boolean) => void;
    postToEdit?: Post;
}

export const CreateEventDialog = memo(function CreateEventDialog({ children, onOpenChange, postToEdit }: CreateEventDialogProps) {
  const { user, userDetails } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();
  const isEditMode = !!postToEdit;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: { address: "" },
      eventDate: "",
      eventTime: "",
      eventLink: "",
      image: undefined,
    },
  });

  useEffect(() => {
    if (open) {
        if (isEditMode && postToEdit) {
          form.reset({
            title: postToEdit.title || "",
            description: postToEdit.text || "",
            location: postToEdit.eventLocation,
            eventDate: postToEdit.eventDate || "",
            eventTime: postToEdit.eventTime || "",
            eventLink: postToEdit.eventLink || "",
            image: postToEdit.imageUrls || [],
          });
        } else {
            form.reset({
                title: "",
                description: "",
                location: { address: "" },
                eventDate: "",
                eventTime: "",
                eventLink: "",
                image: undefined,
            });
        }
    }
  }, [isEditMode, postToEdit, open, form.reset]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !userDetails) {
        toast({ variant: 'destructive', title: 'Not authenticated' });
        return;
    }
    setLoading(true);

    try {
        let imageUrls: string[] = postToEdit?.imageUrls || [];
        const imageFiles = values.image;

        if (imageFiles && imageFiles instanceof FileList && imageFiles.length > 0) {
            const uploadedUrls = await Promise.all(
                Array.from(imageFiles).map(async (file) => {
                    const storageRef = ref(storage, `event_images/${user.uid}/${Date.now()}_${file.name}`);
                    await uploadBytes(storageRef, file);
                    return getDownloadURL(storageRef);
                })
            );
            imageUrls = isEditMode ? [...imageUrls, ...uploadedUrls] : uploadedUrls;
        }

        const eventData = {
            ...postToEdit, // Carry over existing fields like attendees, likedBy etc.
            userId: user.uid,
            authorName: userDetails.name,
            authorImage: userDetails.avatarUrl,
            category: "Event",
            text: values.description,
            title: values.title,
            eventLocation: values.location,
            eventDate: values.eventDate,
            eventTime: values.eventTime,
            eventLink: values.eventLink,
            imageUrls: imageUrls,
            imageUrl: imageUrls[0] || "",
            timestamp: isEditMode && postToEdit.timestamp ? postToEdit.timestamp : serverTimestamp(),
        };

        if (isEditMode && postToEdit) {
            const postRef = doc(db, "posts", postToEdit.id);
            await updateDoc(postRef, eventData);
            toast({ title: 'Event updated!' });
        } else {
            await addDoc(collection(db, "posts"), {
                ...eventData,
                likedBy: [],
                commentCount: 0,
                attendees: []
            });
            toast({ title: 'Event created!' });
        }
        
        form.reset();
        setOpen(false);

    } catch(error) {
        console.error("Error submitting event:", error);
        toast({ variant: 'destructive', title: 'Error', description: `Failed to ${isEditMode ? 'update' : 'create'} event.` });
    } finally {
        setLoading(false);
    }
  }

  const handleOpenChange = useCallback((newOpenState: boolean) => {
    setOpen(newOpenState);
    if(onOpenChange) onOpenChange(newOpenState);
    if (!newOpenState) {
        form.reset();
    }
  }, [onOpenChange, form.reset]);
  
  const finalTitle = isEditMode ? "Edit Event" : "Create Event";
  const finalDescription = isEditMode ? "Make changes to your event." : "Plan and share your neighborhood event.";

  type FormValues = z.infer<typeof formSchema>;

const FormContent = memo(function FormContent({ form }: { form: UseFormReturn<FormValues> }) {
    return (
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
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                          <LocationInput 
                              name={field.name}
                              control={form.control}
                              defaultValue={field.value}
                          />
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
                           <FormLabel>Event Link</FormLabel>
                          <FormControl><Input placeholder="Link to tickets or more info" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )}
              />
              <FormField
                control={form.control}
                name="image"
                render={({ field: { onChange, value, ...rest }}) => (
                  <FormItem>
                    <FormLabel>Event Image</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => onChange(e.target.files)}
                        {...rest}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
    )
  });

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
                <SheetHeader className="px-4"><SheetTitle>{finalTitle}</SheetTitle></SheetHeader>
                <div className="py-4"><FormContent form={form} /></div>
                <SheetFooter className="px-4 pb-4">
                    <Button onClick={form.handleSubmit(onSubmit)} className="w-full" variant="default" disabled={loading}>
                        {loading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Event')}
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
          <DialogTitle>{finalTitle}</DialogTitle>
          <DialogDescription>{finalDescription}</DialogDescription>
        </DialogHeader>
        <div className="py-4"><FormContent form={form} /></div>
        <DialogFooter>
          <Button onClick={form.handleSubmit(onSubmit)} className="w-full" variant="default" disabled={loading}>
            {loading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Event')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
