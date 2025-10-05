
"use client";

import { V0MessagesScreen } from "@/components/V0MessagesScreen";
import { useParams } from 'next/navigation';

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function MessagesPage() {
    const params = useParams();
    const selectedConversationId = params?.convId as string;
    
    console.log("MessagesPage rendered. Conversation ID:", selectedConversationId);
    
    return <V0MessagesScreen selectedConversationId={selectedConversationId} />;
}
