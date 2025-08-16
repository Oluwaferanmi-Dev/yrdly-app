
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
import { useState, useEffect } from "react";
import * as React from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Post, PostCategory, Business } from "@/types";
import { usePosts } from "@/hooks/use-posts";
import { useIsMobile } from "@/hooks/use-mobile";
import { LocationPicker } from "./LocationPicker";

type CreatePostDialogProps = {
    children?: React.ReactNode;
    preselectedCategory?: PostCategory;
    postToEdit?: Post | Business;
    postType?: 'Post' | 'Business';
    onOpenChange?: (open: boolean) => void;
    title?: string;
    description?: string;
}

export function CreatePostDialog({ 
    children, 
    preselectedCategory, 
    postToEdit, 
    postType = 'Post',
    onOpenChange, 
    title, 
    description 
}: CreatePostDialogProps) {
  const { user, userDetails } = useAuth();
  const { toast } = useToast();
  const { createPost, updatePost, createBusiness, updateBusiness } = usePosts();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();
  const [location, setLocation] = useState(postToEdit && 'location' in postToEdit ? {
      address: postToEdit.location.address,
      latitude: postToEdit.location.latitude,
      longitude: postToEdit.location.longitude,
  } : null);
  
  const isEditMode = !!postToEdit;

  const formSchema = z.object({
    text: z.string().min(1, "Description can't be empty.").max(5000),
    category: z.enum(["General", "Event", "For Sale", "Business"]),
    price: z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z.number().positive("Price must be positive.").optional()
    ),
    image: z.any().optional(),
    // Business specific
    name: z.string().optional(),
    businessCategory: z.string().optional(),

  }).superRefine((data, ctx) => {
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
      if (data.category === 'Business') {
        if (!data.name) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: "Business name can't be empty." });
        if (!data.businessCategory) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['businessCategory'], message: "Category can't be empty." });
        if (!location) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['location'], message: "Location is required" });
      }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      category: preselectedCategory || (postType === 'Business' ? 'Business' : "General"),
      price: undefined,
      image: undefined,
      name: "",
      businessCategory: "",
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
                });
                setLocation(postToEdit.location);
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
                category: preselectedCategory || (postType === 'Business' ? 'Business' : "General"),
                price: undefined,
                image: undefined,
                name: "",
                businessCategory: "",
            });
            setLocation(null);
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
            const businessData = {
                name: values.name!,
                category: values.businessCategory!,
                description: values.text,
                location: location!,
                imageUrls: imageUrls
            };
            if (isEditMode && postToEdit) {
                await updateBusiness(postToEdit.id, businessData);
                toast({ title: 'Business updated!' });
            } else {
                await createBusiness(businessData);
                toast({ title: 'Business added!' });
            }
            
        } else { // It's a Post
            const postData: Partial<Post> = {
                text: values.text,
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
        setLocation(null);
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
              <FormControl><Input placeholder="e.g., The Corner Cafe" {...field} /></FormControl>
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
              <FormControl><Input placeholder="e.g., Food & Drink" {...field} /></FormControl>
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
        <FormItem>
            <FormLabel>Location</FormLabel>
            <FormControl>
                <LocationPicker 
                    onLocationSelect={setLocation} 
                    initialLocation={location ? { latitude: location.latitude, longitude: location.longitude } : undefined}
                />
            </FormControl>
            <FormMessage />
        </FormItem>
      </>
  );

  const PostFormFields = () => (
    <>
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
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₦</span>
                                <Input type="number" placeholder="Price" className="pl-7" {...field} />
                            </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}
            </div>
        </div>
    </>
  );


  const FormContent = (
    <div className="space-y-4 px-1">
      {postType === 'Business' ? <BusinessFormFields /> : <PostFormFields />}
       <div className="px-4 pb-4 space-y-4">
          <FormField
            control={form.control}
            name="image"
            render={() => (
              <FormItem>
                  <FormLabel>
                      Add images
                      {(form.watch('category') === 'Event' || form.watch('category') === 'For Sale' || postType === 'Business') && <span className="text-destructive">*</span>}
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
                    <div className="py-4 flex-1 overflow-y-auto">
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
}

    