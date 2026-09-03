'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { XCircle, Loader2, Inbox } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cancelVacationRequest } from '@/actions/vacation';
import { StatusBadge } from '@/components/status-badge';
import { formatDateRange, timeAgo } from '@/lib/utils/date';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';

interface Request {
  id: string; startDate: string; endDate: string; workingDays: number;
  reason: string | null; status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  managerComment: string | null; createdAt: string;
}

export function HistoryList({ requests }: { requests: Request[] }) {
  const [pending, startTransition] = useTransition();
  const [cancelId, setCancelId] = useState<string | null>(null);

  function handleCancel() {
    if (!cancelId) return;
    startTransition(async () => {
      const res = await cancelVacationRequest(cancelId);
      if (res.error) toast.error(res.error);
      else toast.success('Request cancelled');
      setCancelId(null);
    });
  }

  if (requests.length === 0) {
    return <EmptyState icon={Inbox} title="No vacation requests" description="Your submitted requests will appear here." />;
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Dates</th>
                <th className="px-4 py-3 font-medium">Working Days</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Manager Comment</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{formatDateRange(r.startDate, r.endDate)}</td>
                  <td className="px-4 py-3">{r.workingDays}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground" title={r.reason ?? ''}>{r.reason ?? '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground" title={r.managerComment ?? ''}>{r.managerComment ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{timeAgo(r.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'PENDING' && (
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setCancelId(r.id)}>
                        <XCircle className="mr-1 h-3.5 w-3.5" /> Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
            <AlertDialogDescription>This will withdraw your pending vacation request. You can submit a new one anytime.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={pending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Yes, cancel it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
