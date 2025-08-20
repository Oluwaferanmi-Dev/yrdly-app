
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
import { LocationInput, LocationValue } from "./LocationInput";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePosts } from "@/hooks/use-posts";
import type { Post } from "@/types";

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

const CreateEventDialogComponent = memo(function CreateEventDialog({ children, onOpenChange, postToEdit }: CreateEventDialogProps) {
  const { createPost } = usePosts();
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
  }, [isEditMode, postToEdit, open, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const eventData: Partial<Post> = {
        category: "Event",
        text: values.description,
        title: values.title,
        eventLocation: values.location,
        eventDate: values.eventDate,
        eventTime: values.eventTime,
        eventLink: values.eventLink,
        attendees: postToEdit?.attendees || [],
    };
    await createPost(eventData, postToEdit?.id, values.image);
    setLoading(false);
    handleOpenChange(false);
  }

  const handleOpenChange = useCallback((newOpenState: boolean) => {
    setOpen(newOpenState);
    if(onOpenChange) onOpenChange(newOpenState);
  }, [onOpenChange]);

  const finalTitle = isEditMode ? "Edit Event" : "Create Event";
  const finalDescription = isEditMode ? "Make changes to your event." : "Plan and share your neighborhood event.";

  type FormValues = z.infer<typeof formSchema>;

  const FormContent = memo(function FormContent({ formInstance }: { formInstance: UseFormReturn<FormValues> }) {
    return (
      <Form {...formInstance}>
            <form className="space-y-4 px-1">
               <FormField
                  control={formInstance.control}
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
                control={formInstance.control}
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
                control={formInstance.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                          <LocationInput
                              name={field.name}
                              control={formInstance.control}
                              defaultValue={field.value}
                          />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                  <FormField
                      control={formInstance.control}
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
                      control={formInstance.control}
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
                  control={formInstance.control}
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
                control={formInstance.control}
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
  FormContent.displayName = "FormContent";

  const Trigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
    const { userDetails } = useAuth();
    return (
        <div ref={ref} {...props} className="flex items-center gap-4 w-full">
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
  });
  Trigger.displayName = "Trigger";


  if (isMobile) {
    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>{children ? children : <Trigger />}</SheetTrigger>
            <SheetContent side="bottom" className="max-h-screen overflow-y-auto">
                <SheetHeader className="px-4"><SheetTitle>{finalTitle}</SheetTitle></SheetHeader>
                <div className="py-4"><FormContent formInstance={form} /></div>
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
        <div className="py-4"><FormContent formInstance={form} /></div>
        <DialogFooter>
          <Button onClick={form.handleSubmit(onSubmit)} className="w-full" variant="default" disabled={loading}>
            {loading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Event')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
CreateEventDialogComponent.displayName = "CreateEventDialogComponent";

export const CreateEventDialog = CreateEventDialogComponent;

