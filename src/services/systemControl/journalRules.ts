/**
 * System Control - Journal Entry Rules & Financial Statement Config
 * STUB: journal_entry_rules table removed during schema cleanup.
 * financial_statement_config kept (has data).
 */
import { supabase } from '@/hooks/modules/useMiscServices';
import type { FinancialStatementConfig, FinancialStatementSection, JournalEntryRule } from './types';

export async function fetchFinancialStatementConfig(companyId: string, statementType: string): Promise<FinancialStatementConfig | null> {
  const { data, error } = await supabase
    .from('financial_statement_config')
    .select('*')
    .eq('company_id', companyId)
    .eq('statement_type', statementType)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  return {
    ...data,
    sections: (data.sections || []) as unknown as FinancialStatementSection[],
    display_options: (data.display_options || {}) as unknown as FinancialStatementConfig['display_options'],
  };
}

export async function saveFinancialStatementConfig(config: Omit<FinancialStatementConfig, 'id'>): Promise<void> {
  const { error } = await supabase
    .from('financial_statement_config' as any)
    .upsert({
      company_id: config.company_id, statement_type: config.statement_type,
      sections: config.sections, display_options: config.display_options,
      updated_at: new Date().toISOString(),
    } as any, { onConflict: 'company_id,statement_type' });
  if (error) throw error;
}

export async function fetchJournalEntryRules(_companyId: string): Promise<JournalEntryRule[]> {
  return [];
}

export async function createJournalEntryRule(_rule: Omit<JournalEntryRule, 'id'>): Promise<JournalEntryRule> {
  throw new Error('Journal entry rules feature is being redesigned');
}

export async function updateJournalEntryRule(_id: string, _updates: Partial<JournalEntryRule>): Promise<void> {
  throw new Error('Journal entry rules feature is being redesigned');
}

export async function deleteJournalEntryRule(_id: string): Promise<void> {
  throw new Error('Journal entry rules feature is being redesigned');
}
