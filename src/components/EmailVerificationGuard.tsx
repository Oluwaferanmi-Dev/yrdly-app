"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

interface EmailVerificationGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function EmailVerificationGuard({ 
  children, 
  redirectTo = '/verify-email' 
}: EmailVerificationGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while loading
    if (loading) return;

    // If user is not logged in, let the auth system handle it
    if (!user) return;

    // If user is logged in but email is not verified, redirect to verification page
    if (user && !user.emailVerified) {
      router.push(`${redirectTo}?email=${encodeURIComponent(user.email || '')}`);
    }
  }, [user, loading, router, redirectTo]);

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not verified, don't render children (will redirect)
  if (user && !user.emailVerified) {
    return null;
  }

  // If user is verified or not logged in, render children
  return <>{children}</>;
}
