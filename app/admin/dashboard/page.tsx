import { Users, UserCheck, CalendarClock, CheckCircle2, XCircle, Plane, Wallet } from 'lucide-react';
import { requireAdmin } from '@/lib/session';
import { getAllUsers, getAllRequests, getHolidays } from '@/lib/data';
import { StatCard } from '@/components/stat-card';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { MonthlyRequestsChart, DepartmentBreakdownChart, VacationUsageChart } from '@/components/charts';
import { formatDateRange } from '@/lib/date';
import { isWithinInterval, format } from 'date-fns';
import type { RequestStatus } from '@/lib/types';

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [allUsers, requests, holidays] = await Promise.all([getAllUsers(), getAllRequests(), getHolidays()]);
  const employees = allUsers.filter((u) => u.role === 'EMPLOYEE');
  const activeEmployees = employees.filter((u) => u.active);
  const pending = requests.filter((r) => r.status === 'PENDING');
  const now = new Date();
  const thisMonth = requests.filter((r) => r.status === 'APPROVED' && format(new Date(r.createdAt), 'yyyy-MM') === format(now, 'yyyy-MM'));
  const rejectedThisMonth = requests.filter((r) => r.status === 'REJECTED' && format(new Date(r.createdAt), 'yyyy-MM') === format(now, 'yyyy-MM'));
  const onLeave = requests.filter((r) => r.status === 'APPROVED' && isWithinInterval(now, { start: new Date(r.startDate), end: new Date(r.endDate) }));
  const totalRemaining = allUsers.reduce((s, p) => { const approved = requests.filter((r) => r.employeeId === p.id && r.status === 'APPROVED').reduce((a, r) => a + r.workingDays, 0); return s + Math.max(0, p.annualAllowance + p.carryOverDays - approved); }, 0);

  const months: { month: string; requests: number; days: number }[] = [];
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); const key = format(d, 'yyyy-MM'); const label = format(d, 'MMM'); const monthReqs = requests.filter((r) => format(new Date(r.createdAt), 'yyyy-MM') === key); months.push({ month: label, requests: monthReqs.length, days: monthReqs.filter((r) => r.status === 'APPROVED').reduce((s, r) => s + r.workingDays, 0) }); }

  const deptMap = new Map<string, number>();
  for (const r of requests.filter((r) => r.status === 'APPROVED')) { const deptName = r.employee.department?.name ?? 'Unassigned'; deptMap.set(deptName, (deptMap.get(deptName) ?? 0) + r.workingDays); }
  const deptData = Array.from(deptMap, ([name, value]) => ({ name, value }));
  const recentPending = pending.slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" description="Company-wide vacation overview and analytics." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Employees" value={employees.length} icon={Users} tone="primary" />
        <StatCard label="Active Employees" value={activeEmployees.length} icon={UserCheck} tone="success" />
        <StatCard label="Pending Requests" value={pending.length} icon={CalendarClock} tone="warning" />
        <StatCard label="On Leave Today" value={onLeave.length} icon={Plane} tone="primary" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <StatCard label="Approved This Month" value={thisMonth.length} icon={CheckCircle2} tone="success" />
        <StatCard label="Rejected This Month" value={rejectedThisMonth.length} icon={XCircle} tone="danger" />
        {/*<StatCard label="Company Remaining Days" value={totalRemaining} icon={Wallet} tone="primary" />*/}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-base">Monthly Vacation Requests</CardTitle><CardDescription>Last 6 months of submissions</CardDescription></CardHeader><CardContent><MonthlyRequestsChart data={months} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Vacation Usage</CardTitle><CardDescription>Approved working days per month</CardDescription></CardHeader><CardContent><VacationUsageChart data={months} /></CardContent></Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-base">Department Breakdown</CardTitle><CardDescription>Approved days by department</CardDescription></CardHeader><CardContent>{deptData.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No approved vacation yet.</p> : <DepartmentBreakdownChart data={deptData} />}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Pending Approvals</CardTitle><CardDescription>Requests awaiting your review</CardDescription></CardHeader><CardContent className="space-y-3">
          {recentPending.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No pending requests.</p> : recentPending.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-medium">{r.employee.firstName} {r.employee.lastName}</p><p className="text-xs text-muted-foreground">{formatDateRange(r.startDate, r.endDate)} · {r.workingDays} days</p></div><StatusBadge status={r.status as RequestStatus} /></div>
          ))}
        </CardContent></Card>
      </div>
    </div>
  );
}
