"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-supabase-auth';
import { useOnboarding } from '@/hooks/use-onboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, RefreshCw, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { YrdlyLogo } from '@/components/ui/yrdly-logo';
import { useToast } from '@/hooks/use-toast';
import { BrevoEmailService } from '@/lib/brevo-service';
// Removed Firebase import - using Supabase auth
import { onboardingAnalytics } from '@/lib/onboarding-analytics';
import { supabase } from '@/lib/supabase';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { LoadingState } from '@/components/onboarding/LoadingState';
import { useHaptics } from '@/hooks/use-haptics';

function VerifyEmailContent() {
  const { user, profile, loading } = useAuth();
  const { updateOnboardingStatus, isEmailVerified } = useOnboarding();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { triggerHaptic } = useHaptics();
  
  const [isResending, setIsResending] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<number | null>(null);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [timeSinceSent, setTimeSinceSent] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const email = searchParams.get('email') || user?.email || '';
  const token = searchParams.get('token');

  const tips = [
    "Check your spam folder if you don't see the email",
    "Wait 2-3 minutes for the email to arrive",
    "Make sure you entered the correct email address",
    "Try refreshing your email inbox",
    "Contact support if you're still having trouble"
  ];

  // Redirect if user is not authenticated using auth state listener
  useEffect(() => {
    if (loading) return; // Don't redirect while loading

    if (!user) {
      console.log('No user found, setting up auth state listener...');
      
      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, !!session?.user);
          
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('User signed in via auth state change');
            // User is now authenticated, component will re-render
          } else if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
            console.log('User signed out or no session, redirecting to signup');
            router.push('/signup');
          }
        }
      );

      // If still no user after a reasonable time, redirect
      const fallbackTimer = setTimeout(() => {
        if (!user) {
          console.log('Still no user after auth listener setup, redirecting to signup');
          router.push('/signup');
        }
      }, 5000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(fallbackTimer);
      };
    }
  }, [user, loading, router]);

  // Check if user is verified and redirect
  useEffect(() => {
    if (isEmailVerified) {
      // Add a small delay to show the success state
      const timer = setTimeout(() => {
        updateOnboardingStatus('profile_setup');
        onboardingAnalytics.trackStepComplete('email_verification', { 
          userId: user?.id,
          method: 'automatic'
        });
        router.push('/onboarding/profile');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isEmailVerified, updateOnboardingStatus, router, user?.id]);

  const handleTokenVerification = useCallback(async () => {
    if (!user || !token) return;
    
    setIsChecking(true);
    try {
      // Verify the token matches the user ID
      if (token === user.id) {
        // Update user's email verification status
        await updateOnboardingStatus('profile_setup');
        toast({
          title: "Email Verified!",
          description: "Your email has been successfully verified.",
        });
        router.push('/onboarding/profile');
      } else {
        throw new Error('Invalid verification token');
      }
    } catch (error: any) {
      console.error('Token verification error:', error);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "Invalid or expired verification link.",
      });
    } finally {
      setIsChecking(false);
    }
  }, [user, token, updateOnboardingStatus, toast, router]);

  // Handle email verification from link
  useEffect(() => {
    if (token && user) {
      // Token-based verification (from Brevo)
      handleTokenVerification();
    }
  }, [token, user, handleTokenVerification]);

  // Cooldown timer and time since sent
  useEffect(() => {
    if (lastSentTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - lastSentTime) / 1000);
        const remaining = Math.max(0, 60 - elapsed);
        setCooldownTime(remaining);
        setTimeSinceSent(elapsed);
        
        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [lastSentTime]);

  // Tip rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % tips.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [tips.length]);

  // Visibility detection for auto-check
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isChecking) {
        setIsVisible(true);
        // Auto-check verification when tab becomes visible
        setTimeout(() => {
          if (user && !isEmailVerified) {
            handleCheckVerification();
          }
        }, 1000);
      } else {
        setIsVisible(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, isEmailVerified, isChecking]);

  // Page load animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleResendVerification = async () => {
    console.log('Resend verification clicked', { user: !!user, cooldownTime, loading });
    if (!user || cooldownTime > 0 || loading) return;

    triggerHaptic('medium');
    setIsResending(true);
    setError(null);
    
    try {
      // Try to send verification email via Brevo, fallback to manual message
      try {
        // Create verification link with user ID as token
        const verificationLink = BrevoEmailService.generateManualVerificationLink(user.id, email);
        
        // Send verification email via Brevo
        await BrevoEmailService.sendVerificationEmail(email, verificationLink, user.user_metadata?.name || user.email?.split('@')[0]);
        
        console.log('Verification email sent via Brevo');
        onboardingAnalytics.trackEmailVerificationSent(email);
      } catch (error: any) {
        console.log('Brevo email failed:', error.message);
        
        // Handle different types of Brevo errors
        if (error.message === 'BREVO_NOT_CONFIGURED') {
          console.log('Brevo not configured, showing manual instructions');
          setError('Email service is not configured. Please contact support or use the manual verification link below.');
        } else if (error.message === 'BREVO_AUTH_FAILED') {
          setError('Email service authentication failed. Please contact support.');
        } else if (error.message === 'BREVO_RATE_LIMITED') {
          setError('Too many emails sent. Please wait a few minutes before trying again.');
        } else if (error.message === 'BREVO_SERVER_ERROR') {
          setError('Email service is temporarily unavailable. Please try again later or contact support.');
        } else {
          setError('Failed to send verification email. Please try again or contact support.');
        }
        
        onboardingAnalytics.trackEmailVerificationSent(email);
      }
      
      setLastSentTime(Date.now());
      setCooldownTime(60);
      setRetryCount(0); // Reset retry count on success
      
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox and spam folder for the verification link.",
      });
    } catch (error: any) {
      const errorMessage = error.message || "Failed to send verification email. Please try again.";
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
      
      onboardingAnalytics.trackError('email_verification', errorMessage, { 
        userId: user.id,
        action: 'resend',
        retryCount: retryCount + 1
      });
      
      toast({
        variant: "destructive",
        title: "Error Sending Email",
        description: errorMessage,
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleRetry = () => {
    triggerHaptic('light');
    setError(null);
    setRetryCount(0);
    handleResendVerification();
  };

  const handleContactSupport = () => {
    triggerHaptic('light');
    // Open support contact (could be email, chat, etc.)
    window.open('mailto:support@yrdly.com?subject=Email Verification Issue', '_blank');
  };

  const handleOpenEmailApp = () => {
    // Try to open email app
    const emailAppUrl = `mailto:${email}`;
    window.open(emailAppUrl, '_self');
  };

  const formatTimeSinceSent = (seconds: number) => {
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  const handleCheckVerification = useCallback(async () => {
    console.log('Check verification clicked', { user: !!user, emailConfirmed: user?.email_confirmed_at, loading });
    if (!user || loading) return;
    
    triggerHaptic('light');
    setIsChecking(true);
    try {
      // Check verification status - refresh user data first
      const { data: { user: refreshedUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error getting user:', error);
        throw error;
      }
      
      if (refreshedUser?.email_confirmed_at) {
        await updateOnboardingStatus('profile_setup');
        toast({
          title: "Email Verified!",
          description: "Your email has been successfully verified.",
        });
        router.push('/onboarding/profile');
      } else {
        toast({
          title: "Not Verified Yet",
          description: "Your email is not verified yet. Please check your inbox and click the verification link.",
        });
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to check verification status. Please try again.",
      });
    } finally {
      setIsChecking(false);
    }
  }, [user, loading, triggerHaptic, updateOnboardingStatus, toast, router]);

  const handleBackToSignup = () => {
    router.push('/signup');
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <OnboardingProgress />
        <div className="flex items-center justify-center p-4 pt-8">
          <LoadingState 
            type="email" 
            message="Verifying your account setup..."
          />
        </div>
      </div>
    );
  }

  // Show waiting state if no user (but not loading)
  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <OnboardingProgress />
        <div className="flex items-center justify-center p-4 pt-8">
          <LoadingState 
            type="general" 
            message="Setting up your account..."
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

        <Card className={`transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <CardHeader className="text-center">
            <div 
              className={`mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center transition-all duration-1000 ${isVisible ? 'scale-100' : 'scale-0'}`}
              role="img"
              aria-label="Email verification icon"
            >
              <Mail className={`w-8 h-8 text-primary transition-all duration-1000 ${isVisible ? 'animate-pulse' : ''}`} />
            </div>
            <CardTitle className="text-2xl" id="email-verification-title">Check Your Email</CardTitle>
            <CardDescription>
              We&apos;ve sent a verification link to <strong>{email}</strong>
              {lastSentTime && timeSinceSent > 0 && (
                <span className="block text-sm text-muted-foreground mt-1" aria-live="polite">
                  Sent {formatTimeSinceSent(timeSinceSent)}
                </span>
              )}
            </CardDescription>
            
            {/* Screen reader instructions */}
            <div id="verification-instructions" className="sr-only">
              To verify your email, check your inbox for a message from Yrdly and click the verification link. 
              If you don&apos;t see the email, check your spam folder. You can also use the buttons below to open your email app or resend the verification email.
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Click the verification link in your email to continue setting up your account.
                </AlertDescription>
              </Alert>
            )}

            {/* Tips Carousel */}
            <div className="bg-muted/30 rounded-lg p-4 text-center" role="region" aria-label="Helpful tips">
              <div className="text-sm text-muted-foreground mb-2">💡 Tip:</div>
              <div 
                className="text-sm font-medium transition-all duration-500"
                aria-live="polite"
                aria-label={`Tip ${currentTip + 1} of ${tips.length}: ${tips[currentTip]}`}
              >
                {tips[currentTip]}
              </div>
            </div>

            <div className="space-y-4" role="group" aria-labelledby="email-verification-title">
              <Button 
                onClick={handleCheckVerification}
                disabled={isChecking}
                className="w-full h-12 text-base touch-manipulation"
                size="lg"
                aria-describedby="verification-instructions"
                aria-label={isChecking ? "Checking email verification status" : "Confirm that you have verified your email"}
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                    Checking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" aria-hidden="true" />
                    I&apos;ve Verified My Email
                  </>
                )}
              </Button>

              <Button 
                onClick={handleOpenEmailApp}
                variant="outline"
                className="w-full h-12 text-base touch-manipulation"
                size="lg"
                aria-label="Open your email app to check for verification email"
              >
                <Mail className="w-5 h-5 mr-2" aria-hidden="true" />
                Open Email App
              </Button>

              <Button 
                onClick={handleResendVerification}
                disabled={isResending || cooldownTime > 0}
                variant="outline"
                className="w-full h-12 text-base touch-manipulation"
                size="lg"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : cooldownTime > 0 ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Resend in {cooldownTime}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>

              <Button 
                onClick={handleBackToSignup}
                variant="ghost"
                className="w-full h-12 text-base touch-manipulation"
                size="lg"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Sign Up
              </Button>
            </div>

            {error && (
              <div className="space-y-4">
                {/* Manual verification link */}
                {error.includes('not configured') && (
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Manual Verification Link:
                    </div>
                    <div className="bg-background border rounded-lg p-3 font-mono text-xs break-all">
                      {BrevoEmailService.generateManualVerificationLink(user?.id || '', email)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Copy this link and open it in your browser to verify your email.
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Button 
                    onClick={handleRetry}
                    variant="outline"
                    className="w-full h-12 text-base touch-manipulation"
                    size="lg"
                    disabled={isResending}
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Try Again
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={handleContactSupport}
                    variant="outline"
                    className="w-full h-12 text-base touch-manipulation"
                    size="lg"
                  >
                    Contact Support
                  </Button>
                </div>
              </div>
            )}

            <div className="text-center text-sm text-muted-foreground">
              <p>Didn&apos;t receive the email? Check your spam folder.</p>
              <p>Still having trouble? Contact support.</p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingVerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
