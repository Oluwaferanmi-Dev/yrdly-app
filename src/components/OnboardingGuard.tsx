"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useAuth } from '@/hooks/use-supabase-auth';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, profile, loading } = useAuth();
  const { currentStep, isOnboardingComplete } = useOnboarding();
  const router = useRouter();
  const redirectInitiated = useRef(false);

  useEffect(() => {
    // Don't redirect while loading or if user is not logged in
    if (loading || !user || !profile) {
      redirectInitiated.current = false;
      return;
    }

    // If onboarding is complete, don't redirect
    if (isOnboardingComplete) {
      redirectInitiated.current = false;
      return;
    }

    // Prevent multiple redirects
    if (redirectInitiated.current) return;

    // Redirect based on current onboarding step
    const redirectPath = (() => {
      switch (currentStep) {
        case 'email_verification':
          return '/onboarding/verify-email';
        case 'profile_setup':
          return '/onboarding/profile';
        case 'welcome':
          return '/onboarding/welcome';
        case 'tour':
          return '/onboarding/tour';
        case 'signup':
          return '/signup';
        default:
          return '/home';
      }
    })();

    // Only redirect if we're not already on the target path
    if (window.location.pathname !== redirectPath) {
      redirectInitiated.current = true;
      console.log(`OnboardingGuard: Redirecting to ${redirectPath} for step ${currentStep}`);
      router.push(redirectPath);
    }
  }, [currentStep, isOnboardingComplete, user, profile, loading, router]);

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not logged in, let the auth system handle it
  if (!user || !profile) {
    return <>{children}</>;
  }

  // If onboarding is not complete, don't render children (will redirect)
  if (!isOnboardingComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If onboarding is complete, render children
  return <>{children}</>;
}
