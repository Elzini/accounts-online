import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, LayoutDashboard, FileText, Menu, Settings2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface LabelGroup {
  title: string;
  icon: React.ReactNode;
  fields: { key: string; label: string; defaultValue: string }[];
}

const LABEL_GROUPS: LabelGroup[] = [
  {
    title: 'القائمة الرئيسية',
    icon: <Menu className="w-4 h-4" />,
    fields: [
      { key: 'dashboard_title', label: 'الرئيسية', defaultValue: 'الرئيسية' },
      { key: 'purchases_title', label: 'المشتريات', defaultValue: 'المشتريات' },
      { key: 'sales_title', label: 'المبيعات', defaultValue: 'المبيعات' },
      { key: 'customers_title', label: 'العملاء', defaultValue: 'العملاء' },
      { key: 'suppliers_title', label: 'الموردين', defaultValue: 'الموردين' },
      { key: 'transfers_section_title', label: 'قسم التحويلات', defaultValue: 'التحويلات' },
      { key: 'partner_dealerships_title', label: 'المعارض الشريكة', defaultValue: 'المعارض الشريكة' },
      { key: 'car_transfers_title', label: 'تحويلات السيارات', defaultValue: 'تحويلات السيارات' },
    ],
  },
  {
    title: 'المالية',
    icon: <Settings2 className="w-4 h-4" />,
    fields: [
      { key: 'finance_section_title', label: 'عنوان قسم المالية', defaultValue: 'المالية' },
      { key: 'expenses_title', label: 'المصروفات', defaultValue: 'المصروفات' },
      { key: 'prepaid_expenses_title', label: 'المصروفات المقدمة', defaultValue: 'المصروفات المقدمة' },
      { key: 'quotations_title', label: 'عروض الأسعار', defaultValue: 'عروض الأسعار' },
      { key: 'installments_title', label: 'الأقساط', defaultValue: 'الأقساط' },
      { key: 'vouchers_title', label: 'سندات القبض والصرف', defaultValue: 'سندات القبض والصرف' },
      { key: 'financing_title', label: 'شركات التمويل', defaultValue: 'شركات التمويل' },
      { key: 'banking_title', label: 'إدارة البنوك', defaultValue: 'إدارة البنوك' },
    ],
  },
  {
    title: 'التقارير',
    icon: <FileText className="w-4 h-4" />,
    fields: [
      { key: 'reports_title', label: 'عنوان قسم التقارير', defaultValue: 'التقارير' },
      { key: 'inventory_report_title', label: 'تقرير المخزون', defaultValue: 'تقرير المخزون' },
      { key: 'profit_report_title', label: 'تقرير الأرباح', defaultValue: 'تقرير الأرباح' },
      { key: 'purchases_report_title', label: 'تقرير المشتريات', defaultValue: 'تقرير المشتريات' },
      { key: 'sales_report_title', label: 'تقرير المبيعات', defaultValue: 'تقرير المبيعات' },
      { key: 'customers_report_title', label: 'تقرير العملاء', defaultValue: 'تقرير العملاء' },
      { key: 'suppliers_report_title', label: 'تقرير الموردين', defaultValue: 'تقرير الموردين' },
      { key: 'commissions_report_title', label: 'تقرير العمولات', defaultValue: 'تقرير العمولات' },
      { key: 'transfers_report_title', label: 'تقرير التحويلات', defaultValue: 'تقرير التحويلات' },
      { key: 'partner_report_title', label: 'تقرير المعرض الشريك', defaultValue: 'تقرير المعرض الشريك' },
    ],
  },
  {
    title: 'المحاسبة',
    icon: <LayoutDashboard className="w-4 h-4" />,
    fields: [
      { key: 'accounting_section_title', label: 'عنوان قسم المحاسبة', defaultValue: 'المحاسبة' },
      { key: 'tax_settings_title', label: 'إعدادات الضريبة', defaultValue: 'إعدادات الضريبة' },
      { key: 'chart_of_accounts_title', label: 'شجرة الحسابات', defaultValue: 'شجرة الحسابات' },
      { key: 'journal_entries_title', label: 'دفتر اليومية', defaultValue: 'دفتر اليومية' },
      { key: 'general_ledger_title', label: 'دفتر الأستاذ', defaultValue: 'دفتر الأستاذ' },
      { key: 'financial_reports_title', label: 'التقارير المالية', defaultValue: 'التقارير المالية' },
    ],
  },
  {
    title: 'الإدارة',
    icon: <Settings2 className="w-4 h-4" />,
    fields: [
      { key: 'admin_section_title', label: 'عنوان قسم الإدارة', defaultValue: 'الإدارة' },
      { key: 'users_management_title', label: 'إدارة المستخدمين', defaultValue: 'إدارة المستخدمين' },
      { key: 'app_settings_title', label: 'إعدادات النظام', defaultValue: 'إعدادات النظام' },
      { key: 'audit_logs_title', label: 'سجل التدقيق', defaultValue: 'سجل التدقيق' },
      { key: 'backups_title', label: 'النسخ الاحتياطي', defaultValue: 'النسخ الاحتياطي' },
    ],
  },
];

