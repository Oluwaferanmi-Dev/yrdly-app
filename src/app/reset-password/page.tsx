'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';

// Design tokens
const colors = {
  background: '#15181D',
  blob: '#A154F2',
  overlay: 'rgba(255, 255, 255, 0.05)',
  border: '#388E3C',
  primary: '#388E3C',
  text: '#FFFFFF',
  textFaded: '#BBBBBB',
};

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== 'PASSWORD_RECOVERY') {
        // If they just opened this without a token, redirect
        if (!session) {
          router.replace('/login');
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
      } else {
        router.push('/home');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full h-12 sm:h-14 pl-4 pr-11 sm:pl-5 sm:pr-12 rounded-full font-raleway font-light text-sm text-white placeholder:text-[#BBBBBB] bg-transparent border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition';
  const borderStyle = { border: '0.5px solid #388E3C' };
  const pillRound = 'rounded-full';

  return (
    <div
      className="min-h-screen relative flex flex-col items-center justify-center px-4 py-6"
      style={{ background: colors.background }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[10%] min-w-[40px] aspect-square rounded-full"
          style={{ background: colors.blob, opacity: 0.55, left: '5%', top: '10%' }}
        />
        <div
          className="absolute w-[8%] min-w-[32px] aspect-square rounded-full"
          style={{ background: colors.blob, opacity: 0.55, right: '5%', bottom: '10%' }}
        />
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: colors.overlay,
          border: '1px solid rgba(255,255,255,0.01)',
          backdropFilter: 'blur(1.8px)',
        }}
      />

      <div className="relative z-10 w-full max-w-[471px] flex flex-col items-center">
        <div className="text-center mb-8 w-full">
          <h1
            className="text-2xl text-white leading-tight px-1"
            style={{ fontFamily: '"Pacifico", cursive' }}
          >
            Set New Password
          </h1>
          <p className="font-raleway font-light text-sm text-[#BBBBBB] mt-2">
            Please enter your new password
          </p>
        </div>

        {error && (
          <Alert className="mb-4 border-red-500/50 bg-red-500/10 text-red-200 w-full">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <div className={`relative ${pillRound}`} style={borderStyle}>
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="flex items-center justify-center w-full h-full text-[#BBBBBB] hover:text-white"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            className={`w-full h-11 ${pillRound} font-raleway font-medium text-white hover:opacity-90`}
            style={{ background: colors.primary }}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}
