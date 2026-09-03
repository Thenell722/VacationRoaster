import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AppProviders } from '@/components/app-providers';
import { SidebarProvider } from '@/components/sidebar-provider';
import { AppShell } from '@/components/app-shell';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vacation Roster — Time-off Management',
  description: 'Manage employee vacation requests, approvals, and company holidays.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AppProviders>
            <SidebarProvider>
              <AppShell>{children}</AppShell>
              <Toaster richColors position="top-right" />
            </SidebarProvider>
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
