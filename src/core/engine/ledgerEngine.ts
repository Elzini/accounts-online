/**
 * Core Accounting Engine - General Ledger Engine
 * Provides trial balance and account balance queries.
 * Uses repository interfaces — NO direct Supabase imports.
 */

import { IAccountRepository, IJournalEntryRepository } from './repositories';

export interface AccountBalance {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  parent_id: string | null;
  opening_debit: number;
  opening_credit: number;
  period_debit: number;
  period_credit: number;
  closing_debit: number;
  closing_credit: number;
}

export interface TrialBalanceParams {
  companyId: string;
  fiscalYearId: string;
  startDate: string;
  endDate: string;
}

/** Lazy-load default repos when none are injected */
async function getDefaultRepos() {
  const { defaultRepos } = await import('./supabaseRepositories');
  return defaultRepos;
}

/**
 * Compute trial balance from journal entries.
 * Uses fiscal year filtering for complete isolation.
 */
export async function computeTrialBalance(
  params: TrialBalanceParams,
  deps?: { accountRepo?: IAccountRepository; journalRepo?: IJournalEntryRepository },
): Promise<AccountBalance[]> {
  const { companyId, fiscalYearId, startDate, endDate } = params;
  const defaults = (!deps?.accountRepo || !deps?.journalRepo) ? await getDefaultRepos() : null;
  const accountRepo = deps?.accountRepo || defaults!.accounts;
  const journalRepo = deps?.journalRepo || defaults!.journalEntries;

  // 1. Fetch all accounts
  const accounts = await accountRepo.findAll(companyId);

  // 2. Fetch opening entry IDs
  const openingEntryIds = await journalRepo.findOpeningEntryIds(companyId, fiscalYearId);

  // 3. Fetch all posted journal lines for this fiscal year
  const allLines = await journalRepo.fetchAllLines(companyId, fiscalYearId);

  // 4. Separate opening lines vs period lines
  const openingLines = allLines.filter(l => openingEntryIds.includes(l.journal_entry_id));
  const periodLines = allLines.filter(l => {
    if (openingEntryIds.includes(l.journal_entry_id)) return false;
    return l.entry_date >= startDate && l.entry_date <= endDate;
  });

  // 5. Build balance map
  const balanceMap = new Map<string, AccountBalance>();
  for (const acc of accounts) {
    balanceMap.set(acc.id, {
      account_id: acc.id,
      account_code: acc.code,
      account_name: acc.name,
      account_type: acc.type,
      parent_id: acc.parent_id,
      opening_debit: 0, opening_credit: 0,
      period_debit: 0, period_credit: 0,
      closing_debit: 0, closing_credit: 0,
    });
  }

  for (const line of openingLines) {
    const bal = balanceMap.get(line.account_id);
    if (bal) { bal.opening_debit += Number(line.debit) || 0; bal.opening_credit += Number(line.credit) || 0; }
  }

  for (const line of periodLines) {
    const bal = balanceMap.get(line.account_id);
    if (bal) { bal.period_debit += Number(line.debit) || 0; bal.period_credit += Number(line.credit) || 0; }
  }

  for (const bal of balanceMap.values()) {
    const netClosing = (bal.opening_debit - bal.opening_credit) + (bal.period_debit - bal.period_credit);
    bal.closing_debit = netClosing > 0 ? netClosing : 0;
    bal.closing_credit = netClosing < 0 ? Math.abs(netClosing) : 0;
  }

  return Array.from(balanceMap.values()).filter(
    b => b.opening_debit || b.opening_credit || b.period_debit || b.period_credit
  );
}

/**
 * Get account statement (ledger detail) for a single account.
 * Falls back to direct Supabase for backward compatibility.
 */
export async function getAccountStatement(
  companyId: string,
  accountId: string,
  fiscalYearId: string,
  startDate: string,
  endDate: string,
) {
  // This query uses a join pattern specific to Supabase PostgREST.
  // For now, delegate to the Supabase client directly via lazy import.
  const { supabase } = await import('@/integrations/supabase/client');
  const { data, error } = await supabase
    .from('journal_entry_lines')
    .select(`
      id, debit, credit, description,
      journal_entry:journal_entries!inner(
        id, entry_number, entry_date, description, reference_type, is_posted, fiscal_year_id
      )
    `)
    .eq('account_id', accountId)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.fiscal_year_id', fiscalYearId)
    .eq('journal_entry.is_posted', true)
    .gte('journal_entry.entry_date', startDate)
    .lte('journal_entry.entry_date', endDate)
    .order('journal_entry(entry_date)', { ascending: true });

  if (error) throw error;
  return data || [];
}
