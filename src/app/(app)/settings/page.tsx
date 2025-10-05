
"use client";

import { V0SettingsScreen } from "@/components/V0SettingsScreen";

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function SettingsPage() {
    return <V0SettingsScreen />;
}
