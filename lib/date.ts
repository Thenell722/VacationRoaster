import { format, formatDistanceToNow, parseISO } from 'date-fns';

function toDateValue(value: string | Date): Date {
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T12:00:00Z`);
    }
    return parseISO(value);
  }

  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 12));
}

export function formatDate(value: string | Date, pattern = 'MMM d, yyyy'): string {
  return format(toDateValue(value), pattern);
}

export function formatDateOnly(value: string | Date, pattern = 'yyyy-MM-dd'): string {
  return format(toDateValue(value), pattern);
}

export function formatDateRange(start: string | Date, end: string | Date): string {
  const s = toDateValue(start);
  const e = toDateValue(end);
  // If it's the same exact day, show a single date including the year (e.g., "May 1, 2026")
  if (s.getTime() === e.getTime()) return format(s, 'MMM d, yyyy');
  if (format(s, 'yyyy-MM') === format(e, 'yyyy-MM')) return `${format(s, 'MMM d')} – ${format(e, 'd, yyyy')}`;
  if (format(s, 'yyyy') === format(e, 'yyyy')) return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`;
  return `${format(s, 'MMM d, yyyy')} – ${format(e, 'MMM d, yyyy')}`;
}

export function timeAgo(value: string | Date): string {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return formatDistanceToNow(date, { addSuffix: true });
}
