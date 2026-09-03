import { requireAdmin } from '@/lib/session';
import { getAllUsers, getAllRequests, getDepartments } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExportButton } from '@/components/ui/exportButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDateRange } from '@/lib/date';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import type { Department, User, VacationRequest } from '@prisma/client';

function exportCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default async function AdminReportsPage() {
  await requireAdmin();
  const [users, requests, departments] = await Promise.all([getAllUsers(), getAllRequests(), getDepartments()]);
  const deptMap = new Map<string, string>(); (departments as Department[]).forEach((d) => deptMap.set(d.id, d.name));
  const empMap = new Map<string, User>(); (users as User[]).forEach((u) => empMap.set(u.id, u));
  const approvedByEmp = new Map<string, number>(); const pendingByEmp = new Map<string, number>();
  for (const r of requests as VacationRequest[]) { if (r.status === 'APPROVED') approvedByEmp.set(r.employeeId, (approvedByEmp.get(r.employeeId) ?? 0) + r.workingDays); if (r.status === 'PENDING') pendingByEmp.set(r.employeeId, (pendingByEmp.get(r.employeeId) ?? 0) + r.workingDays); }

  const balanceRows: (string | number)[][] = [['Employee', 'Email', 'Department', 'Allowance', 'Carry-over', 'Approved', 'Pending', 'Remaining'], ...(users as User[]).map((e) => { const approved = approvedByEmp.get(e.id) ?? 0; const total = e.annualAllowance + e.carryOverDays; return [`${e.firstName} ${e.lastName}`, e.email, deptMap.get(e.departmentId ?? '') ?? '—', total, e.carryOverDays, approved, pendingByEmp.get(e.id) ?? 0, total - approved]; })];
  const historyRows: (string | number)[][] = [['Employee', 'Email', 'Department', 'Start', 'End', 'Working Days', 'Status', 'Reason', 'Manager Comment', 'Submitted'], ...(requests as VacationRequest[]).map((r) => { const e = empMap.get(r.employeeId); return [e ? `${e.firstName} ${e.lastName}` : '—', e?.email ?? '—', e?.departmentId ? deptMap.get(e.departmentId) ?? '—' : '—', format(new Date(r.startDate), 'yyyy-MM-dd'), format(new Date(r.endDate), 'yyyy-MM-dd'), r.workingDays, r.status, r.reason ?? '', r.managerComment ?? '', format(new Date(r.createdAt), 'yyyy-MM-dd')]; })];
  const summaryRows: (string | number)[][] = [['Department', 'Employees', 'Total Allowance', 'Approved Days', 'Pending Days'], ...(departments as Department[]).map((d) => { const emps = (users as User[]).filter((e) => e.departmentId === d.id); const total = emps.reduce((s, e) => s + e.annualAllowance + e.carryOverDays, 0); const approved = emps.reduce((s, e) => s + (approvedByEmp.get(e.id) ?? 0), 0); const pending = emps.reduce((s, e) => s + (pendingByEmp.get(e.id) ?? 0), 0); return [d.name, emps.length, total, approved, pending]; })];

  return (
    
    <div className="space-y-6">
      <PageHeader title="Reports" description="Generate and export vacation reports to CSV." />
      <Tabs defaultValue="balances">
        <TabsList><TabsTrigger value="balances">Vacation Balances</TabsTrigger><TabsTrigger value="history">Vacation History</TabsTrigger><TabsTrigger value="summary">Employee Summaries</TabsTrigger></TabsList>
        <TabsContent value="balances" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-base">Vacation Balances</CardTitle><CardDescription>Current balances for all employees</CardDescription></div><ExportButton filename="vacation-balances.csv" rows={balanceRows} /></CardHeader>
            <CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Employee</th><th className="px-4 py-3 font-medium">Department</th><th className="px-4 py-3 font-medium">Allowance</th><th className="px-4 py-3 font-medium">Approved</th><th className="px-4 py-3 font-medium">Pending</th><th className="px-4 py-3 font-medium">Remaining</th></tr></thead><tbody className="divide-y">{(users as User[]).map((e) => { const approved = approvedByEmp.get(e.id) ?? 0; const total = e.annualAllowance + e.carryOverDays; return <tr key={e.id} className="hover:bg-muted/30"><td className="px-4 py-3 font-medium">{e.firstName} {e.lastName}</td><td className="px-4 py-3 text-muted-foreground">{deptMap.get(e.departmentId ?? '') ?? '—'}</td><td className="px-4 py-3">{total}</td><td className="px-4 py-3">{approved}</td><td className="px-4 py-3">{pendingByEmp.get(e.id) ?? 0}</td><td className="px-4 py-3 font-medium">{total - approved}</td></tr>; })}</tbody></table></div></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-base">Vacation History</CardTitle><CardDescription>All vacation requests</CardDescription></div><ExportButton filename="vacation-history.csv" rows={historyRows} /></CardHeader>
            <CardContent className="p-0"><div className="max-h-[600px] overflow-auto"><table className="w-full text-sm"><thead className="sticky top-0 bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Employee</th><th className="px-4 py-3 font-medium">Dates</th><th className="px-4 py-3 font-medium">Days</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Reason</th></tr></thead><tbody className="divide-y">{(requests as VacationRequest[]).map((r) => { const e = empMap.get(r.employeeId); return <tr key={r.id} className="hover:bg-muted/30"><td className="px-4 py-3 font-medium">{e?.firstName} {e?.lastName}</td><td className="px-4 py-3">{formatDateRange(r.startDate, r.endDate)}</td><td className="px-4 py-3">{r.workingDays}</td><td className="px-4 py-3">{r.status}</td><td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground">{r.reason ?? '—'}</td></tr>; })}</tbody></table></div></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-base">Employee Summaries</CardTitle><CardDescription>Aggregated by department</CardDescription></div><ExportButton filename="employee-summaries.csv" rows={summaryRows} /></CardHeader>
            <CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Department</th><th className="px-4 py-3 font-medium">Employees</th><th className="px-4 py-3 font-medium">Total Allowance</th><th className="px-4 py-3 font-medium">Approved Days</th><th className="px-4 py-3 font-medium">Pending Days</th></tr></thead><tbody className="divide-y">{(departments as Department[]).map((d) => { const emps = (users as User[]).filter((e) => e.departmentId === d.id); const total = emps.reduce((s, e) => s + e.annualAllowance + e.carryOverDays, 0); const approved = emps.reduce((s, e) => s + (approvedByEmp.get(e.id) ?? 0), 0); const pending = emps.reduce((s, e) => s + (pendingByEmp.get(e.id) ?? 0), 0); return <tr key={d.id} className="hover:bg-muted/30"><td className="px-4 py-3 font-medium">{d.name}</td><td className="px-4 py-3">{emps.length}</td><td className="px-4 py-3">{total}</td><td className="px-4 py-3">{approved}</td><td className="px-4 py-3">{pending}</td></tr>; })}</tbody></table></div></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
