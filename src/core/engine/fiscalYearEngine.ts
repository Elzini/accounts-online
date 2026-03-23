/**
 * Core Accounting Engine - Fiscal Year Management
 * Handles year-end closing and opening balance generation
 */

import { supabase } from '@/hooks/modules/useMiscServices';
import { JournalEngine } from './journalEngine';
import { computeTrialBalance } from './ledgerEngine';

/**
 * Generate opening balances for a new fiscal year from the previous year's closing
 * Only balance sheet accounts (Assets, Liabilities, Equity) carry forward
 * Revenue & Expenses close to Retained Earnings
 */
export async function generateOpeningBalances(
  companyId: string,
  newFiscalYearId: string,
  previousFiscalYearId: string,
  retainedEarningsAccountId: string
): Promise<void> {
  // 1. Get previous year's trial balance
  const { data: prevFY } = await supabase
    .from('fiscal_years')
    .select('start_date, end_date')
    .eq('id', previousFiscalYearId)
    .single();

  if (!prevFY) throw new Error('Previous fiscal year not found');

  const { data: newFY } = await supabase
    .from('fiscal_years')
    .select('start_date')
    .eq('id', newFiscalYearId)
    .single();

  if (!newFY) throw new Error('New fiscal year not found');

  const trialBalance = await computeTrialBalance({
    companyId,
    fiscalYearId: previousFiscalYearId,
    startDate: prevFY.start_date,
    endDate: prevFY.end_date,
  });

  // 2. Separate balance sheet vs income statement
  const balanceSheetTypes = ['assets', 'liabilities', 'equity'];
  const incomeTypes = ['revenue', 'expenses'];

  const bsAccounts = trialBalance.filter(b => balanceSheetTypes.includes(b.account_type));
  const isAccounts = trialBalance.filter(b => incomeTypes.includes(b.account_type));

  // 3. Calculate net income to close into retained earnings
  let netIncome = 0;
  for (const acc of isAccounts) {
    const net = (acc.closing_credit - acc.closing_debit);
    netIncome += net; // Revenue is credit-normal, expenses are debit-normal
  }

  // 4. Build opening entry lines
  const lines: Array<{ account_id: string; description: string; debit: number; credit: number }> = [];

  for (const acc of bsAccounts) {
    if (acc.closing_debit > 0.005) {
      lines.push({
        account_id: acc.account_id,
        description: `رصيد افتتاحي - ${acc.account_name}`,
        debit: Math.round(acc.closing_debit * 100) / 100,
        credit: 0,
      });
    } else if (acc.closing_credit > 0.005) {
      lines.push({
        account_id: acc.account_id,
        description: `رصيد افتتاحي - ${acc.account_name}`,
        debit: 0,
        credit: Math.round(acc.closing_credit * 100) / 100,
      });
    }
  }

  // Add retained earnings from net income
  if (Math.abs(netIncome) > 0.005) {
    lines.push({
      account_id: retainedEarningsAccountId,
      description: 'صافي أرباح / خسائر العام السابق',
      debit: netIncome < 0 ? Math.abs(netIncome) : 0,
      credit: netIncome > 0 ? netIncome : 0,
    });
  }

  if (lines.length < 2) return; // Nothing to carry forward

  // 5. Check balance
  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  const diff = Math.abs(totalDebit - totalCredit);
  
  if (diff > 0.01) {
    // Auto-adjust retained earnings to balance
    const reIdx = lines.findIndex(l => l.account_id === retainedEarningsAccountId);
    if (reIdx >= 0) {
      if (totalDebit > totalCredit) {
        lines[reIdx].credit += diff;
      } else {
        lines[reIdx].debit += diff;
      }
    }
  }

  // 6. Delete existing opening entry for this fiscal year
  const { data: existingEntry } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('company_id', companyId)
    .eq('fiscal_year_id', newFiscalYearId)
    .eq('reference_type', 'opening')
    .maybeSingle();

  if (existingEntry) {
    const repo = defaultRepos.journalEntries;
    await repo.deleteLines(existingEntry.id);
    await repo.deleteEntry(existingEntry.id);
  }

  // 7. Create opening entry
  const engine = new JournalEngine(companyId);
  await engine.createEntry({
    company_id: companyId,
    fiscal_year_id: newFiscalYearId,
    entry_date: newFY.start_date,
    description: 'قيد افتتاحي - أرصدة مرحّلة من السنة السابقة',
    reference_type: 'opening',
    is_posted: true,
    lines,
  });
}
