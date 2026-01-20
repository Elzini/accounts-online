import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, Settings2, Building2, ToggleLeft, BookOpen } from 'lucide-react';

interface CompanyAccountingSettingsProps {
  companyId: string;
  companyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
  sales_cash_account_id: string | null;
  sales_revenue_account_id: string | null;
  cogs_account_id: string | null;
  inventory_account_id: string | null;
  vat_payable_account_id: string | null;
  purchase_cash_account_id: string | null;
  purchase_inventory_account_id: string | null;
  vat_recoverable_account_id: string | null;
  suppliers_account_id: string | null;
}

const defaultSettings: Omit<AccountingSettings, 'company_id'> = {
  auto_journal_entries_enabled: true,
  auto_sales_entries: true,
  auto_purchase_entries: true,
  sales_cash_account_id: null,
  sales_revenue_account_id: null,
  cogs_account_id: null,
  inventory_account_id: null,
  vat_payable_account_id: null,
  purchase_cash_account_id: null,
  purchase_inventory_account_id: null,
  vat_recoverable_account_id: null,
  suppliers_account_id: null,
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
  { 
    label: 'ضريبة القيمة المضافة المستردة',
    salesKey: null,
    purchaseKey: 'vat_recoverable_account_id',
    types: ['liabilities'],
    suggestedCode: '2202',
    suggestedName: 'ضريبة القيمة المضافة المستردة',
  },
  { 
    label: 'ضريبة القيمة المضافة المستحقة',
    salesKey: 'vat_payable_account_id',
    purchaseKey: null,
    types: ['liabilities'],
    suggestedCode: '2201',
    suggestedName: 'ضريبة القيمة المضافة المستحقة',
  },
];

export function CompanyAccountingSettings({ 
  companyId, 
  companyName, 
  open, 
  onOpenChange 
}: CompanyAccountingSettingsProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<AccountingSettings>({
    ...defaultSettings,
    company_id: companyId,
  });

  // Fetch company accounts
  const { data: accounts = [] } = useQuery({
    queryKey: ['company-accounts', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_categories')
        .select('id, code, name, type')
        .eq('company_id', companyId)
        .order('code');
      
      if (error) throw error;
      return data as AccountCategory[];
    },
    enabled: open && !!companyId,
  });

  // Fetch existing settings
  const { data: existingSettings, isLoading } = useQuery({
    queryKey: ['company-accounting-settings', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_accounting_settings')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();
      
      if (error) throw error;
      return data as AccountingSettings | null;
    },
    enabled: open && !!companyId,
  });

  // Update form when settings load
  useEffect(() => {
    if (existingSettings) {
      setFormData(existingSettings);
    } else {
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
            sales_cash_account_id: settings.sales_cash_account_id,
            sales_revenue_account_id: settings.sales_revenue_account_id,
            cogs_account_id: settings.cogs_account_id,
            inventory_account_id: settings.inventory_account_id,
            vat_payable_account_id: settings.vat_payable_account_id,
            purchase_cash_account_id: settings.purchase_cash_account_id,
            purchase_inventory_account_id: settings.purchase_inventory_account_id,
            vat_recoverable_account_id: settings.vat_recoverable_account_id,
            suppliers_account_id: settings.suppliers_account_id,
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
            sales_cash_account_id: settings.sales_cash_account_id,
            sales_revenue_account_id: settings.sales_revenue_account_id,
            cogs_account_id: settings.cogs_account_id,
            inventory_account_id: settings.inventory_account_id,
            vat_payable_account_id: settings.vat_payable_account_id,
            purchase_cash_account_id: settings.purchase_cash_account_id,
            purchase_inventory_account_id: settings.purchase_inventory_account_id,
            vat_recoverable_account_id: settings.vat_recoverable_account_id,
            suppliers_account_id: settings.suppliers_account_id,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-accounting-settings', companyId] });
      toast.success('تم حفظ إعدادات القيود بنجاح');
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            إعدادات القيود المحاسبية
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            {companyName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="accounts" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="accounts" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                تخصيص الحسابات
              </TabsTrigger>
              <TabsTrigger value="control" className="flex items-center gap-2">
                <ToggleLeft className="w-4 h-4" />
                التحكم في القيود
              </TabsTrigger>
            </TabsList>

            {/* Accounts Customization Tab */}
            <TabsContent value="accounts" className="space-y-4">
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

              {accounts.length === 0 && (
                <div className="text-center p-4 bg-warning/10 rounded-lg border border-warning/20">
                  <p className="text-warning font-medium">لا توجد حسابات محاسبية لهذه الشركة</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    يجب إنشاء دليل الحسابات أولاً لتخصيص الحسابات
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Control Tab */}
            <TabsContent value="control" className="space-y-4">
              <div className="space-y-3">
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

                {/* Sales Toggle */}
                <div className={`flex items-center justify-between p-4 rounded-lg border ${!formData.auto_journal_entries_enabled ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                      <span className="text-success text-lg">💰</span>
                    </div>
                    <div>
                      <Label className="font-medium">قيود المبيعات</Label>
                      <p className="text-sm text-muted-foreground">توليد قيد محاسبي تلقائي عند كل عملية بيع</p>
                    </div>
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
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-lg">🛒</span>
                    </div>
                    <div>
                      <Label className="font-medium">قيود المشتريات</Label>
                      <p className="text-sm text-muted-foreground">توليد قيد محاسبي تلقائي عند كل عملية شراء</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.auto_purchase_entries}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, auto_purchase_entries: checked })
                    }
                    disabled={!formData.auto_journal_entries_enabled}
                  />
                </div>

                {/* Status Summary */}
                <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
                  <h4 className="font-medium mb-3">ملخص الحالة</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className={`p-3 rounded-lg ${formData.auto_journal_entries_enabled ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      <div className="text-lg font-bold">{formData.auto_journal_entries_enabled ? '✓' : '✗'}</div>
                      <div className="text-xs">النظام العام</div>
                    </div>
                    <div className={`p-3 rounded-lg ${formData.auto_sales_entries && formData.auto_journal_entries_enabled ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      <div className="text-lg font-bold">{formData.auto_sales_entries && formData.auto_journal_entries_enabled ? '✓' : '✗'}</div>
                      <div className="text-xs">قيود المبيعات</div>
                    </div>
                    <div className={`p-3 rounded-lg ${formData.auto_purchase_entries && formData.auto_journal_entries_enabled ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      <div className="text-lg font-bold">{formData.auto_purchase_entries && formData.auto_journal_entries_enabled ? '✓' : '✗'}</div>
                      <div className="text-xs">قيود المشتريات</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={saveSettings.isPending}>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}