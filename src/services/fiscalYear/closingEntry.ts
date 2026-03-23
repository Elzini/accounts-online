/**
 * Fiscal Year - Closing Entry Operations
 * Uses Core Engine for all journal entry and fiscal year operations.
 */
import { JournalEngine } from '@/core/engine/journalEngine';
import { defaultRepos } from '@/core/engine/supabaseRepositories';
import { computeBalances, buildClosingLines } from './balanceCalculator';

export async function closeFiscalYear(
  fiscalYearId: string, companyId: string, closedBy: string
): Promise<{ success: boolean; closingEntryId?: string; error?: string }> {
  try {
    const fiscalYear = await defaultRepos.fiscalYears.findById(fiscalYearId);
    if (!fiscalYear) throw new Error('السنة المالية غير موجودة');

    const journal = new JournalEngine(companyId);
    const bal = await computeBalances(companyId, fiscalYear.start_date, fiscalYear.end_date);

    if (bal.retainedEarningsAccount && bal.netIncome !== 0) {
      const closingLines = buildClosingLines(
        bal.balances, bal.revenueAccounts, bal.expenseAccounts,
        bal.retainedEarningsAccount.id, bal.netIncome
      );

      const entry = await journal.createEntry({
        company_id: companyId,
        fiscal_year_id: fiscalYearId,
        entry_date: fiscalYear.end_date,
        description: `قيد إقفال السنة المالية ${fiscalYear.name}`,
        reference_type: 'closing',
        is_posted: true,
        lines: closingLines,
      });

      await defaultRepos.fiscalYears.update(fiscalYearId, {
        status: 'closed', closed_at: new Date().toISOString(),
        closed_by: closedBy, closing_balance_entry_id: entry.id,
      });

      return { success: true, closingEntryId: entry.id };
    }

    await defaultRepos.fiscalYears.update(fiscalYearId, {
      status: 'closed', closed_at: new Date().toISOString(), closed_by: closedBy,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function refreshClosingEntry(
  fiscalYearId: string, companyId: string, closedBy: string
): Promise<{ success: boolean; closingEntryId?: string; error?: string }> {
  try {
    const fiscalYear = await defaultRepos.fiscalYears.findById(fiscalYearId);
    if (!fiscalYear) throw new Error('السنة المالية غير موجودة');
    if (fiscalYear.status !== 'closed') throw new Error('السنة المالية غير مقفلة');

    const journal = new JournalEngine(companyId);

    // Delete old closing entry
    if ((fiscalYear as any).closing_balance_entry_id) {
      await journal.deleteEntry((fiscalYear as any).closing_balance_entry_id);
    }

    const bal = await computeBalances(companyId, fiscalYear.start_date, fiscalYear.end_date, true);

    if (bal.retainedEarningsAccount && bal.netIncome !== 0) {
      const closingLines = buildClosingLines(
        bal.balances, bal.revenueAccounts, bal.expenseAccounts,
        bal.retainedEarningsAccount.id, bal.netIncome
      );
      closingLines[closingLines.length - 1].description = 'صافي الربح/الخسارة للسنة (مُحدّث)';

      const entry = await journal.createEntry({
        company_id: companyId,
        fiscal_year_id: fiscalYearId,
        entry_date: fiscalYear.end_date,
        description: `قيد إقفال مُحدّث للسنة المالية ${fiscalYear.name}`,
        reference_type: 'closing',
        is_posted: true,
        lines: closingLines,
      });

      await defaultRepos.fiscalYears.update(fiscalYearId, { closing_balance_entry_id: entry.id });
      return { success: true, closingEntryId: entry.id };
    }

    await defaultRepos.fiscalYears.update(fiscalYearId, { closing_balance_entry_id: null });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
