import { useQuery } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import {
  getCashFlowStatement,
  getChangesInEquityStatement,
  getZakatBaseStatement,
  getDetailedIncomeStatement,
  CashFlowStatement,
  ChangesInEquityStatement,
  ZakatBaseStatement,
  DetailedIncomeStatement,
} from '@/services/zakatReports';

// قائمة التدفقات النقدية
export function useCashFlowStatement(startDate?: string, endDate?: string) {
  const { companyId } = useCompany();
  
  return useQuery<CashFlowStatement | null>({
    queryKey: ['cash-flow-statement', companyId, startDate, endDate],
    queryFn: () => {
      if (!companyId || !startDate || !endDate) return null;
      return getCashFlowStatement(companyId, startDate, endDate);
    },
    enabled: !!companyId && !!startDate && !!endDate,
  });
}

// قائمة التغيرات في حقوق الملكية
export function useChangesInEquityStatement(startDate?: string, endDate?: string) {
  const { companyId } = useCompany();
  
  return useQuery<ChangesInEquityStatement | null>({
    queryKey: ['changes-in-equity', companyId, startDate, endDate],
    queryFn: () => {
      if (!companyId || !startDate || !endDate) return null;
      return getChangesInEquityStatement(companyId, startDate, endDate);
    },
    enabled: !!companyId && !!startDate && !!endDate,
  });
}

// قائمة الوعاء الزكوي
export function useZakatBaseStatement(fiscalYear?: string) {
  const { companyId } = useCompany();
  
  return useQuery<ZakatBaseStatement | null>({
    queryKey: ['zakat-base-statement', companyId, fiscalYear],
    queryFn: () => {
      if (!companyId || !fiscalYear) return null;
      return getZakatBaseStatement(companyId, fiscalYear);
    },
    enabled: !!companyId && !!fiscalYear,
  });
}

// قائمة الدخل المفصلة
export function useDetailedIncomeStatement(startDate?: string, endDate?: string) {
  const { companyId } = useCompany();
  
  return useQuery<DetailedIncomeStatement | null>({
    queryKey: ['detailed-income-statement', companyId, startDate, endDate],
    queryFn: () => {
      if (!companyId || !startDate || !endDate) return null;
      return getDetailedIncomeStatement(companyId, startDate, endDate);
    },
    enabled: !!companyId && !!startDate && !!endDate,
  });
}
