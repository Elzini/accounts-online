/**
 * System Control - Journal Entry Rules & Financial Statement Config
 */
import { supabase } from '@/hooks/modules/useMiscServices';
import type { FinancialStatementConfig, FinancialStatementSection, JournalEntryRule, RuleCondition } from './types';

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
      company_id: config.company_id,
      statement_type: config.statement_type,
      sections: config.sections,
      display_options: config.display_options,
      updated_at: new Date().toISOString(),
    } as any, { onConflict: 'company_id,statement_type' });

  if (error) throw error;
}

export async function fetchJournalEntryRules(companyId: string): Promise<JournalEntryRule[]> {
  const { data, error } = await supabase
    .from('journal_entry_rules')
    .select('*')
    .eq('company_id', companyId)
    .order('priority', { ascending: false });

  if (error) throw error;
  return (data || []).map(row => ({
    ...row,
    conditions: (row.conditions || []) as unknown as RuleCondition[],
  }));
}

export async function createJournalEntryRule(rule: Omit<JournalEntryRule, 'id'>): Promise<JournalEntryRule> {
  const { data, error } = await supabase
    .from('journal_entry_rules' as any)
    .insert({
      company_id: rule.company_id,
      name: rule.name,
      trigger_type: rule.trigger_type,
      is_enabled: rule.is_enabled,
      conditions: rule.conditions,
      debit_account_id: rule.debit_account_id,
      credit_account_id: rule.credit_account_id,
      amount_field: rule.amount_field,
      description_template: rule.description_template,
      priority: rule.priority,
    } as any)
    .select()
    .single();

  if (error) throw error;
  const result = data as any;
  return {
    ...result,
    conditions: (result.conditions || []) as RuleCondition[],
  };
}

export async function updateJournalEntryRule(id: string, updates: Partial<JournalEntryRule>): Promise<void> {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.trigger_type !== undefined) updateData.trigger_type = updates.trigger_type;
  if (updates.is_enabled !== undefined) updateData.is_enabled = updates.is_enabled;
  if (updates.conditions !== undefined) updateData.conditions = updates.conditions as unknown as object[];
  if (updates.debit_account_id !== undefined) updateData.debit_account_id = updates.debit_account_id;
  if (updates.credit_account_id !== undefined) updateData.credit_account_id = updates.credit_account_id;
  if (updates.amount_field !== undefined) updateData.amount_field = updates.amount_field;
  if (updates.description_template !== undefined) updateData.description_template = updates.description_template;
  if (updates.priority !== undefined) updateData.priority = updates.priority;

  const { error } = await supabase
    .from('journal_entry_rules')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteJournalEntryRule(id: string): Promise<void> {
  const { error } = await supabase
    .from('journal_entry_rules')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
