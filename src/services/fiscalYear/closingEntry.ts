/**
 * Fiscal Year - Closing Entry Operations
 * Handles closing a fiscal year and refreshing closing entries
 */
import { supabase } from '@/hooks/modules/useMiscServices';
import { computeBalances, buildClosingLines } from './balanceCalculator';

export async function closeFiscalYear(
  fiscalYearId: string, companyId: string, closedBy: string
): Promise<{ success: boolean; closingEntryId?: string; error?: string }> {
  try {
    const { data: fiscalYear } = await supabase
      .from('fiscal_years').select('*').eq('id', fiscalYearId).single();
    if (!fiscalYear) throw new Error('السنة المالية غير موجودة');

    const bal = await computeBalances(companyId, fiscalYear.start_date, fiscalYear.end_date);

    if (bal.retainedEarningsAccount && bal.netIncome !== 0) {
      const closingLines = buildClosingLines(
        bal.balances, bal.revenueAccounts, bal.expenseAccounts,
        bal.retainedEarningsAccount.id, bal.netIncome
      );
      const totalDebit = closingLines.reduce((sum, l) => sum + l.debit, 0);
      const totalCredit = closingLines.reduce((sum, l) => sum + l.credit, 0);

      const { data: closingEntry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          company_id: companyId,
          description: `قيد إقفال السنة المالية ${fiscalYear.name}`,
          entry_date: fiscalYear.end_date,
          total_debit: totalDebit, total_credit: totalCredit,
          is_posted: true, reference_type: 'closing',
          fiscal_year_id: fiscalYearId, created_by: closedBy,
        })
        .select().single();
      if (entryError) throw entryError;

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(closingLines.map(l => ({ ...l, journal_entry_id: closingEntry.id })));
      if (linesError) throw linesError;

      await supabase.from('fiscal_years').update({
        status: 'closed', closed_at: new Date().toISOString(),
        closed_by: closedBy, closing_balance_entry_id: closingEntry.id,
      }).eq('id', fiscalYearId);

      return { success: true, closingEntryId: closingEntry.id };
    }

    await supabase.from('fiscal_years').update({
      status: 'closed', closed_at: new Date().toISOString(), closed_by: closedBy,
    }).eq('id', fiscalYearId);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function refreshClosingEntry(
  fiscalYearId: string, companyId: string, closedBy: string
): Promise<{ success: boolean; closingEntryId?: string; error?: string }> {
  try {
    const { data: fiscalYear } = await supabase
      .from('fiscal_years').select('*').eq('id', fiscalYearId).single();
    if (!fiscalYear) throw new Error('السنة المالية غير موجودة');
    if (fiscalYear.status !== 'closed') throw new Error('السنة المالية غير مقفلة');

    // Delete old closing entry
    if (fiscalYear.closing_balance_entry_id) {
      await supabase.from('journal_entry_lines').delete()
        .eq('journal_entry_id', fiscalYear.closing_balance_entry_id);
      await supabase.from('journal_entries').delete()
        .eq('id', fiscalYear.closing_balance_entry_id);
    }

    const bal = await computeBalances(companyId, fiscalYear.start_date, fiscalYear.end_date, true);

    if (bal.retainedEarningsAccount && bal.netIncome !== 0) {
      const closingLines = buildClosingLines(
        bal.balances, bal.revenueAccounts, bal.expenseAccounts,
        bal.retainedEarningsAccount.id, bal.netIncome
      );
      closingLines[closingLines.length - 1].description = 'صافي الربح/الخسارة للسنة (مُحدّث)';

      const totalDebit = closingLines.reduce((sum, l) => sum + l.debit, 0);
      const totalCredit = closingLines.reduce((sum, l) => sum + l.credit, 0);

      const { data: closingEntry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          company_id: companyId,
          description: `قيد إقفال مُحدّث للسنة المالية ${fiscalYear.name}`,
          entry_date: fiscalYear.end_date,
          total_debit: totalDebit, total_credit: totalCredit,
          is_posted: true, reference_type: 'closing',
          fiscal_year_id: fiscalYearId, created_by: closedBy,
        })
        .select().single();
      if (entryError) throw entryError;

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(closingLines.map(l => ({ ...l, journal_entry_id: closingEntry.id })));
      if (linesError) throw linesError;

      await supabase.from('fiscal_years')
        .update({ closing_balance_entry_id: closingEntry.id }).eq('id', fiscalYearId);

      return { success: true, closingEntryId: closingEntry.id };
    }

    await supabase.from('fiscal_years')
      .update({ closing_balance_entry_id: null }).eq('id', fiscalYearId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
