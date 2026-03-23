import { supabase } from '@/hooks/modules/useMiscServices';
import { TaxSettings } from './types';

export async function fetchTaxSettings(companyId: string): Promise<TaxSettings | null> {
  const { data, error } = await supabase
    .from('tax_settings')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function upsertTaxSettings(companyId: string, settings: Partial<TaxSettings>): Promise<TaxSettings> {
  const { data, error } = await supabase
    .from('tax_settings')
    .upsert({
      company_id: companyId,
      ...settings,
    }, { onConflict: 'company_id' })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
