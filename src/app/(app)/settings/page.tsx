
"use client";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This page now redirects to the new profile page, which serves as the main entry for settings.
export default function SettingsRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/settings/profile');
    }, [router]);

    return null; // Or a loading spinner
}
