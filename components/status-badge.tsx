import { cn } from '@/lib/utils';
import type { RequestStatus } from '@/lib/types';
const STATUS_STYLES: Record<RequestStatus, { label: string; className: string; dot: string }> = {
  PENDING: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900', dot: 'bg-amber-500' },
  APPROVED: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900', dot: 'bg-red-500' },
  CANCELLED: { label: 'Cancelled', className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', dot: 'bg-slate-400' },
};
export function StatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  const s = STATUS_STYLES[status];
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', s.className, className)}><span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />{s.label}</span>;
}
