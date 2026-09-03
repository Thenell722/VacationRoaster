'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CalendarDays, LayoutDashboard, CalendarPlus, History, User as UserIcon, Users, CalendarClock, CalendarRange, FileBarChart, PartyPopper, ScrollText, ChevronLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/sidebar-provider';
import { Button } from '@/components/ui/button';

interface NavItem { href: string; label: string; icon: React.ComponentType<{ className?: string }>; }
const employeeNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/requests/new', label: 'Request Vacation', icon: CalendarPlus },
  { href: '/history', label: 'My Requests', icon: History },
  { href: '/profile', label: 'Profile', icon: UserIcon },
];
const adminNav: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/employees', label: 'Employees', icon: Users },
  { href: '/admin/requests', label: 'Requests', icon: CalendarClock },
  { href: '/admin/calendar', label: 'Calendar', icon: CalendarRange },
  { href: '/admin/reports', label: 'Reports', icon: FileBarChart },
  { href: '/admin/holidays', label: 'Holidays', icon: PartyPopper },
  { href: '/admin/audit', label: 'Audit Logs', icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const nav = isAdmin ? adminNav : employeeNav;

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={cn('fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-card transition-all duration-300', collapsed ? 'w-[68px]' : 'w-60]', mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200"><CalendarDays className="h-5 w-5" /></div>
          {!collapsed && <div className="flex flex-col leading-tight"><span className="text-sm font-semibold">Vacation Roster</span><span className="text-xs text-muted-foreground">Time-off management</span></div>}
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" className="hidden h-8 w-8 lg:flex" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></Button>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={cn('group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', active ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'text-muted-foreground hover:bg-accent hover:text-foreground', collapsed && 'justify-center')} title={collapsed ? item.label : undefined}><item.icon className="h-5 w-5 shrink-0" />{!collapsed && <span>{item.label}</span>}</Link>;
          })}
        </nav>
      </aside>
    </>
  );
}
