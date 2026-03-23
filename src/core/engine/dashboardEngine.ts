/**
 * Core Accounting Engine - Dashboard Stats Engine
 * Provides unified dashboard data from the general ledger
 * Industry modules can extend with their own stats
 */

import { supabase } from '@/hooks/modules/useMiscServices';
import { DashboardStats } from './types';

interface DateRange {
  start: string;
  end: string;
}

/**
 * Get dashboard stats purely from journal entries (industry-agnostic)
 * This is the single source of truth for financial data
 */
export async function getCoreDashboardStats(
  companyId: string,
  fiscalYearId: string | null,
  fiscalYearRange: DateRange | null,
  monthRange: DateRange,
  today: string
): Promise<DashboardStats> {
  // Get invoice-based stats (works for all non-car companies)
  const baseQuery = (type: string) => {
    let q = supabase
      .from('invoices')
      .select('subtotal, invoice_date')
      .eq('company_id', companyId)
      .eq('invoice_type', type);
    if (fiscalYearRange) {
      q = q.gte('invoice_date', fiscalYearRange.start).lte('invoice_date', fiscalYearRange.end);
    }
    return q;
  };

  const expensesQuery = (() => {
    let q = supabase
      .from('expenses')
      .select('amount, expense_date')
      .eq('company_id', companyId)
      .is('car_id', null);
    if (fiscalYearRange) {
      q = q.gte('expense_date', fiscalYearRange.start).lte('expense_date', fiscalYearRange.end);
    }
    return q;
  })();

  const payrollQuery = supabase
    .from('payroll_records')
    .select('month, year, total_base_salaries, total_allowances, total_bonuses, total_overtime, total_absences')
    .eq('status', 'approved')
    .eq('company_id', companyId);

  const [purchaseRes, salesRes, expensesRes, payrollRes] = await Promise.all([
    baseQuery('purchase'),
    baseQuery('sales'),
    expensesQuery,
    payrollQuery,
  ]);

  const purchases = purchaseRes.data || [];
  const sales = salesRes.data || [];
  const expenses = expensesRes.data || [];
  let payrollData = payrollRes.data || [];

  // Filter payroll by fiscal year
  if (fiscalYearRange) {
    const fyStart = new Date(fiscalYearRange.start);
    const fyEnd = new Date(fiscalYearRange.end);
    payrollData = payrollData.filter(p => {
      const d = new Date(Number(p.year), Number(p.month) - 1, 1);
      return d >= fyStart && d <= fyEnd;
    });
  }

  const sum = (arr: any[], field: string) => arr.reduce((s, r) => s + (Number(r[field]) || 0), 0);

  const totalPurchases = Math.round(sum(purchases, 'subtotal'));
  const totalRevenue = sum(sales, 'subtotal');
  const totalExpenses = sum(expenses, 'amount');
  const payrollExpenses = payrollData.reduce((s, p) =>
    s + (Number(p.total_base_salaries) || 0) + (Number(p.total_allowances) || 0)
    + (Number(p.total_bonuses) || 0) + (Number(p.total_overtime) || 0)
    - (Number(p.total_absences) || 0), 0);

  const allExpenses = totalExpenses + payrollExpenses;
  const netProfit = totalRevenue - totalPurchases - allExpenses;

  // Month filters
  const monthSales = sales.filter((s: any) => s.invoice_date >= monthRange.start && s.invoice_date <= monthRange.end);
  const monthPurchases = purchases.filter((p: any) => p.invoice_date >= monthRange.start && p.invoice_date <= monthRange.end);

  return {
    totalRevenue,
    totalExpenses: allExpenses,
    totalPurchases,
    netProfit,
    monthRevenue: sum(monthSales, 'subtotal'),
    monthExpenses: 0, // Could add monthly expense filter
    monthPurchases: sum(monthPurchases, 'subtotal'),
    monthProfit: sum(monthSales, 'subtotal') - sum(monthPurchases, 'subtotal'),
    todayTransactions: sales.filter((s: any) => s.invoice_date === today).length,
    totalTransactions: sales.length + purchases.length,
    purchasesCount: purchases.length,
    salesCount: sales.length,
    payrollExpenses,
    extra: {},
  };
}
