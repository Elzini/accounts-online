import { supabase } from '@/integrations/supabase/client';
import { ZakatBaseStatement } from './types';
import { fetchAccounts } from './helpers';

export async function getZakatBaseStatement(companyId: string, fiscalYear: string): Promise<ZakatBaseStatement> {
  const accounts = await fetchAccounts(companyId);
  const { data: lines, error } = await supabase
    .from('journal_entry_lines')
    .select('account_id, debit, credit, journal_entry:journal_entries!inner(company_id, is_posted)')
    .eq('journal_entry.company_id', companyId).eq('journal_entry.is_posted', true);
  if (error) throw error;

  const { data: taxSettings } = await supabase.from('tax_settings').select('*').eq('company_id', companyId).maybeSingle();
  const { data: company } = await supabase.from('companies').select('name').eq('id', companyId).single();

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

  const getAccountBalance = (prefix: string) => accounts.filter(a => a.code.startsWith(prefix)).reduce((s, a) => s + (balances.get(a.id) || 0), 0);

  const salesRevenue = accounts.filter(a => a.type === 'revenue').reduce((s, a) => s + (balances.get(a.id) || 0), 0);
  const purchaseCost = accounts.filter(a => a.type === 'expenses' && a.code.startsWith('51')).reduce((s, a) => s + Math.abs(balances.get(a.id) || 0), 0);
  const generalExpenses = accounts.filter(a => a.type === 'expenses' && !a.code.startsWith('51')).reduce((s, a) => s + Math.abs(balances.get(a.id) || 0), 0);
  const netIncomeForYear = salesRevenue - purchaseCost - generalExpenses;

  const paidUpCapital = getAccountBalance('31');
  const reserves = getAccountBalance('32');
  const retainedEarnings = getAccountBalance('33');
  const provisions = getAccountBalance('24');
  const longTermLoans = getAccountBalance('23');
  const totalZakatableSources = paidUpCapital + reserves + retainedEarnings + netIncomeForYear + provisions + longTermLoans;

  const netFixedAssets = getAccountBalance('14') + getAccountBalance('15');
  const investments = getAccountBalance('16');
  const preOperatingExpenses = getAccountBalance('17');
  const accumulatedLosses = Math.min(0, retainedEarnings);
  const totalDeductions = netFixedAssets + investments + preOperatingExpenses + Math.abs(accumulatedLosses);
  const adjustedZakatBase = Math.max(0, totalZakatableSources - totalDeductions);
  const zakatRate = 0.025;

  return {
    zakatableSources: { paidUpCapital, reserves, retainedEarnings: Math.max(0, retainedEarnings), netIncomeForYear, provisions, longTermLoans, total: totalZakatableSources },
    deductions: { netFixedAssets, investments, preOperatingExpenses, accumulatedLosses: Math.abs(accumulatedLosses), total: totalDeductions },
    adjustedZakatBase, zakatRate, zakatDue: adjustedZakatBase * zakatRate, fiscalYear,
    companyInfo: { name: company?.name || '', taxNumber: taxSettings?.tax_number || '', commercialRegister: taxSettings?.commercial_register || '' },
  };
}
