
"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MailWarning, X } from 'lucide-react';
import { sendEmailVerification } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export function EmailVerificationBanner() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isVisible, setIsVisible] = useState(true);
    const [isSending, setIsSending] = useState(false);

    const handleResend = async () => {
        if (!user) return;
        setIsSending(true);
        try {
            await sendEmailVerification(user);
            toast({
                title: "Verification Email Sent",
                description: "Please check your inbox for the verification link.",
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: "Error Sending Email",
                description: error.message,
            });
        } finally {
            setIsSending(false);
        }
    };

    if (!user || user.emailVerified || !isVisible) {
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
                        disabled={isSending}
                        variant="default" 
                        size="sm" 
                        className="bg-yellow-600 text-white hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600"
                    >
                        {isSending ? 'Sending...' : 'Resend Verification Email'}
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    );
}
