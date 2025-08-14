"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function Splash() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [fade, setFade] = useState(false);

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
    <div className={cn("flex items-center justify-center h-screen transition-opacity duration-500", fade ? "opacity-100" : "opacity-0")}>
        <Image 
          src="/yrdly-logo.png" 
          alt="Yrdly Logo" 
          width={128} 
          height={128} 
          className="animate-pulse"
          priority 
        />
    </div>
  );
}
