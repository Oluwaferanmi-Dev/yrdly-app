import { AuthProvider } from '@/hooks/use-supabase-auth';

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
