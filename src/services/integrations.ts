import { supabase } from '@/integrations/supabase/client';
import { requireCompanyId } from '@/services/companyContext';

export async function fetchIntegrationConfigs() {
  const companyId = await requireCompanyId();
  const { data, error } = await supabase.from('integration_configs').select('*').eq('company_id', companyId);
  if (error) throw error;
  return data || [];
}

export async function toggleIntegrationConfig(configs: any[], platform: string, is_active: boolean) {
  const companyId = await requireCompanyId();
  const existing = configs.find((c: any) => c.platform === platform);
  if (existing) {
    const { error } = await supabase.from('integration_configs').update({ is_active }).eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('integration_configs').insert({ company_id: companyId, platform, is_active });
    if (error) throw error;
  }
}

export async function fetchContactsWithPhone(table: 'customers' | 'suppliers') {
  const companyId = await requireCompanyId();
  const { data } = await supabase.from(table).select('id, name, phone').eq('company_id', companyId).not('phone', 'is', null).order('name');
  return data || [];
}
