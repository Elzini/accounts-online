/**
 * Fiscal Year - CRUD Operations
 * Simple data access functions extracted from the 1102-line fiscalYears.ts
 */
import { supabase } from '@/integrations/supabase/client';

export interface FiscalYear {
  id: string;
  company_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'open' | 'closed';
  is_current: boolean;
  opening_balance_entry_id: string | null;
  closing_balance_entry_id: string | null;
  closed_at: string | null;
  closed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type FiscalYearInsert = Omit<FiscalYear, 'id' | 'created_at' | 'updated_at'>;

export async function fetchFiscalYears(companyId: string): Promise<FiscalYear[]> {
  const { data, error } = await supabase
    .from('fiscal_years').select('*').eq('company_id', companyId)
    .order('start_date', { ascending: false });
  if (error) throw error;
  return data as FiscalYear[];
}

export async function getCurrentFiscalYear(companyId: string): Promise<FiscalYear | null> {
  const { data, error } = await supabase
    .from('fiscal_years').select('*').eq('company_id', companyId)
    .eq('is_current', true).maybeSingle();
  if (error) throw error;
  return data as FiscalYear | null;
}

export async function createFiscalYear(fiscalYear: {
  company_id: string; name: string; start_date: string; end_date: string;
  status?: string; is_current?: boolean; notes?: string;
}): Promise<FiscalYear> {
  const { data, error } = await supabase
    .from('fiscal_years').insert(fiscalYear).select().single();
  if (error) throw error;
  return data as FiscalYear;
}

export async function updateFiscalYear(id: string, updates: Partial<FiscalYear>): Promise<FiscalYear> {
  const { data, error } = await supabase
    .from('fiscal_years').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as FiscalYear;
}

export async function setCurrentFiscalYear(id: string): Promise<FiscalYear> {
  const { data, error } = await supabase
    .from('fiscal_years').update({ is_current: true }).eq('id', id).select().single();
  if (error) throw error;
  return data as FiscalYear;
}

export async function setUserFiscalYear(userId: string, fiscalYearId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles').update({ current_fiscal_year_id: fiscalYearId }).eq('user_id', userId);
  if (error) throw error;
}

export async function getUserFiscalYear(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles').select('current_fiscal_year_id').eq('user_id', userId).single();
  if (error) throw error;
  return data?.current_fiscal_year_id || null;
}

export async function deleteFiscalYear(id: string): Promise<void> {
  const { error } = await supabase
    .from('fiscal_years').delete().eq('id', id).eq('status', 'open');
  if (error) throw error;
}
