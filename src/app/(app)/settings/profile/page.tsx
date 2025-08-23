
"use client";

import { useState, useEffect } from 'react';

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db, storage, auth } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { allStates, lgasByState } from '@/lib/geo-data';
import { Loader2 } from 'lucide-react';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  bio: z.string().max(160, { message: 'Bio cannot exceed 160 characters.' }).optional(),
  locationState: z.string().optional(),
  locationLga: z.string().optional(),
  avatar: z.any().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
    const { user, userDetails, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [isEditMode, setIsEditMode] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [lgas, setLgas] = useState<string[]>([]);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: '',
            bio: '',
            locationState: '',
            locationLga: '',
        },
    });

    useEffect(() => {
        if (userDetails) {
            form.reset({
                name: userDetails.name || '',
                bio: userDetails.bio || '',
                locationState: userDetails.location?.state || '',
                locationLga: userDetails.location?.lga || '',
            });
            if (userDetails.location?.state) {
                setLgas(lgasByState[userDetails.location.state] || []);
            }
        }
    }, [userDetails, form]);

    const handleStateChange = (state: string) => {
        form.setValue('locationState', state);
        form.setValue('locationLga', '');
        setLgas(lgasByState[state] || []);
    };
    
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            form.setValue('avatar', e.target.files);
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
        }
    }
    
    const resetFormAndExitEditMode = () => {
        if (userDetails) {
            form.reset({
                name: userDetails.name || '',
                bio: userDetails.bio || '',
                locationState: userDetails.location?.state || '',
                locationLga: userDetails.location?.lga || '',
            });
             setAvatarPreview(null);
        }
        setIsEditMode(false);
    }

    const onSubmit = async (data: ProfileFormValues) => {
        if (!user) return;
        setFormLoading(true);

        try {
            let avatarUrl = userDetails?.avatarUrl;
            let displayName = data.name;

            // Step 1: Upload new avatar if one is selected
            if (data.avatar && data.avatar.length > 0) {
                const file = data.avatar[0];
                const fileExtension = file.name.split('.').pop();
                const fileName = `${user.uid}.${fileExtension}`;
                const storageRef = ref(storage, `avatars/${user.uid}/${fileName}`);
                await uploadBytes(storageRef, file);
                avatarUrl = await getDownloadURL(storageRef);
            }

            // Step 2: Update Firestore document
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                name: displayName,
                bio: data.bio,
                location: {
                    state: data.locationState,
                    lga: data.locationLga,
                },
                avatarUrl: avatarUrl,
            });

            // Step 3: Update Firebase Auth profile
            await updateProfile(user, {
                displayName: displayName,
                photoURL: avatarUrl,
            });

            toast({ title: 'Profile updated successfully!' });
            setIsEditMode(false);
        } catch (error) {
            console.error("Profile update error:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.' });
        } finally {
            setFormLoading(false);
        }
    };
    
    if (authLoading) {
        return (
             <div className="max-w-2xl mx-auto space-y-6">
                <Skeleton className="h-8 w-48" />
                <Card>
                    <CardHeader><Skeleton className="h-6 w-32" /><Skeleton className="h-4 w-64 mt-2" /></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4"><Skeleton className="h-16 w-16 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-32" /></div></div>
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                    <CardFooter><Skeleton className="h-10 w-24" /></CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold font-headline">My Profile</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your photo and personal details here.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <FormField
                                control={form.control}
                                name="avatar"
                                render={({ field }) => (
                                    <FormItem className="flex items-center gap-4">
                                        <Avatar className="h-16 w-16">
                                            <AvatarImage src={avatarPreview || userDetails?.avatarUrl} alt={userDetails?.name} />
                                            <AvatarFallback>{userDetails?.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col gap-2">
                                            <FormLabel>Profile Picture</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={handleAvatarChange}
                                                    disabled={!isEditMode}
                                                    className="w-full md:w-auto"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </div>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl><Input {...field} disabled={!isEditMode} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="bio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bio</FormLabel>
                                        <FormControl><Textarea {...field} disabled={!isEditMode} placeholder="Tell us a little about yourself" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="locationState"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>State</FormLabel>
                                             <Select onValueChange={handleStateChange} defaultValue={field.value} disabled={!isEditMode}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {allStates.map((state) => (<SelectItem key={state} value={state}>{state}</SelectItem>))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="locationLga"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>LGA</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} disabled={!isEditMode || lgas.length === 0}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select LGA" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {lgas.map((lga) => (<SelectItem key={lga} value={lga}>{lga}</SelectItem>))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            {isEditMode ? (
                                <>
                                    <Button type="button" variant="ghost" onClick={resetFormAndExitEditMode}>Cancel</Button>
                                    <Button type="submit" disabled={formLoading}>
                                        {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
                                </>
                            ) : (
                                <Button type="button" onClick={() => setIsEditMode(true)}>Edit Profile</Button>
                            )}
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    );
}
