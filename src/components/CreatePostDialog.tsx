
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
import { useState, useEffect, memo } from "react";
import * as React from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Post, PostCategory, Business } from "@/types";
import { usePosts } from "@/hooks/use-posts";
import { useIsMobile } from "@/hooks/use-mobile";
import { LocationInput, LocationValue } from "./LocationInput";

type CreatePostDialogProps = {
    children?: React.ReactNode;
    preselectedCategory?: PostCategory;
    postToEdit?: Post | Business;
    postType?: 'Post' | 'Business';
    onOpenChange?: (open: boolean) => void;
    title?: string;
    description?: string;
}

const formSchema = z.object({
  text: z.string().min(1, "Title can't be empty.").max(500),
  description: z.string().optional(),
  category: z.enum(["General", "Event", "For Sale", "Business"]),
  price: z.preprocess(
      (val) => (val === "" ? undefined : Number(val)),
      z.number().positive("Price must be positive.").optional()
  ),
  image: z.any().optional(),
  // Business specific
  name: z.string().optional(),
  businessCategory: z.string().optional(),
  location: z.custom<LocationValue>().optional(),

}).superRefine((data, ctx) => {
    const isBusiness = data.category === 'Business';
    // This is a simplified check. A more robust way might be needed if posts can also have names.
    const isEditMode = (data as any).isEditMode || false; 

    // Check for existing images only matters in edit mode.
    const hasExistingImages = isEditMode && (data as any).postToEdit?.imageUrls && (data as any).postToEdit.imageUrls.length > 0;
    const hasNewImage = typeof window !== 'undefined' && data.image && data.image.length > 0;

    if (isBusiness) {
      if (!data.name) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: "Business name can't be empty." });
      if (!data.businessCategory) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['businessCategory'], message: "Category can't be empty." });
      if (!data.location || !data.location.address) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['location'], message: "Location is required for a business." });
       if (!hasNewImage && !hasExistingImages) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['image'], message: 'An image is required for a business.' });
      }
    } else if (data.category === 'For Sale') {
       if (!hasNewImage && !hasExistingImages) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['image'], message: 'An image is required for "For Sale" items.' });
      }
      // Price is optional, so no validation needed here unless it's not a positive number (handled by z.number().positive())
    }
});


