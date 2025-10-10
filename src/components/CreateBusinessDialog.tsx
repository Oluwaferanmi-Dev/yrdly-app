
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { LocationInput, LocationValue } from "./LocationInput";
import type { Business } from "@/types";
import Image from "next/image";

// Business categories list
const BUSINESS_CATEGORIES = [
  "Restaurant & Food",
  "Retail & Shopping",
  "Health & Wellness",
  "Beauty & Personal Care",
  "Automotive",
  "Home & Garden",
  "Professional Services",
  "Entertainment & Recreation",
  "Education & Training",
  "Technology & Electronics",
  "Real Estate",
  "Financial Services",
  "Travel & Tourism",
  "Sports & Fitness",
  "Arts & Crafts",
  "Pet Services",
  "Cleaning Services",
  "Repair & Maintenance",
  "Other"
];

const getFormSchema = (isEditMode: boolean, postToEdit?: Business) => z.object({
  name: z.string().min(1, "Business name can't be empty."),
  category: z.string().min(1, "Please select a category."),
  description: z.string().optional(),
  location: z.custom<LocationValue>().refine(value => value && value.address.length > 0, {
    message: "Location is required.",
  }),
  image: z.any().refine((files) => files && (files.length > 0 || (Array.isArray(files) && files.some(f => typeof f === 'string'))), "An image is required for the business."),
  // Removed rating and review_count fields
  hours: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  owner_name: z.string().optional(),
  owner_avatar: z.string().optional(),
});

type CreateBusinessDialogProps = {
    children?: React.ReactNode;
    postToEdit?: Business;
    onOpenChange?: (open: boolean) => void;
}

const CreateBusinessDialogComponent = ({ children, postToEdit, onOpenChange }: CreateBusinessDialogProps) => {
  const { createBusiness } = usePosts();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [removedImageIndexes, setRemovedImageIndexes] = useState<number[]>([]);
  const isMobile = useIsMobile();
  const isEditMode = !!postToEdit;

  // Create form schema once and stabilize it
  const formSchema = useMemo(() => getFormSchema(isEditMode, postToEdit), [isEditMode, postToEdit]);

  // Create form once and stabilize it - don't recreate on every render
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      location: { address: "" },
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
            name: postToEdit.name,
            category: postToEdit.category,
            description: postToEdit.description,
            location: postToEdit.location,
            image: postToEdit.image_urls || [],
            // Removed rating and review_count fields
            hours: postToEdit.hours,
            phone: postToEdit.phone,
            email: postToEdit.email,
            website: postToEdit.website,
            owner_name: postToEdit.owner_name,
            owner_avatar: postToEdit.owner_avatar,
          });
        } else if (!isEditMode) {
          stableFormReset({
            name: "",
            category: "",
            description: "",
            location: { address: "" },
            image: undefined,
            // Removed rating and review_count fields
            hours: "",
            phone: "",
            email: "",
            website: "",
            owner_name: "",
            owner_avatar: "",
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
    
    const businessData: Omit<Business, 'id' | 'owner_id' | 'created_at'> = {
        name: values.name,
        category: values.category,
        description: values.description || '',
        location: values.location,
        image_urls: filteredImageUrls, // Pass filtered images
        // Removed rating and review_count fields
        hours: values.hours,
        phone: values.phone,
        email: values.email,
        website: values.website,
        owner_name: values.owner_name,
        owner_avatar: values.owner_avatar,
    };
    await createBusiness(businessData, postToEdit?.id, validImageFiles); // Pass validated files
    setLoading(false);
    handleOpenChange(false);
  }

  const handleOpenChange = useCallback((newOpenState: boolean) => {
    setOpen(newOpenState);
    if(onOpenChange) {
        onOpenChange(newOpenState);
    }
    
    if (!newOpenState) {
      form.reset();
      setRemovedImageIndexes([]); // Reset removed images on close
    }
  }, [onOpenChange, form]);

  const finalTitle = isEditMode ? "Edit Business" : "Add a Business";
  const finalDescription = isEditMode ? "Make changes to your business here." : "Add your business to the neighborhood directory.";



  const Trigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
    const { profile: userDetails } = useAuth();
    return (
     <div ref={ref} {...props} className="flex items-center gap-4 w-full">
        <Avatar>
            <AvatarImage src={userDetails?.avatar_url || 'https://placehold.co/100x100.png'}/>
            <AvatarFallback>{userDetails?.name?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 text-left text-muted-foreground cursor-pointer hover:bg-muted p-2 rounded-md border border-dashed">
            Add a business...
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
            <SheetContent side="bottom" className="p-0 flex flex-col h-[90vh] max-h-screen">
                <SheetHeader className="p-4 border-b flex-shrink-0">
                    <SheetTitle>{finalTitle}</SheetTitle>
                    <DialogDescription>
                        {finalDescription}
                    </DialogDescription>
                </SheetHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-4 px-1 pb-4">
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
                                name="category"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {BUSINESS_CATEGORIES.map((category) => (
                                                <SelectItem key={category} value={category}>
                                                    {category}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                render={({ field: { onChange, value, ...rest } }) => (
                                <FormItem>
                                    <FormLabel>
                                        Add images <span className="text-destructive">*</span>
                                    </FormLabel>
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
                            
                            {/* New fields for v0 design */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+234 801 234 5678" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="business@example.com" type="email" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>
                            
                            <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Website</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://www.example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="hours"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Operating Hours</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Mon-Fri: 9AM-6PM, Sat: 10AM-4PM" {...field} />
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
      <DialogContent className="sm:max-w-[525px] p-0 flex flex-col max-h-[90vh]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <DialogHeader className="p-6 pb-0 flex-shrink-0">
              <DialogTitle>{finalTitle}</DialogTitle>
              <DialogDescription>
                 {finalDescription}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
                <div className="space-y-4 px-1 pb-4">
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
                        name="category"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {BUSINESS_CATEGORIES.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                        render={({ field: { onChange, value, ...rest } }) => (
                        <FormItem>
                            <FormLabel>
                                Add images <span className="text-destructive">*</span>
                            </FormLabel>
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
