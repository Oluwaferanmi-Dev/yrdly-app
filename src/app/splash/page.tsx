"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function Splash() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            setFade(true);
        }, 100);

        const redirectTimer = setTimeout(() => {
             if (!loading) {
                if (user) {
                    router.replace('/home');
                 } else {
                    router.replace('/login');
                }
            }
        }, 2500);

        return () => {
            clearTimeout(timer);
            clearTimeout(redirectTimer);
        }
    }, [user, loading, router]);


  return (
    <div className="flex items-center justify-center h-screen">
        import Image from 'next/image';

// ...

<Image src="/yrdly-logo.png" alt="Yrdly Logo" width={128} height={128} className="animate-pulse" />
    </div>
  );
}
