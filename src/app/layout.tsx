import type { Metadata } from 'next';

import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-supabase-auth';
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: 'Yrdly - Your Neighborhood Network',
  description: 'Connect with your neighbors, share updates, and build a stronger community with Yrdly.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#ffffff" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Jersey+25&family=Pacifico&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className={cn('font-body antialiased min-h-screen bg-background')}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
          storageKey="yrdly-theme"
        >
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
