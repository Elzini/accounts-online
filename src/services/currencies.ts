/**
 * Currencies Service - Multi-currency management and exchange rates
 */
import { supabase } from '@/integrations/supabase/client';

export async function fetchCurrencies(companyId: string) {
  const { data, error } = await supabase.from('currencies').select('*').eq('company_id', companyId).order('is_base', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchExchangeRates(companyId: string) {
  const { data, error } = await supabase.from('exchange_rates').select('*, from_currency:currencies!exchange_rates_from_currency_id_fkey(code, name_ar), to_currency:currencies!exchange_rates_to_currency_id_fkey(code, name_ar)').eq('company_id', companyId).order('effective_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addCurrency(companyId: string, form: { code: string; name_ar: string; name_en?: string; symbol?: string; is_base?: boolean; decimal_places?: number }) {
  const { error } = await supabase.from('currencies').insert({ company_id: companyId, ...form });
  if (error) throw error;
}

export async function addExchangeRate(companyId: string, form: { from_currency_id: string; to_currency_id: string; rate: number; effective_date: string }) {
  const { error } = await supabase.from('exchange_rates').insert({ company_id: companyId, ...form });
  if (error) throw error;
}

export async function deleteCurrency(id: string) {
  const { error } = await supabase.from('currencies').delete().eq('id', id);
  if (error) throw error;
}
