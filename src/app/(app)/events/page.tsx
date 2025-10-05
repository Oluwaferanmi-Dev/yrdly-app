
"use client";

import { V0EventsScreen } from "@/components/V0EventsScreen";

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function EventsPage() {
  return <V0EventsScreen />;
}
