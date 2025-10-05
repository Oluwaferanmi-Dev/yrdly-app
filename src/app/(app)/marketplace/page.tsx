
"use client";

import { V0MarketplaceScreen } from "@/components/V0MarketplaceScreen";

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function MarketplacePage() {
  return <V0MarketplaceScreen />;
}
