'use client';
import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check, X, Search, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { reviewVacationRequest } from '@/actions/vacation';
import type { Department, User, VacationRequest } from '@prisma/client';
import { StatusBadge } from '@/components/status-badge';
import { formatDateRange, timeAgo } from '@/lib/date';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/empty-state';
import type { RequestStatus } from '@/lib/types';

interface Props {
  requests: (VacationRequest & { employee: { id: string; firstName: string; lastName: string; email: string; departmentId: string | null; department: Department | null }; approver: { id: string; firstName: string; lastName: string } | null })[];
  employees: User[];
  departments: Department[];
}

export function AdminRequestsView({ requests, employees, departments }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [reviewing, setReviewing] = useState<(typeof requests)[number] | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [comment, setComment] = useState('');
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => requests.filter((r) => {
    const name = `${r.employee.firstName} ${r.employee.lastName}`.toLowerCase();
    if (search && !name.includes(search.toLowerCase()) && !(r.reason ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (deptFilter !== 'ALL' && r.employee.departmentId !== deptFilter) return false;
    return true;
  }), [requests, search, statusFilter, deptFilter]);

  function openReview(req: (typeof requests)[number], action: 'APPROVE' | 'REJECT') { setReviewing(req); setReviewAction(action); setComment(''); }
  function handleReview() {
    if (!reviewing) return;
    startTransition(async () => { const res = await reviewVacationRequest({ requestId: reviewing.id, action: reviewAction, comment: comment || null }); if (res.error) toast.error(res.error); else { toast.success(reviewAction === 'APPROVE' ? 'Request approved' : 'Request rejected'); setReviewing(null); router.refresh(); } });
  }

  return (
    <div className="space-y-4">
      <Card><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search employee or reason..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
          <div className="space-y-1.5"><Label className="text-xs">Status</Label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All statuses</SelectItem><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="APPROVED">Approved</SelectItem><SelectItem value="REJECTED">Rejected</SelectItem><SelectItem value="CANCELLED">Cancelled</SelectItem></SelectContent></Select></div>
          <div className="space-y-1.5"><Label className="text-xs">Department</Label><Select value={deptFilter} onValueChange={setDeptFilter}><SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All departments</SelectItem>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
        </div>
      </CardContent></Card>
      {filtered.length === 0 ? <EmptyState icon={Inbox} title="No requests found" description="Try adjusting your search or filters." /> : (
        <Card><CardContent className="p-0"><div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Employee</th><th className="px-4 py-3 font-medium">Department</th><th className="px-4 py-3 font-medium">Dates</th><th className="px-4 py-3 font-medium">Days</th><th className="px-4 py-3 font-medium">Reason</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Submitted</th><th className="px-4 py-3 font-medium text-right">Actions</th></tr></thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{r.employee.firstName} {r.employee.lastName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.employee.department?.name ?? '—'}</td>
                  <td className="px-4 py-3">{formatDateRange(r.startDate, r.endDate)}</td>
                  <td className="px-4 py-3">{r.workingDays}</td>
                  <td className="px-4 py-3 max-w-[180px] truncate text-muted-foreground" title={r.reason ?? ''}>{r.reason ?? '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status as RequestStatus} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{timeAgo(r.createdAt)}</td>
                  <td className="px-4 py-3 text-right">{r.status === 'PENDING' ? <div className="flex justify-end gap-1"><Button size="sm" variant="ghost" className="text-emerald-600 hover:text-emerald-700" onClick={() => openReview(r, 'APPROVE')}><Check className="mr-1 h-3.5 w-3.5" />Approve</Button><Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => openReview(r, 'REJECT')}><X className="mr-1 h-3.5 w-3.5" />Reject</Button></div> : <span className="text-xs text-muted-foreground">{r.managerComment ?? '—'}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></CardContent></Card>
      )}
      <Dialog open={!!reviewing} onOpenChange={(o) => !o && setReviewing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{reviewAction === 'APPROVE' ? 'Approve Request' : 'Reject Request'}</DialogTitle><DialogDescription>{reviewing && <>{reviewing.employee.firstName} · {formatDateRange(reviewing.startDate, reviewing.endDate)} · {reviewing.workingDays} working days</>}</DialogDescription></DialogHeader>
          <div className="space-y-2"><Label htmlFor="comment">Manager comment (optional)</Label><Textarea id="comment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={reviewAction === 'APPROVE' ? 'Enjoy your time off!' : 'Reason for rejection...'} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setReviewing(null)}>Cancel</Button><Button onClick={handleReview} disabled={pending} className={reviewAction === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-destructive hover:bg-destructive/90'}>{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{reviewAction === 'APPROVE' ? 'Approve' : 'Reject'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
