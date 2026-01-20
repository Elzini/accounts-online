import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, BookOpen, ToggleLeft, Settings2 } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';

interface AccountCategory {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface AccountingSettings {
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
  vat_recoverable_account_id: string | null;
  vat_settlement_account_id: string | null;
  purchase_cash_account_id: string | null;
  purchase_inventory_account_id: string | null;
  suppliers_account_id: string | null;
  expense_cash_account_id: string | null;
  expense_account_id: string | null;
}

const defaultSettings: Omit<AccountingSettings, 'company_id'> = {
  auto_journal_entries_enabled: true,
  auto_sales_entries: true,
  auto_purchase_entries: true,
  auto_expense_entries: true,
  sales_cash_account_id: null,
  sales_revenue_account_id: null,
  cogs_account_id: null,
  inventory_account_id: null,
  vat_payable_account_id: null,
  vat_recoverable_account_id: null,
  vat_settlement_account_id: null,
  purchase_cash_account_id: null,
  purchase_inventory_account_id: null,
  suppliers_account_id: null,
  expense_cash_account_id: null,
  expense_account_id: null,
};

// Account mapping configuration with ZATCA compliant suggested accounts for car dealerships
const accountMappings = [
  { 
    label: 'حساب الصندوق',
    salesKey: 'sales_cash_account_id',
    purchaseKey: 'purchase_cash_account_id',
    types: ['assets'],
    suggestedCode: '1101',
    suggestedName: 'الصندوق الرئيسي',
  },
  { 
    label: 'حساب إيرادات المبيعات',
    salesKey: 'sales_revenue_account_id',
    purchaseKey: null,
    types: ['revenue'],
    suggestedCode: '4101',
    suggestedName: 'مبيعات السيارات الجديدة',
  },
  { 
    label: 'حساب المخزون',
    salesKey: 'inventory_account_id',
    purchaseKey: 'purchase_inventory_account_id',
    types: ['assets'],
    suggestedCode: '1301',
    suggestedName: 'مخزون السيارات',
  },
  { 
    label: 'تكلفة البضاعة المباعة',
    salesKey: 'cogs_account_id',
    purchaseKey: null,
    types: ['expenses'],
    suggestedCode: '5101',
    suggestedName: 'تكلفة السيارات المباعة',
  },
  { 
    label: 'حساب الموردين',
    salesKey: null,
    purchaseKey: 'suppliers_account_id',
    types: ['liabilities'],
    suggestedCode: '2101',
    suggestedName: 'الموردون',
  },
];

// VAT account mappings according to ZATCA requirements
const vatAccountMappings = [
  { 
    label: 'ضريبة القيمة المضافة المستحقة',
    description: 'Output VAT - على المبيعات (15%)',
    key: 'vat_payable_account_id',
    types: ['liabilities'],
    suggestedCode: '2201',
    suggestedName: 'ضريبة القيمة المضافة المستحقة',
  },
  { 
    label: 'ضريبة القيمة المضافة المستردة',
    description: 'Input VAT - على المشتريات (15%)',
    key: 'vat_recoverable_account_id',
    types: ['liabilities'],
    suggestedCode: '2202',
    suggestedName: 'ضريبة القيمة المضافة المستردة',
  },
  { 
    label: 'حساب تسوية ضريبة القيمة المضافة',
    description: 'VAT Settlement - تسوية الضريبة مع هيئة الزكاة',
    key: 'vat_settlement_account_id',
    types: ['liabilities'],
    suggestedCode: '2203',
    suggestedName: 'حساب تسوية ضريبة القيمة المضافة',
  },
];

// Expense account mappings
const expenseAccountMappings = [
  { 
    label: 'حساب الصندوق (المصروفات)',
    key: 'expense_cash_account_id',
    types: ['assets'],
    suggestedCode: '1101',
    suggestedName: 'الصندوق الرئيسي',
  },
  { 
    label: 'حساب المصروفات الافتراضي',
    key: 'expense_account_id',
    types: ['expenses'],
    suggestedCode: '5405',
    suggestedName: 'مصروفات متنوعة',
  },
];

export function CompanyAccountingSettingsTab() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<AccountingSettings>({
    ...defaultSettings,
    company_id: companyId || '',
  });

  // Fetch company accounts
  const { data: accounts = [] } = useQuery({
    queryKey: ['company-accounts', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_categories')
        .select('id, code, name, type')
        .eq('company_id', companyId!)
        .order('code');
      
      if (error) throw error;
      return data as AccountCategory[];
    },
    enabled: !!companyId,
  });

