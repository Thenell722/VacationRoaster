'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Pencil, Trash2, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import { createHoliday, updateHoliday, deleteHoliday } from '@/actions/admin';
import { holidaySchema, type HolidayInput } from '@/lib/validations';
import type { Holiday } from '@prisma/client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/empty-state';
import { formatDateOnly, formatDateRange } from '@/lib/date';

export function HolidaysView({ holidays }: { holidays: Holiday[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Holiday | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);
  const [pending, startTransition] = useTransition();
  const createForm = useForm<HolidayInput>({ resolver: zodResolver(holidaySchema), defaultValues: { name: '', date: '' } });
  const editForm = useForm<HolidayInput>({ resolver: zodResolver(holidaySchema) });

  async function onCreate(values: HolidayInput) { startTransition(async () => { const res = await createHoliday(values); if (res.error) toast.error(res.error); else { toast.success('Holiday created'); createForm.reset(); setCreateOpen(false); router.refresh(); } }); }
  async function onEdit(values: HolidayInput) { if (!editTarget) return; startTransition(async () => { const res = await updateHoliday(editTarget.id, values); if (res.error) toast.error(res.error); else { toast.success('Holiday updated'); setEditTarget(null); router.refresh(); } }); }
  async function onDelete() { if (!deleteTarget) return; startTransition(async () => { const res = await deleteHoliday(deleteTarget.id); if (res.error) toast.error(res.error); else { toast.success('Holiday deleted'); setDeleteTarget(null); router.refresh(); } }); }
  function openEdit(h: Holiday) { editForm.reset({ name: h.name, date: formatDateOnly(h.date) }); setEditTarget(h); }
  const sorted = [...holidays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <>
      <PageHeader title="Holidays" description="Manage company holidays. These are excluded from working-day calculations." actions={
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700"><Plus className="mr-2 h-4 w-4" /> Add Holiday</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add Holiday</DialogTitle><DialogDescription>Create a new company holiday.</DialogDescription></DialogHeader>
            <form onSubmit={createForm.handleSubmit(onCreate)} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="h-name">Holiday name</Label><Input id="h-name" {...createForm.register('name')} />{createForm.formState.errors.name && <p className="text-xs text-destructive">{createForm.formState.errors.name.message}</p>}</div>
              <div className="space-y-2"><Label htmlFor="h-date">Date</Label><Input id="h-date" type="date" {...createForm.register('date')} />{createForm.formState.errors.date && <p className="text-xs text-destructive">{createForm.formState.errors.date.message}</p>}</div>
              <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button type="submit" disabled={pending} className="bg-blue-600 hover:bg-blue-700">{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      } />
      {sorted.length === 0 ? <EmptyState icon={PartyPopper} title="No holidays" description="Add company holidays to exclude them from working-day calculations." /> : (
        <Card><CardContent className="p-0"><div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium text-right">Actions</th></tr></thead>
            <tbody className="divide-y">
              {sorted.map((h) => (
                <tr key={h.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{h.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateRange(h.date, h.date)}</td>
                  <td className="px-4 py-3 text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => openEdit(h)}><Pencil className="mr-1 h-3.5 w-3.5" />Edit</Button><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(h)}><Trash2 className="mr-1 h-3.5 w-3.5" />Delete</Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></CardContent></Card>
      )}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Holiday</DialogTitle><DialogDescription>Update holiday details.</DialogDescription></DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
            <div className="space-y-2"><Label>Holiday name</Label><Input {...editForm.register('name')} />{editForm.formState.errors.name && <p className="text-xs text-destructive">{editForm.formState.errors.name.message}</p>}</div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" {...editForm.register('date')} />{editForm.formState.errors.date && <p className="text-xs text-destructive">{editForm.formState.errors.date.message}</p>}</div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button><Button type="submit" disabled={pending} className="bg-blue-600 hover:bg-blue-700">{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle><AlertDialogDescription>This holiday will no longer be excluded from working-day calculations.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel><AlertDialogAction onClick={onDelete} disabled={pending} className="bg-destructive hover:bg-destructive/90">{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
