
"use client";

import { V0MessagesScreen } from "@/components/V0MessagesScreen";

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function MessagesPage() {
    return <V0MessagesScreen />;
}
