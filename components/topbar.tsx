'use client';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Menu, LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/sidebar-provider';
import { useSession } from 'next-auth/react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Breadcrumbs } from '@/components/breadcrumbs';

export function Topbar() {
  const { setMobileOpen } = useSidebar();
  const { data: session } = useSession();
  const router = useRouter();
  const name = session?.user?.name ?? '';
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur-md lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
      <Breadcrumbs />
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8"><AvatarFallback className="bg-blue-100 text-blue-700 text-xs">{initials}</AvatarFallback></Avatar>
              <div className="hidden flex-col items-start leading-tight sm:flex"><span className="text-sm font-medium">{name}</span><span className="text-xs text-muted-foreground">{isAdmin ? 'Administrator' : 'Employee'}</span></div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')}><UserIcon className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })} className="text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" /> Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
