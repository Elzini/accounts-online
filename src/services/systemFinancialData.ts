/**
 * System Financial Data - Thin Orchestrator
 * Formerly 756 lines → now ~120 lines delegating to focused modules
 */
import { supabase } from '@/integrations/supabase/client';
import { isBalanceSheetType } from '@/utils/accountTypes';
import {
  ComprehensiveFinancialData,
  CashFlowData,
  EquityChangesData,
  emptyFinancialData,
} from '@/components/financial-statements/types';
import { AccountCategory, fetchAccounts } from './accounting';
import { getLeafAccounts, classifyAccounts, getBalance } from './financial/accountClassifier';
import { buildBalanceSheet } from './financial/balanceSheetBuilder';
import { computeIncomeComponents, buildIncomeStatement } from './financial/incomeStatementBuilder';
import { calculateZakat } from './financial/zakatCalculator';
import { buildNotes } from './financial/notesBuilder';

// ── Re-export the trial balance (kept here for backward compat) ──

interface SystemTrialBalanceAccount {
  code: string; name: string; type: string;
  openingDebit: number; openingCredit: number;
  movementDebit: number; movementCredit: number;
  closingDebit: number; closingCredit: number;
}
interface SystemTrialBalanceData {
  accounts: SystemTrialBalanceAccount[];
  totals: {
    openingDebit: number; openingCredit: number;
    movementDebit: number; movementCredit: number;
    closingDebit: number; closingCredit: number;
  };
}

export async function getSystemTrialBalance(
  companyId: string, startDate?: string, endDate?: string
): Promise<SystemTrialBalanceData> {
  const accounts = await fetchAccounts(companyId);
  const leafAccounts = getLeafAccounts(accounts);

  // Opening balances
  let openingQuery = supabase.from('journal_entry_lines')
    .select('account_id, debit, credit, journal_entry:journal_entries!inner(company_id, is_posted, entry_date, reference_type)')
    .eq('journal_entry.company_id', companyId).eq('journal_entry.is_posted', true);
  if (startDate) openingQuery = openingQuery.lt('journal_entry.entry_date', startDate);
  const { data: openingLines, error: e1 } = await openingQuery;
  if (e1) throw e1;

  // Opening entries within period
  let openingEntriesQuery = supabase.from('journal_entry_lines')
    .select('account_id, debit, credit, journal_entry:journal_entries!inner(company_id, is_posted, entry_date, reference_type)')
    .eq('journal_entry.company_id', companyId).eq('journal_entry.is_posted', true)
    .eq('journal_entry.reference_type', 'opening');
  if (startDate) openingEntriesQuery = openingEntriesQuery.gte('journal_entry.entry_date', startDate);
  if (endDate) openingEntriesQuery = openingEntriesQuery.lte('journal_entry.entry_date', endDate);
  const { data: openingEntryLines, error: e2 } = await openingEntriesQuery;
  if (e2) throw e2;

  // Movement (excluding opening entries)
  let movementQuery = supabase.from('journal_entry_lines')
    .select('account_id, debit, credit, journal_entry:journal_entries!inner(company_id, is_posted, entry_date, reference_type)')
    .eq('journal_entry.company_id', companyId).eq('journal_entry.is_posted', true)
    .neq('journal_entry.reference_type', 'opening');
  if (startDate) movementQuery = movementQuery.gte('journal_entry.entry_date', startDate);
  if (endDate) movementQuery = movementQuery.lte('journal_entry.entry_date', endDate);
  const { data: movementLines, error: e3 } = await movementQuery;
  if (e3) throw e3;

  // Aggregate
  const accountTypeMap = new Map<string, string>();
  accounts.forEach(a => accountTypeMap.set(a.id, a.type));

  const openingBalances = new Map<string, { debit: number; credit: number }>();
  const movementBalances = new Map<string, { debit: number; credit: number }>();

  const openingSourceLines = (openingEntryLines?.length ?? 0) > 0 ? openingEntryLines! : [...(openingLines || [])];
  openingSourceLines.forEach((line: any) => {
    const accType = accountTypeMap.get(line.account_id);
    if (!accType || !isBalanceSheetType(accType)) return;
    const c = openingBalances.get(line.account_id) || { debit: 0, credit: 0 };
    c.debit += Number(line.debit) || 0; c.credit += Number(line.credit) || 0;
    openingBalances.set(line.account_id, c);
  });

  (movementLines || []).forEach((line: any) => {
    const c = movementBalances.get(line.account_id) || { debit: 0, credit: 0 };
    c.debit += Number(line.debit) || 0; c.credit += Number(line.credit) || 0;
    movementBalances.set(line.account_id, c);
  });

  const trialBalanceAccounts: SystemTrialBalanceAccount[] = [];
  const totals = { openingDebit: 0, openingCredit: 0, movementDebit: 0, movementCredit: 0, closingDebit: 0, closingCredit: 0 };

  leafAccounts.forEach(account => {
    const opening = openingBalances.get(account.id) || { debit: 0, credit: 0 };
    const movement = movementBalances.get(account.id) || { debit: 0, credit: 0 };
    const net = (opening.debit + movement.debit) - (opening.credit + movement.credit);
    if (movement.debit > 0 || movement.credit > 0 || opening.debit > 0 || opening.credit > 0) {
      trialBalanceAccounts.push({
        code: account.code, name: account.name, type: account.type,
        openingDebit: opening.debit, openingCredit: opening.credit,
        movementDebit: movement.debit, movementCredit: movement.credit,
        closingDebit: net > 0 ? net : 0, closingCredit: net < 0 ? Math.abs(net) : 0,
      });
      totals.openingDebit += opening.debit; totals.openingCredit += opening.credit;
      totals.movementDebit += movement.debit; totals.movementCredit += movement.credit;
    }
  });

  totals.closingDebit = totals.openingDebit + totals.movementDebit;
  totals.closingCredit = totals.openingCredit + totals.movementCredit;
  trialBalanceAccounts.sort((a, b) => a.code.localeCompare(b.code));

  return { accounts: trialBalanceAccounts, totals };
}

