import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FiscalYear } from '@/services/fiscalYears';
import { useCurrentFiscalYear, useFiscalYears } from '@/hooks/useFiscalYears';
import { useCompany } from '@/contexts/CompanyContext';

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

// Storage key for persisting fiscal year selection
const FISCAL_YEAR_STORAGE_KEY = 'selected_fiscal_year';

export function FiscalYearProvider({ children }: { children: ReactNode }) {
  const { companyId } = useCompany();
  const { data: fiscalYears = [], isLoading: isLoadingYears } = useFiscalYears();
  const { data: currentFiscalYear, isLoading: isLoadingCurrent } = useCurrentFiscalYear();
  const [selectedFiscalYear, setSelectedFiscalYearState] = useState<FiscalYear | null>(null);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  // Custom setter that also persists to localStorage
  const setSelectedFiscalYear = (year: FiscalYear | null) => {
    setSelectedFiscalYearState(year);
    if (year && companyId) {
      localStorage.setItem(`${FISCAL_YEAR_STORAGE_KEY}_${companyId}`, JSON.stringify({
        id: year.id,
        name: year.name,
      }));
    } else if (companyId) {
      localStorage.removeItem(`${FISCAL_YEAR_STORAGE_KEY}_${companyId}`);
    }
  };

  // Load from localStorage on mount when fiscalYears are available
  useEffect(() => {
    if (!companyId || fiscalYears.length === 0 || hasLoadedFromStorage) return;

    const stored = localStorage.getItem(`${FISCAL_YEAR_STORAGE_KEY}_${companyId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const matchingYear = fiscalYears.find(fy => fy.id === parsed.id);
        if (matchingYear) {
          setSelectedFiscalYearState(matchingYear);
          setHasLoadedFromStorage(true);
          return;
        }
      } catch (e) {
        // Invalid JSON, remove it
        localStorage.removeItem(`${FISCAL_YEAR_STORAGE_KEY}_${companyId}`);
      }
    }
    setHasLoadedFromStorage(true);
  }, [companyId, fiscalYears, hasLoadedFromStorage]);

  // Reset selection when user logs out (companyId becomes null) or company changes
  useEffect(() => {
    if (!companyId) {
      setSelectedFiscalYearState(null);
      setHasLoadedFromStorage(false);
    }
  }, [companyId]);

  // If the selected year no longer exists in the fetched list (e.g., company changed), reset it.
  useEffect(() => {
    if (selectedFiscalYear && fiscalYears.length > 0) {
      const stillExists = fiscalYears.some((fy) => fy.id === selectedFiscalYear.id);
      if (!stillExists) {
        setSelectedFiscalYear(null);
      }
    }
  }, [fiscalYears, selectedFiscalYear]);

  // Only auto-select if there's exactly ONE fiscal year and nothing is selected
  useEffect(() => {
    if (!selectedFiscalYear && fiscalYears.length === 1 && hasLoadedFromStorage) {
      setSelectedFiscalYear(fiscalYears[0]);
    }
  }, [fiscalYears, selectedFiscalYear, hasLoadedFromStorage]);

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
