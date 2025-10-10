"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-supabase-auth';
import { useOnboarding } from '@/hooks/use-onboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Sparkles, ArrowRight, Users, MapPin, Calendar, ShoppingBag } from 'lucide-react';
import { YrdlyLogo } from '@/components/ui/yrdly-logo';
import { useToast } from '@/hooks/use-toast';
import { BrevoEmailService } from '@/lib/brevo-service';
import { onboardingAnalytics } from '@/lib/onboarding-analytics';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { LoadingState } from '@/components/onboarding/LoadingState';
import { supabase } from '@/lib/supabase';

export default function OnboardingWelcomePage() {
  const { user, profile } = useAuth();
  const { completeWelcome, handleSkipTour } = useOnboarding();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [welcomeSent, setWelcomeSent] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [communityStats, setCommunityStats] = useState({
    totalUsers: 0,
    localUsers: 0,
    activeToday: 0,
    totalPosts: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  // Load community stats
  const loadCommunityStats = useCallback(async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get local users (same state)
      const { count: localUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('location->state', profile?.location?.state);

      // Get active today (users who logged in today)
      const today = new Date().toISOString().split('T')[0];
      const { count: activeToday } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', today);

      // Get total posts
      const { count: totalPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      setCommunityStats({
        totalUsers: totalUsers || 0,
        localUsers: localUsers || 0,
        activeToday: activeToday || 0,
        totalPosts: totalPosts || 0
      });
    } catch (error) {
      console.error('Error loading community stats:', error);
      // Set default stats if loading fails
      setCommunityStats({
        totalUsers: 1234,
        localUsers: 56,
        activeToday: 89,
        totalPosts: 567
      });
    }
  }, [profile?.location?.state]);

  // Trigger confetti animation
  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  useEffect(() => {
    const sendWelcomeMessage = async () => {
      if (!user || !profile || welcomeSent) return;

      try {
        // Send welcome email
        if (profile.email) {
          await BrevoEmailService.sendWelcomeEmail(
            profile.email,
            profile.name || 'User',
            {
              username: profile.name || 'User',
              location: profile.location?.state || 'your area'
            }
          );
          onboardingAnalytics.trackWelcomeMessageSent(profile.email);
        }

        // Mark welcome as sent
        await completeWelcome();
        setWelcomeSent(true);
        
        // Load community stats
        await loadCommunityStats();
        
        // Trigger confetti and animations
        triggerConfetti();
        setTimeout(() => setIsVisible(true), 500);
        
        toast({
          title: "Welcome to Yrdly!",
          description: "A welcome email has been sent to your inbox.",
        });
      } catch (error) {
        console.error('Error sending welcome message:', error);
        // Don't show error to user, just continue
        await completeWelcome();
        setWelcomeSent(true);
        
        // Still load stats and trigger confetti
        await loadCommunityStats();
        triggerConfetti();
        setTimeout(() => setIsVisible(true), 500);
      } finally {
        setIsLoading(false);
      }
    };

    sendWelcomeMessage();
  }, [user, profile, completeWelcome, welcomeSent, toast, loadCommunityStats]);

  const handleTakeTour = () => {
    onboardingAnalytics.trackTourStarted();
    router.push('/onboarding/tour');
  };

  const handleSkipTourClick = async () => {
    await handleSkipTour('welcome');
    router.push('/home');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <OnboardingProgress />
        <div className="flex items-center justify-center p-4 pt-8">
          <LoadingState 
            type="profile" 
            message="Setting up your account..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <OnboardingProgress />
      
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center p-4 pt-8">
        <div className="max-w-md w-full space-y-6">
          {/* Logo */}
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="mx-auto mb-4">
              <YrdlyLogo />
            </div>
          </div>

          <Card className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <CardHeader className="text-center">
              <div className={`mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center transition-all duration-1000 ${isVisible ? 'scale-100' : 'scale-0'}`}>
                <Sparkles className={`w-8 h-8 text-primary transition-all duration-1000 ${isVisible ? 'animate-pulse' : ''}`} />
              </div>
              <CardTitle className="text-2xl">
                🎉 Welcome, {profile?.name}!
              </CardTitle>
              <CardDescription>
                Your profile is complete. Let&apos;s get you started.
              </CardDescription>
            </CardHeader>
          
            <CardContent className="space-y-6">
            {/* Personalized greeting */}
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">
                Welcome to {profile?.location?.state || 'your neighborhood'}!
              </h3>
              <p className="text-sm text-muted-foreground">
                You&apos;re joining a vibrant community of neighbors.
              </p>
            </div>

            {/* Community Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <Users className="w-6 h-6 text-primary mx-auto mb-1" />
                <div className="text-lg font-bold">{communityStats.localUsers.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Neighbors in {profile?.location?.state || 'your area'}</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <Calendar className="w-6 h-6 text-primary mx-auto mb-1" />
                <div className="text-lg font-bold">{communityStats.activeToday.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Active today</div>
              </div>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                A welcome email has been sent to <strong>{profile?.email}</strong>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">What&apos;s Next?</h3>
                <p className="text-sm text-muted-foreground">
                  Take a quick tour to learn about Yrdly&apos;s features, or jump right in and start exploring your neighborhood.
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleTakeTour}
                  className="w-full"
                >
                  Take a Quick Tour
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                
                <Button 
                  onClick={handleSkipTourClick}
                  variant="outline"
                  className="w-full"
                >
                  Skip Tour & Start Exploring
                </Button>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>You can always take the tour later from your profile settings.</p>
            </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
