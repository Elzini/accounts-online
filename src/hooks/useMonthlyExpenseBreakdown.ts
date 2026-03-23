import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/hooks/modules/useMiscServices';
import { useCompany } from '@/contexts/CompanyContext';
import { useFiscalYearBounds } from '@/hooks/useFiscalYearBounds';
import { getDashboardDateWindow } from '@/lib/dashboardDateWindow';

export interface MonthlyExpenseBreakdown {
  custodyExpenses: number;
  payrollExpenses: number;
  rentExpenses: number;
  otherExpenses: number;
  total: number;
}

async function fetchMonthlyExpenses(
  companyId: string,
  fiscalBounds?: { start: Date; end: Date } | null
): Promise<MonthlyExpenseBreakdown> {
  const window = getDashboardDateWindow(fiscalBounds);
  const monthStart = window.monthStartISO;
  const monthEnd = window.monthEndISO;

  const [custodyResult, payrollResult, prepaidResult, expensesResult] = await Promise.all([
    supabase.from('custody_transactions').select('amount').eq('company_id', companyId).gte('transaction_date', monthStart).lte('transaction_date', monthEnd),
    supabase
      .from('payroll_records')
      .select('total_base_salaries, total_allowances, total_bonuses, total_overtime, total_absences')
      .eq('company_id', companyId)
      .eq('status', 'approved')
      .eq('month', window.month)
      .eq('year', window.year),
    supabase.from('prepaid_expense_amortizations').select('amount, amortization_date, prepaid_expense:prepaid_expenses!inner(company_id)').gte('amortization_date', monthStart).lte('amortization_date', monthEnd),
    supabase.from('expenses').select('amount, car_id, payment_method').eq('company_id', companyId).is('car_id', null).gte('expense_date', monthStart).lte('expense_date', monthEnd),
  ]);

  const custodyExpenses = custodyResult.data?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;
  const payrollExpenses = payrollResult.data?.reduce((sum, p) => sum + (Number(p.total_base_salaries) || 0) + (Number(p.total_allowances) || 0) + (Number(p.total_bonuses) || 0) + (Number(p.total_overtime) || 0) - (Number(p.total_absences) || 0), 0) || 0;
  const rentExpenses = prepaidResult.data?.filter((a: any) => a.prepaid_expense?.company_id === companyId).reduce((sum, a) => sum + (Number(a.amount) || 0), 0) || 0;
  const otherExpenses = expensesResult.data?.filter(e => e.payment_method !== 'prepaid').reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;

  return { custodyExpenses, payrollExpenses, rentExpenses, otherExpenses, total: custodyExpenses + payrollExpenses + rentExpenses + otherExpenses };
}

export function useMonthlyExpenseBreakdown() {
  const { companyId } = useCompany();
  const fiscalBounds = useFiscalYearBounds();

  return useQuery<MonthlyExpenseBreakdown>({
    queryKey: ['monthly-expense-breakdown', companyId, fiscalBounds?.fiscalYearId, fiscalBounds?.startISO, fiscalBounds?.endISO],
    queryFn: () => fetchMonthlyExpenses(companyId!, fiscalBounds ? { start: fiscalBounds.start, end: fiscalBounds.end } : null),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
  });
}
