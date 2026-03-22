import { format } from 'date-fns';

interface DateBounds {
  start: Date;
  end: Date;
}

export interface DashboardDateWindow {
  referenceDate: Date;
  monthStartISO: string;
  monthEndISO: string;
  month: number;
  year: number;
}

function clamp(date: Date, bounds: DateBounds): Date {
  if (date < bounds.start) return new Date(bounds.start);
  if (date > bounds.end) return new Date(bounds.end);
  return new Date(date);
}

/**
 * Returns the dashboard month window clamped to fiscal-year bounds when provided.
 */
export function getDashboardDateWindow(bounds?: DateBounds | null, now: Date = new Date()): DashboardDateWindow {
  const referenceDate = bounds ? clamp(now, bounds) : new Date(now);

  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  const effectiveStart = bounds && monthStart < bounds.start ? new Date(bounds.start) : monthStart;
  const effectiveEnd = bounds && monthEnd > bounds.end ? new Date(bounds.end) : monthEnd;

  return {
    referenceDate,
    monthStartISO: format(effectiveStart, 'yyyy-MM-dd'),
    monthEndISO: format(effectiveEnd, 'yyyy-MM-dd'),
    month: referenceDate.getMonth() + 1,
    year: referenceDate.getFullYear(),
  };
}
