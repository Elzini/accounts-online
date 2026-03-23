/**
 * Core Accounting Engine - General Ledger Engine
 * Provides trial balance and account balance queries
 * Single source of truth: journal_entry_lines
 */

import { supabase } from '@/integrations/supabase/client';

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

/**
 * Compute trial balance from journal entries
 * Uses fiscal year filtering for complete isolation
 */
export async function computeTrialBalance(params: TrialBalanceParams): Promise<AccountBalance[]> {
  const { companyId, fiscalYearId, startDate, endDate } = params;

  // 1. Fetch all accounts
  const { data: accounts, error: accError } = await supabase
    .from('account_categories')
    .select('id, code, name, type, parent_id')
    .eq('company_id', companyId)
    .order('code');
  
  if (accError) throw accError;

  // 2. Fetch opening entries (reference_type = 'opening')
  const { data: openingEntries } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('company_id', companyId)
    .eq('fiscal_year_id', fiscalYearId)
    .eq('reference_type', 'opening')
    .eq('is_posted', true);

  const openingEntryIds = (openingEntries || []).map(e => e.id);

  // 3. Fetch all posted journal lines for this fiscal year
  const allLines = await fetchAllJournalLines(companyId, fiscalYearId);

  // 4. Separate opening lines vs period lines
  const openingLines = allLines.filter(l => openingEntryIds.includes(l.journal_entry_id));
  const periodLines = allLines.filter(l => {
    if (openingEntryIds.includes(l.journal_entry_id)) return false;
    // Filter by date range
    const entryDate = l.entry_date;
    return entryDate >= startDate && entryDate <= endDate;
  });

  // 5. Build balance map
  const balanceMap = new Map<string, AccountBalance>();
  for (const acc of accounts || []) {
    balanceMap.set(acc.id, {
      account_id: acc.id,
      account_code: acc.code,
      account_name: acc.name,
      account_type: acc.type,
      parent_id: acc.parent_id,
      opening_debit: 0,
      opening_credit: 0,
      period_debit: 0,
      period_credit: 0,
      closing_debit: 0,
      closing_credit: 0,
    });
  }

  // Aggregate opening
  for (const line of openingLines) {
    const bal = balanceMap.get(line.account_id);
    if (bal) {
      bal.opening_debit += Number(line.debit) || 0;
      bal.opening_credit += Number(line.credit) || 0;
    }
  }

  // Aggregate period
  for (const line of periodLines) {
    const bal = balanceMap.get(line.account_id);
    if (bal) {
      bal.period_debit += Number(line.debit) || 0;
      bal.period_credit += Number(line.credit) || 0;
    }
  }

  // Calculate closing
  for (const bal of balanceMap.values()) {
    const netOpening = bal.opening_debit - bal.opening_credit;
    const netPeriod = bal.period_debit - bal.period_credit;
    const netClosing = netOpening + netPeriod;
    
    bal.closing_debit = netClosing > 0 ? netClosing : 0;
    bal.closing_credit = netClosing < 0 ? Math.abs(netClosing) : 0;
  }

  return Array.from(balanceMap.values()).filter(
    b => b.opening_debit || b.opening_credit || b.period_debit || b.period_credit
  );
}

/**
 * Get account statement (ledger detail) for a single account
 */
export async function getAccountStatement(
  companyId: string,
  accountId: string,
  fiscalYearId: string,
  startDate: string,
  endDate: string
) {
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

/** Helper: fetch all journal lines with pagination */
async function fetchAllJournalLines(companyId: string, fiscalYearId: string) {
  const allLines: Array<{
    journal_entry_id: string;
    account_id: string;
    debit: number;
    credit: number;
    entry_date: string;
  }> = [];
  
  let from = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('journal_entry_lines')
      .select(`
        journal_entry_id, account_id, debit, credit,
        journal_entry:journal_entries!inner(entry_date, is_posted, company_id, fiscal_year_id)
      `)
      .eq('journal_entry.company_id', companyId)
      .eq('journal_entry.fiscal_year_id', fiscalYearId)
      .eq('journal_entry.is_posted', true)
      .range(from, from + pageSize - 1);
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    for (const row of data) {
      const je = row.journal_entry as any;
      allLines.push({
        journal_entry_id: row.journal_entry_id,
        account_id: row.account_id,
        debit: Number(row.debit) || 0,
        credit: Number(row.credit) || 0,
        entry_date: je?.entry_date || '',
      });
    }
    
    if (data.length < pageSize) break;
    from += pageSize;
  }
  
  return allLines;
}
