"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function Splash() {
    const [fade, setFade] = useState(false);
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
        <img src="/yrdly-logo.png" alt="Yrdly Logo" className="h-32 w-32 animate-pulse" />
    </div>
  );
}
