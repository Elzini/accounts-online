import { supabase } from '@/integrations/supabase/client';

export interface AppSettings {
  app_name: string;
  app_subtitle: string;
  primary_color: string;
  dashboard_title: string;
  purchases_title: string;
  sales_title: string;
  customers_title: string;
  suppliers_title: string;
  reports_title: string;
  welcome_message: string;
}

export const defaultSettings: AppSettings = {
  app_name: 'أشبال النمر',
  app_subtitle: 'لتجارة السيارات',
  primary_color: '#3b82f6',
  dashboard_title: 'لوحة التحكم',
  purchases_title: 'المشتريات',
  sales_title: 'المبيعات',
  customers_title: 'العملاء',
  suppliers_title: 'الموردين',
  reports_title: 'التقارير',
  welcome_message: 'مرحباً بك في نظام إدارة معرض أشبال النمر للسيارات',
};

export async function fetchAppSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value');
  
  if (error) throw error;
  
  const settings: AppSettings = { ...defaultSettings };
  
  data?.forEach(row => {
    const key = row.key as keyof AppSettings;
    if (key in settings && row.value) {
      settings[key] = row.value;
    }
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
