import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
interface StatCardProps { label: string; value: string | number; icon: LucideIcon; hint?: string; tone?: 'default' | 'success' | 'warning' | 'danger' | 'primary'; }
const TONES: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  primary: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300',
  success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300',
  danger: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300',
};
export function StatCard({ label, value, icon: Icon, hint, tone = 'default' }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-1"><p className="text-sm font-medium text-muted-foreground">{label}</p><p className="text-2xl font-semibold tracking-tight">{value}</p>{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', TONES[tone])}><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  );
}
