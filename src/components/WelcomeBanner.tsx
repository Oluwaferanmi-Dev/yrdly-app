
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Heart, Users, Building, X, UserCheck } from 'lucide-react';
import Link from 'next/link';

export function WelcomeBanner() {
    const { user, userDetails } = useAuth();
    const [isVisible, setIsVisible] = useState(false);
    const [bannerType, setBannerType] = useState<'welcome' | 'completeProfile'>('welcome');

    useEffect(() => {
        const hasDismissedProfileReminder = localStorage.getItem('hasDismissedProfileReminder');
        
        if (userDetails && (!userDetails.bio || !userDetails.location)) {
            if (!hasDismissedProfileReminder) {
                setIsVisible(true);
                setBannerType('completeProfile');
            }
            return;
        }

        const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeBanner');
        if (hasSeenWelcome) {
            setIsVisible(false);
            return;
        }

        if (user && user.metadata.creationTime) {
            const creationDate = new Date(user.metadata.creationTime);
            const now = new Date();
            const sevenDaysAgo = new Date(new Date().setDate(now.getDate() - 7));
            
            if (creationDate > sevenDaysAgo) {
                setIsVisible(true);
                setBannerType('welcome');
            }
        }
    }, [user, userDetails]);

    const handleDismiss = () => {
        if (bannerType === 'welcome') {
            localStorage.setItem('hasSeenWelcomeBanner', 'true');
        } else {
            localStorage.setItem('hasDismissedProfileReminder', 'true');
        }
        setIsVisible(false);
    };

    if (!isVisible) return null;

    if (bannerType === 'completeProfile') {
        return (
            <Alert className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200">
              <button onClick={handleDismiss} className="absolute top-2 right-2 text-current/70 hover:text-current">
                <X className="h-4 w-4" />
              </button>
              <AlertTitle className="font-bold text-lg flex items-center gap-2">
                <UserCheck /> Complete Your Profile!
              </AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-4">A complete profile helps you connect with more neighbors. Add your bio and location to get the most out of Yrdly.</p>
                <div className="flex gap-2">
                    <Button asChild variant="default" size="sm" className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"><Link href="/settings">Go to Settings</Link></Button>
                </div>
              </AlertDescription>
            </Alert>
        )
    }

    return (
        <Alert className="bg-accent border-accent/20 text-accent-foreground">
          <button onClick={handleDismiss} className="absolute top-2 right-2 text-accent-foreground/70 hover:text-accent-foreground">
            <X className="h-4 w-4" />
          </button>
          <AlertTitle className="font-bold text-lg flex items-center gap-2">
            Welcome to Yrdly, {user?.displayName?.split(' ')[0] || 'Neighbor'}! 👋
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">You&apos;re now part of your neighborhood network. Here&apos;s how to get started:</p>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex items-center gap-2"><Heart className="h-5 w-5 text-primary"/> Share community posts</div>
                <div className="flex items-center gap-2"><Users className="h-5 w-5 text-primary"/> Connect with neighbors</div>
                <div className="flex items-center gap-2"><Building className="h-5 w-5 text-primary"/> Discover local businesses</div>
            </div>
            <div className="flex gap-2">
                <Button asChild variant="default" size="sm" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"><Link href="/settings">Complete Profile</Link></Button>
                <Button asChild variant="outline" size="sm" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"><Link href="/neighbors">Find Neighbors</Link></Button>
            </div>
          </AlertDescription>
        </Alert>
    )
}
