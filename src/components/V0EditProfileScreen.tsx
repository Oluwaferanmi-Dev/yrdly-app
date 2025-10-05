"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-supabase-auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { StorageService } from '@/lib/storage-service';
import { allStates, lgasByState } from '@/lib/geo-data';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  bio: z.string().max(160, { message: 'Bio cannot exceed 160 characters.' }).optional(),
  locationState: z.string().optional(),
  locationLga: z.string().optional(),
  avatar: z.any().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface V0EditProfileScreenProps {
  onBack?: () => void;
}

export function V0EditProfileScreen({ onBack }: V0EditProfileScreenProps) {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
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

  // Load profile data
  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || '',
        bio: profile.bio || '',
        locationState: profile.location?.state || '',
        locationLga: profile.location?.lga || '',
      });
      setAvatarPreview(profile.avatar_url || null);
    }
  }, [profile, form]);

  // Update LGAs when state changes
  useEffect(() => {
    const selectedState = form.watch('locationState');
    if (selectedState) {
      setLgas(lgasByState[selectedState] || []);
      form.setValue('locationLga', ''); // Reset LGA when state changes
    } else {
      setLgas([]);
    }
  }, [form.watch('locationState')]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;

    setFormLoading(true);
    try {
      let avatarUrl = profile?.avatar_url;

      // Upload new avatar if provided
      if (values.avatar && values.avatar.length > 0) {
        const file = values.avatar[0];
        const fileName = `avatars/${user.id}/${Date.now()}-${file.name}`;
        const { data, error } = await StorageService.uploadFile('user-avatars', fileName, file);
        if (error) {
          console.error('Error uploading avatar:', error);
          throw error;
        }
        avatarUrl = data?.path;
      }

      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          name: values.name,
          bio: values.bio,
          avatar_url: avatarUrl,
          location: values.locationState && values.locationLga ? {
            state: values.locationState,
            lga: values.locationLga,
          } : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile updated successfully!',
        description: 'Your changes have been saved.',
      });

      if (onBack) {
        onBack();
      } else {
        router.back();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error updating profile',
        description: 'Please try again.',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  if (authLoading) {
    return (
      <div className="p-4 space-y-6 pb-24 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>
        <Card className="p-6">
          <div className="space-y-4">
            <div className="h-24 w-24 bg-muted animate-pulse rounded-full mx-auto" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-muted animate-pulse rounded mx-auto" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded mx-auto" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleBack} className="p-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-bold text-foreground">Edit Profile</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Picture */}
          <Card className="p-6 yrdly-shadow">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={avatarPreview || profile?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {profile?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-foreground">Profile Picture</h3>
                <p className="text-sm text-muted-foreground">Tap to change your photo</p>
              </div>
            </div>
          </Card>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Basic Information</h3>

            <Card className="p-4 space-y-4 yrdly-shadow">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about yourself..."
                        className="min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Card>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Location</h3>

            <Card className="p-4 space-y-4 yrdly-shadow">
              <FormField
                control={form.control}
                name="locationState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allStates.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
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
                name="locationLga"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local Government Area</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!form.watch('locationState')}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your LGA" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lgas.map((lga) => (
                          <SelectItem key={lga} value={lga}>
                            {lga}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Card>
          </div>

          {/* Save Button */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={handleBack}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={formLoading}
            >
              {formLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
