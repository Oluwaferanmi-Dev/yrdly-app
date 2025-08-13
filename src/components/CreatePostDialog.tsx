
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
import { Image as ImageIcon, MapPin, PlusCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Post, PostCategory } from "@/types";

const formSchema = z.object({
  text: z.string().min(1, "Post can't be empty.").max(500),
  category: z.enum(["General", "Event", "For Sale", "Business"]),
  location: z.string().optional(),
  eventDate: z.string().optional(),
  eventTime: z.string().optional(),
  eventLink: z.string().optional(),
});

type CreatePostDialogProps = {
    children?: React.ReactNode;
    preselectedCategory?: PostCategory;
    postToEdit?: Post;
    onOpenChange?: (open: boolean) => void;
}

export function CreatePostDialog({ children, preselectedCategory, postToEdit, onOpenChange }: CreatePostDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const isEditMode = !!postToEdit;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      category: preselectedCategory || "General",
      location: "",
      eventDate: "",
      eventTime: "",
      eventLink: "",
    },
  });

   useEffect(() => {
    // If there's a post to edit, populate the form
    if (isEditMode) {
      form.reset({
        text: postToEdit.text,
        category: postToEdit.category,
        location: postToEdit.location || "",
        eventDate: postToEdit.eventDate || "",
        eventTime: postToEdit.eventTime || "",
        eventLink: postToEdit.eventLink || "",
      });
    } else {
        // Otherwise, use the preselected category or default
        form.reset({
            text: "",
            category: preselectedCategory || "General",
            location: "",
            eventDate: "",
            eventTime: "",
            eventLink: "",
        });
    }
  }, [postToEdit, preselectedCategory, form, isEditMode, open]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Not authenticated', description: 'You must be logged in to create or edit a post.' });
        return;
    }
    setLoading(true);

    try {
        let imageUrl = postToEdit?.imageUrl || "";
        if (imageFile) {
            const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${imageFile.name}`);
            const snapshot = await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(snapshot.ref);
        }

        const postData = {
            ...values,
            imageUrl: imageUrl,
        };

        if (isEditMode) {
            const postRef = doc(db, "posts", postToEdit.id);
            await updateDoc(postRef, postData);
            toast({ title: 'Post updated!', description: 'Your post has been successfully updated.' });
        } else {
             await addDoc(collection(db, "posts"), {
                userId: user.uid,
                authorName: user.displayName || "Anonymous User",
                authorImage: user.photoURL || `https://placehold.co/100x100.png?text=${user.displayName?.charAt(0) || 'A'}`,
                ...postData,
                timestamp: serverTimestamp(),
                likes: 0,
                likedBy: [],
                commentCount: 0,
            });
            toast({ title: 'Post created!', description: 'Your post is now live.' });
        }

        form.reset({ text: "", category: preselectedCategory || "General", location: "", eventDate: "", eventTime: "", eventLink: "" });
        setImageFile(null);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
        setImageFile(e.target.files[0]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        { children ? children : (
            <div className="flex items-center gap-4 w-full">
                <Avatar>
                    <AvatarImage src={user?.photoURL || 'https://placehold.co/100x100.png'} data-ai-hint="person portrait"/>
                    <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left text-muted-foreground cursor-pointer hover:bg-muted p-2 rounded-md border border-dashed">
                    What's happening in your neighborhood?
                </div>
                <Button variant="ghost" size="icon"><PlusCircle className="h-6 w-6 text-primary" /></Button>
            </div>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Post' : 'Create Post'}</DialogTitle>
          <DialogDescription>
             {isEditMode ? 'Make changes to your post here.' : 'Share an update with your neighborhood.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
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
                 <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                <Input placeholder="Add a location" className="pl-8" {...field} />
                            </div>
                        </FormControl>
                    </FormItem>
                  )}
                />
            </div>
            
            <FormItem>
                <FormLabel>Add an image</FormLabel>
                <FormControl>
                    <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange}
                    />
                </FormControl>
            </FormItem>
            {postToEdit?.imageUrl && !imageFile && (
                <div className="text-sm text-muted-foreground">Current image: <a href={postToEdit.imageUrl} target="_blank" rel="noopener noreferrer" className="underline">view image</a></div>
            )}


            <DialogFooter>
              <Button type="submit" className="w-full" variant="default" disabled={loading}>
                {loading ? (isEditMode ? 'Saving...' : 'Posting...') : (isEditMode ? 'Save Changes' : 'Post')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
