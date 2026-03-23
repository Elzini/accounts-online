import { supabase } from '@/hooks/modules/useMiscServices';
import { ChangesInEquityStatement } from './types';
import { fetchAccounts, calculateActualNetIncome } from './helpers';

export async function getChangesInEquityStatement(companyId: string, startDate: string, endDate: string): Promise<ChangesInEquityStatement> {
  const accounts = await fetchAccounts(companyId);
  const actualData = await calculateActualNetIncome(companyId, startDate, endDate);

  const fetchLines = async (dateFilter: 'period' | 'prior') => {
    let query = supabase.from('journal_entry_lines')
      .select('account_id, debit, credit, journal_entry:journal_entries!inner(company_id, entry_date, is_posted)')
      .eq('journal_entry.company_id', companyId).eq('journal_entry.is_posted', true);
    if (dateFilter === 'period') query = query.gte('journal_entry.entry_date', startDate).lte('journal_entry.entry_date', endDate);
    else query = query.lt('journal_entry.entry_date', startDate);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  const calculateBalances = (lines: any[]) => {
    const balances = new Map<string, number>();
    lines.forEach((line: any) => {
      const current = balances.get(line.account_id) || 0;
      const account = accounts.find(a => a.id === line.account_id);
      if (account && ['liabilities', 'equity', 'revenue'].includes(account.type)) {
        balances.set(line.account_id, current + (Number(line.credit) - Number(line.debit)));
      } else {
        balances.set(line.account_id, current + (Number(line.debit) - Number(line.credit)));
      }
    });
    return balances;
  };

  const priorBalances = calculateBalances(await fetchLines('prior'));
  const periodBalances = calculateBalances(await fetchLines('period'));

  const capitalAccounts = accounts.filter(a => a.code.startsWith('31'));
  const reserveAccounts = accounts.filter(a => a.code.startsWith('32'));
  const retainedAccounts = accounts.filter(a => a.code.startsWith('33'));

  const openingCapital = capitalAccounts.reduce((s, a) => s + (priorBalances.get(a.id) || 0), 0);
  const openingReserves = reserveAccounts.reduce((s, a) => s + (priorBalances.get(a.id) || 0), 0);
  const openingRetained = retainedAccounts.reduce((s, a) => s + (priorBalances.get(a.id) || 0), 0);
  const netIncome = actualData.netIncome;
  const capitalIncrease = capitalAccounts.reduce((s, a) => s + (periodBalances.get(a.id) || 0), 0);
  const reservesChange = reserveAccounts.reduce((s, a) => s + (periodBalances.get(a.id) || 0), 0);
  const closingCapital = openingCapital + capitalIncrease;
  const closingReserves = openingReserves + reservesChange;
  const closingRetained = openingRetained + netIncome;

  return {
    openingBalance: { capital: openingCapital, retainedEarnings: openingRetained, reserves: openingReserves, total: openingCapital + openingReserves + openingRetained },
    changes: { netIncome, dividends: 0, capitalIncrease, otherChanges: reservesChange },
    closingBalance: { capital: closingCapital, retainedEarnings: closingRetained, reserves: closingReserves, total: closingCapital + closingReserves + closingRetained },
    details: [
      { description: 'الرصيد الافتتاحي', capital: openingCapital, retainedEarnings: openingRetained, reserves: openingReserves, total: openingCapital + openingReserves + openingRetained },
      { description: 'صافي الربح للفترة', capital: 0, retainedEarnings: netIncome, reserves: 0, total: netIncome },
      { description: 'زيادة رأس المال', capital: capitalIncrease, retainedEarnings: 0, reserves: 0, total: capitalIncrease },
      { description: 'الرصيد الختامي', capital: closingCapital, retainedEarnings: closingRetained, reserves: closingReserves, total: closingCapital + closingReserves + closingRetained },
    ],
    period: { startDate, endDate },
  };
}
