"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { sendEmailVerification, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BrevoEmailService } from '@/lib/brevo-service';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

function VerifyEmailContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<number | null>(null);
  const [cooldownTime, setCooldownTime] = useState(0);

  const email = searchParams.get('email') || user?.email || '';
  const token = searchParams.get('token');

  // Check if user is verified and redirect
  useEffect(() => {
    if (user?.emailVerified) {
      router.push('/home');
    }
  }, [user, router]);

  // Handle email verification from Brevo link
  useEffect(() => {
    const verifyEmailFromToken = async () => {
      if (token && user && user.uid === token) {
        try {
          // Mark email as verified in Firestore
          await updateDoc(doc(db, 'users', user.uid), {
            emailVerified: true
          });

          toast({
            title: "Email Verified!",
            description: "Your email has been successfully verified. Welcome to Yrdly!",
          });

          // Redirect to home
          router.push('/home');
        } catch (error) {
          console.error('Error verifying email:', error);
          toast({
            variant: "destructive",
            title: "Verification Error",
            description: "Failed to verify email. Please try again.",
          });
        }
      }
    };

    verifyEmailFromToken();
  }, [token, user, router, toast]);

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

  const handleResendVerification = async () => {
    if (!user || cooldownTime > 0) return;

    setIsResending(true);
    try {
      // Try to send verification email via Brevo, fallback to Firebase
      try {
        // Create verification link with user ID as token
        const verificationLink = `${window.location.origin}/verify-email?token=${user.uid}&email=${encodeURIComponent(email)}`;
        
        // Send verification email via Brevo
        await BrevoEmailService.sendVerificationEmail(email, verificationLink, user.displayName || undefined);
        
        console.log('Verification email sent via Brevo');
      } catch (error: any) {
        if (error.message === 'BREVO_NOT_CONFIGURED' || error.message === 'BREVO_SEND_FAILED') {
          console.log('Falling back to Firebase email verification');
          
          // Fallback to Firebase email verification
          await sendEmailVerification(user, {
            url: `${window.location.origin}/verify-email?email=${encodeURIComponent(email)}`,
            handleCodeInApp: true
          });
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
        variant: "destructive",
        title: "Error Sending Email",
        description: error.message || "Failed to send verification email. Please try again.",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = () => {
    if (user?.emailVerified) {
      router.push('/home');
    } else {
      toast({
        title: "Email Not Verified",
        description: "Please check your email and click the verification link.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle>Please Sign In</CardTitle>
            <CardDescription>You need to be signed in to verify your email.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            We&apos;ve sent a verification link to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Next steps:</strong>
              <ol className="mt-2 space-y-1 text-sm">
                <li>1. Check your email inbox</li>
                <li>2. Look for an email from Yrdly</li>
                <li>3. Click the verification link</li>
                <li>4. Return here and click &quot;I&apos;ve verified my email&quot;</li>
              </ol>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button 
              onClick={handleCheckVerification}
              className="w-full"
              size="lg"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              I&apos;ve verified my email
            </Button>

            <Button 
              onClick={handleResendVerification}
              disabled={isResending || cooldownTime > 0}
              variant="outline"
              className="w-full"
            >
              {isResending ? (
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
                  Resend verification email
                </>
              )}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>Didn&apos;t receive the email?</p>
            <ul className="mt-1 space-y-1">
              <li>• Check your spam/junk folder</li>
              <li>• Make sure {email} is correct</li>
              <li>• Wait a few minutes and try again</li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/login')}
              className="w-full text-sm"
            >
              Sign in with a different account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
