import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, Settings, FileText, Calculator, Building2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface DefaultSetting {
  id: string;
  setting_type: string;
  setting_key: string;
  setting_value: string | null;
}

export function DefaultCompanySettings() {
  const queryClient = useQueryClient();

  // Fetch all default settings
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
  });

  // App settings state
  const [appName, setAppName] = useState('');
  const [appSubtitle, setAppSubtitle] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [dashboardTitle, setDashboardTitle] = useState('');
  const [purchasesTitle, setPurchasesTitle] = useState('');
  const [salesTitle, setSalesTitle] = useState('');
  const [customersTitle, setCustomersTitle] = useState('');
  const [suppliersTitle, setSuppliersTitle] = useState('');
  const [reportsTitle, setReportsTitle] = useState('');

  // Tax settings state
  const [taxName, setTaxName] = useState('');
  const [taxRate, setTaxRate] = useState('15');
  const [taxActive, setTaxActive] = useState(true);
  const [applyToSales, setApplyToSales] = useState(true);
  const [applyToPurchases, setApplyToPurchases] = useState(true);

  // Accounting settings state
  const [autoJournalEnabled, setAutoJournalEnabled] = useState(true);
  const [autoSalesEntries, setAutoSalesEntries] = useState(true);
  const [autoPurchaseEntries, setAutoPurchaseEntries] = useState(true);
  const [autoExpenseEntries, setAutoExpenseEntries] = useState(true);

  // Load settings into state
  useEffect(() => {
    if (defaultSettings.length > 0) {
      const getValue = (type: string, key: string) => {
        const setting = defaultSettings.find(s => s.setting_type === type && s.setting_key === key);
        return setting?.setting_value || '';
      };

      // App settings
      setAppName(getValue('app_settings', 'app_name'));
      setAppSubtitle(getValue('app_settings', 'app_subtitle'));
      setWelcomeMessage(getValue('app_settings', 'welcome_message'));
      setDashboardTitle(getValue('app_settings', 'dashboard_title'));
      setPurchasesTitle(getValue('app_settings', 'purchases_title'));
      setSalesTitle(getValue('app_settings', 'sales_title'));
      setCustomersTitle(getValue('app_settings', 'customers_title'));
      setSuppliersTitle(getValue('app_settings', 'suppliers_title'));
      setReportsTitle(getValue('app_settings', 'reports_title'));

      // Tax settings
      setTaxName(getValue('tax_settings', 'tax_name'));
      setTaxRate(getValue('tax_settings', 'tax_rate') || '15');
      setTaxActive(getValue('tax_settings', 'is_active') === 'true');
      setApplyToSales(getValue('tax_settings', 'apply_to_sales') === 'true');
      setApplyToPurchases(getValue('tax_settings', 'apply_to_purchases') === 'true');

      // Accounting settings
      setAutoJournalEnabled(getValue('accounting_settings', 'auto_journal_entries_enabled') !== 'false');
      setAutoSalesEntries(getValue('accounting_settings', 'auto_sales_entries') !== 'false');
      setAutoPurchaseEntries(getValue('accounting_settings', 'auto_purchase_entries') !== 'false');
      setAutoExpenseEntries(getValue('accounting_settings', 'auto_expense_entries') !== 'false');
    }
  }, [defaultSettings]);

  // Update mutation
  const updateSetting = useMutation({
    mutationFn: async ({ type, key, value }: { type: string; key: string; value: string }) => {
      const { error } = await supabase
        .from('default_company_settings')
        .upsert({
          setting_type: type,
          setting_key: key,
          setting_value: value,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'setting_type,setting_key',
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['default-company-settings'] });
    },
  });

  const handleSaveAppSettings = async () => {
    try {
      const settings = [
        { type: 'app_settings', key: 'app_name', value: appName },
        { type: 'app_settings', key: 'app_subtitle', value: appSubtitle },
        { type: 'app_settings', key: 'welcome_message', value: welcomeMessage },
        { type: 'app_settings', key: 'dashboard_title', value: dashboardTitle },
        { type: 'app_settings', key: 'purchases_title', value: purchasesTitle },
        { type: 'app_settings', key: 'sales_title', value: salesTitle },
        { type: 'app_settings', key: 'customers_title', value: customersTitle },
        { type: 'app_settings', key: 'suppliers_title', value: suppliersTitle },
        { type: 'app_settings', key: 'reports_title', value: reportsTitle },
      ];

      for (const s of settings) {
        await updateSetting.mutateAsync(s);
      }

      toast.success('تم حفظ إعدادات التطبيق الافتراضية');
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleSaveTaxSettings = async () => {
    try {
      const settings = [
        { type: 'tax_settings', key: 'tax_name', value: taxName },
        { type: 'tax_settings', key: 'tax_rate', value: taxRate },
        { type: 'tax_settings', key: 'is_active', value: String(taxActive) },
        { type: 'tax_settings', key: 'apply_to_sales', value: String(applyToSales) },
        { type: 'tax_settings', key: 'apply_to_purchases', value: String(applyToPurchases) },
      ];

      for (const s of settings) {
        await updateSetting.mutateAsync(s);
      }

      toast.success('تم حفظ إعدادات الضريبة الافتراضية');
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleSaveAccountingSettings = async () => {
    try {
      const settings = [
        { type: 'accounting_settings', key: 'auto_journal_entries_enabled', value: String(autoJournalEnabled) },
        { type: 'accounting_settings', key: 'auto_sales_entries', value: String(autoSalesEntries) },
        { type: 'accounting_settings', key: 'auto_purchase_entries', value: String(autoPurchaseEntries) },
        { type: 'accounting_settings', key: 'auto_expense_entries', value: String(autoExpenseEntries) },
      ];

      for (const s of settings) {
        await updateSetting.mutateAsync(s);
      }

      toast.success('تم حفظ إعدادات القيود الافتراضية');
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">الإعدادات الافتراضية للشركات الجديدة</h1>
          <p className="text-muted-foreground">هذه الإعدادات ستُطبق تلقائياً على كل شركة جديدة</p>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
        <p className="text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          أي تغييرات هنا ستُطبق فقط على الشركات الجديدة ولن تؤثر على الشركات الموجودة
        </p>
      </div>

      <Tabs defaultValue="app" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="app" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            إعدادات التطبيق
          </TabsTrigger>
          <TabsTrigger value="tax" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            إعدادات الضريبة
          </TabsTrigger>
          <TabsTrigger value="accounting" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            إعدادات القيود
          </TabsTrigger>
        </TabsList>

        {/* App Settings Tab */}
        <TabsContent value="app" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات التطبيق الافتراضية</CardTitle>
              <CardDescription>تسميات الأقسام ورسالة الترحيب</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم التطبيق</Label>
                  <Input
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="منصة إدارة المعارض"
                  />
                </div>
                <div className="space-y-2">
                  <Label>العنوان الفرعي</Label>
                  <Input
                    value={appSubtitle}
                    onChange={(e) => setAppSubtitle(e.target.value)}
                    placeholder="لتجارة السيارات"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>رسالة الترحيب</Label>
                <Input
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="مرحباً بك..."
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">تسميات الأقسام</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>لوحة التحكم</Label>
                    <Input
                      value={dashboardTitle}
                      onChange={(e) => setDashboardTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>المشتريات</Label>
                    <Input
                      value={purchasesTitle}
                      onChange={(e) => setPurchasesTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>المبيعات</Label>
                    <Input
                      value={salesTitle}
                      onChange={(e) => setSalesTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>العملاء</Label>
                    <Input
                      value={customersTitle}
                      onChange={(e) => setCustomersTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الموردين</Label>
                    <Input
                      value={suppliersTitle}
                      onChange={(e) => setSuppliersTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>التقارير</Label>
                    <Input
                      value={reportsTitle}
                      onChange={(e) => setReportsTitle(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveAppSettings} disabled={updateSetting.isPending}>
                {updateSetting.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <Save className="h-4 w-4 ml-2" />
                )}
                حفظ إعدادات التطبيق
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Settings Tab */}
        <TabsContent value="tax" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الضريبة الافتراضية</CardTitle>
              <CardDescription>نسبة وتفعيل ضريبة القيمة المضافة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم الضريبة</Label>
                  <Input
                    value={taxName}
                    onChange={(e) => setTaxName(e.target.value)}
                    placeholder="ضريبة القيمة المضافة"
                  />
                </div>
                <div className="space-y-2">
                  <Label>نسبة الضريبة (%)</Label>
                  <Input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    placeholder="15"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">تفعيل الضريبة</p>
                    <p className="text-sm text-muted-foreground">تفعيل احتساب الضريبة تلقائياً</p>
                  </div>
                  <Switch checked={taxActive} onCheckedChange={setTaxActive} />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">تطبيق على المبيعات</p>
                    <p className="text-sm text-muted-foreground">احتساب الضريبة على فواتير البيع</p>
                  </div>
                  <Switch checked={applyToSales} onCheckedChange={setApplyToSales} />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">تطبيق على المشتريات</p>
                    <p className="text-sm text-muted-foreground">احتساب الضريبة على فواتير الشراء</p>
                  </div>
                  <Switch checked={applyToPurchases} onCheckedChange={setApplyToPurchases} />
                </div>
              </div>

              <Button onClick={handleSaveTaxSettings} disabled={updateSetting.isPending}>
                {updateSetting.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <Save className="h-4 w-4 ml-2" />
                )}
                حفظ إعدادات الضريبة
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accounting Settings Tab */}
        <TabsContent value="accounting" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات القيود المحاسبية الافتراضية</CardTitle>
              <CardDescription>تفعيل إنشاء القيود تلقائياً</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">تفعيل القيود التلقائية</p>
                    <p className="text-sm text-muted-foreground">إنشاء قيود محاسبية تلقائياً عند العمليات</p>
                  </div>
                  <Switch checked={autoJournalEnabled} onCheckedChange={setAutoJournalEnabled} />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">قيود المبيعات</p>
                    <p className="text-sm text-muted-foreground">إنشاء قيد تلقائي عند كل عملية بيع</p>
                  </div>
                  <Switch 
                    checked={autoSalesEntries} 
                    onCheckedChange={setAutoSalesEntries}
                    disabled={!autoJournalEnabled}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">قيود المشتريات</p>
                    <p className="text-sm text-muted-foreground">إنشاء قيد تلقائي عند كل عملية شراء</p>
                  </div>
                  <Switch 
                    checked={autoPurchaseEntries} 
                    onCheckedChange={setAutoPurchaseEntries}
                    disabled={!autoJournalEnabled}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">قيود المصروفات</p>
                    <p className="text-sm text-muted-foreground">إنشاء قيد تلقائي عند كل مصروف</p>
                  </div>
                  <Switch 
                    checked={autoExpenseEntries} 
                    onCheckedChange={setAutoExpenseEntries}
                    disabled={!autoJournalEnabled}
                  />
                </div>
              </div>

              <Button onClick={handleSaveAccountingSettings} disabled={updateSetting.isPending}>
                {updateSetting.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <Save className="h-4 w-4 ml-2" />
                )}
                حفظ إعدادات القيود
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
