import Link from 'next/link';
import { CalendarPlus, CalendarDays, Clock, CheckCircle2, Hourglass, Wallet, TrendingUp, CalendarClock, Inbox, PartyPopper } from 'lucide-react';
import { getSessionUser } from '@/lib/session';
import { getEmployeeRequests, getHolidays, computeBalance } from '@/lib/data';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDateRange, timeAgo } from '@/lib/date';
import { isAfter } from 'date-fns';
import { EmptyState } from '@/components/empty-state';
import type { RequestStatus } from '@/lib/types';

export default async function EmployeeDashboardPage() {
  const profile = await getSessionUser();
  if (!profile) return null;
  const [requests, holidays] = await Promise.all([getEmployeeRequests(profile.id), getHolidays()]);
  const balance = computeBalance(profile, requests);
  const today = new Date();
  const upcoming = requests.filter((r) => r.status === 'APPROVED' && isAfter(new Date(r.startDate), today)).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).slice(0, 3);
  const recent = requests.slice(0, 5);
  const upcomingHolidays = holidays.filter((h) => isAfter(new Date(h.date), today)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3);
  const usedPct = balance.annualAllowance > 0 ? Math.round((balance.approvedDays / balance.annualAllowance) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${profile.firstName}`} description="Here's your vacation overview at a glance." actions={<Button asChild className="bg-blue-600 hover:bg-blue-700"><Link href="/requests/new"><CalendarPlus className="mr-2 h-4 w-4" />Request Vacation</Link></Button>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Annual Allowance" value={balance.annualAllowance} icon={Wallet} tone="primary" />
        <StatCard label="Days Approved" value={balance.approvedDays} icon={CheckCircle2} tone="success" />
        <StatCard label="Days Pending" value={balance.pendingDays} icon={Hourglass} tone="warning" />
        <StatCard label="Remaining Balance" value={balance.remaining} icon={TrendingUp} tone={balance.remaining < 5 ? 'danger' : 'default'} hint={balance.carryOverDays > 0 ? `incl. ${balance.carryOverDays} carry-over` : undefined} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Vacation Usage</CardTitle><CardDescription>{usedPct}% of your annual allowance used</CardDescription></CardHeader>
        <CardContent>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all" style={{ width: `${Math.min(usedPct, 100)}%` }} /></div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{balance.approvedDays} approved</span><span>{balance.annualAllowance + balance.carryOverDays} total</span></div>
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-base">Upcoming Vacations</CardTitle><CardDescription>Your next approved time off</CardDescription></div><CalendarDays className="h-5 w-5 text-muted-foreground" /></CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 ? <EmptyState icon={CalendarClock} title="No upcoming vacations" description="Your next approved time off will appear here." /> : upcoming.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-medium">{formatDateRange(r.startDate, r.endDate)}</p><p className="text-xs text-muted-foreground">{r.workingDays} working days · {r.reason ?? 'No reason provided'}</p></div><StatusBadge status={r.status as RequestStatus} /></div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-base">Recent Requests</CardTitle><CardDescription>Your latest submissions</CardDescription></div><Clock className="h-5 w-5 text-muted-foreground" /></CardHeader>
          <CardContent className="space-y-3">
            {recent.length === 0 ? <EmptyState icon={Inbox} title="No requests yet" description="Submit your first vacation request to get started." action={<Button asChild size="sm" className="mt-2 bg-blue-600 hover:bg-blue-700"><Link href="/requests/new">New Request</Link></Button>} /> : recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-medium">{formatDateRange(r.startDate, r.endDate)}</p><p className="text-xs text-muted-foreground">{r.workingDays} days · {timeAgo(r.createdAt)}</p></div><StatusBadge status={r.status as RequestStatus} /></div>
            ))}
          </CardContent>
        </Card>
      </div>
      {upcomingHolidays.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Upcoming Holidays</CardTitle><CardDescription>These days are excluded from working-day calculations</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {upcomingHolidays.map((h) => <div key={h.id} className="flex items-center gap-2 rounded-lg border bg-blue-50/50 px-3 py-2 dark:bg-blue-950/30"><PartyPopper className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">{h.name}</span><span className="text-xs text-muted-foreground">{formatDateRange(h.date, h.date)}</span></div>)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
