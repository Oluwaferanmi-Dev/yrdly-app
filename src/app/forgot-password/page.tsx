"use client";

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { YrdlyLogo } from "@/components/ui/yrdly-logo";
import { ArrowLeft, Mail, Clock } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { AUTH_CONSTANTS } from '@/lib/constants';

const passwordResetSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [redirectCountdown, setRedirectCountdown] = useState(0);

  const form = useForm<z.infer<typeof passwordResetSchema>>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: "",
    },
  });

  // Pre-fill email from URL parameters
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      form.setValue('email', emailParam);
    }
  }, [searchParams, form]);

  // Handle resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Handle auto-redirect after successful submission
  useEffect(() => {
    if (isSubmitted && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isSubmitted && redirectCountdown === 0) {
      router.push('/login');
    }
  }, [isSubmitted, redirectCountdown, router]);

  const onSubmit = async (values: z.infer<typeof passwordResetSchema>) => {
    if (resendCooldown > 0) return; // Prevent spam
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setIsSubmitted(true);
      setResendCooldown(AUTH_CONSTANTS.EMAIL_RESEND_COOLDOWN / 1000); // Convert to seconds
      setRedirectCountdown(10); // Start 10-second countdown
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your inbox for instructions to reset your password.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      form.setError("email", { type: "manual", message: errorMessage });
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    await onSubmit(form.getValues());
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-6 text-center pb-8">
              <div className="flex justify-center">
                <YrdlyLogo />
              </div>
              <div className="space-y-2">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-semibold text-balance">Check your email</CardTitle>
                <CardDescription className="text-muted-foreground">
                  We&apos;ve sent a password reset link to <strong>{form.getValues("email")}</strong>
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Didn&apos;t receive the email? Check your spam folder or try again.
                </p>

                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={handleResend} 
                    disabled={resendCooldown > 0}
                    className="w-full h-11"
                  >
                    {resendCooldown > 0 ? (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        Try again in {resendCooldown}s
                      </>
                    ) : (
                      'Resend email'
                    )}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsSubmitted(false)} 
                    className="w-full h-10"
                  >
                    Use different email
                  </Button>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                {redirectCountdown > 0 ? (
                  <p>Redirecting to login in {redirectCountdown}s...</p>
                ) : (
                  <Link href="/login" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" />
                    Back to sign in
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-6 text-center pb-8">
            <div className="flex justify-center">
              <YrdlyLogo />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold text-balance">Forgot your password?</CardTitle>
              <CardDescription className="text-muted-foreground">
                No worries! Enter your email and we&apos;ll send you a reset link.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your email"
                          {...field}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full h-11 font-medium" disabled={isLoading}>
                  {isLoading ? "Sending reset link..." : "Send reset link"}
                </Button>
              </form>
            </Form>

            <div className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" />
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <YrdlyLogo />
              </div>
              <CardTitle className="text-2xl font-semibold text-balance">Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  );
}
