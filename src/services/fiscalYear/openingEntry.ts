/**
 * Fiscal Year - Opening Entry & Carry Forward Operations
 */
import { supabase } from '@/integrations/supabase/client';
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

  const { data: openingEntry, error: entryError } = await supabase
    .from('journal_entries')
    .insert({
      company_id: companyId,
      description: `قيد افتتاحي للسنة المالية ${name}`,
      entry_date: startDate,
      total_debit: totalDebit, total_credit: totalCredit,
      is_posted: true, reference_type: 'opening', fiscal_year_id: fiscalYearId,
    })
    .select().single();
  if (entryError) throw entryError;

  const { error: linesError } = await supabase
    .from('journal_entry_lines')
    .insert(openingLines.map(l => ({ ...l, journal_entry_id: openingEntry.id })));
  if (linesError) throw linesError;

  await supabase.from('fiscal_years')
    .update({ opening_balance_entry_id: openingEntry.id }).eq('id', fiscalYearId);

  return openingEntry.id;
}

export async function openNewFiscalYear(
  companyId: string, name: string, startDate: string, endDate: string,
  previousYearId?: string, autoCarryForward = true
): Promise<{ success: boolean; fiscalYearId?: string; openingEntryId?: string; error?: string }> {
  try {
    const { data: newYear, error: createError } = await supabase
      .from('fiscal_years')
      .insert({ company_id: companyId, name, start_date: startDate, end_date: endDate, status: 'open', is_current: true })
      .select().single();
    if (createError) throw createError;

    if (autoCarryForward && previousYearId) {
      const { data: previousYear } = await supabase
        .from('fiscal_years').select('*').eq('id', previousYearId).single();

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
    const { data: currentYear } = await supabase
      .from('fiscal_years').select('*').eq('id', fiscalYearId).single();
    if (!currentYear) throw new Error('السنة المالية غير موجودة');

    const { data: previousYear } = await supabase
      .from('fiscal_years').select('*').eq('id', previousYearId).single();
    if (!previousYear) throw new Error('السنة السابقة غير موجودة');

    // Find existing opening entries and clean duplicates
    const { data: oldOpeningEntries } = await supabase
      .from('journal_entries').select('id')
      .eq('company_id', companyId).eq('fiscal_year_id', fiscalYearId)
      .eq('reference_type', 'opening');

    const openingEntryIds = (oldOpeningEntries || []).map(e => e.id);
    let openingEntryIdToUpdate =
      currentYear.opening_balance_entry_id && openingEntryIds.includes(currentYear.opening_balance_entry_id)
        ? currentYear.opening_balance_entry_id : (openingEntryIds[0] || null);

    if (openingEntryIdToUpdate) {
      await supabase.from('journal_entry_lines').delete().eq('journal_entry_id', openingEntryIdToUpdate);
    }

    // Remove duplicate opening entries
    const duplicateIds = openingEntryIds.filter(id => id !== openingEntryIdToUpdate);
    if (duplicateIds.length > 0) {
      await supabase.from('journal_entry_lines').delete().in('journal_entry_id', duplicateIds);
      await supabase.from('journal_entries').delete().in('id', duplicateIds);
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
        await supabase.from('journal_entries').update({
          description: `قيد افتتاحي مُحدّث للسنة المالية ${currentYear.name}`,
          entry_date: currentYear.start_date,
          total_debit: totalDebit, total_credit: totalCredit,
          is_posted: true, reference_type: 'opening', fiscal_year_id: fiscalYearId,
        }).eq('id', openingEntryIdToUpdate);
      } else {
        const { data: entry, error } = await supabase.from('journal_entries').insert({
          company_id: companyId,
          description: `قيد افتتاحي مُحدّث للسنة المالية ${currentYear.name}`,
          entry_date: currentYear.start_date,
          total_debit: totalDebit, total_credit: totalCredit,
          is_posted: true, reference_type: 'opening', fiscal_year_id: fiscalYearId,
        }).select('id').single();
        if (error) throw error;
        openingEntryIdToUpdate = entry.id;
      }

      await supabase.from('journal_entry_lines')
        .insert(openingLines.map(l => ({ ...l, journal_entry_id: openingEntryIdToUpdate! })));
      await supabase.from('fiscal_years')
        .update({ opening_balance_entry_id: openingEntryIdToUpdate }).eq('id', fiscalYearId);
    } else if (openingEntryIdToUpdate) {
      await supabase.from('journal_entries').update({
        description: `قيد افتتاحي مُحدّث للسنة المالية ${currentYear.name}`,
        entry_date: currentYear.start_date, total_debit: 0, total_credit: 0,
        is_posted: true, reference_type: 'opening', fiscal_year_id: fiscalYearId,
      }).eq('id', openingEntryIdToUpdate);
      await supabase.from('fiscal_years')
        .update({ opening_balance_entry_id: openingEntryIdToUpdate }).eq('id', fiscalYearId);
    } else {
      await supabase.from('fiscal_years')
        .update({ opening_balance_entry_id: null }).eq('id', fiscalYearId);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
