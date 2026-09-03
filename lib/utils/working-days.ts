import { differenceInCalendarDays, eachDayOfInterval, isWeekend, parseISO } from 'date-fns';
import type { Holiday } from '@/types';

export function parseDate(value: string | Date): Date {
  return typeof value === 'string' ? parseISO(value) : value;
}

export function calculateWorkingDays(
  startDate: string | Date,
  endDate: string | Date,
  holidays: Pick<Holiday, 'date'>[] = [],
): number {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (end < start) return 0;

  const holidayDates = new Set(holidays.map((h) => h.date));
  const days = eachDayOfInterval({ start, end });
  return days.filter((day) => {
    if (isWeekend(day)) return false;
    const iso = day.toISOString().slice(0, 10);
    return !holidayDates.has(iso);
  }).length;
}

export function dateRangesOverlap(
  aStart: string | Date,
  aEnd: string | Date,
  bStart: string | Date,
  bEnd: string | Date,
): boolean {
  const aS = parseDate(aStart);
  const aE = parseDate(aEnd);
  const bS = parseDate(bStart);
  const bE = parseDate(bEnd);
  return aS <= bE && bS <= aE;
}
