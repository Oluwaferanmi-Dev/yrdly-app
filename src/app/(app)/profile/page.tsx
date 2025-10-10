"use client";

import { V0ProfileScreen } from "@/components/V0ProfileScreen";
import { useAuth } from "@/hooks/use-supabase-auth";

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const { user } = useAuth();
  
  // isOwnProfile is true when viewing own profile (no userId in route)
  // This page is for the logged-in user's own profile
  return <V0ProfileScreen isOwnProfile={true} targetUserId={user?.id} />;
}

