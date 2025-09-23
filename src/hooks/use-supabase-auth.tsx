'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { AuthService, AuthUser } from '@/lib/auth-service';

interface AuthContextType {
  user: User | null;
  profile: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ user: User | null; error: any }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  signInWithGoogle: () => Promise<{ data: any; error: any }>;
  signInWithApple: () => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
          
          if (currentUser) {
            try {
              // First, try to get existing profile
              let userProfile = await AuthService.getUserProfile(currentUser.id);
              
              // If no profile exists, create one
              if (!userProfile) {
                console.log('No user profile found on initial load, creating one for user:', currentUser.id);
                try {
                  await AuthService.createUserProfile(currentUser, 
                    currentUser.user_metadata?.name || 
                    currentUser.user_metadata?.full_name ||
                    currentUser.user_metadata?.display_name ||
                    currentUser.user_metadata?.given_name ||
                    currentUser.email?.split('@')[0] || 
                    'User'
                  );
                  // Fetch the newly created profile
                  userProfile = await AuthService.getUserProfile(currentUser.id);
                  console.log('User profile created successfully on initial load:', userProfile?.name);
                } catch (createError) {
                  console.error('Error creating user profile on initial load:', createError);
                }
              }
              
              if (isMounted) {
                setProfile(userProfile);
              }
            } catch (error) {
              console.error('Error fetching user profile:', error);
              if (isMounted) {
                setProfile(null);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = AuthService.onAuthStateChange(async (user) => {
      if (isMounted) {
        setUser(user);
        
        if (user) {
          try {
            // First, try to get existing profile
            let userProfile = await AuthService.getUserProfile(user.id);
            
            // If no profile exists, create one
            if (!userProfile) {
              console.log('No user profile found, creating one for user:', user.id);
              try {
                await AuthService.createUserProfile(user, 
                  user.user_metadata?.name || 
                  user.user_metadata?.full_name ||
                  user.user_metadata?.display_name ||
                  user.user_metadata?.given_name ||
                  user.email?.split('@')[0] || 
                  'User'
                );
                // Fetch the newly created profile
                userProfile = await AuthService.getUserProfile(user.id);
                console.log('User profile created successfully:', userProfile?.name);
              } catch (createError) {
                console.error('Error creating user profile:', createError);
              }
            }
            
            if (isMounted) {
              setProfile(userProfile);
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
            if (isMounted) {
              setProfile(null);
            }
          }
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const result = await AuthService.signUp(email, password, name);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await AuthService.signIn(email, password);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await AuthService.signInWithGoogle();
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signInWithApple = async () => {
    setLoading(true);
    try {
      const result = await AuthService.signInWithApple();
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const result = await AuthService.signOut();
      setUser(null);
      setProfile(null);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    return await AuthService.resetPassword(email);
  };

  const updatePassword = async (newPassword: string) => {
    return await AuthService.updatePassword(newPassword);
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      await AuthService.updateUserProfile(user.id, updates);
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithApple,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

