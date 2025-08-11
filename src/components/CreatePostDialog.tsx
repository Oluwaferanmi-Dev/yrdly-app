
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
import { Image as ImageIcon, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { collection, addDoc, serverTimestamp, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  text: z.string().min(1, "Post can't be empty.").max(500),
  category: z.enum(["General", "Event", "For Sale"]),
  location: z.string().optional(),
  image: z.instanceof(File).optional(),
});

export function CreatePostDialog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      category: "General",
      location: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Not authenticated', description: 'You must be logged in to create a post.' });
        return;
    }
    setLoading(true);

    try {
        let imageUrl = "";
        if (values.image) {
            const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${values.image.name}`);
            const snapshot = await uploadBytes(storageRef, values.image);
            imageUrl = await getDownloadURL(snapshot.ref);
        }

        await addDoc(collection(db, "posts"), {
            text: values.text,
            category: values.category,
            location: values.location,
            imageUrl: imageUrl,
            timestamp: serverTimestamp(),
            likes: 0,
            comments: [],
            userRef: doc(db, 'users', user.uid),
        });

        toast({ title: 'Post created!', description: 'Your post is now live.' });
        form.reset();
        setOpen(false);

    } catch(error) {
        console.error("Error creating post:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to create post.' });
    } finally {
        setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex items-center gap-4 w-full">
            <Avatar>
                <AvatarImage src={user?.photoURL || 'https://placehold.co/100x100.png'} data-ai-hint="person portrait"/>
                <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left text-muted-foreground cursor-pointer hover:bg-muted p-2 rounded-md">
                What's on your mind?
            </div>
            <Button variant="ghost" size="icon"><ImageIcon className="h-5 w-5 text-primary" /></Button>
        </div>
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
            
             <FormField
                control={form.control}
                name="image"
                render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                        <FormLabel>Add an image</FormLabel>
                        <FormControl>
                            <Input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => onChange(e.target.files?.[0])}
                                {...rest}
                            />
                        </FormControl>
                    </FormItem>
                )}
             />

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