const CreatePostDialogComponent = ({ 
    children, 
    preselectedCategory, 
    postToEdit, 
    postType = 'Post',
    onOpenChange, 
    title, 
    description 
}: CreatePostDialogProps) => {
  const { user, userDetails } = useAuth();
  const { toast } = useToast();
  const { createPost, updatePost, createBusiness, updateBusiness } = usePosts();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();
  
  const isEditMode = !!postToEdit;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      description: "",
      category: preselectedCategory || (postType === 'Business' ? 'Business' : "General"),
      price: undefined,
      image: undefined,
      name: "",
      businessCategory: "",
      location: { address: "" },
    },
  });

   useEffect(() => {
    if (open) {
        if (isEditMode && postToEdit) {
            if (postType === 'Business' && 'ownerId' in postToEdit) { // It's a Business
                form.reset({
                    name: postToEdit.name,
                    businessCategory: postToEdit.category,
                    text: postToEdit.description,
                    category: 'Business',
                    image: undefined,
                    location: postToEdit.location
                });
            } else if ('userId' in postToEdit) { // It's a Post
                 form.reset({
                    text: postToEdit.text,
                    category: postToEdit.category,
                    price: postToEdit.price || undefined,
                    image: undefined,
                });
            }
        } else {
             form.reset({
                text: "",
                description: "",
                category: preselectedCategory || (postType === 'Business' ? 'Business' : "General"),
                price: undefined,
                image: undefined,
                name: "",
                businessCategory: "",
                location: { address: "" },
            });
        }
    }
  }, [postToEdit, preselectedCategory, form, isEditMode, open, postType]);


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
             const uploadedUrls = await Promise.all(
                Array.from(imageFiles).map(async (file) => {
                    const storagePath = postType === 'Business' ? `businesses/${user.uid}/${Date.now()}_${file.name}` : `posts/${user.uid}/${Date.now()}_${file.name}`;
                    const storageRef = ref(storage, storagePath);
                    await uploadBytes(storageRef, file);
                    return getDownloadURL(storageRef);
                })
            );
            imageUrls = isEditMode ? [...imageUrls, ...uploadedUrls] : uploadedUrls;
        }

        if (postType === 'Business') {
            const businessData: Partial<Business> = {
                name: values.name!,
                category: values.businessCategory!,
                description: values.text,
                location: values.location,
                imageUrls: imageUrls,
            };
            if (isEditMode && postToEdit) {
                await updateBusiness(postToEdit.id, businessData);
                toast({ title: 'Business updated!' });
            } else {
                await createBusiness(businessData as Omit<Business, 'id' | 'ownerId'>);
                toast({ title: 'Business added!' });
            }
            
        } else { // It's a Post
            const postData: Partial<Post> = {
                text: values.text,
                description: values.description,
                category: values.category,
                imageUrls: imageUrls,
                imageUrl: imageUrls[0] || "",
            };

            if(values.category === 'For Sale' && values.price) {
                postData.price = values.price;
            }

            if (isEditMode && postToEdit) {
                await updatePost(postToEdit.id, postData);
                toast({ title: 'Post updated!' });
            } else {
                await createPost(postData as Omit<Post, 'id' | 'userId' | 'authorName' | 'authorImage' | 'timestamp' | 'commentCount' | 'likedBy'>);
                toast({ title: 'Post created!' });
            }
        }

        form.reset();
        setOpen(false);

    } catch(error) {
        console.error("Error submitting:", error);
        toast({ variant: 'destructive', title: 'Error', description: `Failed to submit ${postType.toLowerCase()}.` });
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
  
  const finalTitle = title || (isEditMode ? `Edit ${postType}` : `Create ${postType}`);
  const finalDescription = description || (isEditMode ? `Make changes to your ${postType.toLowerCase()} here.` : `Share something with your neighborhood.`);

  const imageField = form.register('image');

  const BusinessFormFields = () => (
      <>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Name</FormLabel>
              <FormControl><Input placeholder="e.g., The Corner Cafe" {...field} autoComplete="organization" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="businessCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl><Input placeholder="e.g., Food & Drink" {...field} autoComplete="off" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea placeholder="Tell everyone about your business..." {...field} /></FormControl>
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
      </>
  );

  const PostFormFields = () => {
    const category = form.watch("category");

    return (
    <>
       <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
            <FormItem>
                <FormLabel>{category === 'For Sale' ? 'Item Title' : 'Post'}</FormLabel>
                <FormControl>
                <Textarea
                    placeholder={category === 'For Sale' ? 'e.g. Slightly used armchair' : "What's happening in the neighborhood?"}
                    className="resize-none min-h-[120px]"
                    {...field}
                />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />

        {category === 'For Sale' && (
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
        )}


        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Category</FormLabel>
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
                    </SelectContent>
                    </Select>
                </FormItem>
                )}
            />
            
            {category === 'For Sale' && (
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
            )}
        </div>
    </>
  )};


  const FormContent = (
    <div className="space-y-4 px-1">
      {postType === 'Business' ? <BusinessFormFields /> : <PostFormFields />}
       <div className="space-y-4">
          <FormField
            control={form.control}
            name="image"
            render={() => (
              <FormItem>
                  <FormLabel>
                      Add images
                      {(form.watch('category') === 'For Sale' || postType === 'Business') && <span className="text-destructive">*</span>}
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
          {postToEdit?.imageUrls && postToEdit.imageUrls.length > 0 && (
              <div className="text-sm text-muted-foreground">
                  Current images: {postToEdit.imageUrls.length}. Upload more to add to the list.
              </div>
          )}
      </div>
    </div>
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
                        {FormContent}
                    </div>
                    <SheetFooter className="p-4 border-t mt-auto">
                        <Button type="submit" className="w-full" variant="default" disabled={loading}>
                            {loading ? (isEditMode ? 'Saving...' : 'Posting...') : (isEditMode ? 'Save Changes' : `Create ${postType}`)}
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
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>{finalTitle}</DialogTitle>
              <DialogDescription>
                 {finalDescription}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto p-6">
                {FormContent}
            </div>
            <DialogFooter className="p-6 pt-0 border-t">
                <Button type="submit" className="w-full" variant="default" disabled={loading}>
                    {loading ? (isEditMode ? 'Saving...' : 'Posting...') : (isEditMode ? 'Save Changes' : `Create ${postType}`)}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export const CreatePostDialog = memo(CreatePostDialogComponent);
