/**
 * System Control - Menu & Account Mapping Configuration
 */
import { supabase } from '@/integrations/supabase/client';
import type { MenuConfiguration, MenuItem, ThemeSettings, AccountMapping } from './types';

export async function fetchMenuConfiguration(companyId: string): Promise<MenuConfiguration | null> {
  const { data, error } = await supabase
    .from('menu_configuration')
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  
  return {
    ...data,
    menu_items: (data.menu_items || []) as unknown as MenuItem[],
    theme_settings: (data.theme_settings || {}) as unknown as ThemeSettings,
  };
}

export async function saveMenuConfiguration(companyId: string, config: Partial<MenuConfiguration>): Promise<void> {
  const { error } = await supabase
    .from('menu_configuration' as any)
    .upsert({
      company_id: companyId,
      menu_items: config.menu_items || [],
      theme_settings: config.theme_settings || {},
      updated_at: new Date().toISOString(),
    } as any, { onConflict: 'company_id' });

  if (error) throw error;
}

export async function fetchAccountMappings(companyId: string): Promise<AccountMapping[]> {
  const { data, error } = await supabase
    .from('account_mappings')
    .select('*')
    .eq('company_id', companyId);

  if (error) throw error;
  return data || [];
}

export async function saveAccountMapping(mapping: Omit<AccountMapping, 'id'>): Promise<void> {
  const { error } = await supabase
    .from('account_mappings')
    .upsert({
      company_id: mapping.company_id,
      mapping_type: mapping.mapping_type,
      mapping_key: mapping.mapping_key,
      account_id: mapping.account_id,
      is_active: mapping.is_active,
    }, { onConflict: 'company_id,mapping_type,mapping_key' });

  if (error) throw error;
}
