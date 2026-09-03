'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO, isWeekend } from 'date-fns';
import { CalendarPlus, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createVacationRequest } from '@/actions/vacation';
import { vacationRequestSchema, type VacationRequestInput } from '@/lib/validations';
import type { Holiday } from '@prisma/client';
import { calculateWorkingDays } from '@/lib/working-days';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function NewRequestForm({ holidays }: { holidays: Holiday[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<VacationRequestInput>({ resolver: zodResolver(vacationRequestSchema), defaultValues: { startDate: '', endDate: '', reason: '' } });
  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const workingDays = useMemo(() => { if (!startDate || !endDate) return null; return calculateWorkingDays(startDate, endDate, holidays); }, [startDate, endDate, holidays]);
  const conflictingHolidays = useMemo(() => { if (!startDate || !endDate) return []; return holidays.filter((h) => { const d = new Date(h.date); return d >= parseISO(startDate) && d <= parseISO(endDate) && !isWeekend(d); }); }, [startDate, endDate, holidays]);

  async function onSubmit(values: VacationRequestInput) {
    setSubmitting(true); setFormError(null);
    const res = await createVacationRequest(values);
    setSubmitting(false);
    if (res.error) { setFormError(res.error); toast.error(res.error); return; }
    toast.success('Vacation request submitted');
    router.push('/history'); router.refresh();
  }

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Request Vacation" description="Submit a new time-off request for approval." />
      <Card>
        <CardHeader><CardTitle className="text-base">Request Details</CardTitle><CardDescription>Choose your dates and optionally add a reason.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="startDate">Start Date</Label><Input id="startDate" type="date" min={today} {...register('startDate')} />{errors.startDate && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.startDate.message}</p>}</div>
              <div className="space-y-2"><Label htmlFor="endDate">End Date</Label><Input id="endDate" type="date" min={startDate || today} {...register('endDate')} />{errors.endDate && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.endDate.message}</p>}</div>
            </div>
            <div className="space-y-2"><Label htmlFor="reason">Reason (optional)</Label><Textarea id="reason" placeholder="e.g. Family vacation, medical appointment..." rows={3} {...register('reason')} />{errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}</div>
            {workingDays !== null && (
              <div className="rounded-lg border bg-blue-50/50 p-4 dark:bg-blue-950/30">
                <div className="flex items-center justify-between"><span className="text-sm font-medium">Working days</span><span className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{workingDays}</span></div>
                <p className="mt-1 text-xs text-muted-foreground">Weekends are excluded{conflictingHolidays.length > 0 ? `, plus ${conflictingHolidays.length} holiday(s)` : ''}.</p>
                {conflictingHolidays.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{conflictingHolidays.map((h) => <span key={h.id} className="rounded-md bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-200">{h.name} ({format(new Date(h.date), 'MMM d')})</span>)}</div>}
              </div>
            )}
            {formError && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 border border-red-100 dark:bg-red-950 dark:text-red-300">{formError}</div>}
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button><Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-2 h-4 w-4" />}Submit Request</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
