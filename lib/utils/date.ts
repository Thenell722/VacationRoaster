import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatDate(value: string | Date, pattern = 'MMM d, yyyy'): string {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, pattern);
}

export function formatDateRange(start: string | Date, end: string | Date): string {
  const s = typeof start === 'string' ? parseISO(start) : start;
  const e = typeof end === 'string' ? parseISO(end) : end;
  if (format(s, 'yyyy-MM') === format(e, 'yyyy-MM')) {
    return `${format(s, 'MMM d')} – ${format(e, 'd, yyyy')}`;
  }
  if (format(s, 'yyyy') === format(e, 'yyyy')) {
    return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`;
  }
  return `${format(s, 'MMM d, yyyy')} – ${format(e, 'MMM d, yyyy')}`;
}

export function timeAgo(value: string | Date): string {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return formatDistanceToNow(date, { addSuffix: true });
}
