'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { useSidebar } from '@/components/sidebar-provider';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Pages that do not require authentication
  const publicRoutes = ['/login'];

  const isPublicRoute = publicRoutes.includes(pathname);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}


function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  const { data: session, status } = useSession();

  const router = useRouter();
  const pathname = usePathname();

  const isAdminArea = pathname.startsWith('/admin');
  const isAdmin = (session?.user as any)?.role === 'ADMIN';


  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }

    if (isAdminArea && !isAdmin) {
      router.replace('/dashboard');
    }

  }, [
    status,
    isAdmin,
    isAdminArea,
    router
  ]);


  // Wait for NextAuth to determine session state
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }


  // Prevent rendering protected pages when not logged in
  if (status === 'unauthenticated') {
    return null;
  }


  // Prevent unauthorized admin access
  if (isAdminArea && !isAdmin) {
    return null;
  }


  return (
    <div className="min-h-screen bg-background">

      <Sidebar />

      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-300',
          collapsed ? 'lg:pl-[68px]' : 'lg:pl-64'
        )}
      >

        <Topbar />

        <main className="flex-1 p-4 lg:p-6">
          <div className="mx-auto max-w-7xl animate-in">
            {children}
          </div>
        </main>

      </div>

    </div>
  );
}