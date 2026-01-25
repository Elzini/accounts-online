import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FiscalYear } from '@/services/fiscalYears';
import { useCurrentFiscalYear, useFiscalYears } from '@/hooks/useFiscalYears';

interface FiscalYearContextType {
  currentFiscalYear: FiscalYear | null;
  selectedFiscalYear: FiscalYear | null;
  fiscalYears: FiscalYear[];
  setSelectedFiscalYear: (year: FiscalYear | null) => void;
  isLoading: boolean;
}

const FiscalYearContext = createContext<FiscalYearContextType>({
  currentFiscalYear: null,
  selectedFiscalYear: null,
  fiscalYears: [],
  setSelectedFiscalYear: () => {},
  isLoading: true,
});

export function FiscalYearProvider({ children }: { children: ReactNode }) {
  const { data: fiscalYears = [], isLoading: isLoadingYears } = useFiscalYears();
  const { data: currentFiscalYear, isLoading: isLoadingCurrent } = useCurrentFiscalYear();
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<FiscalYear | null>(null);

  // Set selected year to current year on initial load
  useEffect(() => {
    if (currentFiscalYear && !selectedFiscalYear) {
      setSelectedFiscalYear(currentFiscalYear);
    }
  }, [currentFiscalYear, selectedFiscalYear]);

  const isLoading = isLoadingYears || isLoadingCurrent;

  return (
    <FiscalYearContext.Provider
      value={{
        currentFiscalYear,
        selectedFiscalYear,
        fiscalYears,
        setSelectedFiscalYear,
        isLoading,
      }}
    >
      {children}
    </FiscalYearContext.Provider>
  );
}

export function useFiscalYear() {
  const context = useContext(FiscalYearContext);
  if (!context) {
    throw new Error('useFiscalYear must be used within a FiscalYearProvider');
  }
  return context;
}
