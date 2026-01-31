import { useMemo } from 'react';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

/**
 * Utility hook for filtering data by the selected fiscal year's date range.
 * This ensures all data displayed is within the selected fiscal year only.
 */
export function useFiscalYearFilter() {
  const { selectedFiscalYear } = useFiscalYear();

  /**
   * Check if a date falls within the selected fiscal year
   */
  const isWithinFiscalYear = useMemo(() => {
    if (!selectedFiscalYear) {
      return (_date: string | Date) => true;
    }

    const startDate = new Date(selectedFiscalYear.start_date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(selectedFiscalYear.end_date);
    endDate.setHours(23, 59, 59, 999);

    return (date: string | Date) => {
      const dateToCheck = new Date(date);
      return dateToCheck >= startDate && dateToCheck <= endDate;
    };
  }, [selectedFiscalYear]);

  /**
   * Get fiscal year date range for date pickers
   */
  const fiscalYearDateRange = useMemo(() => {
    if (!selectedFiscalYear) {
      return {
        startDate: undefined as Date | undefined,
        endDate: undefined as Date | undefined,
      };
    }

    return {
      startDate: new Date(selectedFiscalYear.start_date),
      endDate: new Date(selectedFiscalYear.end_date),
    };
  }, [selectedFiscalYear]);

  /**
   * Filter an array by a date field within the fiscal year
   */
  const filterByFiscalYear = <T extends Record<string, any>>(
    items: T[],
    dateField: keyof T
  ): T[] => {
    if (!selectedFiscalYear) return items;
    
    return items.filter((item) => {
      const dateValue = item[dateField];
      if (!dateValue) return false;
      return isWithinFiscalYear(dateValue);
    });
  };

  return {
    selectedFiscalYear,
    isWithinFiscalYear,
    fiscalYearDateRange,
    filterByFiscalYear,
  };
}
