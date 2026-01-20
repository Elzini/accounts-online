import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
import { Loader2, Save, Settings2, Building2, BookOpen, DollarSign, ShoppingCart } from 'lucide-react';

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

  const renderAccountSelect = (
    label: string,
    value: string | null,
    onChange: (value: string | null) => void,
    types: string[]
  ) => {
    const filteredAccounts = getAccountsByType(types);
    
    return (
      <div className="space-y-2">
        <Label className="text-sm">{label}</Label>
        <Select 
          value={value || 'default'} 
          onValueChange={(v) => onChange(v === 'default' ? null : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="حساب افتراضي" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">حساب افتراضي (تلقائي)</SelectItem>
            {filteredAccounts.map(account => (
              <SelectItem key={account.id} value={account.id}>
                {account.code} - {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" dir="rtl">
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
          <div className="space-y-6 py-4">
            {/* Master Controls */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  التحكم في توليد القيود
                </CardTitle>
                <CardDescription>
                  تفعيل أو تعطيل توليد القيود المحاسبية التلقائية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div>
                    <Label className="text-base font-medium">توليد القيود التلقائي</Label>
                    <p className="text-sm text-muted-foreground">تفعيل توليد قيود اليومية تلقائياً</p>
                  </div>
                  <Switch
                    checked={formData.auto_journal_entries_enabled}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, auto_journal_entries_enabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
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

                <div className="flex items-center justify-between p-3 rounded-lg border">
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
              </CardContent>
            </Card>

            {/* Sales Accounts */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  حسابات المبيعات
                </CardTitle>
                <CardDescription>
                  تخصيص الحسابات المستخدمة في قيود المبيعات
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {renderAccountSelect(
                  'حساب النقدية / البنك',
                  formData.sales_cash_account_id,
                  (v) => setFormData({ ...formData, sales_cash_account_id: v }),
                  ['assets']
                )}
                {renderAccountSelect(
                  'حساب إيرادات المبيعات',
                  formData.sales_revenue_account_id,
                  (v) => setFormData({ ...formData, sales_revenue_account_id: v }),
                  ['revenue']
                )}
                {renderAccountSelect(
                  'حساب تكلفة البضاعة المباعة',
                  formData.cogs_account_id,
                  (v) => setFormData({ ...formData, cogs_account_id: v }),
                  ['expenses']
                )}
                {renderAccountSelect(
                  'حساب المخزون',
                  formData.inventory_account_id,
                  (v) => setFormData({ ...formData, inventory_account_id: v }),
                  ['assets']
                )}
                {renderAccountSelect(
                  'حساب ضريبة القيمة المضافة المستحقة',
                  formData.vat_payable_account_id,
                  (v) => setFormData({ ...formData, vat_payable_account_id: v }),
                  ['liabilities']
                )}
              </CardContent>
            </Card>

            {/* Purchase Accounts */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  حسابات المشتريات
                </CardTitle>
                <CardDescription>
                  تخصيص الحسابات المستخدمة في قيود المشتريات
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {renderAccountSelect(
                  'حساب النقدية / البنك',
                  formData.purchase_cash_account_id,
                  (v) => setFormData({ ...formData, purchase_cash_account_id: v }),
                  ['assets']
                )}
                {renderAccountSelect(
                  'حساب المخزون',
                  formData.purchase_inventory_account_id,
                  (v) => setFormData({ ...formData, purchase_inventory_account_id: v }),
                  ['assets']
                )}
                {renderAccountSelect(
                  'حساب الموردين',
                  formData.suppliers_account_id,
                  (v) => setFormData({ ...formData, suppliers_account_id: v }),
                  ['liabilities']
                )}
                {renderAccountSelect(
                  'حساب ضريبة القيمة المضافة المستردة',
                  formData.vat_recoverable_account_id,
                  (v) => setFormData({ ...formData, vat_recoverable_account_id: v }),
                  ['liabilities', 'assets']
                )}
              </CardContent>
            </Card>

            {accounts.length === 0 && (
              <div className="text-center p-4 bg-warning/10 rounded-lg border border-warning/20">
                <p className="text-warning font-medium">لا توجد حسابات محاسبية لهذه الشركة</p>
                <p className="text-sm text-muted-foreground mt-1">
                  يجب إنشاء دليل الحسابات أولاً لتخصيص الحسابات
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
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
