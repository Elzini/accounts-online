/**
 * Module Services - Dashboard widgets (expenses, invoices, alerts, project costs)
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/untypedFrom';
import { getDashboardDateWindow } from '@/lib/dashboardDateWindow';

export function useMonthlyExpenses(companyId: string | null, fiscalBounds: { start: Date; end: Date } | null, fiscalYearId?: string, startISO?: string, endISO?: string) {
  return useQuery({
    queryKey: ['monthly-expenses-dashboard', companyId, fiscalYearId, startISO, endISO],
    queryFn: async () => {
      const window = getDashboardDateWindow(fiscalBounds);
      const monthStart = window.monthStartISO;
      const monthEnd = window.monthEndISO;

      const [custodyResult, payrollResult, prepaidResult, expensesResult] = await Promise.all([
        supabase.from('custody_transactions').select('amount').eq('company_id', companyId!).gte('transaction_date', monthStart).lte('transaction_date', monthEnd),
        supabase.from('payroll_records').select('total_base_salaries, total_allowances, total_bonuses, total_overtime, total_absences').eq('company_id', companyId!).eq('status', 'approved').eq('month', window.month).eq('year', window.year),
        supabase.from('prepaid_expense_amortizations').select(`amount, amortization_date, status, prepaid_expense:prepaid_expenses!inner(company_id, status)`).gte('amortization_date', monthStart).lte('amortization_date', monthEnd),
        supabase.from('expenses').select('amount, car_id, payment_method').eq('company_id', companyId!).is('car_id', null).gte('expense_date', monthStart).lte('expense_date', monthEnd),
      ]);

      const custodyExpenses = custodyResult.data?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;
      const payrollExpenses = payrollResult.data?.reduce((sum, p) => {
        return sum + (Number(p.total_base_salaries) || 0) + (Number(p.total_allowances) || 0) + (Number(p.total_bonuses) || 0) + (Number(p.total_overtime) || 0) - (Number(p.total_absences) || 0);
      }, 0) || 0;
      const rentExpenses = prepaidResult.data?.filter(a => { const prepaid = a.prepaid_expense as any; return prepaid?.company_id === companyId; }).reduce((sum, a) => sum + (Number(a.amount) || 0), 0) || 0;
      const otherExpenses = expensesResult.data?.filter(e => e.payment_method !== 'prepaid').reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;
      const total = custodyExpenses + payrollExpenses + rentExpenses + otherExpenses;
      return { custodyExpenses, payrollExpenses, rentExpenses, otherExpenses, total };
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60000,
  });
}

export function useRecentInvoices(companyId: string | null, fiscalYearId?: string, enabled = true) {
  return useQuery({
    queryKey: ['dashboard-recent-invoices', companyId, fiscalYearId],
    queryFn: async () => {
      let query = (supabase as any)
        .from('invoices')
        .select('id, invoice_number, invoice_type, invoice_date, total, payment_status, customer_name, supplier:suppliers!invoices_supplier_id_fkey(name)')
        .eq('company_id', companyId!)
        .in('invoice_type', ['sales', 'purchase'])
        .order('invoice_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);
      if (fiscalYearId) query = query.eq('fiscal_year_id', fiscalYearId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSmartAlertChecks(companyId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['smart-alerts-checks', companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase.from('checks').select('*', { count: 'exact', head: true }).eq('company_id', companyId).in('status', ['pending', 'active']).lte('due_date', today);
      return count || 0;
    },
    enabled: !!companyId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSmartAlertCustodies(companyId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['smart-alerts-custodies', companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const { count } = await supabase.from('custodies').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'active');
      return count || 0;
    },
    enabled: !!companyId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSmartAlertInstallments(companyId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['smart-alerts-installments', companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase.from('installment_payments').select('*', { count: 'exact', head: true }).eq('status', 'pending').lte('due_date', today);
      return count || 0;
    },
    enabled: !!companyId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSmartAlertDraftInvoices(companyId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['smart-alerts-drafts', companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'draft');
      return count || 0;
    },
    enabled: !!companyId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSmartAlertLowStock(companyId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['smart-alerts-low-stock', companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const { data } = await supabase.from('inventory_items').select('id, quantity_on_hand, reorder_level').eq('company_id', companyId).eq('is_active', true).not('reorder_level', 'is', null);
      if (!data) return 0;
      return data.filter(item => (item.quantity_on_hand || 0) <= (item.reorder_level || 0)).length;
    },
    enabled: !!companyId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSmartAlertApprovals(companyId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['smart-alerts-approvals', companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const { count } = await supabase.from('approval_requests').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'pending');
      return count || 0;
    },
    enabled: !!companyId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export async function fetchProjectCostBreakdown(companyId: string, fiscalYearId?: string) {
  const { data: projectAccounts } = await supabase.from('account_categories').select('id, code, name, parent_id').eq('company_id', companyId).in('code', ['1301', '130', '13']);
  const projectParentIds = (projectAccounts || []).map(a => a.id);
  const { data: subAccounts } = await supabase.from('account_categories').select('id, code, name, parent_id').eq('company_id', companyId);
  const allAccounts = subAccounts || [];
  const findDescendants = (parentIds: string[]): typeof allAccounts => {
    const children = allAccounts.filter(a => a.parent_id && parentIds.includes(a.parent_id));
    if (children.length === 0) return [];
    return [...children, ...findDescendants(children.map(c => c.id))];
  };
  const projectSubAccounts = findDescendants(projectParentIds);
  const allProjectAccountIds = [...projectParentIds, ...projectSubAccounts.map(a => a.id)];
  const parentIdSet = new Set(allAccounts.filter(a => a.parent_id).map(a => a.parent_id!));
  const leafProjectAccounts = allAccounts.filter(a => allProjectAccountIds.includes(a.id) && !parentIdSet.has(a.id));

  let query = supabase.from('journal_entry_lines').select('account_id, debit, credit, journal_entry:journal_entries!inner(company_id, is_posted, fiscal_year_id)').eq('journal_entry.company_id', companyId).eq('journal_entry.is_posted', true);
  if (fiscalYearId) query = query.eq('journal_entry.fiscal_year_id', fiscalYearId);
  if (leafProjectAccounts.length > 0) query = query.in('account_id', leafProjectAccounts.map(a => a.id));

  const { data: lines } = await query;
  const balanceMap = new Map<string, number>();
  (lines || []).forEach((line: any) => {
    const current = balanceMap.get(line.account_id) || 0;
    balanceMap.set(line.account_id, current + (Number(line.debit) || 0) - (Number(line.credit) || 0));
  });

  return { leafProjectAccounts, balanceMap };
}
