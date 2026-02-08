import { AuthProvider } from '@/hooks/use-supabase-auth';
import { Pacifico, Raleway } from 'next/font/google';

const pacifico = Pacifico({ weight: '400', subsets: ['latin'], variable: '--font-pacifico' });
const raleway = Raleway({ weight: ['300', '400', '500'], subsets: ['latin'], variable: '--font-raleway' });

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className={`${pacifico.variable} ${raleway.variable} font-sans`}>
        {children}
      </div>
    </AuthProvider>
  );
}
