"use client";

import { V0EditProfileScreen } from "@/components/V0EditProfileScreen";

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function ProfilePage() {
    return <V0EditProfileScreen />;
}