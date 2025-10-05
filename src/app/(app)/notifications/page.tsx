"use client";

import { V0NotificationsScreen } from "@/components/V0NotificationsScreen";

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function NotificationsPage() {
  return <V0NotificationsScreen />;
}
