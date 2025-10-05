
"use client";

import { V0MessagesScreen } from "@/components/V0MessagesScreen";
import { use, Suspense } from 'react';

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

// For Next.js 15 compatibility, params is now async
export default function MessagesPage({ params }: { params?: Promise<{ convId?: string }> }) {
    // Use React's use() hook for client components
    const resolvedParams = params ? use(params) : undefined;
    const selectedConversationId = resolvedParams?.convId;
    
    console.log("MessagesPage rendered. Params:", resolvedParams);
    
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <V0MessagesScreen />
        </Suspense>
    );
}
