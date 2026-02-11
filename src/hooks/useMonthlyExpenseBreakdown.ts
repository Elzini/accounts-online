import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

export interface MonthlyExpenseBreakdown {
  custodyExpenses: number;
  payrollExpenses: number;
  rentExpenses: number;
  otherExpenses: number;
  total: number;
}

async function fetchMonthlyExpenses(companyId: string): Promise<MonthlyExpenseBreakdown> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  
  const monthStart = formatDate(startOfMonth);
  const monthEnd = formatDate(endOfMonth);

  const [custodyResult, payrollResult, prepaidResult, expensesResult] = await Promise.all([
    supabase.from('custody_transactions').select('amount').eq('company_id', companyId).gte('transaction_date', monthStart).lte('transaction_date', monthEnd),
    supabase.from('payroll_records').select('total_base_salaries, total_allowances, total_bonuses, total_overtime, total_absences').eq('company_id', companyId).eq('status', 'approved').eq('month', now.getMonth() + 1).eq('year', now.getFullYear()),
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
  const { selectedFiscalYear } = useFiscalYear();

  return useQuery<MonthlyExpenseBreakdown>({
    queryKey: ['monthly-expense-breakdown', companyId, selectedFiscalYear?.id],
    queryFn: () => fetchMonthlyExpenses(companyId!),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
  });
}
