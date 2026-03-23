/**
 * Fiscal Year - Opening Entry & Carry Forward Operations
 * Uses Core Engine for all journal entry and fiscal year operations.
 */
import { JournalEngine } from '@/core/engine/journalEngine';
import { defaultRepos } from '@/core/engine/supabaseRepositories';
import { computeBalances, buildOpeningLines, ensureRetainedEarningsAccount } from './balanceCalculator';

async function createOpeningEntry(
  companyId: string, fiscalYearId: string, name: string, startDate: string,
  openingLines: Array<{ account_id: string; debit: number; credit: number; description: string }>
): Promise<string> {
  const totalDebit = openingLines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = openingLines.reduce((sum, l) => sum + l.credit, 0);
  const balanceDiff = Math.abs(totalDebit - totalCredit);
  if (balanceDiff > 0.005) {
    throw new Error(`قيد الافتتاح غير متوازن (الفرق: ${balanceDiff.toFixed(2)})`);
  }

  const journal = new JournalEngine(companyId);
  const entry = await journal.createEntry({
    company_id: companyId,
    fiscal_year_id: fiscalYearId,
    entry_date: startDate,
    description: `قيد افتتاحي للسنة المالية ${name}`,
    reference_type: 'opening',
    is_posted: true,
    lines: openingLines,
  });

  await defaultRepos.fiscalYears.update(fiscalYearId, { opening_balance_entry_id: entry.id });
  return entry.id;
}

export async function openNewFiscalYear(
  companyId: string, name: string, startDate: string, endDate: string,
  previousYearId?: string, autoCarryForward = true
): Promise<{ success: boolean; fiscalYearId?: string; openingEntryId?: string; error?: string }> {
  try {
    const newYear = await defaultRepos.fiscalYears.create({
      company_id: companyId, name, start_date: startDate, end_date: endDate,
      status: 'open', is_current: true,
    });

    if (autoCarryForward && previousYearId) {
      const previousYear = await defaultRepos.fiscalYears.findById(previousYearId);
      if (previousYear) {
        const bal = await computeBalances(companyId, undefined, previousYear.end_date);
        const retAcc = await ensureRetainedEarningsAccount(
          bal.accounts, bal.retainedEarningsAccount, companyId, bal.netIncome
        );
        const openingLines = buildOpeningLines(bal.balances, bal.accounts, retAcc, bal.netIncome);
        if (openingLines.length > 0) {
          const openingEntryId = await createOpeningEntry(companyId, newYear.id, name, startDate, openingLines);
          return { success: true, fiscalYearId: newYear.id, openingEntryId };
        }
      }
    }

    return { success: true, fiscalYearId: newYear.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function refreshOpeningBalances(
  fiscalYearId: string, previousYearId: string, companyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentYear = await defaultRepos.fiscalYears.findById(fiscalYearId);
    if (!currentYear) throw new Error('السنة المالية غير موجودة');

    const previousYear = await defaultRepos.fiscalYears.findById(previousYearId);
    if (!previousYear) throw new Error('السنة السابقة غير موجودة');

    const journal = new JournalEngine(companyId);
    const repo = defaultRepos.journalEntries;

    // Find existing opening entries
    const openingEntryIds = await repo.findOpeningEntryIds(companyId, fiscalYearId);
    let openingEntryIdToUpdate =
      (currentYear as any).opening_balance_entry_id && openingEntryIds.includes((currentYear as any).opening_balance_entry_id)
        ? (currentYear as any).opening_balance_entry_id : (openingEntryIds[0] || null);

    if (openingEntryIdToUpdate) {
      await repo.deleteLines(openingEntryIdToUpdate);
    }

    // Remove duplicate opening entries
    const duplicateIds = openingEntryIds.filter(id => id !== openingEntryIdToUpdate);
    for (const id of duplicateIds) {
      await journal.deleteEntry(id);
    }

    // Compute fresh balances
    const bal = await computeBalances(companyId, undefined, previousYear.end_date);
    const retAcc = await ensureRetainedEarningsAccount(
      bal.accounts, bal.retainedEarningsAccount, companyId, bal.netIncome
    );
    const openingLines = buildOpeningLines(bal.balances, bal.accounts, retAcc, bal.netIncome, 'رصيد افتتاحي مُحدّث');

    if (openingLines.length > 0) {
      const totalDebit = openingLines.reduce((sum, l) => sum + l.debit, 0);
      const totalCredit = openingLines.reduce((sum, l) => sum + l.credit, 0);
      const balanceDiff = Math.abs(totalDebit - totalCredit);
      if (balanceDiff > 0.005) throw new Error(`قيد الافتتاح غير متوازن (الفرق: ${balanceDiff.toFixed(2)})`);

      if (openingEntryIdToUpdate) {
        await repo.updateEntry(openingEntryIdToUpdate, {
          description: `قيد افتتاحي مُحدّث للسنة المالية ${currentYear.name}`,
          entry_date: currentYear.start_date,
          total_debit: totalDebit, total_credit: totalCredit,
          is_posted: true, reference_type: 'opening', fiscal_year_id: fiscalYearId,
        });
      } else {
        const entry = await journal.createEntry({
          company_id: companyId, fiscal_year_id: fiscalYearId,
          entry_date: currentYear.start_date,
          description: `قيد افتتاحي مُحدّث للسنة المالية ${currentYear.name}`,
          reference_type: 'opening', is_posted: true,
          lines: openingLines,
        });
        openingEntryIdToUpdate = entry.id;
      }

      if (openingEntryIdToUpdate && openingLines.length > 0) {
        await repo.createLines(openingLines.map(l => ({ ...l, journal_entry_id: openingEntryIdToUpdate! })));
      }
      await defaultRepos.fiscalYears.update(fiscalYearId, { opening_balance_entry_id: openingEntryIdToUpdate });
    } else if (openingEntryIdToUpdate) {
      await repo.updateEntry(openingEntryIdToUpdate, {
        description: `قيد افتتاحي مُحدّث للسنة المالية ${currentYear.name}`,
        entry_date: currentYear.start_date, total_debit: 0, total_credit: 0,
        is_posted: true, reference_type: 'opening', fiscal_year_id: fiscalYearId,
      });
      await defaultRepos.fiscalYears.update(fiscalYearId, { opening_balance_entry_id: openingEntryIdToUpdate });
    } else {
      await defaultRepos.fiscalYears.update(fiscalYearId, { opening_balance_entry_id: null });
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
