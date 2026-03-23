import { supabase } from '@/hooks/modules/useMiscServices';
import { DetailedIncomeStatement } from './types';
import { fetchAccounts } from './helpers';

export async function getDetailedIncomeStatement(companyId: string, startDate: string, endDate: string): Promise<DetailedIncomeStatement> {
  const accounts = await fetchAccounts(companyId);
  const { data: lines, error } = await supabase
    .from('journal_entry_lines')
    .select('account_id, debit, credit, journal_entry:journal_entries!inner(company_id, entry_date, is_posted)')
    .eq('journal_entry.company_id', companyId).eq('journal_entry.is_posted', true)
    .gte('journal_entry.entry_date', startDate).lte('journal_entry.entry_date', endDate);
  if (error) throw error;

  const balances = new Map<string, number>();
  (lines || []).forEach((line: any) => {
    const current = balances.get(line.account_id) || 0;
    const account = accounts.find(a => a.id === line.account_id);
    if (account && ['liabilities', 'equity', 'revenue'].includes(account.type)) {
      balances.set(line.account_id, current + (Number(line.credit) - Number(line.debit)));
    } else {
      balances.set(line.account_id, current + (Number(line.debit) - Number(line.credit)));
    }
  });

  const revenueAccounts = accounts.filter(a => a.type === 'revenue');
  const salesRevenueAccounts = revenueAccounts.filter(a => a.code.startsWith('41'));
  const otherRevenueAccounts = revenueAccounts.filter(a => !a.code.startsWith('41'));
  const actualSalesRevenue = salesRevenueAccounts.reduce((s, a) => s + (balances.get(a.id) || 0), 0);
  const otherRevenueItems = otherRevenueAccounts.map(a => ({ code: a.code, name: a.name, amount: balances.get(a.id) || 0 })).filter(i => i.amount !== 0);
  const otherRevenue = otherRevenueItems.reduce((s, i) => s + i.amount, 0);

  const cogsAccounts = accounts.filter(a => a.type === 'expenses' && a.code.startsWith('51'));
  const cogsItems = cogsAccounts.map(a => ({ code: a.code, name: a.name, amount: Math.abs(balances.get(a.id) || 0) })).filter(i => i.amount !== 0);
  const actualPurchaseCost = cogsItems.reduce((s, i) => s + i.amount, 0);

  const adminExpAccounts = accounts.filter(a => a.type === 'expenses' && !a.code.startsWith('51'));
  const operatingExpenseItems = adminExpAccounts.map(a => ({ code: a.code, name: a.name, amount: Math.abs(balances.get(a.id) || 0) })).filter(i => i.amount !== 0);
  const generalExpenses = operatingExpenseItems.reduce((s, i) => s + i.amount, 0);

  const totalRevenue = actualSalesRevenue + otherRevenue;
  const grossProfit = actualSalesRevenue - actualPurchaseCost;
  const operatingIncome = grossProfit - generalExpenses;
  const netIncomeBeforeZakat = operatingIncome + otherRevenue;
  const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netProfitMargin = totalRevenue > 0 ? (netIncomeBeforeZakat / totalRevenue) * 100 : 0;

  const { count: salesCount } = await supabase.from('invoices').select('id', { count: 'exact', head: true })
    .eq('company_id', companyId).eq('invoice_type', 'sales').neq('status', 'draft')
    .gte('invoice_date', startDate).lte('invoice_date', endDate);

  return {
    revenue: {
      items: [...salesRevenueAccounts.map(a => ({ code: a.code, name: a.name, amount: balances.get(a.id) || 0 })).filter(i => i.amount !== 0), ...otherRevenueItems].filter(i => i.amount !== 0),
      salesRevenue: actualSalesRevenue, otherRevenue, total: totalRevenue,
    },
    costOfSales: { items: cogsItems, openingInventory: 0, purchases: actualPurchaseCost, closingInventory: 0, total: actualPurchaseCost },
    grossProfit,
    operatingExpenses: { items: operatingExpenseItems, total: generalExpenses },
    operatingIncome,
    otherExpenses: { items: [], total: 0 },
    otherIncome: { items: otherRevenueItems, total: otherRevenue },
    netIncomeBeforeZakat,
    zakatNote: 'ملاحظة: الزكاة تُحسب على الوعاء الزكوي وليس على صافي الربح. راجع قائمة الوعاء الزكوي للحساب الصحيح.',
    period: { startDate, endDate },
    stats: { totalSalesCount: salesCount || 0, grossProfitMargin: Math.round(grossProfitMargin * 100) / 100, netProfitMargin: Math.round(netProfitMargin * 100) / 100 },
  };
}