  // Fetch existing settings
  const { data: existingSettings, isLoading } = useQuery({
    queryKey: ['company-accounting-settings', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_accounting_settings')
        .select('*')
        .eq('company_id', companyId!)
        .maybeSingle();
      
      if (error) throw error;
      return data as AccountingSettings | null;
    },
    enabled: !!companyId,
  });

  // Update form when settings load
  useEffect(() => {
    if (existingSettings) {
      setFormData(existingSettings);
    } else if (companyId) {
      setFormData({ ...defaultSettings, company_id: companyId });
    }
  }, [existingSettings, companyId]);

  // Save settings mutation
  const saveSettings = useMutation({
    mutationFn: async (settings: AccountingSettings) => {
      if (existingSettings?.id) {
        const { error } = await supabase
          .from('company_accounting_settings')
          .update({
            auto_journal_entries_enabled: settings.auto_journal_entries_enabled,
            auto_sales_entries: settings.auto_sales_entries,
            auto_purchase_entries: settings.auto_purchase_entries,
            auto_expense_entries: settings.auto_expense_entries,
            sales_cash_account_id: settings.sales_cash_account_id,
            sales_revenue_account_id: settings.sales_revenue_account_id,
            cogs_account_id: settings.cogs_account_id,
            inventory_account_id: settings.inventory_account_id,
            vat_payable_account_id: settings.vat_payable_account_id,
            vat_recoverable_account_id: settings.vat_recoverable_account_id,
            vat_settlement_account_id: settings.vat_settlement_account_id,
            purchase_cash_account_id: settings.purchase_cash_account_id,
            purchase_inventory_account_id: settings.purchase_inventory_account_id,
            suppliers_account_id: settings.suppliers_account_id,
            expense_cash_account_id: settings.expense_cash_account_id,
            expense_account_id: settings.expense_account_id,
          })
          .eq('id', existingSettings.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_accounting_settings')
          .insert({
            company_id: settings.company_id,
            auto_journal_entries_enabled: settings.auto_journal_entries_enabled,
            auto_sales_entries: settings.auto_sales_entries,
            auto_purchase_entries: settings.auto_purchase_entries,
            auto_expense_entries: settings.auto_expense_entries,
            sales_cash_account_id: settings.sales_cash_account_id,
            sales_revenue_account_id: settings.sales_revenue_account_id,
            cogs_account_id: settings.cogs_account_id,
            inventory_account_id: settings.inventory_account_id,
            vat_payable_account_id: settings.vat_payable_account_id,
            vat_recoverable_account_id: settings.vat_recoverable_account_id,
            vat_settlement_account_id: settings.vat_settlement_account_id,
            purchase_cash_account_id: settings.purchase_cash_account_id,
            purchase_inventory_account_id: settings.purchase_inventory_account_id,
            suppliers_account_id: settings.suppliers_account_id,
            expense_cash_account_id: settings.expense_cash_account_id,
            expense_account_id: settings.expense_account_id,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-accounting-settings', companyId] });
      toast.success('تم حفظ إعدادات القيود بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    },
  });

  const handleSave = () => {
    saveSettings.mutate(formData);
  };

  const getAccountsByType = (types: string[]) => {
    return accounts.filter(a => types.includes(a.type));
  };

  const getAccountDisplay = (accountId: string | null) => {
    if (!accountId) return null;
    const account = accounts.find(a => a.id === accountId);
    return account ? `${account.code}` : null;
  };

  // Find account by suggested code
  const findAccountByCode = (suggestedCode: string) => {
    return accounts.find(a => a.code === suggestedCode);
  };

  // Get display name for suggested account
  const getSuggestedAccountDisplay = (suggestedCode: string, suggestedName: string) => {
    const account = findAccountByCode(suggestedCode);
    if (account) {
      return `${account.code} - ${account.name}`;
    }
    return `${suggestedCode} - ${suggestedName}`;
  };

  const renderAccountSelect = (
    value: string | null,
    onChange: (value: string | null) => void,
    types: string[],
    disabled?: boolean,
    suggestedCode?: string,
    suggestedName?: string
  ) => {
    const filteredAccounts = getAccountsByType(types);
    const selectedCode = getAccountDisplay(value);
    const suggestedAccount = suggestedCode ? findAccountByCode(suggestedCode) : null;
    const displayPlaceholder = suggestedCode && suggestedName 
      ? getSuggestedAccountDisplay(suggestedCode, suggestedName)
      : 'اختر الحساب';
    
    return (
      <div className="flex items-center gap-2">
        <Select 
          value={value || 'default'} 
          onValueChange={(v) => {
            if (v === 'default') {
              // If selecting default and there's a suggested account, use it
              if (suggestedAccount) {
                onChange(suggestedAccount.id);
              } else {
                onChange(null);
              }
            } else {
              onChange(v);
            }
          }}
          disabled={disabled}
        >
          <SelectTrigger className="w-full h-9 text-sm">
            <SelectValue placeholder={displayPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {suggestedAccount && (
              <SelectItem value="default" className="text-primary font-medium">
                ✓ {suggestedAccount.code} - {suggestedAccount.name} (مقترح)
              </SelectItem>
            )}
            {filteredAccounts.map(account => (
              <SelectItem key={account.id} value={account.id}>
                {account.code} - {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCode && (
          <span className="text-xs font-mono bg-muted px-2 py-1 rounded min-w-[60px] text-center">
            {selectedCode}
          </span>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ToggleLeft className="w-5 h-5" />
            التحكم في توليد القيود
          </CardTitle>
          <CardDescription>
            تفعيل أو تعطيل توليد القيود المحاسبية التلقائية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Master Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label className="text-base font-semibold">توليد القيود التلقائي</Label>
                <p className="text-sm text-muted-foreground">تفعيل توليد قيود اليومية تلقائياً عند إجراء العمليات</p>
              </div>
            </div>
            <Switch
              checked={formData.auto_journal_entries_enabled}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, auto_journal_entries_enabled: checked })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sales Toggle */}
            <div className={`flex items-center justify-between p-4 rounded-lg border ${!formData.auto_journal_entries_enabled ? 'opacity-50' : ''}`}>
              <div>
                <Label className="font-medium">قيود المبيعات</Label>
                <p className="text-sm text-muted-foreground">توليد قيد تلقائي عند كل عملية بيع</p>
              </div>
              <Switch
                checked={formData.auto_sales_entries}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, auto_sales_entries: checked })
                }
                disabled={!formData.auto_journal_entries_enabled}
              />
            </div>

            {/* Purchase Toggle */}
            <div className={`flex items-center justify-between p-4 rounded-lg border ${!formData.auto_journal_entries_enabled ? 'opacity-50' : ''}`}>
              <div>
                <Label className="font-medium">قيود المشتريات</Label>
                <p className="text-sm text-muted-foreground">توليد قيد تلقائي عند كل عملية شراء</p>
              </div>
              <Switch
                checked={formData.auto_purchase_entries}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, auto_purchase_entries: checked })
                }
                disabled={!formData.auto_journal_entries_enabled}
              />
            </div>

            {/* Expense Toggle */}
            <div className={`flex items-center justify-between p-4 rounded-lg border ${!formData.auto_journal_entries_enabled ? 'opacity-50' : ''}`}>
              <div>
                <Label className="font-medium">قيود المصروفات</Label>
                <p className="text-sm text-muted-foreground">توليد قيد تلقائي عند كل عملية صرف</p>
              </div>
              <Switch
                checked={formData.auto_expense_entries}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, auto_expense_entries: checked })
                }
                disabled={!formData.auto_journal_entries_enabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Mapping Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            تخصيص الحسابات المستخدمة في القيود
          </CardTitle>
          <CardDescription>
            اختر الحسابات التي ستستخدم في توليد القيود المحاسبية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-3 bg-muted/50 border-b">
              <div className="p-3 text-center font-semibold border-l">الوصف</div>
              <div className="p-3 text-center font-semibold border-l text-success">حسابات المبيعات</div>
              <div className="p-3 text-center font-semibold text-primary">حسابات المشتريات</div>
            </div>

            {/* Account Rows */}
            {accountMappings.map((mapping, index) => (
              <div 
                key={mapping.label} 
                className={`grid grid-cols-3 ${index !== accountMappings.length - 1 ? 'border-b' : ''}`}
              >
                {/* Label */}
                <div className="p-3 bg-muted/20 border-l flex items-center">
                  <div>
                    <span className="text-sm font-medium block">{mapping.label}</span>
                    <span className="text-xs text-muted-foreground">{mapping.suggestedCode} - {mapping.suggestedName}</span>
                  </div>
                </div>
                
                {/* Sales Account */}
                <div className="p-2 border-l">
                  {mapping.salesKey ? (
                    renderAccountSelect(
                      formData[mapping.salesKey as keyof AccountingSettings] as string | null,
                      (v) => setFormData({ ...formData, [mapping.salesKey as string]: v }),
                      mapping.types,
                      !formData.auto_sales_entries,
                      mapping.suggestedCode,
                      mapping.suggestedName
                    )
                  ) : (
                    <div className="h-9 flex items-center justify-center text-muted-foreground text-sm">
                      —
                    </div>
                  )}
                </div>
                
                {/* Purchase Account */}
                <div className="p-2">
                  {mapping.purchaseKey ? (
                    renderAccountSelect(
                      formData[mapping.purchaseKey as keyof AccountingSettings] as string | null,
                      (v) => setFormData({ ...formData, [mapping.purchaseKey as string]: v }),
                      mapping.types,
                      !formData.auto_purchase_entries,
                      mapping.suggestedCode,
                      mapping.suggestedName
                    )
                  ) : (
                    <div className="h-9 flex items-center justify-center text-muted-foreground text-sm">
                      —
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* VAT Accounts Section - ZATCA Compliant */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-3 text-emerald-600 flex items-center gap-2">
              <span>🏛️</span> حسابات ضريبة القيمة المضافة (ZATCA)
            </h4>
            <div className="border rounded-lg overflow-hidden border-emerald-200">
              <div className="grid grid-cols-2 bg-emerald-50 dark:bg-emerald-950/20 border-b">
                <div className="p-3 text-center font-semibold border-l">الوصف</div>
                <div className="p-3 text-center font-semibold text-emerald-600">الحساب</div>
              </div>
              {vatAccountMappings.map((mapping, index) => (
                <div 
                  key={mapping.label} 
                  className={`grid grid-cols-2 ${index !== vatAccountMappings.length - 1 ? 'border-b' : ''}`}
                >
                  <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border-l flex items-center">
                    <div>
                      <span className="text-sm font-medium block">{mapping.label}</span>
                      <span className="text-xs text-muted-foreground">{mapping.description}</span>
                      <span className="text-xs text-emerald-600 block">{mapping.suggestedCode} - {mapping.suggestedName}</span>
                    </div>
                  </div>
                  <div className="p-2">
                    {renderAccountSelect(
                      formData[mapping.key as keyof AccountingSettings] as string | null,
                      (v) => setFormData({ ...formData, [mapping.key]: v }),
                      mapping.types,
                      false,
                      mapping.suggestedCode,
                      mapping.suggestedName
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
              💡 وفقاً لمتطلبات هيئة الزكاة والضريبة والجمارك (ZATCA): نسبة الضريبة 15% - يتم احتساب صافي الضريبة = المستحقة - المستردة
            </p>
          </div>

          {/* Expense Accounts Section */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-3 text-amber-600 flex items-center gap-2">
              <span>📋</span> حسابات المصروفات
            </h4>
            <div className="border rounded-lg overflow-hidden border-amber-200">
              <div className="grid grid-cols-2 bg-amber-50 dark:bg-amber-950/20 border-b">
                <div className="p-3 text-center font-semibold border-l">الوصف</div>
                <div className="p-3 text-center font-semibold text-amber-600">الحساب</div>
              </div>
              {expenseAccountMappings.map((mapping, index) => (
                <div 
                  key={mapping.label} 
                  className={`grid grid-cols-2 ${index !== expenseAccountMappings.length - 1 ? 'border-b' : ''}`}
                >
                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border-l flex items-center">
                    <div>
                      <span className="text-sm font-medium block">{mapping.label}</span>
                      <span className="text-xs text-muted-foreground">{mapping.suggestedCode} - {mapping.suggestedName}</span>
                    </div>
                  </div>
                  <div className="p-2">
                    {renderAccountSelect(
                      formData[mapping.key as keyof AccountingSettings] as string | null,
                      (v) => setFormData({ ...formData, [mapping.key]: v }),
                      mapping.types,
                      !formData.auto_expense_entries,
                      mapping.suggestedCode,
                      mapping.suggestedName
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {accounts.length === 0 && (
            <div className="text-center p-4 mt-4 bg-warning/10 rounded-lg border border-warning/20">
              <p className="text-warning font-medium">لا توجد حسابات محاسبية</p>
              <p className="text-sm text-muted-foreground mt-1">
                يجب إنشاء دليل الحسابات أولاً لتخصيص الحسابات
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveSettings.isPending} size="lg">
          {saveSettings.isPending ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 ml-2" />
              حفظ الإعدادات
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