export function SystemLabelsManagement() {
  const queryClient = useQueryClient();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch all companies
  const { data: companies = [] } = useQuery({
    queryKey: ['all-companies-labels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, company_type')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch current labels for selected company
  const { data: currentLabels, isLoading } = useQuery({
    queryKey: ['company-labels', selectedCompanyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .eq('company_id', selectedCompanyId);
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach(row => {
        if (row.value) map[row.key] = row.value;
      });
      return map;
    },
    enabled: !!selectedCompanyId,
  });

  // Initialize labels when company changes
  useEffect(() => {
    if (currentLabels) {
      const defaultLabels: Record<string, string> = {};
      LABEL_GROUPS.forEach(group => {
        group.fields.forEach(field => {
          defaultLabels[field.key] = currentLabels[field.key] || field.defaultValue;
        });
      });
      setLabels(defaultLabels);
      setHasChanges(false);
    }
  }, [currentLabels]);

  const handleLabelChange = (key: string, value: string) => {
    setLabels(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Save all labels
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCompanyId) throw new Error('يرجى اختيار شركة');

      for (const [key, value] of Object.entries(labels)) {
        // Check if setting exists
        const { data: existing } = await supabase
          .from('app_settings')
          .select('id')
          .eq('key', key)
          .eq('company_id', selectedCompanyId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('app_settings')
            .update({ value })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('app_settings')
            .insert({ key, value, company_id: selectedCompanyId });
        }
      }
    },
    onSuccess: () => {
      toast.success('تم حفظ المسميات بنجاح');
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['company-labels', selectedCompanyId] });
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
    },
    onError: () => {
      toast.error('حدث خطأ أثناء الحفظ');
    },
  });

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            تخصيص مسميات النظام
          </CardTitle>
          <CardDescription>
            تحكم في جميع الأسماء والعناوين الظاهرة في النظام لكل شركة على حدة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>اختر الشركة</Label>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر شركة لتخصيص مسمياتها..." />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCompany && (
              <div className="text-sm text-muted-foreground mt-5">
                نوع النشاط: <span className="font-medium text-foreground">
                  {selectedCompany.company_type === 'car_dealership' ? 'معرض سيارات' :
                   selectedCompany.company_type === 'construction' ? 'مقاولات' :
                   selectedCompany.company_type === 'general_trading' ? 'تجارة عامة' :
                   selectedCompany.company_type === 'restaurant' ? 'مطاعم' :
                   selectedCompany.company_type === 'export_import' ? 'استيراد وتصدير' : ''}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedCompanyId && !isLoading && (
        <>
          <Tabs defaultValue="menu" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              {LABEL_GROUPS.map((group, idx) => (
                <TabsTrigger key={idx} value={['menu', 'finance', 'reports', 'accounting', 'admin'][idx]} className="flex items-center gap-1 text-xs">
                  {group.icon}
                  <span className="hidden sm:inline">{group.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {LABEL_GROUPS.map((group, idx) => (
              <TabsContent key={idx} value={['menu', 'finance', 'reports', 'accounting', 'admin'][idx]}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {group.icon}
                      {group.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {group.fields.map(field => (
                        <div key={field.key}>
                          <Label className="text-xs text-muted-foreground">{field.label}</Label>
                          <Input
                            value={labels[field.key] || ''}
                            onChange={(e) => handleLabelChange(field.key, e.target.value)}
                            placeholder={field.defaultValue}
                            dir="rtl"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          <div className="flex justify-end">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!hasChanges || saveMutation.isPending}
              className="gap-2"
              size="lg"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              حفظ جميع المسميات
            </Button>
          </div>
        </>
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
