
"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function AppearancePage() {
  return (
    <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold font-headline mb-6">Appearance</h1>
        <Card>
            <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>
                    Customize the look and feel of the app by selecting a theme.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Toggle Theme</p>
                    <ThemeToggle />
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
