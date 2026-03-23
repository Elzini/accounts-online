import { supabase } from '@/hooks/modules/useMiscServices';
import { getCurrentCompanyId } from '@/services/companyContext';

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
  // Transfers section
  transfers_section_title: string;
  partner_dealerships_title: string;
  car_transfers_title: string;
  // Finance section
  finance_section_title: string;
  expenses_title: string;
  prepaid_expenses_title: string;
  quotations_title: string;
  installments_title: string;
  vouchers_title: string;
  financing_title: string;
  banking_title: string;
  // Reports
  inventory_report_title: string;
  profit_report_title: string;
  purchases_report_title: string;
  sales_report_title: string;
  customers_report_title: string;
  suppliers_report_title: string;
  commissions_report_title: string;
  transfers_report_title: string;
  partner_report_title: string;
  // Accounting section
  accounting_section_title: string;
  tax_settings_title: string;
  chart_of_accounts_title: string;
  journal_entries_title: string;
  general_ledger_title: string;
  financial_reports_title: string;
  // Admin section
  admin_section_title: string;
  users_management_title: string;
  app_settings_title: string;
  audit_logs_title: string;
  backups_title: string;
}

export const defaultSettings: AppSettings = {
  app_name: 'Elzini SaaS',
  app_subtitle: 'نظام محاسبي سحابي متكامل',
  primary_color: '#3b82f6',
  dashboard_title: 'الرئيسية',
  purchases_title: 'المشتريات',
  sales_title: 'المبيعات',
  customers_title: 'العملاء',
  suppliers_title: 'الموردين',
  reports_title: 'التقارير',
  welcome_message: 'مرحباً بك في Elzini SaaS',
  // Login page defaults
  login_title: 'Elzini SaaS',
  login_subtitle: 'نظام محاسبي سحابي متكامل',
  login_bg_color: 'hsl(222.2, 84%, 4.9%)',
  login_card_color: 'hsl(222.2, 84%, 6%)',
  login_header_gradient_start: 'hsl(221.2, 83.2%, 53.3%)',
  login_header_gradient_end: 'hsl(250, 95%, 65%)',
  login_button_text: 'تسجيل الدخول',
  signup_button_text: 'إنشاء حساب',
  login_switch_text: 'ليس لديك حساب؟ إنشاء حساب جديد',
  signup_switch_text: 'لديك حساب؟ تسجيل الدخول',
  login_logo_url: '',
  // Transfers section
  transfers_section_title: 'التحويلات',
  partner_dealerships_title: 'المعارض الشريكة',
  car_transfers_title: 'تحويلات السيارات',
  // Finance section
  finance_section_title: 'المالية',
  expenses_title: 'المصروفات',
  prepaid_expenses_title: 'المصروفات المقدمة',
  quotations_title: 'عروض الأسعار',
  installments_title: 'الأقساط',
  vouchers_title: 'سندات القبض والصرف',
  financing_title: 'شركات التمويل',
  banking_title: 'إدارة البنوك',
  // Reports
  inventory_report_title: 'تقرير المخزون',
  profit_report_title: 'تقرير الأرباح',
  purchases_report_title: 'تقرير المشتريات',
  sales_report_title: 'تقرير المبيعات',
  customers_report_title: 'تقرير العملاء',
  suppliers_report_title: 'تقرير الموردين',
  commissions_report_title: 'تقرير العمولات',
  transfers_report_title: 'تقرير التحويلات',
  partner_report_title: 'تقرير المعرض الشريك',
  // Accounting section
  accounting_section_title: 'المحاسبة',
  tax_settings_title: 'إعدادات الضريبة',
  chart_of_accounts_title: 'شجرة الحسابات',
  journal_entries_title: 'دفتر اليومية',
  general_ledger_title: 'دفتر الأستاذ',
  financial_reports_title: 'التقارير المالية',
  // Admin section
  admin_section_title: 'الإدارة',
  users_management_title: 'إدارة المستخدمين',
  app_settings_title: 'إعدادات النظام',
  audit_logs_title: 'سجل التدقيق',
  backups_title: 'النسخ الاحتياطي',
};


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
  
  // Check if setting already exists for this company
  const { data: existing } = await supabase
    .from('app_settings')
    .select('id')
    .eq('key', key)
    .eq('company_id', companyId)
    .maybeSingle();

  if (existing) {
    // Update existing setting
    const { error } = await supabase
      .from('app_settings')
      .update({ value })
      .eq('id', existing.id);
    
    if (error) throw error;
  } else {
    // Insert new setting
    const { error } = await supabase
      .from('app_settings')
      .insert({ key, value, company_id: companyId });
    
    if (error) throw error;
  }
}

export async function resetDatabase() {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('No company ID found');

  // Order matters: delete child tables first to respect foreign key constraints
  const tablesToDelete = [
    'car_transfers',    // references cars, sales
    'checks',           // references customers, suppliers
    'vouchers',         // references customers, suppliers
    'installments',     // references sales
    'sales',            // references cars, customers
    'expenses',         // references suppliers
    'cars',             // references suppliers
    'customers',
    'suppliers',
  ];

  for (const table of tablesToDelete) {
    try {
      const { error } = await supabase
        .from(table as any)
        .delete()
        .eq('company_id', companyId);
      
      if (error) {
        console.warn(`Warning deleting from ${table}:`, error.message);
        // Continue with other tables even if one fails
      }
    } catch (e) {
      console.warn(`Skipping table ${table}:`, e);
    }
  }
}
