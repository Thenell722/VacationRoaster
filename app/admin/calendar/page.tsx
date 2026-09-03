import { requireAdmin } from '@/lib/session';
import { getAllRequests, getHolidays } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { CompanyCalendar } from '@/components/company-calendar';
export default async function AdminCalendarPage() {
  await requireAdmin();
  const [requests, holidays] = await Promise.all([getAllRequests(), getHolidays()]);
  return <div className="space-y-6"><PageHeader title="Company Calendar" description="View approved and pending leave, holidays, and overlaps." /><CompanyCalendar requests={requests as any} holidays={holidays} /></div>;
}
