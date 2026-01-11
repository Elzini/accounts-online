import { supabase } from '@/integrations/supabase/client';

export interface AppSettings {
  app_name: string;
  app_subtitle: string;
  primary_color: string;
}

export async function fetchAppSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value');
  
  if (error) throw error;
  
  const settings: AppSettings = {
    app_name: 'أشبال النمر',
    app_subtitle: 'لتجارة السيارات',
    primary_color: '#3b82f6',
  };
  
  data?.forEach(row => {
    if (row.key === 'app_name') settings.app_name = row.value || settings.app_name;
    if (row.key === 'app_subtitle') settings.app_subtitle = row.value || settings.app_subtitle;
    if (row.key === 'primary_color') settings.primary_color = row.value || settings.primary_color;
  });
  
  return settings;
}

export async function updateAppSetting(key: string, value: string) {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value }, { onConflict: 'key' });
  
  if (error) throw error;
}

export async function resetDatabase() {
  // Delete sales first (has foreign keys to cars and customers)
  const { error: salesError } = await supabase
    .from('sales')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (salesError) throw salesError;

  // Delete cars (has foreign key to suppliers)
  const { error: carsError } = await supabase
    .from('cars')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (carsError) throw carsError;

  // Delete customers
  const { error: customersError } = await supabase
    .from('customers')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (customersError) throw customersError;

  // Delete suppliers
  const { error: suppliersError } = await supabase
    .from('suppliers')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (suppliersError) throw suppliersError;
}
