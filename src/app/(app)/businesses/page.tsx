
"use client";

import { V0BusinessesScreen } from "@/components/V0BusinessesScreen";

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function BusinessesPage() {
  return <V0BusinessesScreen />;
}
