"use client";

import { V0ProfileScreen } from "@/components/V0ProfileScreen";

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  return <V0ProfileScreen isOwnProfile={true} />;
}

