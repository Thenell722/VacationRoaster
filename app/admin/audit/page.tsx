import { requireAdmin } from '@/lib/session';
import prisma from '@/lib/db';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';
import { ScrollText } from 'lucide-react';
import { timeAgo } from '@/lib/date';

const ACTION_LABELS: Record<string, string> = {
  REQUEST_CREATED: 'Request Created', REQUEST_CANCELLED: 'Request Cancelled', REQUEST_APPROVED: 'Request Approved', REQUEST_REJECTED: 'Request Rejected',
  EMPLOYEE_CREATED: 'Employee Created', EMPLOYEE_UPDATED: 'Employee Updated', EMPLOYEE_DEACTIVATED: 'Employee Deactivated', EMPLOYEE_REACTIVATED: 'Employee Reactivated',
  PASSWORD_CHANGED: 'Password Changed', PASSWORD_RESET: 'Password Reset',
  HOLIDAY_CREATED: 'Holiday Created', HOLIDAY_UPDATED: 'Holiday Updated', HOLIDAY_DELETED: 'Holiday Deleted', DEPARTMENT_CREATED: 'Department Created',
};

export default async function AdminAuditPage() {
  await requireAdmin();
  const logs = await prisma.auditLog.findMany({ include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } }, orderBy: { createdAt: 'desc' }, take: 200 });

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="A record of key actions performed in the system." />
      {logs.length === 0 ? <EmptyState icon={ScrollText} title="No audit entries" description="Actions will be logged here as they happen." /> : (
        <Card><CardContent className="p-0"><div className="max-h-[600px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Action</th><th className="px-4 py-3 font-medium">User</th><th className="px-4 py-3 font-medium">Details</th><th className="px-4 py-3 font-medium">Time</th></tr></thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3"><Badge variant="secondary">{ACTION_LABELS[log.action] ?? log.action}</Badge></td>
                  <td className="px-4 py-3 font-medium">{log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{log.details ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{timeAgo(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></CardContent></Card>
      )}
    </div>
  );
}
