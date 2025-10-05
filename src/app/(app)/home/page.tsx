
"use client";

import { V0HomeScreen } from "@/components/V0HomeScreen";

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function Home() {
  return <V0HomeScreen />;
}
