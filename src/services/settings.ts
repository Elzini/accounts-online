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
  // Login page settings
  login_title: string;
  login_subtitle: string;
  login_bg_color: string;
  login_card_color: string;
  login_header_gradient_start: string;
  login_header_gradient_end: string;
  login_button_text: string;
  signup_button_text: string;
  login_switch_text: string;
  signup_switch_text: string;
  login_logo_url: string;
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
  // Login page defaults
  login_title: 'أشبال النمر',
  login_subtitle: 'نظام إدارة معرض السيارات',
  login_bg_color: 'hsl(222.2, 84%, 4.9%)',
  login_card_color: 'hsl(222.2, 84%, 6%)',
  login_header_gradient_start: 'hsl(221.2, 83.2%, 53.3%)',
  login_header_gradient_end: 'hsl(250, 95%, 65%)',
  login_button_text: 'تسجيل الدخول',
  signup_button_text: 'إنشاء حساب',
  login_switch_text: 'ليس لديك حساب؟ إنشاء حساب جديد',
  signup_switch_text: 'لديك حساب؟ تسجيل الدخول',
  login_logo_url: '',
};

// Helper function to get current user's company_id
async function getCurrentCompanyId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('user_id', user.id)
    .single();
  
  return profile?.company_id || null;
}

export async function uploadLoginLogo(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `login-logo-${Date.now()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('app-logos')
    .upload(fileName, file, { upsert: true });
  
  if (uploadError) throw uploadError;
  
  const { data } = supabase.storage
    .from('app-logos')
    .getPublicUrl(fileName);
  
  return data.publicUrl;
}

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
  const companyId = await getCurrentCompanyId();
  
  const { error } = await supabase
    .from('app_settings')
    .upsert({ 
      key, 
      value, 
      company_id: companyId 
    }, { 
      onConflict: 'key' 
    });
  
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
