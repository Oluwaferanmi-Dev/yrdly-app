
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
import { PlusCircle, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuth } from "@/hooks/use-supabase-auth";
import { useState, useEffect, memo, useCallback, useMemo } from "react";
import * as React from 'react';
import { LocationInput, LocationValue } from "./LocationInput";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePosts } from "@/hooks/use-posts";
import type { Post } from "@/types";
import Image from "next/image";

const getFormSchema = (isEditMode: boolean, postToEdit?: Post) => z.object({
  title: z.string().min(1, "Event title can't be empty.").max(100),
  description: z.string().min(1, "Event description can't be empty.").max(1000),
  location: z.custom<LocationValue>().refine(value => value && value.address.length > 0, {
    message: "Location is required.",
  }),
  eventDateTime: z.string().min(1, "Date and time are required."),
  eventLink: z.string().url("Please enter a valid URL.").min(1, "Event link is required."),
  image: z.any().refine((files) => files && (files.length > 0 || (Array.isArray(files) && files.some(f => typeof f === 'string'))), "An image is required for the event."),
});

type CreateEventDialogProps = {
    children?: React.ReactNode;
    onOpenChange?: (open: boolean) => void;
    postToEdit?: Post;
    open?: boolean; // Add open prop for programmatic control
}

const CreateEventDialogComponent = memo(function CreateEventDialog({ children, onOpenChange, postToEdit, open: externalOpen }: CreateEventDialogProps) {
  const { createPost } = usePosts();
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [removedImageIndexes, setRemovedImageIndexes] = useState<number[]>([]);
  const isMobile = useIsMobile();
  const isEditMode = !!postToEdit;
  
  // Use external open prop if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;

  // Create form schema once and stabilize it
  const formSchema = useMemo(() => getFormSchema(isEditMode, postToEdit), [isEditMode, postToEdit]);

  // Create form once and stabilize it - don't recreate on every render
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: { address: "" },
      eventDateTime: "",
      eventLink: "",
      image: undefined,
    },
  });

  // Stabilize form.reset function to prevent dependency issues
  const stableFormReset = useCallback((values: any) => {
    form.reset(values);
  }, [form]);

  // Fix useEffect dependencies - only reset when dialog opens, not on every change
  useEffect(() => {
    if (open) {
      // Use setTimeout to ensure this runs after the dialog is fully opened
      const timer = setTimeout(() => {
        if (isEditMode && postToEdit) {
          // Combine date and time for datetime-local input
          const eventDateTime = postToEdit.event_date && postToEdit.event_time 
            ? `${postToEdit.event_date}T${postToEdit.event_time}`
            : '';
          
          stableFormReset({
            title: postToEdit.title,
            description: postToEdit.text || postToEdit.description || "",
            location: postToEdit.event_location,
            eventDateTime: eventDateTime,
            eventLink: postToEdit.event_link,
            image: postToEdit.image_urls || [],
          });
        } else if (!isEditMode) {
          stableFormReset({
            title: "",
            description: "",
            location: { address: "" },
            eventDateTime: "",
            eventLink: "",
            image: undefined,
          });
        }
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [open, isEditMode, postToEdit, stableFormReset]); // Include all dependencies

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    
    // Filter out removed images
    let filteredImageUrls: string[] = [];
    if (postToEdit?.image_urls) {
      filteredImageUrls = postToEdit.image_urls.filter((_, index) => !removedImageIndexes.includes(index));
    }
    
    // Validate image files
    let validImageFiles: FileList | undefined;
    if (values.image && values.image.length > 0) {
      // Filter out invalid files
      const validFiles = Array.from(values.image).filter(file => 
        file && file instanceof File && file.name && file.size > 0
      );
      
      if (validFiles.length > 0) {
        // Create a new FileList-like object
        const dataTransfer = new DataTransfer();
        validFiles.forEach(file => dataTransfer.items.add(file as File));
        validImageFiles = dataTransfer.files;
      }
    }
    
    // Parse datetime-local input to separate date and time
    const eventDateTime = new Date(values.eventDateTime);
    const eventDate = eventDateTime.toISOString().split('T')[0];
    const eventTime = eventDateTime.toTimeString().split(' ')[0].substring(0, 5);
    
    const eventData: Partial<Post> = {
        category: "Event",
        text: values.description,
        title: values.title,
        event_location: values.location,
        event_date: eventDate,
        event_time: eventTime,
        event_link: values.eventLink,
        attendees: postToEdit?.attendees || [],
        image_urls: filteredImageUrls,
    };
    await createPost(eventData, postToEdit?.id, validImageFiles);
    setLoading(false);
    handleOpenChange(false);
  }

  const handleOpenChange = useCallback((newOpenState: boolean) => {
    if (externalOpen !== undefined) {
      // External control - only call onOpenChange
      if (onOpenChange) {
        onOpenChange(newOpenState);
      }
    } else {
      // Internal control - update internal state
      setInternalOpen(newOpenState);
      if (onOpenChange) {
        onOpenChange(newOpenState);
      }
    }
    
    if (!newOpenState) {
      form.reset();
    }
  }, [onOpenChange, externalOpen, form]);

  const finalTitle = isEditMode ? "Edit Event" : "Create Event";
  const finalDescription = isEditMode ? "Make changes to your event." : "Plan and share your neighborhood event.";

  type FormValues = z.infer<typeof formSchema>;



  const Trigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
    const { profile: userDetails } = useAuth();
    return (
        <div ref={ref} {...props} className="flex items-center gap-4 w-full">
            <Avatar>
                <AvatarImage src={userDetails?.avatar_url || 'https://placehold.co/100x100.png'}/>
                <AvatarFallback>{userDetails?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left text-muted-foreground cursor-pointer hover:bg-muted p-2 rounded-md border border-dashed">
                Organize an event in your neighborhood?
            </div>
             <Button variant="ghost" size="icon"><PlusCircle className="h-6 w-6 text-primary" /></Button>
        </div>
    );
  });
  Trigger.displayName = "Trigger";


  if (isMobile) {
    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>{children ? children : <Trigger />}</SheetTrigger>
            <SheetContent side="bottom" className="p-0 flex flex-col h-[90vh] max-h-screen">
                <SheetHeader className="p-4 border-b flex-shrink-0">
                    <SheetTitle>{finalTitle}</SheetTitle>
                    <DialogDescription>{finalDescription}</DialogDescription>
                </SheetHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-4 px-1 pb-4">
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
                                </FormItem>
                              )}
                            />
                            <FormField
                                control={form.control}
                                name="eventDateTime"
                                render={({ field }) => (
                                  <FormItem>
                                     <FormLabel>Date & Time</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="datetime-local" 
                                            {...field}
                                            min={new Date().toISOString().slice(0, 16)}
                                        />
                                    </FormControl>
                                     <FormMessage />
                                  </FormItem>
                                )}
                              />
                            <FormField
                                control={form.control}
                                name="eventLink"
                                render={({ field }) => (
                                    <FormItem>
                                         <FormLabel>Event Link</FormLabel>
                                        <FormControl><Input placeholder="Link to tickets or more info" {...field} /></FormControl>
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
                            {postToEdit?.image_urls && postToEdit.image_urls.length > 0 && (
                                <div className="space-y-3">
                                    <div className="text-sm text-muted-foreground">
                                        Current images ({postToEdit.image_urls.length}):
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {postToEdit.image_urls.map((url, index) => {
                                            const isRemoved = removedImageIndexes.includes(index);
                                            return (
                                                <div key={index} className={`relative group ${isRemoved ? 'opacity-50' : ''}`}>
                                                    <Image
                                                        src={url}
                                                        alt={`Current image ${index + 1}`}
                                                        width={100}
                                                        height={100}
                                                        className="w-full h-20 object-cover rounded-lg"
                                                    />
                                                    {!isRemoved && (
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => {
                                                                setRemovedImageIndexes(prev => [...prev, index]);
                                                            }}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                    {isRemoved && (
                                                        <div className="absolute inset-0 bg-red-500/20 rounded-lg flex items-center justify-center">
                                                            <X className="h-6 w-6 text-red-500" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Upload more images to add to the list.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <SheetFooter className="p-4 border-t flex-shrink-0">
                        <Button type="submit" className="w-full" variant="default" disabled={loading}>
                            {loading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Event')}
                        </Button>
                    </SheetFooter>
                  </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {externalOpen === undefined && (
        <DialogTrigger asChild>{children ? children : <Trigger />}</DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[525px] p-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle>{finalTitle}</DialogTitle>
          <DialogDescription>{finalDescription}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
                <div className="space-y-4 px-1 pb-4">
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
                        </FormItem>
                      )}
                    />
                    <FormField
                        control={form.control}
                        name="eventDateTime"
                        render={({ field }) => (
                          <FormItem>
                             <FormLabel>Date & Time</FormLabel>
                            <FormControl>
                                <Input 
                                    type="datetime-local" 
                                    {...field}
                                    min={new Date().toISOString().slice(0, 16)}
                                />
                            </FormControl>
                             <FormMessage />
                          </FormItem>
                        )}
                      />
                    <FormField
                        control={form.control}
                        name="eventLink"
                        render={({ field }) => (
                            <FormItem>
                                 <FormLabel>Event Link</FormLabel>
                                <FormControl><Input placeholder="Link to tickets or more info" {...field} /></FormControl>
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
                    {postToEdit?.image_urls && postToEdit.image_urls.length > 0 && (
                        <div className="space-y-3">
                            <div className="text-sm text-muted-foreground">
                                Current images ({postToEdit.image_urls.length}):
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {postToEdit.image_urls.map((url, index) => {
                                    const isRemoved = removedImageIndexes.includes(index);
                                    return (
                                        <div key={index} className={`relative group ${isRemoved ? 'opacity-50' : ''}`}>
                                            <Image
                                                src={url}
                                                alt={`Current image ${index + 1}`}
                                                width={100}
                                                height={100}
                                                className="w-full h-20 object-cover rounded-lg"
                                            />
                                            {!isRemoved && (
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => {
                                                        setRemovedImageIndexes(prev => [...prev, index]);
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                            {isRemoved && (
                                                <div className="absolute inset-0 bg-red-500/20 rounded-lg flex items-center justify-center">
                                                    <X className="h-6 w-6 text-red-500" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Upload more images to add to the list.
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <DialogFooter className="p-6 pt-0 border-t flex-shrink-0">
              <Button type="submit" className="w-full" variant="default" disabled={loading}>
                {loading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Event')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});
CreateEventDialogComponent.displayName = "CreateEventDialogComponent";

export const CreateEventDialog = CreateEventDialogComponent;