// ── Main Financial Statements (orchestrator) ──

export async function getSystemFinancialStatements(
  companyId: string, companyName: string, startDate?: string, endDate?: string
): Promise<ComprehensiveFinancialData> {
  const accounts = await fetchAccounts(companyId);
  const leafAccounts = getLeafAccounts(accounts);
  const classified = classifyAccounts(leafAccounts);

  // Fetch all posted lines for period
  let query = supabase.from('journal_entry_lines')
    .select('account_id, debit, credit, journal_entry:journal_entries!inner(company_id, is_posted, entry_date)')
    .eq('journal_entry.company_id', companyId).eq('journal_entry.is_posted', true);
  if (startDate) query = query.gte('journal_entry.entry_date', startDate);
  if (endDate) query = query.lte('journal_entry.entry_date', endDate);
  const { data: lines, error } = await query;
  if (error) throw error;

  const balances = new Map<string, { debit: number; credit: number }>();
  (lines || []).forEach((line: any) => {
    const c = balances.get(line.account_id) || { debit: 0, credit: 0 };
    c.debit += Number(line.debit) || 0; c.credit += Number(line.credit) || 0;
    balances.set(line.account_id, c);
  });

  // 1. Income Statement components
  const income = computeIncomeComponents(classified, balances);

  // 2. Zakat
  const bs = buildBalanceSheet(classified, balances, 0); // temp for totalNonCurrentAssets
  const { zakat, zakatNote } = await calculateZakat(
    classified, balances, income.profitBeforeZakat, bs.totalNonCurrentAssets, companyId, endDate
  );
  const netProfit = income.profitBeforeZakat - zakat;

  // 3. Final Balance Sheet (with net profit)
  const balanceSheet = buildBalanceSheet(classified, balances, netProfit);

  // 4. Income Statement
  const incomeStatement = buildIncomeStatement(income, zakat, netProfit);

  // 5. Notes
  const notes = buildNotes(classified, balances, income, zakatNote);

  // 6. Cash Flow (simplified)
  const cashFlow: CashFlowData = {
    operatingActivities: {
      profitBeforeZakat: income.profitBeforeZakat,
      adjustmentsToReconcile: [], changesInWorkingCapital: [],
      zakatPaid: 0, employeeBenefitsPaid: 0, netOperatingCashFlow: netProfit,
    },
    investingActivities: [], netInvestingCashFlow: 0,
    financingActivities: [], netFinancingCashFlow: 0,
    netChangeInCash: netProfit,
    openingCashBalance: 0,
    closingCashBalance: notes.cashAndBank.total,
  };

  // 7. Equity Changes
  const capitalValue = notes.capital?.totalValue || 0;
  const equityChanges: EquityChangesData = {
    periods: [{
      label: 'السنة الحالية',
      rows: [
        { description: 'الرصيد في بداية السنة', capital: capitalValue, statutoryReserve: 0, retainedEarnings: 0, total: capitalValue },
        { description: 'صافي الربح للسنة', capital: 0, statutoryReserve: 0, retainedEarnings: netProfit, total: netProfit },
        { description: 'الرصيد في نهاية السنة', capital: capitalValue, statutoryReserve: 0, retainedEarnings: netProfit, total: balanceSheet.totalEquity },
      ],
    }],
  };

  const reportDate = endDate
    ? `${new Date(endDate).getDate()} ${new Date(endDate).toLocaleDateString('ar-SA', { month: 'long' })} ${new Date(endDate).getFullYear()}م`
    : `${new Date().getDate()} ${new Date().toLocaleDateString('ar-SA', { month: 'long' })} ${new Date().getFullYear()}م`;

  return {
    companyName, companyType: 'مؤسسة فردية', reportDate, currency: 'ريال سعودي',
    balanceSheet, incomeStatement, equityChanges, cashFlow, notes,
  };
}
