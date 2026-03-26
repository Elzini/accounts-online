/**
 * Comprehensive Trial Balance Report
 * Extracted from reports.ts (~240 lines → isolated module)
 */
import { supabase } from '@/hooks/modules/useMiscServices';
import { AccountCategory } from './types';
import { fetchAccounts } from './accounts';
import { isBalanceSheetType } from '@/utils/accountTypes';

export async function getComprehensiveTrialBalance(
  companyId: string, startDate?: string, endDate?: string, fiscalYearId?: string
): Promise<{
  accounts: Array<{
    account: AccountCategory;
    openingDebit: number; openingCredit: number;
    periodDebit: number; periodCredit: number;
    closingDebit: number; closingCredit: number;
    isParent: boolean; level: number;
  }>;
  totals: {
    openingDebit: number; openingCredit: number;
    periodDebit: number; periodCredit: number;
    closingDebit: number; closingCredit: number;
  };
}> {
  const accounts = await fetchAccounts(companyId);

  let fyStartDate: string | undefined;
  let effectiveStartDate: string | undefined;
  let effectiveEndDate: string | undefined;

  if (fiscalYearId) {
    const { data: selectedFY } = await supabase
      .from('fiscal_years').select('start_date, end_date').eq('id', fiscalYearId).single();
    fyStartDate = selectedFY?.start_date;
    effectiveStartDate = startDate || fyStartDate;
    effectiveEndDate = endDate || selectedFY?.end_date;
  } else {
    const { data: fiscalYear } = await supabase
      .from('fiscal_years').select('start_date, end_date')
      .eq('company_id', companyId).eq('is_current', true).single();
    fyStartDate = fiscalYear?.start_date;
    effectiveStartDate = startDate || fyStartDate;
    effectiveEndDate = endDate || fiscalYear?.end_date;
  }

  // 1) Opening balances = ALL posted entries BEFORE the period start date
  // For Balance Sheet accounts: all entries from beginning of time to day before start
  // For Income/Expense accounts: entries from fiscal year start to day before period start
  // This matches the standard used by Qoyod, Daftra, Wafeq, and SOCPA standards
  const openingBalances = new Map<string, { debit: number; credit: number }>();

  if (effectiveStartDate) {
    // Balance Sheet accounts: all entries before period start
    let bsOpeningQuery = supabase
      .from('journal_entry_lines')
      .select('account_id, debit, credit, journal_entry:journal_entries!inner(company_id, is_posted, entry_date)')
      .eq('journal_entry.company_id', companyId)
      .eq('journal_entry.is_posted', true)
      .lt('journal_entry.entry_date', effectiveStartDate)
      .limit(10000);

    const { data: bsOpeningLines } = await bsOpeningQuery;

    const accountTypeMap = new Map<string, string>();
    accounts.forEach(a => accountTypeMap.set(a.id, a.type));

    // Process all lines before period start
    (bsOpeningLines || []).forEach((line: any) => {
      const d = Number(line.debit) || 0, c = Number(line.credit) || 0;
      const accType = accountTypeMap.get(line.account_id);
      if (!accType) return;

      if (isBalanceSheetType(accType)) {
        // Balance sheet: include ALL historical entries
        const current = openingBalances.get(line.account_id) || { debit: 0, credit: 0 };
        current.debit += d; current.credit += c;
        openingBalances.set(line.account_id, current);
      }
      // Income/Expense accounts: opening is entries from fiscal year start to period start
      // If period starts at fiscal year start, opening for income/expense = 0 (correct)
      // If period starts mid-year, we need entries from FY start to period start
    });

    // For income/expense accounts: if period starts AFTER fiscal year start, 
    // include entries from FY start to period start as opening
    if (fyStartDate && effectiveStartDate > fyStartDate) {
      let ieOpeningQuery = supabase
        .from('journal_entry_lines')
        .select('account_id, debit, credit, journal_entry:journal_entries!inner(company_id, is_posted, entry_date)')
        .eq('journal_entry.company_id', companyId)
        .eq('journal_entry.is_posted', true)
        .gte('journal_entry.entry_date', fyStartDate)
        .lt('journal_entry.entry_date', effectiveStartDate)
        .limit(10000);

      const { data: ieOpeningLines } = await ieOpeningQuery;

      (ieOpeningLines || []).forEach((line: any) => {
        const d = Number(line.debit) || 0, c = Number(line.credit) || 0;
        const accType = accountTypeMap.get(line.account_id);
        if (!accType || isBalanceSheetType(accType)) return; // skip BS accounts (already handled)

        const current = openingBalances.get(line.account_id) || { debit: 0, credit: 0 };
        current.debit += d; current.credit += c;
        openingBalances.set(line.account_id, current);
      });
    }
  }

  // 2) Period movement = ALL posted entries within the date range
  let periodQuery = supabase
    .from('journal_entry_lines')
    .select('account_id, debit, credit, journal_entry:journal_entries!inner(company_id, is_posted, entry_date)')
    .eq('journal_entry.company_id', companyId).eq('journal_entry.is_posted', true)
    .limit(10000);

  if (effectiveStartDate) periodQuery = periodQuery.gte('journal_entry.entry_date', effectiveStartDate);
  if (effectiveEndDate) periodQuery = periodQuery.lte('journal_entry.entry_date', effectiveEndDate);

  const { data: periodLines, error } = await periodQuery;
  if (error) throw error;

  const periodBalances = new Map<string, { debit: number; credit: number }>();
  (periodLines || []).forEach((line: any) => {
    const current = periodBalances.get(line.account_id) || { debit: 0, credit: 0 };
    current.debit += Number(line.debit) || 0; current.credit += Number(line.credit) || 0;
    periodBalances.set(line.account_id, current);
  });

  // Build hierarchy
  const leafOpening = new Map<string, { od: number; oc: number }>();
  const leafPeriod = new Map<string, { pd: number; pc: number }>();
  accounts.forEach(account => {
    const ob = openingBalances.get(account.id);
    if (ob && (ob.debit > 0 || ob.credit > 0)) leafOpening.set(account.id, { od: ob.debit, oc: ob.credit });
    const pb = periodBalances.get(account.id);
    if (pb && (pb.debit > 0 || pb.credit > 0)) leafPeriod.set(account.id, { pd: pb.debit, pc: pb.credit });
  });

  const accountMap = new Map(accounts.map(a => [a.id, a]));
  const childrenOf = (parentId: string) => accounts.filter(a => a.parent_id === parentId);

  const aggCache = new Map<string, { od: number; oc: number; pd: number; pc: number }>();
  const getAggregated = (accountId: string): { od: number; oc: number; pd: number; pc: number } => {
    if (aggCache.has(accountId)) return aggCache.get(accountId)!;
    const ownO = leafOpening.get(accountId) || { od: 0, oc: 0 };
    const ownP = leafPeriod.get(accountId) || { pd: 0, pc: 0 };
    const children = childrenOf(accountId);
    let tOD = ownO.od, tOC = ownO.oc, tPD = ownP.pd, tPC = ownP.pc;
    for (const child of children) {
      const c = getAggregated(child.id);
      tOD += c.od; tOC += c.oc; tPD += c.pd; tPC += c.pc;
    }
    const result = { od: tOD, oc: tOC, pd: tPD, pc: tPC };
    aggCache.set(accountId, result);
    return result;
  };
  accounts.forEach(a => getAggregated(a.id));

  const trialAccounts: Array<{
    account: AccountCategory;
    openingDebit: number; openingCredit: number;
    periodDebit: number; periodCredit: number;
    closingDebit: number; closingCredit: number;
    isParent: boolean; level: number;
  }> = [];

  const rootAccounts = accounts.filter(a => !a.parent_id || !accountMap.has(a.parent_id));

  const addHierarchy = (account: AccountCategory, level: number) => {
    const children = childrenOf(account.id);
    const hasChildren = children.length > 0;
    const agg = getAggregated(account.id);
    if (agg.od === 0 && agg.oc === 0 && agg.pd === 0 && agg.pc === 0) return;
    const openingNet = agg.od - agg.oc;
    const closingNet = (agg.od + agg.pd) - (agg.oc + agg.pc);
    trialAccounts.push({
      account,
      openingDebit: openingNet > 0 ? openingNet : 0,
      openingCredit: openingNet < 0 ? Math.abs(openingNet) : 0,
      periodDebit: agg.pd, periodCredit: agg.pc,
      closingDebit: closingNet > 0 ? closingNet : 0,
      closingCredit: closingNet < 0 ? Math.abs(closingNet) : 0,
      isParent: hasChildren, level,
    });
    if (hasChildren) children.sort((a, b) => a.code.localeCompare(b.code)).forEach(c => addHierarchy(c, level + 1));
  };
  rootAccounts.sort((a, b) => a.code.localeCompare(b.code)).forEach(a => addHierarchy(a, 0));

  let rawPeriodDebit = 0, rawPeriodCredit = 0;
  periodBalances.forEach(val => { rawPeriodDebit += val.debit; rawPeriodCredit += val.credit; });

  // Compute opening totals using NET method (consistent with per-account rows)
  let netOpeningDebit = 0, netOpeningCredit = 0;
  openingBalances.forEach(val => {
    const net = val.debit - val.credit;
    if (net > 0) netOpeningDebit += net;
    else if (net < 0) netOpeningCredit += Math.abs(net);
  });

  const closingAccountIds = new Set([...openingBalances.keys(), ...periodBalances.keys()]);
  let netClosingDebit = 0, netClosingCredit = 0;
  closingAccountIds.forEach(accountId => {
    const opening = openingBalances.get(accountId) || { debit: 0, credit: 0 };
    const period = periodBalances.get(accountId) || { debit: 0, credit: 0 };
    const net = (opening.debit + period.debit) - (opening.credit + period.credit);
    if (net > 0) netClosingDebit += net;
    else if (net < 0) netClosingCredit += Math.abs(net);
  });

  return {
    accounts: trialAccounts,
    totals: {
      openingDebit: netOpeningDebit, openingCredit: netOpeningCredit,
      periodDebit: rawPeriodDebit, periodCredit: rawPeriodCredit,
      closingDebit: netClosingDebit, closingCredit: netClosingCredit,
    },
  };
}
