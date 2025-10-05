
"use client";

import { V0CommunityScreen } from "@/components/V0CommunityScreen";

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function NeighborsPage() {
  return <V0CommunityScreen />;
}
