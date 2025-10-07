
"use client";

import { V0ConversationScreen } from "@/components/V0ConversationScreen";
import { useParams } from 'next/navigation';

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function ConversationPage() {
    const params = useParams();
    const conversationId = params?.convId as string;
    
    console.log("ConversationPage rendered. Conversation ID:", conversationId);
    
    return <V0ConversationScreen conversationId={conversationId} />;
}
