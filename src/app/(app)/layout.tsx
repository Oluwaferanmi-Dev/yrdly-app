
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppBottomNav } from '@/components/layout/AppBottomNav';
import { useAuth } from '@/hooks/use-auth';
import { PushNotificationManager } from '@/components/PushNotificationManager';
import Image from 'next/image';
import { APIProvider } from '@vis.gl/react-google-maps';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Image 
            src="/yrdly-logo.png" 
            alt="Yrdly Logo" 
            width={96} 
            height={96} 
            className="animate-pulse"
            priority
        />
      </div>
    );
  }

  return (
    <>
      <PushNotificationManager />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="md:hidden">
              <AppHeader />
          </div>
          <main className="p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 pt-16 md:pt-6">{children}</main>
          <AppBottomNav />
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!} libraries={['places']}>
      <ProtectedLayout>
        {children}
      </ProtectedLayout>
    </APIProvider>
  );
}
