import { supabase } from '@/integrations/supabase/client';
import { FormulaDefinition, FormulaVariable, FormulaNode } from './types';
import { DEFAULT_FORMULAS } from './defaults';

export async function fetchFormulaVariables(companyId?: string | null): Promise<FormulaVariable[]> {
  let query = supabase.from('formula_variables').select('*').order('variable_category', { ascending: true });
  if (companyId) query = query.or(`is_system.eq.true,company_id.eq.${companyId}`);
  else query = query.eq('is_system', true);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchFormulaDefinitions(companyId: string, category?: string): Promise<FormulaDefinition[]> {
  let query = supabase.from('formula_definitions').select('*').eq('company_id', companyId).order('display_order', { ascending: true });
  if (category) query = query.eq('formula_category', category);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(item => ({ ...item, formula_expression: (item.formula_expression as unknown) as FormulaNode[] }));
}

export async function seedDefaultFormulas(companyId: string, category: string): Promise<{ inserted: number }> {
  const defaults = DEFAULT_FORMULAS[category] || [];
  if (defaults.length === 0) return { inserted: 0 };
  const { data: existing, error: existingError } = await supabase.from('formula_definitions').select('formula_key, display_order').eq('company_id', companyId).eq('formula_category', category);
  if (existingError) throw existingError;
  const existingKeys = new Set((existing || []).map((r: any) => r.formula_key));
  const maxOrder = (existing || []).reduce((max: number, r: any) => Math.max(max, Number(r.display_order) || 0), -1);
  const startOrder = maxOrder >= 0 ? maxOrder + 1 : (existing?.length || 0);
  const missing = defaults.filter(d => !existingKeys.has(d.key));
  if (missing.length === 0) return { inserted: 0 };
  const rows = missing.map((d, idx) => ({ company_id: companyId, formula_category: category, formula_key: d.key, formula_name: d.name, formula_expression: JSON.parse(JSON.stringify(d.expression)), description: null, is_active: true, display_order: startOrder + idx }));
  const { error: insertError } = await supabase.from('formula_definitions').insert(rows);
  if (insertError) throw insertError;
  return { inserted: rows.length };
}

export async function saveFormulaDefinition(formula: Partial<FormulaDefinition> & { company_id: string }): Promise<FormulaDefinition> {
  const expressionAsJson = JSON.parse(JSON.stringify(formula.formula_expression || []));
  if (formula.id) {
    const { data, error } = await supabase.from('formula_definitions').update({ formula_name: formula.formula_name, formula_expression: expressionAsJson, description: formula.description, is_active: formula.is_active, display_order: formula.display_order }).eq('id', formula.id).select().single();
    if (error) throw error;
    return { ...data, formula_expression: (data.formula_expression as unknown) as FormulaNode[] };
  } else {
    const { data, error } = await supabase.from('formula_definitions').insert({ company_id: formula.company_id, formula_category: formula.formula_category!, formula_key: formula.formula_key!, formula_name: formula.formula_name!, formula_expression: expressionAsJson, description: formula.description, is_active: formula.is_active ?? true, display_order: formula.display_order ?? 0 }).select().single();
    if (error) throw error;
    return { ...data, formula_expression: (data.formula_expression as unknown) as FormulaNode[] };
  }
}

export async function deleteFormulaDefinition(id: string): Promise<void> {
  const { error } = await supabase.from('formula_definitions').delete().eq('id', id);
  if (error) throw error;
}

export async function createCustomVariable(variable: Partial<FormulaVariable> & { company_id: string }): Promise<FormulaVariable> {
  const { data, error } = await supabase.from('formula_variables').insert({ company_id: variable.company_id, variable_key: variable.variable_key, variable_name: variable.variable_name, variable_category: variable.variable_category, data_source: variable.data_source || 'custom', query_definition: variable.query_definition, is_system: false, icon: variable.icon, color: variable.color }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCustomVariable(id: string): Promise<void> {
  const { error } = await supabase.from('formula_variables').delete().eq('id', id);
  if (error) throw error;
}
