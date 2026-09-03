import { requireAdmin } from '@/lib/session';
import { getHolidays } from '@/lib/data';
import { HolidaysView } from '@/components/holidays-view';
export default async function AdminHolidaysPage() {
  await requireAdmin();
  const holidays = await getHolidays();
  return <HolidaysView holidays={holidays} />;
}
