/**
 * General Ledger Report
 * Extracted from reports.ts (200 lines → isolated module)
 */
import { supabase } from '@/hooks/modules/useMiscServices';
import { AccountCategory } from './types';
import { fetchAccounts } from './accounts';

export async function getGeneralLedger(
  companyId: string,
  accountId: string,
  startDate?: string,
  endDate?: string,
  fiscalYearId?: string
): Promise<{
  account: AccountCategory;
  entries: Array<{
    id: string; date: string; entry_number: number; description: string;
    debit: number; credit: number; balance: number;
    reference_type: string | null; sub_account_name?: string;
  }>;
  openingBalance: number; totalDebit: number; totalCredit: number;
  closingBalance: number; isParentAccount: boolean;
}> {
  const { data: account, error: accountError } = await supabase
    .from('account_categories').select('*').eq('id', accountId).single();
  if (accountError) throw accountError;

  const allAccounts = await fetchAccounts(companyId);
  const accountMap = new Map(allAccounts.map(a => [a.id, a]));

  const getDescendantIds = (parentId: string): string[] => {
    const children = allAccounts.filter(a => a.parent_id === parentId);
    let ids: string[] = [];
    for (const child of children) {
      ids.push(child.id);
      ids = ids.concat(getDescendantIds(child.id));
    }
    return ids;
  };

  const childIds = getDescendantIds(accountId);
  const isParentAccount = childIds.length > 0;
  const targetAccountIds = isParentAccount ? [accountId, ...childIds] : [accountId];
  const isDebitNormal = ['asset', 'assets', 'expense', 'expenses'].includes(account.type);

  let openingBalance = 0;

  if (startDate && fiscalYearId) {
    const { data: openingEntryLines } = await supabase
      .from('journal_entry_lines')
      .select('account_id, debit, credit, journal_entry:journal_entries!inner(company_id, is_posted, entry_date, reference_type, fiscal_year_id)')
      .in('account_id', targetAccountIds)
      .eq('journal_entry.company_id', companyId).eq('journal_entry.is_posted', true)
      .eq('journal_entry.fiscal_year_id', fiscalYearId).eq('journal_entry.reference_type', 'opening');

    const { data: priorLines, error: priorError } = await supabase
      .from('journal_entry_lines')
      .select('account_id, debit, credit, journal_entry:journal_entries!inner(company_id, is_posted, entry_date, fiscal_year_id)')
      .in('account_id', targetAccountIds)
      .eq('journal_entry.company_id', companyId).eq('journal_entry.is_posted', true)
      .eq('journal_entry.fiscal_year_id', fiscalYearId).lt('journal_entry.entry_date', startDate);
    if (priorError) throw priorError;

    const allPriorLines = (openingEntryLines?.length ?? 0) > 0 ? openingEntryLines! : (priorLines || []);
    allPriorLines.forEach((line: any) => {
      const d = Number(line.debit) || 0, c = Number(line.credit) || 0;
      openingBalance += isDebitNormal ? d - c : c - d;
    });
  } else if (startDate && !fiscalYearId) {
    const { data: priorLines, error: priorError } = await supabase
      .from('journal_entry_lines')
      .select('account_id, debit, credit, journal_entry:journal_entries!inner(company_id, is_posted, entry_date)')
      .in('account_id', targetAccountIds)
      .eq('journal_entry.company_id', companyId).eq('journal_entry.is_posted', true)
      .lt('journal_entry.entry_date', startDate);
    if (priorError) throw priorError;

    const { data: openingEntryLines } = await supabase
      .from('journal_entry_lines')
      .select('account_id, debit, credit, journal_entry:journal_entries!inner(company_id, is_posted, entry_date, reference_type)')
      .in('account_id', targetAccountIds)
      .eq('journal_entry.company_id', companyId).eq('journal_entry.is_posted', true)
      .eq('journal_entry.reference_type', 'opening').gte('journal_entry.entry_date', startDate);

    const allPriorLines = (openingEntryLines?.length ?? 0) > 0 ? openingEntryLines! : (priorLines || []);
    allPriorLines.forEach((line: any) => {
      const d = Number(line.debit) || 0, c = Number(line.credit) || 0;
      openingBalance += isDebitNormal ? d - c : c - d;
    });
  }

  let query = supabase
    .from('journal_entry_lines')
    .select('id, account_id, debit, credit, description, journal_entry:journal_entries!inner(id, entry_number, entry_date, description, reference_type, company_id, is_posted, fiscal_year_id)')
    .in('account_id', targetAccountIds)
    .eq('journal_entry.company_id', companyId).eq('journal_entry.is_posted', true)
    .order('journal_entry(entry_date)', { ascending: true })
    .order('journal_entry(entry_number)', { ascending: true });

  if (fiscalYearId) query = query.eq('journal_entry.fiscal_year_id', fiscalYearId);
  if (startDate) query = query.gte('journal_entry.entry_date', startDate);
  if (endDate) query = query.lte('journal_entry.entry_date', endDate);

  const { data: lines, error: linesError } = await query;
  if (linesError) throw linesError;

  let runningBalance = openingBalance;
  const entries = (lines || []).map((line: any) => {
    const debit = Number(line.debit) || 0, credit = Number(line.credit) || 0;
    runningBalance += isDebitNormal ? debit - credit : credit - debit;
    const subAccount = isParentAccount && line.account_id !== accountId ? accountMap.get(line.account_id) : null;
    return {
      id: line.id, date: line.journal_entry.entry_date,
      entry_number: line.journal_entry.entry_number,
      description: line.journal_entry.description || line.description,
      debit, credit, balance: runningBalance,
      reference_type: line.journal_entry.reference_type,
      sub_account_name: subAccount ? `${subAccount.code} - ${subAccount.name}` : undefined,
    };
  });

  return {
    account: account as AccountCategory, entries, openingBalance,
    totalDebit: entries.reduce((s, e) => s + e.debit, 0),
    totalCredit: entries.reduce((s, e) => s + e.credit, 0),
    closingBalance: runningBalance, isParentAccount,
  };
}
