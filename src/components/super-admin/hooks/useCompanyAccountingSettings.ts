/**
 * Company Accounting Settings - Logic Hook
 * Extracted from CompanyAccountingSettings.tsx (669 lines)
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/hooks/modules/useSuperAdminServices';
import { toast } from 'sonner';

interface AccountCategory { id: string; code: string; name: string; type: string; }

export interface AccountingSettings {
  id?: string;
  company_id: string;
  auto_journal_entries_enabled: boolean;
  auto_sales_entries: boolean;
  auto_purchase_entries: boolean;
  auto_expense_entries: boolean;
  sales_cash_account_id: string | null;
  sales_revenue_account_id: string | null;
  cogs_account_id: string | null;
  inventory_account_id: string | null;
  vat_payable_account_id: string | null;
  purchase_cash_account_id: string | null;
  purchase_inventory_account_id: string | null;
  vat_recoverable_account_id: string | null;
  suppliers_account_id: string | null;
  expense_cash_account_id: string | null;
  expense_account_id: string | null;
}

const defaultSettings: Omit<AccountingSettings, 'company_id'> = {
  auto_journal_entries_enabled: true, auto_sales_entries: true, auto_purchase_entries: true, auto_expense_entries: true,
  sales_cash_account_id: null, sales_revenue_account_id: null, cogs_account_id: null, inventory_account_id: null,
  vat_payable_account_id: null, purchase_cash_account_id: null, purchase_inventory_account_id: null,
  vat_recoverable_account_id: null, suppliers_account_id: null, expense_cash_account_id: null, expense_account_id: null,
};

export const accountMappings = [
  { label: 'حساب الصندوق', salesKey: 'sales_cash_account_id', purchaseKey: 'purchase_cash_account_id', types: ['assets'], suggestedCode: '1101', suggestedName: 'الصندوق الرئيسي' },
  { label: 'حساب إيرادات المبيعات', salesKey: 'sales_revenue_account_id', purchaseKey: null, types: ['revenue'], suggestedCode: '4101', suggestedName: 'مبيعات السيارات الجديدة' },
  { label: 'حساب المخزون', salesKey: 'inventory_account_id', purchaseKey: 'purchase_inventory_account_id', types: ['assets'], suggestedCode: '1301', suggestedName: 'مخزون السيارات' },
  { label: 'تكلفة البضاعة المباعة', salesKey: 'cogs_account_id', purchaseKey: null, types: ['expenses'], suggestedCode: '5101', suggestedName: 'تكلفة السيارات المباعة' },
  { label: 'حساب الموردين', salesKey: null, purchaseKey: 'suppliers_account_id', types: ['liabilities'], suggestedCode: '2101', suggestedName: 'الموردون' },
];

export const vatAccountMappings = [
  { label: 'ضريبة القيمة المضافة المستحقة', description: 'Output VAT - على المبيعات (15%)', key: 'vat_payable_account_id', types: ['liabilities'], suggestedCode: '2201', suggestedName: 'ضريبة القيمة المضافة المستحقة' },
  { label: 'ضريبة القيمة المضافة المستردة', description: 'Input VAT - على المشتريات (15%)', key: 'vat_recoverable_account_id', types: ['liabilities'], suggestedCode: '2202', suggestedName: 'ضريبة القيمة المضافة المستردة' },
];

export const expenseAccountMappings = [
  { label: 'حساب الصندوق (المصروفات)', key: 'expense_cash_account_id', types: ['assets'], suggestedCode: '1101', suggestedName: 'الصندوق الرئيسي' },
  { label: 'حساب المصروفات الافتراضي', key: 'expense_account_id', types: ['expenses'], suggestedCode: '5405', suggestedName: 'مصروفات متنوعة' },
];

export function useCompanyAccountingSettings(companyId: string, open: boolean, onOpenChange: (o: boolean) => void) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<AccountingSettings>({ ...defaultSettings, company_id: companyId });

  const { data: accounts = [] } = useQuery({
    queryKey: ['company-accounts', companyId],
    queryFn: async () => { const { data, error } = await supabase.from('account_categories').select('id, code, name, type').eq('company_id', companyId).order('code'); if (error) throw error; return data as AccountCategory[]; },
    enabled: open && !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: existingSettings, isLoading } = useQuery({
    queryKey: ['company-accounting-settings', companyId],
    queryFn: async () => { const { data, error } = await supabase.from('company_accounting_settings').select('*').eq('company_id', companyId).maybeSingle(); if (error) throw error; return data as AccountingSettings | null; },
    enabled: open && !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (existingSettings) setFormData(existingSettings);
    else setFormData({ ...defaultSettings, company_id: companyId });
  }, [existingSettings, companyId]);

  const saveSettings = useMutation({
    mutationFn: async (settings: AccountingSettings) => {
      const payload = {
        auto_journal_entries_enabled: settings.auto_journal_entries_enabled, auto_sales_entries: settings.auto_sales_entries,
        auto_purchase_entries: settings.auto_purchase_entries, auto_expense_entries: settings.auto_expense_entries,
        sales_cash_account_id: settings.sales_cash_account_id, sales_revenue_account_id: settings.sales_revenue_account_id,
        cogs_account_id: settings.cogs_account_id, inventory_account_id: settings.inventory_account_id,
        vat_payable_account_id: settings.vat_payable_account_id, purchase_cash_account_id: settings.purchase_cash_account_id,
        purchase_inventory_account_id: settings.purchase_inventory_account_id, vat_recoverable_account_id: settings.vat_recoverable_account_id,
        suppliers_account_id: settings.suppliers_account_id, expense_cash_account_id: settings.expense_cash_account_id,
        expense_account_id: settings.expense_account_id,
      };
      if (existingSettings?.id) { const { error } = await supabase.from('company_accounting_settings').update(payload).eq('id', existingSettings.id); if (error) throw error; }
      else { const { error } = await supabase.from('company_accounting_settings').insert({ company_id: settings.company_id, ...payload }); if (error) throw error; }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['company-accounting-settings', companyId] }); toast.success('تم حفظ إعدادات القيود بنجاح'); onOpenChange(false); },
    onError: () => toast.error('حدث خطأ أثناء حفظ الإعدادات'),
  });

  const handleSave = () => saveSettings.mutate(formData);
  const getAccountsByType = (types: string[]) => accounts.filter(a => types.includes(a.type));
  const getAccountDisplay = (accountId: string | null) => { if (!accountId) return null; const a = accounts.find(x => x.id === accountId); return a ? a.code : null; };
  const findAccountByCode = (code: string) => accounts.find(a => a.code === code);
  const getSuggestedAccountDisplay = (code: string, name: string) => { const a = findAccountByCode(code); return a ? `${a.code} - ${a.name}` : `${code} - ${name}`; };

  return {
    formData, setFormData, accounts, isLoading, saveSettings, handleSave,
    getAccountsByType, getAccountDisplay, findAccountByCode, getSuggestedAccountDisplay,
  };
}
