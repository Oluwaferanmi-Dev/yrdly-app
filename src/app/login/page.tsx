
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword, signInWithPopup, getAdditionalUserInfo, AuthProvider, OAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db, googleProvider, appleProvider } from '@/lib/firebase';
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';


const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const passwordResetSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const resetForm = useForm<z.infer<typeof passwordResetSchema>>({
      resolver: zodResolver(passwordResetSchema),
      defaultValues: {
          email: "",
      },
  });

  const handleSocialSignIn = async (provider: AuthProvider | OAuthProvider) => {
    setLoading(true);
    setError(null);
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const additionalInfo = getAdditionalUserInfo(result);

        if (additionalInfo?.isNewUser) {
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                avatarUrl: user.photoURL || `https://placehold.co/100x100.png?text=${user.displayName?.charAt(0)}`,
                bio: "",
            });
        }
        router.push('/home');
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setError(errorMessage);
        toast({
            variant: "destructive",
            title: "Sign In Failed",
            description: errorMessage,
        });
    } finally {
        setLoading(false);
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push('/home');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      })
    } finally {
        setLoading(false);
    }
  };

  const handlePasswordReset = async (values: z.infer<typeof passwordResetSchema>) => {
      setLoading(true);
      try {
          await sendPasswordResetEmail(auth, values.email);
          toast({
              title: "Password Reset Email Sent",
              description: "Please check your inbox for instructions to reset your password.",
          });
          setResetDialogOpen(false);
          resetForm.reset();
      } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          resetForm.setError("email", { type: "manual", message: errorMessage });
          toast({
              variant: "destructive",
              title: "Error",
              description: errorMessage,
          });
      } finally {
          setLoading(false);
      }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 animate-fade-in">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="/yrdly-logo.png" alt="Yrdly Logo" width={80} height={80} />
          </div>
            <div className="flex justify-center items-center gap-2 mb-2">
                <CardTitle className="text-3xl font-bold font-headline">Yrdly</CardTitle>
            </div>

          <CardDescription>Welcome back! Please enter your details.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => handleSocialSignIn(googleProvider)} disabled={loading}>
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 76.2c-27.3-25.2-65-41-106.3-41-84.3 0-152.3 67.4-152.3 150.9s68 150.9 152.3 150.9c98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                    Google
                </Button>
                 <Button variant="outline" onClick={() => handleSocialSignIn(appleProvider)} disabled={loading}>
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="apple" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C39.2 141.6 0 184.2 0 241.2c0 61.6 31.5 118.8 80.1 142.6 20.7 10.2 43.4 15.6 65.7 15.6 62.2 0 89.4-40.2 127.9-40.2 39.2 0 65.7 40.2 127.9 40.2 21.5 0 43.7-4.7 64.1-14.2-67.2-34.9-102.5-102.3-102.5-167.5zM298.1 82.5c24.5-32.9 44.5-54.8 44.5-82.5-26.6 1.3-55.5 15.9-74.2 34.3-20.5 20.5-39.2 49.9-39.2 78.5 28.5 2.8 56.6-14.2 68.9-30.3z"></path></svg>
                    Apple
                </Button>
            </div>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
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
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="link" type="button" className="text-xs p-0 h-auto">Forgot Password?</Button>
                          </DialogTrigger>
                          <DialogContent>
                              <Form {...resetForm}>
                                  <form onSubmit={resetForm.handleSubmit(handlePasswordReset)}>
                                      <DialogHeader>
                                          <DialogTitle>Reset Password</DialogTitle>
                                          <DialogDescription>
                                              Enter your email address and we&apos;ll send you a link to reset your password.
                                          </DialogDescription>
                                      </DialogHeader>
                                      <div className="py-4">
                                          <FormField
                                              control={resetForm.control}
                                              name="email"
                                              render={({ field }) => (
                                                  <FormItem>
                                                      <FormLabel>Email</FormLabel>
                                                      <FormControl>
                                                          <Input placeholder="name@example.com" {...field} />
                                                      </FormControl>
                                                      <FormMessage />
                                                  </FormItem>
                                              )}
                                          />
                                      </div>
                                      <DialogFooter>
                                          <Button type="submit" disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</Button>
                                      </DialogFooter>
                                  </form>
                              </Form>
                          </DialogContent>
                        </Dialog>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Create Account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
