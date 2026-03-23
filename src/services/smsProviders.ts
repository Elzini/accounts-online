import { supabase } from '@/integrations/supabase/client';
import { requireCompanyId } from '@/services/companyContext';

export async function fetchSmsProviderConfigs() {
  const companyId = await requireCompanyId();
  const { data, error } = await supabase.from('sms_provider_configs').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data || [];
}

export async function upsertSmsProviderConfig(existing: any, companyId: string, provider: string, config: Record<string, string>) {
  if (existing) {
    const { error } = await supabase.from('sms_provider_configs')
      .update({ config, is_active: true }).eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('sms_provider_configs')
      .insert({ company_id: companyId, provider, config, is_active: true });
    if (error) throw error;
  }
}
