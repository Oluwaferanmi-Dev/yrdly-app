
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, AuthProvider } from '@/hooks/use-supabase-auth';
import { PushNotificationManager } from '@/components/PushNotificationManager';
import Image from 'next/image';
import { APIProvider } from '@vis.gl/react-google-maps';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import type { User } from '@/types';
import { useDeepLinking } from '@/hooks/use-deep-linking';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { OfflineStatus } from '@/components/OfflineStatus';
import { OnboardingGuard } from '@/components/OnboardingGuard';
import { V0MainLayout } from '@/components/layout/V0MainLayout';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth(); // Using Supabase auth
  const router = useRouter();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  
  // Initialize deep linking
  useDeepLinking();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user || !profile) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Image 
            src="/yrdly-logo.png" 
            alt="Yrdly Logo" 
            width={96} 
            height={96} 
            className="animate-pulse w-24 h-24"
            priority
        />
      </div>
    );
  }

  const handleProfileClick = () => {
    setProfileUser(profile as User);
  };

  return (
    <OnboardingGuard>
      <ServiceWorkerRegistration />
      <PushNotificationManager />
      <V0MainLayout>
        {children}
      </V0MainLayout>
      {/* Offline Status Component */}
      <OfflineStatus />
    </OnboardingGuard>
  );
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!} libraries={['places']}>
        <ProtectedLayout>
          {children}
        </ProtectedLayout>
      </APIProvider>
    </AuthProvider>
  );
}
