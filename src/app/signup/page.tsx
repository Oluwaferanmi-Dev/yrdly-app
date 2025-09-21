
"use client";

import React, { useState } from 'react';

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, getAdditionalUserInfo, AuthProvider, OAuthProvider, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, appleProvider } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
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
import { Separator } from "@/components/ui/separator";
import { YrdlyLogo } from "@/components/ui/yrdly-logo";
import { Eye, EyeOff } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { BrevoEmailService } from '@/lib/brevo-service';
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { TermsOfServiceModal } from '@/components/modals/TermsOfServiceModal';
import { PrivacyPolicyModal } from '@/components/modals/PrivacyPolicyModal';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });


  // Check if all form fields are filled
  const watchedValues = form.watch();
  const isFormComplete = React.useMemo(() => {
    const values = form.getValues();
    return values.name.length >= 2 && 
           values.email.includes('@') && 
           values.password.length >= 6;
  }, [form]);

  const handleSocialSignIn = async (provider: AuthProvider | OAuthProvider) => {
    if (!agreed) {
      setError("You must agree to the Terms and Privacy Policy to continue.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const additionalInfo = getAdditionalUserInfo(result);

        // If it's a new user, create their document in Firestore
        if (additionalInfo?.isNewUser) {
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                avatarUrl: user.photoURL || `https://placehold.co/100x100.png?text=${user.displayName?.charAt(0)}`,
                bio: "",
                termsAccepted: true,
            });
        }
        router.push('/home');
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setError(errorMessage);
        toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: errorMessage,
        });
    } finally {
        setLoading(false);
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!isFormComplete) {
      setError("Please fill in all form fields completely.");
      return;
    }
    if (!agreed) {
      setError("You must agree to the Terms and Privacy Policy to continue.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: values.name });

      // Create a user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: values.name,
        email: values.email,
        avatarUrl: `https://placehold.co/100x100.png?text=${values.name.charAt(0)}`,
        bio: "",
        termsAccepted: true,
        emailVerified: false, // Track verification status
      });

      // Try to send verification email via Brevo, fallback to Firebase
      try {
        // Create verification link with user ID as token
        const verificationLink = `${window.location.origin}/verify-email?token=${user.uid}&email=${encodeURIComponent(values.email)}`;
        
        // Send verification email via Brevo
        await BrevoEmailService.sendVerificationEmail(values.email, verificationLink, values.name);
        
        console.log('Verification email sent via Brevo');
      } catch (error: any) {
        if (error.message === 'BREVO_NOT_CONFIGURED' || error.message === 'BREVO_SEND_FAILED') {
          console.log('Falling back to Firebase email verification');
          
          // Fallback to Firebase email verification
          await sendEmailVerification(user, {
            url: `${window.location.origin}/verify-email?email=${encodeURIComponent(values.email)}`,
            handleCodeInApp: true
          });
        } else {
          throw error; // Re-throw other errors
        }
      }

      // Redirect to verification page instead of home
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setError(errorMessage);
        toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: errorMessage,
        })
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-6 text-center pb-8">
            <div className="flex justify-center">
              <YrdlyLogo />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold text-balance">Create your account</CardTitle>
              <CardDescription className="text-muted-foreground">Get started with Yrdly today</CardDescription>
            </div>
        </CardHeader>

          <CardContent className="space-y-6">
            {/* Social Signup Buttons */}
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={(e) => {
                  e.preventDefault();
                  handleSocialSignIn(googleProvider);
                }} 
                disabled={loading || !agreed} 
                className="h-11 w-full max-w-sm"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
                </Button>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                </div>
            </div>

            {/* Signup Form */}
          <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                      <FormLabel>Full name</FormLabel>
                    <FormControl>
                        <Input
                          placeholder="Enter your full name"
                          {...field}
                          className="h-11"
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password"
                            {...field}
                            className="h-11 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowPassword(!showPassword);
                            }}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                          </Button>
                        </div>
                    </FormControl>
                      <p className="text-xs text-muted-foreground">Must be at least 6 characters long</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

                {/* Terms Agreement */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      checked={agreed}
                      onCheckedChange={(checked) => {
                        setAgreed(checked === true);
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor="terms" 
                        className="text-sm font-normal cursor-pointer leading-relaxed"
                        onClick={() => {
                          setAgreed(!agreed);
                        }}
                      >
                        I agree to Yrdly&apos;s{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowTermsModal(true);
                          }}
                          className="text-primary hover:underline font-medium"
                        >
                          Terms of Service
                        </button>
                      </Label>
                      <div className="mt-1">
                        <Label 
                  htmlFor="terms"
                          className="text-sm font-normal cursor-pointer leading-relaxed"
                          onClick={() => {
                            setAgreed(!agreed);
                          }}
                        >
                          and{" "}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowPrivacyModal(true);
                            }}
                            className="text-primary hover:underline font-medium"
                          >
                            Privacy Policy
                          </button>
                        </Label>
                      </div>
                      {!agreed && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          You must agree to the Terms and Privacy Policy to create an account.
                        </div>
                      )}
                    </div>
                  </div>
              </div>

               {error && (
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

                <Button type="submit" className="w-full h-11 font-medium" disabled={loading || !agreed}>
                  {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </Form>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
        </CardContent>
      </Card>

        {/* Modals */}
        <TermsOfServiceModal 
          open={showTermsModal} 
          onOpenChange={setShowTermsModal} 
        />
        <PrivacyPolicyModal 
          open={showPrivacyModal} 
          onOpenChange={setShowPrivacyModal} 
        />
      </div>
    </div>
  );
}
