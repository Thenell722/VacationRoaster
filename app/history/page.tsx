import Link from 'next/link';
import { CalendarPlus } from 'lucide-react';
import { getSessionUser } from '@/lib/session';
import { getEmployeeRequests } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { HistoryList } from '@/components/history-list';
export default async function HistoryPage() {
  const profile = await getSessionUser();
  if (!profile) return null;
  const requests = await getEmployeeRequests(profile.id);
  return (
    <div className="space-y-6">
      <PageHeader title="My Requests" description="View your vacation request history and cancel pending requests." actions={<Button asChild className="bg-blue-600 hover:bg-blue-700"><Link href="/requests/new"><CalendarPlus className="mr-2 h-4 w-4" />New Request</Link></Button>} />
      <HistoryList requests={requests} />
    </div>
  );
}
