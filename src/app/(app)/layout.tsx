
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppBottomNav } from '@/components/layout/AppBottomNav';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="md:hidden">
            <AppHeader />
        </div>
        <main className="p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">{children}</main>
        <AppBottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
