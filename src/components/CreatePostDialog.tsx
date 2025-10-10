
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
import { useAuth } from "@/hooks/use-supabase-auth";
import { useState, useEffect, memo, useCallback, useMemo } from "react";
import * as React from 'react';
// Removed usePosts import - will receive createPost as prop
import { useIsMobile } from "@/hooks/use-mobile";
import type { Post } from "@/types";

const getFormSchema = (isEditMode: boolean, postToEdit?: Post) => z.object({
  text: z.string().min(1, "Text can't be empty.").max(500),
  imageFiles: z.any().optional(),
  category: z.enum(['General', 'Event', 'For Sale', 'Business']).default('General'),
});

type CreatePostDialogProps = {
    children?: React.ReactNode;
    postToEdit?: Post;
    onOpenChange?: (open: boolean) => void;
    createPost: (postData: any, postId?: string, imageFiles?: FileList) => Promise<void>;
    open?: boolean; // Add open prop for programmatic control
}

const CreatePostDialogComponent = ({ children, postToEdit, onOpenChange, createPost, open: externalOpen }: CreatePostDialogProps) => {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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
      text: "",
      imageFiles: undefined,
      category: "General" as const,
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
          stableFormReset({
            text: postToEdit.text,
            imageFiles: undefined, // Don't set existing URLs as files
            category: postToEdit.category || "General",
          });
        } else if (!isEditMode) {
          stableFormReset({
            text: "",
            imageFiles: undefined,
            category: "General",
          });
        }
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [open, isEditMode, postToEdit, stableFormReset]); // Include all dependencies

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    // Only pass imageFiles if images are actually selected
    const imageFiles = values.imageFiles && values.imageFiles.length > 0 ? values.imageFiles : undefined;
    
    // For editing, include existing image_urls
    const postData = {
      ...values,
      image_urls: isEditMode && postToEdit?.image_urls ? postToEdit.image_urls : undefined
    };
    
    await createPost(postData, postToEdit?.id, imageFiles);
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

  const finalTitle = isEditMode ? "Edit Post" : "Create Post";
  const finalDescription = isEditMode ? "Make changes to your post here." : "Share something with your neighborhood.";



  const Trigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
    const { user, profile } = useAuth();
    return (
        <div ref={ref} {...props} className="flex items-center gap-4 w-full">
            <Avatar>
                <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url || 'https://placehold.co/100x100.png'}/>
                <AvatarFallback>{profile?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left text-muted-foreground cursor-pointer hover:bg-muted p-2 rounded-md border border-dashed">
                What&apos;s happening in your neighborhood?
            </div>
            <Button variant="ghost" size="icon"><PlusCircle className="h-6 w-6 text-primary" /></Button>
        </div>
    );
  });
  Trigger.displayName = 'Trigger';

  if (isMobile) {
    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
                { children || <Trigger /> }
            </SheetTrigger>
            <SheetContent side="bottom" className="p-0 flex flex-col max-h-screen">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle>{finalTitle}</SheetTitle>
                    <DialogDescription>
                        {finalDescription}
                    </DialogDescription>
                </SheetHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col">
                    <div className="p-4 flex-1 overflow-y-auto">
                        <div className="space-y-4 px-1">
                            <FormField
                                control={form.control}
                                name="text"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Post</FormLabel>
                                    <FormControl>
                                    <Textarea
                                        placeholder="What's happening in the neighborhood?"
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
                                name="imageFiles"
                                render={({ field: { onChange, value, ...rest } }) => (
                                <FormItem>
                                    <FormLabel>Add images</FormLabel>
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
                                <div className="text-sm text-muted-foreground">
                                    Current images: {postToEdit.image_urls.length}. Upload more to add to the list.
                                </div>
                            )}
                        </div>
                    </div>
                    <SheetFooter className="p-4 border-t mt-auto">
                        <Button type="submit" className="w-full" variant="default" disabled={loading}>
                            {loading ? (isEditMode ? 'Saving...' : 'Posting...') : (isEditMode ? 'Save Changes' : 'Create Post')}
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
        <DialogTrigger asChild>
          { children || <Trigger /> }
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[525px] p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>{finalTitle}</DialogTitle>
              <DialogDescription>
                 {finalDescription}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto p-6">
                <div className="space-y-4 px-1">
                    <FormField
                        control={form.control}
                        name="text"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Post</FormLabel>
                            <FormControl>
                            <Textarea
                                placeholder="What's happening in the neighborhood?"
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
                        name="imageFiles"
                        render={({ field: { onChange, value, ...rest } }) => (
                        <FormItem>
                            <FormLabel>Add images</FormLabel>
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
                        <div className="text-sm text-muted-foreground">
                            Current images: {postToEdit.image_urls.length}. Upload more to add to the list.
                        </div>
                    )}
                </div>
            </div>
            <DialogFooter className="p-6 pt-0 border-t">
                <Button type="submit" className="w-full" variant="default" disabled={loading}>
                    {loading ? (isEditMode ? 'Saving...' : 'Posting...') : (isEditMode ? 'Save Changes' : 'Create Post')}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export const CreatePostDialog = memo(CreatePostDialogComponent);
