import { useMemo } from 'react';
import { format } from 'date-fns';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

export interface FiscalYearBounds {
  fiscalYearId: string;
  start: Date;
  end: Date;
  startISO: string;
  endISO: string;
}

/**
 * Returns the active fiscal year's date bounds (selected if available, otherwise current).
 * All dates are normalized to start/end of day.
 */
export function useFiscalYearBounds(): FiscalYearBounds | null {
  const { selectedFiscalYear, currentFiscalYear } = useFiscalYear();
  const fy = selectedFiscalYear ?? currentFiscalYear;

  return useMemo(() => {
    if (!fy) return null;

    const start = new Date(fy.start_date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(fy.end_date);
    end.setHours(23, 59, 59, 999);

    return {
      fiscalYearId: fy.id,
      start,
      end,
      startISO: format(start, 'yyyy-MM-dd'),
      endISO: format(end, 'yyyy-MM-dd'),
    };
  }, [fy?.id, fy?.start_date, fy?.end_date]);
}

export function clampDateToBounds(date: Date, bounds: FiscalYearBounds): Date {
  if (date < bounds.start) return new Date(bounds.start);
  if (date > bounds.end) return new Date(bounds.end);
  return date;
}
