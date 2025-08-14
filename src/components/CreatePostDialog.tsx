
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import * as React from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Post, PostCategory } from "@/types";
import { usePosts } from "@/hooks/use-posts";
import { useIsMobile } from "@/hooks/use-mobile";

type CreatePostDialogProps = {
    children?: React.ReactNode;
    preselectedCategory?: PostCategory;
    postToEdit?: Post;
    onOpenChange?: (open: boolean) => void;
    title?: string;
    description?: string;
}

export function CreatePostDialog({ children, preselectedCategory, postToEdit, onOpenChange, title, description }: CreatePostDialogProps) {
  const { user, userDetails } = useAuth();
  const { toast } = useToast();
  const { createPost: createPostHook, updatePost } = usePosts();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();
  
  const isEditMode = !!postToEdit;

  // Define the schema inside the component to access props like postToEdit
  const formSchema = z.object({
    text: z.string().min(1, "Post can't be empty.").max(500),
    category: z.enum(["General", "Event", "For Sale", "Business"]),
    price: z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z.number().positive("Price must be positive.").optional()
    ),
    image: z.any().optional(),
  }).superRefine((data, ctx) => {
      // On the server, data.image will be undefined, so this check will pass.
      // On the client, it will be a FileList.
      const hasNewImage = typeof window !== 'undefined' && data.image && data.image.length > 0;
      const hasExistingImages = isEditMode && postToEdit?.imageUrls && postToEdit.imageUrls.length > 0;

      if ((data.category === 'Event' || data.category === 'For Sale' || data.category === 'Business') && !hasNewImage && !hasExistingImages) {
          ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['image'],
              message: 'An image is required for this post category.',
          });
      }
      if (data.category === 'For Sale' && (data.price === undefined || data.price <= 0)) {
          ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['price'],
              message: 'A valid price is required for "For Sale" items.',
          });
      }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      category: preselectedCategory || "General",
      price: undefined,
      image: undefined,
    },
  });

   useEffect(() => {
    if (open) {
        const defaultValues = isEditMode
          ? {
              text: postToEdit.text,
              category: postToEdit.category,
              price: postToEdit.price || undefined,
              image: undefined,
            }
          : {
              text: "",
              category: preselectedCategory || "General",
              price: undefined,
              image: undefined,
            };
        form.reset(defaultValues);
    }
  }, [postToEdit, preselectedCategory, form, isEditMode, open]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Not authenticated' });
        return;
    }
    setLoading(true);

    try {
        let imageUrls: string[] = postToEdit?.imageUrls || [];
        const imageFiles = values.image;

        if (imageFiles && imageFiles instanceof FileList && imageFiles.length > 0) {
            if (values.category === 'For Sale') {
                const uploadedUrls = await Promise.all(
                    Array.from(imageFiles).map(async (file) => {
                        const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${file.name}`);
                        await uploadBytes(storageRef, file);
                        return getDownloadURL(storageRef);
                    })
                );
                imageUrls = [...imageUrls, ...uploadedUrls];
            } else {
                const imageFile = imageFiles[0];
                const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${imageFile.name}`);
                await uploadBytes(storageRef, imageFile);
                imageUrls = [await getDownloadURL(storageRef)];
            }
        }

        const postData: Partial<Post> = {
            text: values.text,
            category: values.category,
            imageUrls: imageUrls,
            imageUrl: imageUrls[0] || "", // For backwards compatibility
        };

        if(values.category === 'For Sale' && values.price) {
            postData.price = values.price;
        }

        if (isEditMode) {
            await updatePost(postToEdit.id, postData);
            toast({ title: 'Post updated!' });
        } else {
            await createPostHook(postData as Omit<Post, 'id' | 'userId' | 'authorName' | 'authorImage' | 'timestamp' | 'commentCount' | 'likedBy'>);
            toast({ title: 'Post created!' });
        }

        form.reset();
        setOpen(false);

    } catch(error) {
        console.error("Error submitting post:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit post.' });
    } finally {
        setLoading(false);
    }
  }
  
  const handleOpenChange = (newOpenState: boolean) => {
    setOpen(newOpenState);
    if(onOpenChange) {
        onOpenChange(newOpenState);
    }
  }
  
  const finalTitle = title || (isEditMode ? 'Edit Post' : 'Create Post');
  const finalDescription = description || (isEditMode ? 'Make changes to your post here.' : 'Share an update with your neighborhood.');

  const imageField = form.register('image');

  const FormContent = (
    <>
      <div className="space-y-4 px-1">
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="What&apos;s happening in the neighborhood?"
                  className="resize-none min-h-[120px] border-none shadow-none focus-visible:ring-0 p-4"
                  {...field}
                />
              </FormControl>
              <FormMessage className="px-4" />
            </FormItem>
          )}
        />
        <div className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Event">Event</SelectItem>
                          <SelectItem value="For Sale">For Sale</SelectItem>
                          <SelectItem value="Business">Business</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                {form.watch('category') === 'For Sale' && (
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                             <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                                <Input type="number" placeholder="Price" className="pl-7" {...field} />
                             </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                )}
            </div>
            
            <FormField
              control={form.control}
              name="image"
              render={() => (
                <FormItem>
                    <FormLabel>
                        Add an image
                        {(form.watch('category') === 'Event' || form.watch('category') === 'For Sale') && <span className="text-destructive">*</span>}
                    </FormLabel>
                    <FormControl>
                        <Input 
                            type="file" 
                            accept="image/*" 
                            multiple={form.watch('category') === 'For Sale'}
                            {...imageField}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
              )}
            />
            {postToEdit?.imageUrls && postToEdit.imageUrls.length > 0 && (
                <div className="text-sm text-muted-foreground">
                    Current images: {postToEdit.imageUrls.map((url, index) => (
                        <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="underline p-1">
                            image {index + 1}
                        </a>
                    ))}
                </div>
            )}
        </div>
      </div>
    </>
  );

  const Trigger = React.forwardRef<HTMLDivElement>((props, ref) => (
     <div ref={ref} {...props} className="flex items-center gap-4 w-full">
        <Avatar>
            <AvatarImage src={userDetails?.avatarUrl || 'https://placehold.co/100x100.png'}/>
            <AvatarFallback>{userDetails?.name?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 text-left text-muted-foreground cursor-pointer hover:bg-muted p-2 rounded-md border border-dashed">
            What&apos;s happening in your neighborhood?
        </div>
        <Button variant="ghost" size="icon"><PlusCircle className="h-6 w-6 text-primary" /></Button>
    </div>
  ));
  Trigger.displayName = 'Trigger';

  if (isMobile) {
    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
                { children || <Trigger /> }
            </SheetTrigger>
            <SheetContent side="bottom" className="p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle>{finalTitle}</SheetTitle>
                    <DialogDescription>
                        {finalDescription}
                    </DialogDescription>
                </SheetHeader>
                <Form {...form}>
                  <form className="flex-1 flex flex-col">
                    <div className="py-4 flex-1 overflow-y-auto">
                        {FormContent}
                    </div>
                    <SheetFooter className="p-4 border-t mt-auto">
                        <Button type="button" onClick={form.handleSubmit(onSubmit)} className="w-full" variant="default" disabled={loading}>
                            {loading ? (isEditMode ? 'Saving...' : 'Posting...') : (isEditMode ? 'Save Changes' : 'Post')}
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
      <DialogTrigger asChild>
        { children || <Trigger /> }
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] p-0">
        <Form {...form}>
          <form>
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>{finalTitle}</DialogTitle>
              <DialogDescription>
                 {finalDescription}
              </DialogDescription>
            </DialogHeader>
            {FormContent}
            <DialogFooter className="p-6 pt-0">
                <Button type="button" onClick={form.handleSubmit(onSubmit)} className="w-full" variant="default" disabled={loading}>
                    {loading ? (isEditMode ? 'Saving...' : 'Posting...') : (isEditMode ? 'Save Changes' : 'Post')}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
