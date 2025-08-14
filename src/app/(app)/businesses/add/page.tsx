"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { LocationPicker } from "@/components/LocationPicker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(1, "Business name can't be empty.").max(100),
  category: z.string().min(1, "Category can't be empty.").max(50),
  description: z.string().min(1, "Description can't be empty.").max(1000),
  image: z.any().refine((files) => {
    if (typeof window === 'undefined') return true; // Always pass on server
    return files instanceof FileList && files.length > 0;
  }, "An image is required."),
});

export default function AddBusinessPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [businessLocation, setBusinessLocation] = useState<{ address: string; latitude: number; longitude: number; } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      image: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Not authenticated', description: 'You must be logged in to add a business.' });
        return;
    }
    if (!businessLocation) {
        toast({ variant: 'destructive', title: 'Location required', description: 'Please select a location for the business.' });
        return;
    }
    setLoading(true);

    try {
        const imageFiles = values.image as FileList;
        if (imageFiles && imageFiles.length > 0) {
            const imageFile = imageFiles[0];
            const storageRef = ref(storage, `businesses/${user.uid}/${Date.now()}_${imageFile.name}`);
            await uploadBytes(storageRef, imageFile);
            const imageUrl = await getDownloadURL(storageRef);

            const businessData = {
                ownerId: user.uid,
                name: values.name,
                category: values.category,
                description: values.description,
                location: businessLocation,
                imageUrl: imageUrl,
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, "businesses"), businessData);

            toast({ title: 'Business added!', description: 'Your business is now listed.' });
            router.push('/businesses');
        } else {
            // This case should ideally not be hit due to form validation
            toast({ variant: 'destructive', title: 'Image missing', description: 'Please select an image.' });
        }

    } catch(error) {
        console.error("Error adding business:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to add business.' });
    } finally {
        setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle>Add Your Business</CardTitle>
            <CardDescription>List your local business on the Yrdly map.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                 <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. The Corner Cafe" {...field} />
                        </FormControl>
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
                        <FormControl>
                          <Input placeholder="e.g. Food & Drink, Services" {...field} />
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
                       <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell everyone about your business..."
                          className="resize-none min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Image</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => field.onChange(e.target.files)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                        <LocationPicker onLocationSelect={setBusinessLocation} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                <Button type="submit" className="w-full" variant="default" disabled={loading}>
                    {loading ? 'Adding Business...' : 'Add Business'}
                </Button>
              </form>
            </Form>
        </CardContent>
    </Card>
  );
}
