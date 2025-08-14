
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Heart, Users, Building, X } from 'lucide-react';
import Link from 'next/link';

export function WelcomeBanner() {
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeBanner');
        if (hasSeenWelcome) {
            setIsVisible(false);
            return;
        }

        if (user && user.metadata.creationTime) {
            const creationDate = new Date(user.metadata.creationTime);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            if (creationDate > sevenDaysAgo) {
                setIsVisible(true);
            }
        }
    }, [user]);

    const handleDismiss = () => {
        localStorage.setItem('hasSeenWelcomeBanner', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <Alert className="bg-accent border-primary/20 text-accent-foreground">
          <button onClick={handleDismiss} className="absolute top-2 right-2 text-accent-foreground/70 hover:text-accent-foreground">
            <X className="h-4 w-4" />
          </button>
          <AlertTitle className="font-bold text-lg flex items-center gap-2">
            Welcome to Yrdly, {user?.displayName?.split(' ')[0] || 'Neighbor'}! 👋
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-3">You&apos;re now part of your neighborhood network. Here&apos;s how to get started:</p>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex items-center gap-2"><Heart className="h-5 w-5 text-primary"/> Share community posts</div>
                <div className="flex items-center gap-2"><Users className="h-5 w-5 text-primary"/> Connect with neighbors</div>
                <div className="flex items-center gap-2"><Building className="h-5 w-5 text-primary"/> Discover local businesses</div>
            </div>
            <div className="flex gap-2">
                <Button asChild variant="default" size="sm"><Link href="/settings">Complete Profile</Link></Button>
                <Button asChild variant="outline" size="sm"><Link href="/neighbors">Find Neighbors</Link></Button>
            </div>
          </AlertDescription>
        </Alert>
    )
}
