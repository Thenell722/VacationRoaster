import { requireAdmin } from '@/lib/session';
import { getAllRequests, getAllUsers, getDepartments } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { AdminRequestsView } from '@/components/admin-requests-view';
export default async function AdminRequestsPage() {
  await requireAdmin();
  const [requests, employees, departments] = await Promise.all([getAllRequests(), getAllUsers(), getDepartments()]);
  return <div className="space-y-6"><PageHeader title="Vacation Requests" description="Review, approve, or reject employee time-off requests." /><AdminRequestsView requests={requests as any} employees={employees as any} departments={departments as any} /></div>;
}
