import { eachDayOfInterval, isWeekend, parseISO } from 'date-fns';

export function parseDate(value: string | Date): Date {
  return typeof value === 'string' ? parseISO(value) : value;
}

export function calculateWorkingDays(
  startDate: string | Date,
  endDate: string | Date,
  holidays: { date: Date | string }[] = [],
): number {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (end < start) return 0;

  const holidayDates = new Set(holidays.map((h) => parseDate(h.date).toISOString().slice(0, 10)));
  const days = eachDayOfInterval({ start, end });
  return days.filter((day) => {
    if (isWeekend(day)) return false;
    return !holidayDates.has(day.toISOString().slice(0, 10));
  }).length;
}

export function dateRangesOverlap(
  aStart: string | Date, aEnd: string | Date,
  bStart: string | Date, bEnd: string | Date,
): boolean {
  return parseDate(aStart) <= parseDate(bEnd) && parseDate(bStart) <= parseDate(aEnd);
}
