import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'We\'ll be back soon',
  description: 'Yrdly is temporarily down for maintenance and will be back shortly.',
};

export default function MaintenancePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold mb-3">We\'re temporarily down</h1>
        <p className="text-muted-foreground mb-6">
          We\'re performing some maintenance and will be back shortly. Thank you for your patience.
        </p>
      </div>
    </main>
  );
}


