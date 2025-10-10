
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
import { usePosts } from "@/hooks/use-posts";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Post } from "@/types";
import Image from "next/image";

const getFormSchema = (isEditMode: boolean, postToEdit?: Post) => z.object({
  text: z.string().min(1, "Item title can't be empty.").max(100),
  description: z.string().optional(),
  price: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
      z.number().positive("Price must be positive.").optional()
  ),
  image: z.any().refine((files) => files && (files.length > 0 || (Array.isArray(files) && files.some(f => typeof f === 'string'))), "An image is required for the item."),
});

type CreateItemDialogProps = {
    children?: React.ReactNode;
    postToEdit?: Post;
    onOpenChange?: (open: boolean) => void;
    open?: boolean; // Add open prop for programmatic control
}

const CreateItemDialogComponent = ({ children, postToEdit, onOpenChange, open: externalOpen }: CreateItemDialogProps) => {
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
      text: "",
      description: "",
      price: "" as any, // Use empty string instead of undefined to avoid controlled/uncontrolled warning
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
          stableFormReset({
            text: postToEdit.text,
            description: postToEdit.description,
            price: postToEdit.price,
            image: postToEdit.image_urls || [],
          });
        } else if (!isEditMode) {
          stableFormReset({
            text: "",
            description: "",
            price: "",
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
    
    const postData: Partial<Post> = {
        text: values.text,
        description: values.description,
        category: "For Sale",
        price: values.price || 0,
        image_urls: filteredImageUrls,
    };
    await createPost(postData, postToEdit?.id, validImageFiles);
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

  const finalTitle = isEditMode ? "Edit Item" : "Create Item for Sale";
  const finalDescription = isEditMode ? "Make changes to your item here." : "Sell something in your neighborhood.";

  const imageField = form.register('image');



  const Trigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
    const { profile: userDetails } = useAuth();
    return (
     <div ref={ref} {...props} className="flex items-center gap-4 w-full">
        <Avatar>
            <AvatarImage src={userDetails?.avatar_url || 'https://placehold.co/100x100.png'}/>
            <AvatarFallback>{userDetails?.name?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 text-left text-muted-foreground cursor-pointer hover:bg-muted p-2 rounded-md border border-dashed">
            Sell something...
        </div>
        <Button variant="ghost" size="icon"><PlusCircle className="h-6 w-6 text-primary" /></Button>
    </div>
    )
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
                                    <FormLabel>Item Title</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g. Slightly used armchair" {...field} />
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
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                    <Textarea
                                        placeholder="Add more details about the item, its condition, etc."
                                        className="resize-none min-h-[100px]"
                                        {...field}
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price (Optional)</FormLabel>
                                    <FormControl>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₦</span>
                                        <Input type="number" placeholder="Leave blank for Free" className="pl-7" {...field} />
                                    </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="image"
                                render={() => (
                                <FormItem>
                                    <FormLabel>
                                        Add images <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            {...imageField}
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
                    <SheetFooter className="p-4 border-t mt-auto">
                        <Button type="submit" className="w-full" variant="default" disabled={loading}>
                            {loading ? (isEditMode ? 'Saving...' : 'Listing Item...') : (isEditMode ? 'Save Changes' : 'List Item')}
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
                            <FormLabel>Item Title</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g. Slightly used armchair" {...field} />
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
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                            <Textarea
                                placeholder="Add more details about the item, its condition, etc."
                                className="resize-none min-h-[100px]"
                                {...field}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Price (Optional)</FormLabel>
                            <FormControl>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₦</span>
                                <Input type="number" placeholder="Leave blank for Free" className="pl-7" {...field} />
                            </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="image"
                        render={() => (
                        <FormItem>
                            <FormLabel>
                                Add images <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    {...imageField}
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
                    {loading ? (isEditMode ? 'Saving...' : 'Listing Item...') : (isEditMode ? 'Save Changes' : 'List Item')}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export const CreateItemDialog = memo(CreateItemDialogComponent);
