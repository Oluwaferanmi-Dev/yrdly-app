
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-supabase-auth';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MailWarning, X, RefreshCw, CheckCircle } from 'lucide-react';
// Removed Firebase import - using Supabase auth
import { useToast } from '@/hooks/use-toast';
import { ResendEmailService } from '@/lib/resend-service';

export function EmailVerificationBanner() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isVisible, setIsVisible] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [lastSentTime, setLastSentTime] = useState<number | null>(null);
    const [cooldownTime, setCooldownTime] = useState(0);

    // Cooldown timer for resend button
    useEffect(() => {
        if (lastSentTime) {
            const interval = setInterval(() => {
                const timeLeft = Math.max(0, 60 - Math.floor((Date.now() - lastSentTime) / 1000));
                setCooldownTime(timeLeft);
                if (timeLeft === 0) {
                    clearInterval(interval);
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [lastSentTime]);

    // Auto-dismiss after 4 seconds
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 4000);

            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    const handleResend = async () => {
        if (!user || cooldownTime > 0) return;
        setIsSending(true);
        try {
            // Try to send verification email via Resend
            try {
                // Create verification link with user ID as token
                const verificationLink = `${window.location.origin}/verify-email?token=${user.id}&email=${encodeURIComponent(user.email || '')}`;
                
                // Send verification email via Resend
                await ResendEmailService.sendVerificationEmail(user.email || '', verificationLink, user.user_metadata?.full_name || undefined);
                
            } catch (error: any) {
                if (error.message === 'RESEND_NOT_CONFIGURED' || error.message === 'RESEND_SEND_FAILED') {
                    throw new Error('Email service not configured. Please contact support.');
                } else {
                    throw error; // Re-throw other errors
                }
            }
            
            setLastSentTime(Date.now());
            setCooldownTime(60);
            
            toast({
                title: "Verification Email Sent",
                description: "Please check your inbox and spam folder for the verification link.",
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: "Error Sending Email",
                description: error.message || "Failed to send verification email. Please try again.",
            });
        } finally {
            setIsSending(false);
        }
    };

    if (!user || user.email_confirmed_at || !isVisible) {
        return null;
    }

    return (
        <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200 relative first-content-safe">
            <button onClick={() => setIsVisible(false)} className="absolute top-2 right-2 text-current/70 hover:text-current">
                <X className="h-4 w-4" />
            </button>
            <AlertTitle className="font-bold text-lg flex items-center gap-2">
                <MailWarning /> Verify Your Email Address
            </AlertTitle>
            <AlertDescription className="mt-2">
                <p className="mb-4">
                    Please check your inbox for a verification link. Verifying your email helps secure your account.
                </p>
                <div className="flex gap-2">
                    <Button 
                        onClick={handleResend} 
                        disabled={isSending || cooldownTime > 0}
                        variant="default" 
                        size="sm" 
                        className="bg-yellow-600 text-white hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600"
                    >
                        {isSending ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : cooldownTime > 0 ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Resend in {cooldownTime}s
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Resend Verification Email
                            </>
                        )}
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    );
}
