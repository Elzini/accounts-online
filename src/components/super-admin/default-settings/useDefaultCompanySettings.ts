/**
 * Hook for Default Company Settings logic
 * Extracted from DefaultCompanySettings.tsx (817 lines → hook + 4 tabs)
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/hooks/modules/useSuperAdminServices';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface DefaultSetting {
  id: string;
  setting_type: string;
  setting_key: string;
  setting_value: string | null;
}

export interface InvoiceSettings {
  template: 'modern' | 'classic' | 'minimal';
  primary_color: string;
  show_logo: boolean;
  show_qr: boolean;
  show_terms: boolean;
  terms_text: string;
  footer_text: string;
  logo_position: 'right' | 'left' | 'center';
  qr_position: 'right' | 'left' | 'center';
  seller_position: 'top' | 'bottom';
  buyer_position: 'top' | 'bottom';
  seller_title: string;
  buyer_title: string;
}

export const defaultInvoiceSettings: InvoiceSettings = {
  template: 'modern',
  primary_color: '#10b981',
  show_logo: true,
  show_qr: true,
  show_terms: true,
  terms_text: 'الأسعار شاملة ضريبة القيمة المضافة 15%',
  footer_text: 'شكراً لتعاملكم معنا',
  logo_position: 'right',
  qr_position: 'left',
  seller_position: 'top',
  buyer_position: 'bottom',
  seller_title: 'معلومات البائع',
  buyer_title: 'معلومات المشتري',
};

export function useDefaultCompanySettings() {
  const queryClient = useQueryClient();

  const { data: defaultSettings = [], isLoading } = useQuery({
    queryKey: ['default-company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('default_company_settings')
        .select('*')
        .order('setting_type', { ascending: true });
      if (error) throw error;
      return data as DefaultSetting[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // App settings
  const [appName, setAppName] = useState('');
  const [appSubtitle, setAppSubtitle] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [dashboardTitle, setDashboardTitle] = useState('');
  const [purchasesTitle, setPurchasesTitle] = useState('');
  const [salesTitle, setSalesTitle] = useState('');
  const [customersTitle, setCustomersTitle] = useState('');
  const [suppliersTitle, setSuppliersTitle] = useState('');
  const [reportsTitle, setReportsTitle] = useState('');

  // Tax settings
  const [taxName, setTaxName] = useState('');
  const [taxRate, setTaxRate] = useState('15');
  const [taxActive, setTaxActive] = useState(true);
  const [applyToSales, setApplyToSales] = useState(true);
  const [applyToPurchases, setApplyToPurchases] = useState(true);

  // Accounting settings
  const [autoJournalEnabled, setAutoJournalEnabled] = useState(true);
  const [autoSalesEntries, setAutoSalesEntries] = useState(true);
  const [autoPurchaseEntries, setAutoPurchaseEntries] = useState(true);
  const [autoExpenseEntries, setAutoExpenseEntries] = useState(true);

  // Invoice settings
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>(defaultInvoiceSettings);

  useEffect(() => {
    if (defaultSettings.length > 0) {
      const getValue = (type: string, key: string) => {
        const setting = defaultSettings.find(s => s.setting_type === type && s.setting_key === key);
        return setting?.setting_value || '';
      };
      setAppName(getValue('app_settings', 'app_name'));
      setAppSubtitle(getValue('app_settings', 'app_subtitle'));
      setWelcomeMessage(getValue('app_settings', 'welcome_message'));
      setDashboardTitle(getValue('app_settings', 'dashboard_title'));
      setPurchasesTitle(getValue('app_settings', 'purchases_title'));
      setSalesTitle(getValue('app_settings', 'sales_title'));
      setCustomersTitle(getValue('app_settings', 'customers_title'));
      setSuppliersTitle(getValue('app_settings', 'suppliers_title'));
      setReportsTitle(getValue('app_settings', 'reports_title'));
      setTaxName(getValue('tax_settings', 'tax_name'));
      setTaxRate(getValue('tax_settings', 'tax_rate') || '15');
      setTaxActive(getValue('tax_settings', 'is_active') === 'true');
      setApplyToSales(getValue('tax_settings', 'apply_to_sales') === 'true');
      setApplyToPurchases(getValue('tax_settings', 'apply_to_purchases') === 'true');
      setAutoJournalEnabled(getValue('accounting_settings', 'auto_journal_entries_enabled') !== 'false');
      setAutoSalesEntries(getValue('accounting_settings', 'auto_sales_entries') !== 'false');
      setAutoPurchaseEntries(getValue('accounting_settings', 'auto_purchase_entries') !== 'false');
      setAutoExpenseEntries(getValue('accounting_settings', 'auto_expense_entries') !== 'false');
      const invoiceSettingsStr = getValue('invoice_settings', 'default_invoice_settings');
      if (invoiceSettingsStr) {
        try { setInvoiceSettings({ ...defaultInvoiceSettings, ...JSON.parse(invoiceSettingsStr) }); } catch {}
      }
    }
  }, [defaultSettings]);

  const updateSetting = useMutation({
    mutationFn: async ({ type, key, value }: { type: string; key: string; value: string }) => {
      const { error } = await supabase
        .from('default_company_settings')
        .upsert({ setting_type: type, setting_key: key, setting_value: value, updated_at: new Date().toISOString() }, { onConflict: 'setting_type,setting_key' });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['default-company-settings'] }); },
  });

  const saveBatch = async (settings: { type: string; key: string; value: string }[], successMsg: string) => {
    try {
      for (const s of settings) { await updateSetting.mutateAsync(s); }
      toast.success(successMsg);
    } catch { toast.error('حدث خطأ أثناء الحفظ'); }
  };

  const handleSaveAppSettings = () => saveBatch([
    { type: 'app_settings', key: 'app_name', value: appName },
    { type: 'app_settings', key: 'app_subtitle', value: appSubtitle },
    { type: 'app_settings', key: 'welcome_message', value: welcomeMessage },
    { type: 'app_settings', key: 'dashboard_title', value: dashboardTitle },
    { type: 'app_settings', key: 'purchases_title', value: purchasesTitle },
    { type: 'app_settings', key: 'sales_title', value: salesTitle },
    { type: 'app_settings', key: 'customers_title', value: customersTitle },
    { type: 'app_settings', key: 'suppliers_title', value: suppliersTitle },
    { type: 'app_settings', key: 'reports_title', value: reportsTitle },
  ], 'تم حفظ إعدادات التطبيق الافتراضية');

  const handleSaveTaxSettings = () => saveBatch([
    { type: 'tax_settings', key: 'tax_name', value: taxName },
    { type: 'tax_settings', key: 'tax_rate', value: taxRate },
    { type: 'tax_settings', key: 'is_active', value: String(taxActive) },
    { type: 'tax_settings', key: 'apply_to_sales', value: String(applyToSales) },
    { type: 'tax_settings', key: 'apply_to_purchases', value: String(applyToPurchases) },
  ], 'تم حفظ إعدادات الضريبة الافتراضية');

  const handleSaveAccountingSettings = () => saveBatch([
    { type: 'accounting_settings', key: 'auto_journal_entries_enabled', value: String(autoJournalEnabled) },
    { type: 'accounting_settings', key: 'auto_sales_entries', value: String(autoSalesEntries) },
    { type: 'accounting_settings', key: 'auto_purchase_entries', value: String(autoPurchaseEntries) },
    { type: 'accounting_settings', key: 'auto_expense_entries', value: String(autoExpenseEntries) },
  ], 'تم حفظ إعدادات القيود الافتراضية');

  const handleSaveInvoiceSettings = async () => {
    try {
      await updateSetting.mutateAsync({ type: 'invoice_settings', key: 'default_invoice_settings', value: JSON.stringify(invoiceSettings) });
      toast.success('تم حفظ إعدادات الفاتورة الافتراضية');
    } catch { toast.error('حدث خطأ أثناء الحفظ'); }
  };

  const applyToExisting = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('apply_defaults_to_existing_companies');
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast.success(`تم تطبيق الإعدادات على ${data?.companies_updated || 0} شركة بنجاح`);
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: () => { toast.error('حدث خطأ أثناء تطبيق الإعدادات'); },
  });

  return {
    isLoading, isSaving: updateSetting.isPending,
    // App
    appName, setAppName, appSubtitle, setAppSubtitle, welcomeMessage, setWelcomeMessage,
    dashboardTitle, setDashboardTitle, purchasesTitle, setPurchasesTitle,
    salesTitle, setSalesTitle, customersTitle, setCustomersTitle,
    suppliersTitle, setSuppliersTitle, reportsTitle, setReportsTitle,
    handleSaveAppSettings,
    // Tax
    taxName, setTaxName, taxRate, setTaxRate, taxActive, setTaxActive,
    applyToSales, setApplyToSales, applyToPurchases, setApplyToPurchases,
    handleSaveTaxSettings,
    // Accounting
    autoJournalEnabled, setAutoJournalEnabled, autoSalesEntries, setAutoSalesEntries,
    autoPurchaseEntries, setAutoPurchaseEntries, autoExpenseEntries, setAutoExpenseEntries,
    handleSaveAccountingSettings,
    // Invoice
    invoiceSettings, setInvoiceSettings, handleSaveInvoiceSettings,
    // Apply
    applyToExisting,
  };
}
