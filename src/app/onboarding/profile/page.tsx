"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-supabase-auth';
import { useOnboarding } from '@/hooks/use-onboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, MapPin, User, Camera } from 'lucide-react';
import { YrdlyLogo } from '@/components/ui/yrdly-logo';
import { useToast } from '@/hooks/use-toast';
import statesData from '@/data/states.json';
import lgasData from '@/data/lgas.json';
import wardsData from '@/data/wards.json';
import { onboardingAnalytics } from '@/lib/onboarding-analytics';
import { supabase } from '@/lib/supabase';

const profileFormSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must be less than 50 characters'),
  location: z.object({
    state: z.string().min(1, 'Please select a state'),
    lga: z.string().min(1, 'Please select an LGA'),
    ward: z.string().optional(),
    address: z.string().optional(),
  }),
  avatar: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function OnboardingProfilePage() {
  const { user, profile, updateProfile } = useAuth();
  const { completeProfile } = useOnboarding();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [selectedLga, setSelectedLga] = useState('');
  const [availableLgas, setAvailableLgas] = useState<any[]>([]);
  const [availableWards, setAvailableWards] = useState<any[]>([]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: '',
      fullName: profile?.name || '',
      location: {
        state: profile?.location?.state || '',
        lga: profile?.location?.lga || '',
        ward: profile?.location?.ward || '',
        address: '',
      },
      avatar: profile?.avatar_url || '',
    },
  });

  // Load available LGAs when state changes
  useEffect(() => {
    if (selectedState) {
      const stateLgas = (lgasData as any)[selectedState] || [];
      setAvailableLgas(stateLgas.map((name: string) => ({ name })));
      setSelectedLga('');
      setAvailableWards([]);
      form.setValue('location.lga', '');
      form.setValue('location.ward', '');
    } else {
      setAvailableLgas([]);
      setSelectedLga('');
      setAvailableWards([]);
    }
  }, [selectedState, form]);

  // Load available wards when LGA changes
  useEffect(() => {
    if (selectedLga && selectedState) {
      const lgaWards = wardsData
        .filter(ward => ward.State === selectedState && ward.LGA === selectedLga)
        .map(ward => ({ name: ward.Ward }));
      setAvailableWards(lgaWards);
      form.setValue('location.ward', '');
    } else {
      setAvailableWards([]);
    }
  }, [selectedLga, selectedState, form]);

  // Check username availability
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      // Check if username is available by querying the database
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .limit(1);

      if (error) {
        console.error('Error checking username:', error);
        setUsernameAvailable(null);
      } else if (data && data.length > 0) {
        // Username found, not available
        setUsernameAvailable(false);
      } else {
        // No rows found, username is available
        setUsernameAvailable(true);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (usernameAvailable === false) {
      toast({
        variant: "destructive",
        title: "Username Not Available",
        description: "Please choose a different username.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Track profile setup start
      onboardingAnalytics.trackProfileSetupStarted(!!data.location.state);

      // Update user profile
      await updateProfile({
        name: data.fullName,
        username: data.username,
        location: data.location,
        avatar_url: data.avatar,
      });

      // Complete profile setup
      await completeProfile();

      // Track profile setup completion
      onboardingAnalytics.trackProfileSetupCompleted({
        hasUsername: !!data.username,
        hasLocation: !!data.location.state,
        hasAvatar: !!data.avatar,
        locationCompleteness: calculateLocationCompleteness(data.location),
      });

      toast({
        title: "Profile Complete!",
        description: "Your profile has been successfully set up.",
      });

      router.push('/onboarding/welcome');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      onboardingAnalytics.trackError('profile_setup', error.message, {  
        userId: user?.id,
        hasLocation: !!data.location.state
      });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateLocationCompleteness = (location: any) => {
    let completeness = 0;
    if (location.state) completeness += 25;
    if (location.lga) completeness += 25;
    if (location.ward) completeness += 25;
    if (location.address) completeness += 25;
    return completeness;
  };

  const handleBackToVerification = () => {
    router.push('/onboarding/verify-email');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto mb-4">
            <YrdlyLogo />
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
            <CardDescription>
              Help us connect you with your neighbors
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Choose a unique username"
                  {...form.register('username')}
                  onChange={(e) => {
                    form.setValue('username', e.target.value);
                    checkUsernameAvailability(e.target.value);
                  }}
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.username.message}
                  </p>
                )}
                {checkingUsername && (
                  <p className="text-sm text-muted-foreground">Checking availability...</p>
                )}
                {usernameAvailable === true && (
                  <p className="text-sm text-green-600">&check; Username is available</p>
                )}
                {usernameAvailable === false && (
                  <p className="text-sm text-destructive">&times; Username is already taken</p>
                )}
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  {...form.register('fullName')}
                />
                {form.formState.errors.fullName && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-base font-medium">Location</Label>
                </div>

                {/* State */}
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select
                    value={selectedState}
                    onValueChange={(value) => {
                      setSelectedState(value);
                      form.setValue('location.state', value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your state" />
                    </SelectTrigger>
                    <SelectContent>
                      {statesData.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.location?.state && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.location.state.message}
                    </p>
                  )}
                </div>

                {/* LGA */}
                <div className="space-y-2">
                  <Label htmlFor="lga">Local Government Area</Label>
                  <Select
                    value={selectedLga}
                    onValueChange={(value) => {
                      setSelectedLga(value);
                      form.setValue('location.lga', value);
                    }}
                    disabled={!selectedState}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your LGA" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLgas.map((lga) => (
                        <SelectItem key={lga.name} value={lga.name}>
                          {lga.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.location?.lga && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.location.lga.message}
                    </p>
                  )}
                </div>

                {/* Ward (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="ward">Ward (Optional)</Label>
                  <Select
                    value={form.watch('location.ward') || ''}
                    onValueChange={(value) => form.setValue('location.ward', value)}
                    disabled={!selectedLga}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your ward" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableWards.map((ward) => (
                        <SelectItem key={ward.name} value={ward.name}>
                          {ward.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Address (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="address">Address (Optional)</Label>
                  <Input
                    id="address"
                    placeholder="Enter your specific address"
                    {...form.register('location.address')}
                  />
                </div>
              </div>

              {/* Avatar (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="avatar">Profile Picture (Optional)</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Camera className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <Input
                      id="avatar"
                      placeholder="Enter image URL"
                      {...form.register('avatar')}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      You can add a profile picture later
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  Your location helps us connect you with neighbors in your area. 
                  This information is used to show you relevant posts and events.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || usernameAvailable === false}
                  className="w-full"
                >
                  {isSubmitting ? 'Setting up...' : 'Complete Profile'}
                </Button>

                <Button 
                  type="button"
                  onClick={handleBackToVerification}
                  variant="ghost"
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Email Verification
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
