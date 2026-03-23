/**
 * System Control - Dashboard Configuration
 */
import { supabase } from '@/integrations/supabase/client';
import type { DashboardConfig, StatCardConfig, AnalyticsSettings, LayoutSettings } from './types';

export async function fetchDashboardConfig(companyId: string): Promise<DashboardConfig | null> {
  const { data, error } = await supabase
    .from('dashboard_config')
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  
  return {
    ...data,
    stat_cards: (data.stat_cards || []) as unknown as StatCardConfig[],
    analytics_settings: (data.analytics_settings || {}) as unknown as AnalyticsSettings,
    layout_settings: (data.layout_settings || {}) as unknown as LayoutSettings,
  };
}

export async function saveDashboardConfig(companyId: string, config: Partial<DashboardConfig>): Promise<void> {
  let existing: DashboardConfig | null = null;
  try {
    existing = await fetchDashboardConfig(companyId);
  } catch {
    // ignore - will create new
  }

  const merged = {
    company_id: companyId,
    stat_cards: config.stat_cards ?? existing?.stat_cards ?? [],
    analytics_settings: config.analytics_settings ?? existing?.analytics_settings ?? {},
    layout_settings: config.layout_settings 
      ? { ...(existing?.layout_settings || {}), ...config.layout_settings }
      : existing?.layout_settings ?? {},
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('dashboard_config' as any)
    .upsert(merged as any, { onConflict: 'company_id' });

  if (error) throw error;
}
