import { getHolidays } from '@/lib/data';
import { NewRequestForm } from '@/components/new-request-form';
export default async function NewRequestPage() {
  const holidays = await getHolidays();
  return <NewRequestForm holidays={holidays} />;
}
