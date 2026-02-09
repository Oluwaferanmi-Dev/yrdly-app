"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-supabase-auth';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useDebounce } from '@/hooks/use-debounce';
import { useLocationData } from '@/hooks/use-location-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, MapPin, User, HelpCircle, Lightbulb, CheckCircle2 } from 'lucide-react';
import { YrdlyLogo } from '@/components/ui/yrdly-logo';
import { useToast } from '@/hooks/use-toast';
import { onboardingAnalytics } from '@/lib/onboarding-analytics';
import { supabase } from '@/lib/supabase';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { LoadingState } from '@/components/onboarding/LoadingState';

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
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Use lazy loading hook for location data
  const { states, lgas, wards, isLoading: locationLoading, error: locationError, loadLgas, loadWards } = useLocationData();

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
    },
  });

  // Get the current username value and debounce it
  const usernameValue = form.watch('username');
  const debouncedUsername = useDebounce(usernameValue, 500);
  const fullNameValue = form.watch('fullName');

  // Generate username suggestions based on full name
  const generateUsernameSuggestions = (fullName: string, currentUsername: string) => {
    if (!fullName || fullName.length < 2) return [];
    
    const suggestions: string[] = [];
    const nameParts = fullName.toLowerCase().split(' ').filter(part => part.length > 0);
    
    if (nameParts.length >= 2) {
      // First name + last name
      suggestions.push(`${nameParts[0]}${nameParts[nameParts.length - 1]}`);
      // First name + last initial
      suggestions.push(`${nameParts[0]}${nameParts[nameParts.length - 1][0]}`);
      // First initial + last name
      suggestions.push(`${nameParts[0][0]}${nameParts[nameParts.length - 1]}`);
    }
    
    if (nameParts.length >= 1) {
      // Just first name
      suggestions.push(nameParts[0]);
      // First name + numbers
      suggestions.push(`${nameParts[0]}123`);
      suggestions.push(`${nameParts[0]}2024`);
    }
    
    // Add some random suggestions
    suggestions.push(`${nameParts[0] || 'user'}_${Math.floor(Math.random() * 1000)}`);
    
    // Filter out current username and duplicates
    return suggestions
      .filter(suggestion => suggestion !== currentUsername && suggestion.length >= 3)
      .slice(0, 5);
  };

  // Handle state selection
  const handleStateChange = (state: string) => {
    form.setValue('location.state', state);
    form.setValue('location.lga', '');
    form.setValue('location.ward', '');
    loadLgas(state);
  };

  // Handle LGA selection
  const handleLgaChange = (lga: string) => {
    form.setValue('location.lga', lga);
    form.setValue('location.ward', '');
    loadWards(form.getValues('location.state'), lga);
  };

  // Check username availability with better error handling
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      setUsernameError(null);
      return;
    }

    setCheckingUsername(true);
    setUsernameError(null);
    
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
        setUsernameError('Failed to check username availability');
      } else if (data && data.length > 0) {
        // Username found, not available
        setUsernameAvailable(false);
        setUsernameError(null);
      } else {
        // No rows found, username is available
        setUsernameAvailable(true);
        setUsernameError(null);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
      setUsernameError('Network error. Please try again.');
    } finally {
      setCheckingUsername(false);
    }
  };

  // Debounced username checking effect
  useEffect(() => {
    if (debouncedUsername && debouncedUsername.length >= 3) {
      checkUsernameAvailability(debouncedUsername);
    } else {
      setUsernameAvailable(null);
      setUsernameError(null);
    }
  }, [debouncedUsername]);

  // Generate username suggestions when full name changes
  useEffect(() => {
    if (fullNameValue && fullNameValue.length >= 2) {
      const suggestions = generateUsernameSuggestions(fullNameValue, usernameValue);
      setUsernameSuggestions(suggestions);
    } else {
      setUsernameSuggestions([]);
    }
  }, [fullNameValue, usernameValue]);

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
      });

      // Complete profile setup
      await completeProfile();

      // Track profile setup completion
      onboardingAnalytics.trackProfileSetupCompleted({
        hasUsername: !!data.username,
        hasLocation: !!data.location.state,
        hasAvatar: false,
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

  const handleUseSuggestion = (suggestion: string) => {
    form.setValue('username', suggestion);
    setShowSuggestions(false);
  };

  // Show loading state while location data is being loaded
  if (locationLoading && states.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <OnboardingProgress />
        <div className="flex items-center justify-center p-4 pt-8">
          <LoadingState 
            type="location" 
            message="Loading location data..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <OnboardingProgress />
      <div className="flex items-center justify-center p-4 pt-8">
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="username">Username</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Choose a unique username that others can use to find you. You can use letters, numbers, and underscores.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="relative">
                  <Input
                    id="username"
                    placeholder="Choose a unique username"
                    {...form.register('username')}
                    onFocus={() => setShowSuggestions(usernameSuggestions.length > 0)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    maxLength={20}
                  />
                  
                  {/* Character counter */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {usernameValue.length}/20
                  </div>
                </div>

                {/* Username suggestions */}
                {showSuggestions && usernameSuggestions.length > 0 && (
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Lightbulb className="w-4 h-4" />
                      <span>Suggestions based on your name:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {usernameSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleUseSuggestion(suggestion)}
                          className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {form.formState.errors.username && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.username.message}
                  </p>
                )}
                {checkingUsername && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                    Checking availability...
                  </div>
                )}
                {usernameError && (
                  <p className="text-sm text-destructive">{usernameError}</p>
                )}
                {usernameAvailable === true && !checkingUsername && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Username is available
                  </p>
                )}
                {usernameAvailable === false && !checkingUsername && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <span>&times;</span> Username is already taken
                  </p>
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Your location helps us connect you with neighbors in your area and show you relevant posts and events.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* State */}
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select
                    value={form.watch('location.state')}
                    onValueChange={handleStateChange}
                    disabled={locationLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={locationLoading ? "Loading states..." : "Select your state"} />
                    </SelectTrigger>
                    <SelectContent>
                      {states.filter((s) => s != null && s !== '').map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {locationError && (
                    <p className="text-sm text-destructive">{locationError}</p>
                  )}
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
                    value={form.watch('location.lga')}
                    onValueChange={handleLgaChange}
                    disabled={!form.watch('location.state') || locationLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !form.watch('location.state') 
                          ? "Select state first" 
                          : locationLoading 
                            ? "Loading LGAs..." 
                            : "Select your LGA"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {lgas.filter((l) => l != null && l !== '').map((lga) => (
                        <SelectItem key={lga} value={lga}>
                          {lga}
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
                    value={form.watch('location.ward') || undefined}
                    onValueChange={(value) => form.setValue('location.ward', value)}
                    disabled={!form.watch('location.lga') || locationLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !form.watch('location.lga') 
                          ? "Select LGA first" 
                          : locationLoading 
                            ? "Loading wards..." 
                            : "Select your ward"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {wards.filter((w) => w != null && w !== '').map((ward) => (
                        <SelectItem key={ward} value={ward}>
                          {ward}
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


              {/* Profile Preview */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="text-sm font-medium text-muted-foreground">Profile Preview:</div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {form.watch('fullName') || 'Your Name'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      @{form.watch('username') || 'username'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {form.watch('location.state') && form.watch('location.lga') 
                        ? `${form.watch('location.lga')}, ${form.watch('location.state')}`
                        : 'Your Location'
                      }
                    </div>
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
                  disabled={isSubmitting || usernameAvailable === false || checkingUsername}
                  className="w-full"
                >
                  {isSubmitting ? 'Setting up...' : checkingUsername ? 'Checking username...' : 'Complete Profile'}
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
    </div>
  );
}
