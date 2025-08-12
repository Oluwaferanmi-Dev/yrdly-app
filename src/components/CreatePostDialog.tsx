
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
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { PostCategory } from "@/types";

const formSchema = z.object({
  text: z.string().min(1, "Post can't be empty.").max(500),
  category: z.enum(["General", "Event", "For Sale", "Business"]),
  location: z.string().optional(),
});

type CreatePostDialogProps = {
    children?: React.ReactNode;
    preselectedCategory?: PostCategory;
}

export function CreatePostDialog({ children, preselectedCategory }: CreatePostDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      category: preselectedCategory || "General",
      location: "",
    },
  });

  useEffect(() => {
    if (preselectedCategory) {
        form.setValue("category", preselectedCategory);
    }
  }, [preselectedCategory, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Not authenticated', description: 'You must be logged in to create a post.' });
        return;
    }
    setLoading(true);

    try {
        let imageUrl = "";
        if (imageFile) {
            const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${imageFile.name}`);
            const snapshot = await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(snapshot.ref);
        }

        await addDoc(collection(db, "posts"), {
            userId: user.uid,
            authorName: user.displayName || "Anonymous User",
            authorImage: user.photoURL || `https://placehold.co/100x100.png?text=${user.displayName?.charAt(0) || 'A'}`,
            text: values.text,
            category: values.category,
            location: values.location,
            imageUrl: imageUrl,
            timestamp: serverTimestamp(),
            likes: 0,
            likedBy: [],
            comments: [],
        });

        toast({ title: 'Post created!', description: 'Your post is now live.' });
        form.reset({ text: "", category: preselectedCategory || "General", location: "" });
        setImageFile(null);
        setOpen(false);

    } catch(error) {
        console.error("Error creating post:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to create post.' });
    } finally {
        setLoading(false);
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
        setImageFile(e.target.files[0]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <DialogTitle>Create Post</DialogTitle>
          <DialogDescription>
            Share an update with your neighborhood.
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

            <DialogFooter>
              <Button type="submit" className="w-full" variant="default" disabled={loading}>
                {loading ? 'Posting...' : 'Post'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
