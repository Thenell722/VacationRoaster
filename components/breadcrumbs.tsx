'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import { ChevronRight } from 'lucide-react';
const LABELS: Record<string, string> = { dashboard: 'Dashboard', requests: 'Requests', new: 'New Request', history: 'My Requests', profile: 'Profile', admin: 'Admin', employees: 'Employees', calendar: 'Calendar', reports: 'Reports', holidays: 'Holidays', audit: 'Audit Logs' };
export function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === '/dashboard') return <span className="text-sm font-medium">Dashboard</span>;
  const segments = pathname.split('/').filter(Boolean);
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground overflow-hidden">
      {segments.map((seg, i) => {
        const href = '/' + segments.slice(0, i + 1).join('/');
        const isLast = i === segments.length - 1;
        const label = LABELS[seg] ?? seg;
        return <Fragment key={href}>{i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />}{isLast ? <span className="truncate font-medium text-foreground">{label}</span> : <Link href={href} className="truncate hover:text-foreground">{label}</Link>}</Fragment>;
      })}
    </nav>
  );
}
