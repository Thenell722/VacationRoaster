'use client';

import { useMemo, useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, parseISO, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Req { id: string; startDate: string; endDate: string; status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'; employee: { firstName: string; lastName: string }; }
interface Hol { id: string; name: string; date: string; }

export function CompanyCalendar({ requests, holidays }: { requests: Req[]; holidays: Hol[] }) {
  const [cursor, setCursor] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const overlapDates = useMemo(() => {
    const active = requests.filter((r) => r.status === 'APPROVED' || r.status === 'PENDING');
    const counts = new Map<string, number>();
    for (const r of active) {
      const range = eachDayOfInterval({ start: parseISO(r.startDate), end: parseISO(r.endDate) });
      for (const d of range) {
        const key = format(d, 'yyyy-MM-dd');
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return new Set(Array.from(counts.entries()).filter(([, c]) => c > 1).map(([k]) => k));
  }, [requests]);

  function requestsForDay(day: Date) {
    return requests.filter((r) => {
      const s = parseISO(r.startDate); const e = parseISO(r.endDate);
      return day >= s && day <= e && (r.status === 'APPROVED' || r.status === 'PENDING');
    });
  }

  function holidayForDay(day: Date) {
    return holidays.find((h) => isSameDay(parseISO(h.date), day));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{format(cursor, 'MMMM yyyy')}</CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setCursor(subMonths(cursor, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
          <Button variant="ghost" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const inMonth = isSameMonth(day, cursor);
            const dayReqs = requestsForDay(day);
            const holiday = holidayForDay(day);
            const isOverlap = overlapDates.has(format(day, 'yyyy-MM-dd'));
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            return (
              <div key={day.toISOString()} className={cn('min-h-[72px] rounded-lg border p-1.5 text-left transition-colors', inMonth ? 'bg-card' : 'bg-muted/30 text-muted-foreground', isOverlap && 'ring-2 ring-amber-400', holiday && 'bg-blue-50 dark:bg-blue-950/40')}>
                <div className="flex items-center justify-between">
                  <span className={cn('text-xs font-medium', isWeekend && 'text-muted-foreground/70')}>{format(day, 'd')}</span>
                  {holiday && <PartyPopper className="h-3 w-3 text-blue-500" />}
                </div>
                <div className="mt-1 space-y-0.5">
                  {holiday && <div className="truncate text-[10px] font-medium text-blue-700 dark:text-blue-300" title={holiday.name}>{holiday.name}</div>}
                  {dayReqs.slice(0, 2).map((r) => (
                    <div key={r.id} className={cn('truncate rounded px-1 py-0.5 text-[10px] font-medium', r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300')} title={`${r.employee.firstName} ${r.employee.lastName}`}>{r.employee.firstName} {r.employee.lastName[0]}.</div>
                  ))}
                  {dayReqs.length > 2 && <div className="text-[10px] text-muted-foreground">+{dayReqs.length - 2} more</div>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-200 dark:bg-emerald-900" /> Approved leave</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-200 dark:bg-amber-900" /> Pending leave</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-blue-100 dark:bg-blue-950" /> Holiday</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded ring-2 ring-amber-400" /> Overlap</span>
        </div>
      </CardContent>
    </Card>
  );
}
