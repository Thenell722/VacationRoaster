import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
interface EmptyStateProps { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode; className?: string; }
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center', className)}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"><Icon className="h-6 w-6" /></div>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
