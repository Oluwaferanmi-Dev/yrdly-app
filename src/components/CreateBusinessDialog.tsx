
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
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Business } from "@/types";
import { usePosts } from "@/hooks/use-posts";
import { useIsMobile } from "@/hooks/use-mobile";
import { LocationInput, LocationValue } from "./LocationInput";

const getFormSchema = (isEditMode: boolean, postToEdit?: Business) => z.object({
  name: z.string().min(1, "Business name can't be empty."),
  businessCategory: z.string().min(1, "Category can't be empty."),
  text: z.string().optional(),
  location: z.custom<LocationValue>().refine(value => value && value.address.length > 0, {
    message: "Location is required.",
  }),
  image: z.any().refine((files) => files && (files.length > 0 || (Array.isArray(files) && files.some(f => typeof f === 'string'))), "An image is required for the business."),
});

type CreateBusinessDialogProps = {
    children?: React.ReactNode;
    postToEdit?: Business;
    onOpenChange?: (open: boolean) => void;
}

const CreateBusinessDialogComponent = ({ children, postToEdit, onOpenChange }: CreateBusinessDialogProps) => {
  const { user, userDetails } = useAuth();
  const { toast } = useToast();
  const { createBusiness, updateBusiness } = usePosts();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();
  const isEditMode = !!postToEdit;

  const formSchema = getFormSchema(isEditMode, postToEdit);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      businessCategory: "",
      text: "",
      location: { address: "" },
      image: undefined,
    },
  });

  useEffect(() => {
    if (open) {
        if (isEditMode && postToEdit) {
            form.reset({
                name: postToEdit.name,
                businessCategory: postToEdit.category,
                text: postToEdit.description,
                location: postToEdit.location,
                image: postToEdit.imageUrls || [],
            });
        } else {
            form.reset({
                name: "",
                businessCategory: "",
                text: "",
                location: { address: "" },
                image: undefined,
            });
        }
    }
  }, [postToEdit, isEditMode, open, form.reset]);

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
                    const storagePath = `businesses/${user.uid}/${Date.now()}_${file.name}`;
                    const storageRef = ref(storage, storagePath);
                    await uploadBytes(storageRef, file);
                    return getDownloadURL(storageRef);
                })
            );
            imageUrls = isEditMode ? [...imageUrls, ...uploadedUrls] : uploadedUrls;
        }

        const businessData: Partial<Business> = {
            name: values.name,
            category: values.businessCategory,
            description: values.text,
            location: values.location,
            imageUrls: imageUrls,
        };

        if (isEditMode && postToEdit) {
            await updateBusiness(postToEdit.id, businessData);
            toast({ title: 'Business updated!' });
        } else {
            await createBusiness(businessData as Omit<Business, 'id' | 'ownerId' | 'createdAt'>);
            toast({ title: 'Business added!' });
        }

        form.reset();
        setOpen(false);

    } catch(error) {
        console.error("Error submitting business:", error);
        toast({ variant: 'destructive', title: 'Error', description: "Failed to submit business." });
    } finally {
        setLoading(false);
    }
  }
  
  const handleOpenChange = useCallback((newOpenState: boolean) => {
    setOpen(newOpenState);
    if(onOpenChange) {
        onOpenChange(newOpenState);
    }
     if (!newOpenState) {
        form.reset();
    }
  }, [onOpenChange, form.reset]);
  
  const finalTitle = isEditMode ? "Edit Business" : "Add a Business";
  const finalDescription = isEditMode ? "Make changes to your business here." : "Add your business to the neighborhood directory.";

  const imageField = form.register('image');

  const FormContent = memo(function FormContent({ form }: { form: UseFormReturn<z.infer<typeof formSchema>> }) {
    return (
        <div className="space-y-4 px-1">
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
            {postToEdit?.imageUrls && postToEdit.imageUrls.length > 0 && (
                <div className="text-sm text-muted-foreground">
                    Current images: {postToEdit.imageUrls.length}. Upload more to add to the list.
                </div>
            )}
        </div>
    );
  });

  const Trigger = React.forwardRef<HTMLDivElement>((props, ref) => (
     <div ref={ref} {...props} className="flex items-center gap-4 w-full">
        <Avatar>
            <AvatarImage src={userDetails?.avatarUrl || 'https://placehold.co/100x100.png'}/>
            <AvatarFallback>{userDetails?.name?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 text-left text-muted-foreground cursor-pointer hover:bg-muted p-2 rounded-md border border-dashed">
            Add a business...
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
                        <FormContent form={form} />
                    </div>
                    <SheetFooter className="p-4 border-t mt-auto">
                        <Button type="submit" className="w-full" variant="default" disabled={loading}>
                            {loading ? (isEditMode ? 'Saving...' : 'Adding Business...') : (isEditMode ? 'Save Changes' : 'Add Business')}
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
                <FormContent form={form} />
            </div>
            <DialogFooter className="p-6 pt-0 border-t">
                <Button type="submit" className="w-full" variant="default" disabled={loading}>
                    {loading ? (isEditMode ? 'Saving...' : 'Adding Business...') : (isEditMode ? 'Save Changes' : 'Add Business')}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export const CreateBusinessDialog = memo(CreateBusinessDialogComponent);
