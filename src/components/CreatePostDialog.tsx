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
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Post, PostCategory } from "../types";
import { useIsMobile } from "@/hooks/use-mobile";

const formSchema = z.object({
  text: z.string().min(1, "Post can't be empty.").max(500),
  category: z.enum(["General", "Event", "For Sale", "Business"]),
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
  const isMobile = useIsMobile();
  
  const isEditMode = !!postToEdit;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      category: preselectedCategory || "General",
    },
  });

   useEffect(() => {
    if (open) {
        if (isEditMode) {
          form.reset({
            text: postToEdit.text,
            category: postToEdit.category,
          });
        } else {
            form.reset({
                text: "",
                category: preselectedCategory || "General",
            });
        }
    }
  }, [postToEdit, preselectedCategory, form, isEditMode, open]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Not authenticated' });
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
            toast({ title: 'Post updated!' });
        } else {
             await addDoc(collection(db, "posts"), {
                userId: user.uid,
                authorName: user.displayName || "Anonymous User",
                authorImage: user.photoURL || `https://placehold.co/100x100.png`,
                ...postData,
                timestamp: serverTimestamp(),
                likes: 0,
                likedBy: [],
                commentCount: 0,
            });
            toast({ title: 'Post created!' });
        }

        form.reset();
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

  const FormContent = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4">
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="What&apos;s happening in the neighborhood?"
                  className="resize-none min-h-[120px] border-none shadow-none focus-visible:ring-0"
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
      </form>
    </Form>
  );

  const Trigger = () => (
     <div className="flex items-center gap-4 w-full">
        <Avatar>
            <AvatarImage src={user?.photoURL || 'https://placehold.co/100x100.png'}/>
            <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 text-left text-muted-foreground cursor-pointer hover:bg-muted p-2 rounded-md border border-dashed">
            What&apos;s happening in your neighborhood?
        </div>
        <Button variant="ghost" size="icon"><PlusCircle className="h-6 w-6 text-primary" /></Button>
    </div>
  );

  if (isMobile) {
    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
                { children ? children : <Trigger /> }
            </SheetTrigger>
            <SheetContent side="bottom">
                <SheetHeader>
                    <SheetTitle>{isEditMode ? 'Edit Post' : 'Create Post'}</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                    <FormContent />
                </div>
                <SheetFooter>
                  <Button onClick={form.handleSubmit(onSubmit)} className="w-full" variant="default" disabled={loading}>
                    {loading ? (isEditMode ? 'Saving...' : 'Posting...') : (isEditMode ? 'Save Changes' : 'Post')}
                  </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        { children ? children : <Trigger /> }
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Post' : 'Create Post'}</DialogTitle>
          <DialogDescription>
             {isEditMode ? 'Make changes to your post here.' : 'Share an update with your neighborhood.'}
          </DialogDescription>
        </DialogHeader>
        <FormContent />
        <DialogFooter>
          <Button onClick={form.handleSubmit(onSubmit)} className="w-full" variant="default" disabled={loading}>
            {loading ? (isEditMode ? 'Saving...' : 'Posting...') : (isEditMode ? 'Save Changes' : 'Post')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}