/**
 * Fiscal Year - Carry Forward & Refresh Operations
 */
import { supabase } from '@/integrations/supabase/client';
import { getIndustryFeatures } from '@/core/engine/industryFeatures';
import { refreshClosingEntry } from './closingEntry';
import { refreshOpeningBalances } from './openingEntry';

export async function carryForwardInventory(
  fromFiscalYearId: string, toFiscalYearId: string, companyId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { data: cars, error: fetchError } = await supabase
      .from('cars').select('id').eq('company_id', companyId)
      .eq('fiscal_year_id', fromFiscalYearId).eq('status', 'available');
    if (fetchError) throw fetchError;
    if (!cars || cars.length === 0) return { success: true, count: 0 };

    const { error: updateError } = await supabase
      .from('cars').update({ fiscal_year_id: toFiscalYearId }).in('id', cars.map(c => c.id));
    if (updateError) throw updateError;
    return { success: true, count: cars.length };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function refreshCustomerBalances(
  _fiscalYearId: string, previousYearId: string, companyId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { data: previousYear } = await supabase
      .from('fiscal_years').select('end_date').eq('id', previousYearId).single();
    if (!previousYear) throw new Error('السنة السابقة غير موجودة');

    const { data: receivablesAccount } = await supabase
      .from('account_categories').select('id').eq('company_id', companyId).eq('code', '1201').single();
    if (!receivablesAccount) return { success: true, count: 0 };

    const { data: lines } = await supabase
      .from('journal_entry_lines')
      .select('debit, credit, journal_entry:journal_entries!inner(company_id, entry_date, is_posted)')
      .eq('account_id', receivablesAccount.id)
      .eq('journal_entry.company_id', companyId)
      .eq('journal_entry.is_posted', true)
      .lte('journal_entry.entry_date', previousYear.end_date);

    const balance = (lines || []).reduce((sum: number, line: any) =>
      sum + (Number(line.debit) - Number(line.credit)), 0);
    return { success: true, count: balance !== 0 ? 1 : 0 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function refreshSupplierBalances(
  _fiscalYearId: string, previousYearId: string, companyId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { data: previousYear } = await supabase
      .from('fiscal_years').select('end_date').eq('id', previousYearId).single();
    if (!previousYear) throw new Error('السنة السابقة غير موجودة');

    const { data: payablesAccount } = await supabase
      .from('account_categories').select('id').eq('company_id', companyId).eq('code', '2101').single();
    if (!payablesAccount) return { success: true, count: 0 };

    const { data: lines } = await supabase
      .from('journal_entry_lines')
      .select('debit, credit, journal_entry:journal_entries!inner(company_id, entry_date, is_posted)')
      .eq('account_id', payablesAccount.id)
      .eq('journal_entry.company_id', companyId)
      .eq('journal_entry.is_posted', true)
      .lte('journal_entry.entry_date', previousYear.end_date);

    const balance = (lines || []).reduce((sum: number, line: any) =>
      sum + (Number(line.credit) - Number(line.debit)), 0);
    return { success: true, count: balance !== 0 ? 1 : 0 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function refreshAllCarryForwardBalances(
  fiscalYearId: string, previousYearId: string, companyId: string, companyType?: string
): Promise<{
  success: boolean; openingBalancesUpdated?: boolean;
  closingEntryUpdated?: boolean; inventoryCount?: number; error?: string;
}> {
  try {
    const { data: previousYear } = await supabase
      .from('fiscal_years').select('status, closed_by').eq('id', previousYearId).single();

    let closingEntryUpdated = false;
    if (previousYear?.status === 'closed') {
      const result = await refreshClosingEntry(previousYearId, companyId, previousYear.closed_by || '');
      if (result.success) closingEntryUpdated = true;
    }

    const openingResult = await refreshOpeningBalances(fiscalYearId, previousYearId, companyId);
    if (!openingResult.success) throw new Error(openingResult.error);

    let inventoryCount = 0;
    if (getIndustryFeatures(companyType).hasCarInventory) {
      const result = await carryForwardInventory(previousYearId, fiscalYearId, companyId);
      inventoryCount = result.count || 0;
    }

    await refreshCustomerBalances(fiscalYearId, previousYearId, companyId);
    await refreshSupplierBalances(fiscalYearId, previousYearId, companyId);

    return { success: true, openingBalancesUpdated: true, closingEntryUpdated, inventoryCount };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
