
"use client";

import { V0MapScreen } from "@/components/V0MapScreen";

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function MapPage() {
  return <V0MapScreen />;
}
