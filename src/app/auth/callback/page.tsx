'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Handling OAuth callback...');
        console.log('Current URL:', window.location.href);
        
        // Check if we have URL fragments (OAuth response)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        console.log('Hash params:', Object.fromEntries(hashParams));
        console.log('Search params:', Object.fromEntries(searchParams));
        
        // If we have an access token in the hash, exchange it for a session
        if (hashParams.get('access_token')) {
          console.log('Found access token, exchanging for session...');
          const { data, error } = await supabase.auth.setSession({
            access_token: hashParams.get('access_token')!,
            refresh_token: hashParams.get('refresh_token')!,
          });
          
          if (error) {
            console.error('Error setting session:', error);
            router.push('/login-supabase?error=' + encodeURIComponent(error.message));
            return;
          }
          
          if (data.session) {
            console.log('Session established:', data.session.user);
            // Redirect to Supabase home after a short delay
            setTimeout(() => {
              router.push('/home');
            }, 1000);
            return;
          }
        }
        
        // Check if we have a session already (user might be already authenticated)
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/login-supabase?error=' + encodeURIComponent(error.message));
          return;
        }

        if (data.session) {
          console.log('User already authenticated:', data.session.user);
          // Redirect to Supabase home after a short delay
          setTimeout(() => {
            router.push('/home');
          }, 1000);
        } else {
          console.log('No session found, redirecting to login');
          router.push('/login-supabase');
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        router.push('/login-supabase?error=An unexpected error occurred');
      }
    };

    // Add a small delay to ensure the page is fully loaded
    const timeoutId = setTimeout(handleAuthCallback, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Completing sign in...</p>
        <p className="text-sm text-gray-500 mt-2">If this takes too long, <a href="/home" className="text-blue-600 underline">click here</a></p>
      </div>
    </div>
  );
}

