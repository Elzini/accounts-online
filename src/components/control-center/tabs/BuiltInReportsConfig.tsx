import { useState, useEffect } from 'react';
import { 
  FileText, Settings, Eye, EyeOff, Save, RotateCcw, 
  BarChart3, ShoppingCart, Package, Users, Truck, 
  DollarSign, Receipt, ArrowRightLeft, Building2,
  Calculator, BookOpen, ClipboardList, TrendingUp,
  Wallet, Scale
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── Types ──────────────────────────────────────────────
export interface ReportColumnConfig {
  field: string;
  label: string;
  defaultLabel: string;
  visible: boolean;
  order: number;
}

export interface BuiltInReportConfig {
  key: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'sales' | 'purchases' | 'inventory' | 'financial' | 'accounting' | 'other';
  columns: ReportColumnConfig[];
  enabled: boolean;
}

// ─── Default Report Definitions ─────────────────────────
const BUILT_IN_REPORTS: Omit<BuiltInReportConfig, 'icon'>[] = [
  // المبيعات
  {
    key: 'sales_report',
    name: 'تقرير المبيعات',
    description: 'تفاصيل عمليات البيع والإيرادات',
    category: 'sales',
    enabled: true,
    columns: [
      { field: 'sale_number', label: 'رقم البيع', defaultLabel: 'رقم البيع', visible: true, order: 0 },
      { field: 'sale_date', label: 'تاريخ البيع', defaultLabel: 'تاريخ البيع', visible: true, order: 1 },
      { field: 'car_name', label: 'السيارة', defaultLabel: 'السيارة', visible: true, order: 2 },
      { field: 'customer_name', label: 'العميل', defaultLabel: 'العميل', visible: true, order: 3 },
      { field: 'sale_price', label: 'سعر البيع', defaultLabel: 'سعر البيع', visible: true, order: 4 },
      { field: 'purchase_price', label: 'سعر الشراء', defaultLabel: 'سعر الشراء', visible: true, order: 5 },
      { field: 'profit', label: 'الربح', defaultLabel: 'الربح', visible: true, order: 6 },
      { field: 'commission', label: 'العمولة', defaultLabel: 'العمولة', visible: true, order: 7 },
      { field: 'seller_name', label: 'البائع', defaultLabel: 'البائع', visible: true, order: 8 },
      { field: 'payment_method', label: 'طريقة الدفع', defaultLabel: 'طريقة الدفع', visible: true, order: 9 },
    ],
  },
  {
    key: 'commissions_report',
    name: 'تقرير العمولات',
    description: 'تفاصيل عمولات البائعين',
    category: 'sales',
    enabled: true,
    columns: [
      { field: 'seller_name', label: 'البائع', defaultLabel: 'البائع', visible: true, order: 0 },
      { field: 'sale_date', label: 'تاريخ البيع', defaultLabel: 'تاريخ البيع', visible: true, order: 1 },
      { field: 'car_name', label: 'السيارة', defaultLabel: 'السيارة', visible: true, order: 2 },
      { field: 'sale_price', label: 'سعر البيع', defaultLabel: 'سعر البيع', visible: true, order: 3 },
      { field: 'commission', label: 'العمولة', defaultLabel: 'العمولة', visible: true, order: 4 },
    ],
  },
  // المشتريات
  {
    key: 'purchases_report',
    name: 'تقرير المشتريات',
    description: 'تفاصيل عمليات الشراء',
    category: 'purchases',
    enabled: true,
    columns: [
      { field: 'inventory_number', label: 'رقم المخزون', defaultLabel: 'رقم المخزون', visible: true, order: 0 },
      { field: 'name', label: 'اسم السيارة', defaultLabel: 'اسم السيارة', visible: true, order: 1 },
      { field: 'chassis_number', label: 'رقم الشاسيه', defaultLabel: 'رقم الشاسيه', visible: true, order: 2 },
      { field: 'model', label: 'الموديل', defaultLabel: 'الموديل', visible: true, order: 3 },
      { field: 'color', label: 'اللون', defaultLabel: 'اللون', visible: true, order: 4 },
      { field: 'supplier_name', label: 'المورد', defaultLabel: 'المورد', visible: true, order: 5 },
      { field: 'purchase_price', label: 'سعر الشراء', defaultLabel: 'سعر الشراء', visible: true, order: 6 },
      { field: 'purchase_date', label: 'تاريخ الشراء', defaultLabel: 'تاريخ الشراء', visible: true, order: 7 },
      { field: 'payment_method', label: 'طريقة الدفع', defaultLabel: 'طريقة الدفع', visible: true, order: 8 },
    ],
  },
  // المخزون
  {
    key: 'inventory_report',
    name: 'تقرير المخزون',
    description: 'حالة السيارات في المخزون',
    category: 'inventory',
    enabled: true,
    columns: [
      { field: 'inventory_number', label: 'رقم المخزون', defaultLabel: 'رقم المخزون', visible: true, order: 0 },
      { field: 'name', label: 'اسم السيارة', defaultLabel: 'اسم السيارة', visible: true, order: 1 },
      { field: 'chassis_number', label: 'رقم الشاسيه', defaultLabel: 'رقم الشاسيه', visible: true, order: 2 },
      { field: 'model', label: 'الموديل', defaultLabel: 'الموديل', visible: true, order: 3 },
      { field: 'color', label: 'اللون', defaultLabel: 'اللون', visible: true, order: 4 },
      { field: 'purchase_price', label: 'سعر الشراء', defaultLabel: 'سعر الشراء', visible: true, order: 5 },
      { field: 'purchase_date', label: 'تاريخ الشراء', defaultLabel: 'تاريخ الشراء', visible: true, order: 6 },
      { field: 'status', label: 'الحالة', defaultLabel: 'الحالة', visible: true, order: 7 },
    ],
  },
  // الأرباح
  {
    key: 'profit_report',
    name: 'تقرير الأرباح',
    description: 'تفاصيل الأرباح والمصاريف',
    category: 'financial',
    enabled: true,
    columns: [
      { field: 'sale_date', label: 'التاريخ', defaultLabel: 'التاريخ', visible: true, order: 0 },
      { field: 'car_name', label: 'السيارة', defaultLabel: 'السيارة', visible: true, order: 1 },
      { field: 'sale_price', label: 'سعر البيع', defaultLabel: 'سعر البيع', visible: true, order: 2 },
      { field: 'gross_profit', label: 'الربح الإجمالي', defaultLabel: 'الربح الإجمالي', visible: true, order: 3 },
      { field: 'car_expenses', label: 'مصروفات السيارة', defaultLabel: 'مصروفات السيارة', visible: true, order: 4 },
      { field: 'net_profit', label: 'صافي الربح', defaultLabel: 'صافي الربح', visible: true, order: 5 },
    ],
  },
  // العملاء
  {
    key: 'customers_report',
    name: 'تقرير العملاء',
    description: 'بيانات وإحصائيات العملاء',
    category: 'other',
    enabled: true,
    columns: [
      { field: 'name', label: 'اسم العميل', defaultLabel: 'اسم العميل', visible: true, order: 0 },
      { field: 'phone', label: 'الهاتف', defaultLabel: 'الهاتف', visible: true, order: 1 },
      { field: 'id_number', label: 'رقم الهوية', defaultLabel: 'رقم الهوية', visible: true, order: 2 },
      { field: 'address', label: 'العنوان', defaultLabel: 'العنوان', visible: true, order: 3 },
      { field: 'total_purchases', label: 'إجمالي المشتريات', defaultLabel: 'إجمالي المشتريات', visible: true, order: 4 },
      { field: 'cars_count', label: 'عدد السيارات', defaultLabel: 'عدد السيارات', visible: true, order: 5 },
    ],
  },
  // الموردين
  {
    key: 'suppliers_report',
    name: 'تقرير الموردين',
    description: 'بيانات وإحصائيات الموردين',
    category: 'other',
    enabled: true,
    columns: [
      { field: 'name', label: 'اسم المورد', defaultLabel: 'اسم المورد', visible: true, order: 0 },
      { field: 'phone', label: 'الهاتف', defaultLabel: 'الهاتف', visible: true, order: 1 },
      { field: 'id_number', label: 'رقم الهوية', defaultLabel: 'رقم الهوية', visible: true, order: 2 },
      { field: 'address', label: 'العنوان', defaultLabel: 'العنوان', visible: true, order: 3 },
      { field: 'total_supplies', label: 'إجمالي التوريدات', defaultLabel: 'إجمالي التوريدات', visible: true, order: 4 },
      { field: 'cars_count', label: 'عدد السيارات', defaultLabel: 'عدد السيارات', visible: true, order: 5 },
    ],
  },
  // التحويلات
  {
    key: 'transfers_report',
    name: 'تقرير التحويلات',
    description: 'تحويلات السيارات بين المعارض',
    category: 'other',
    enabled: true,
    columns: [
      { field: 'transfer_date', label: 'تاريخ التحويل', defaultLabel: 'تاريخ التحويل', visible: true, order: 0 },
      { field: 'car_name', label: 'السيارة', defaultLabel: 'السيارة', visible: true, order: 1 },
      { field: 'partner_name', label: 'المعرض الشريك', defaultLabel: 'المعرض الشريك', visible: true, order: 2 },
      { field: 'transfer_type', label: 'نوع التحويل', defaultLabel: 'نوع التحويل', visible: true, order: 3 },
      { field: 'status', label: 'الحالة', defaultLabel: 'الحالة', visible: true, order: 4 },
      { field: 'commission', label: 'العمولة', defaultLabel: 'العمولة', visible: true, order: 5 },
    ],
  },
  // المعارض الشريكة
  {
    key: 'partner_report',
    name: 'تقرير المعارض الشريكة',
    description: 'إحصائيات المعارض الشريكة',
    category: 'other',
    enabled: true,
    columns: [
      { field: 'name', label: 'اسم المعرض', defaultLabel: 'اسم المعرض', visible: true, order: 0 },
      { field: 'contact_person', label: 'جهة الاتصال', defaultLabel: 'جهة الاتصال', visible: true, order: 1 },
      { field: 'phone', label: 'الهاتف', defaultLabel: 'الهاتف', visible: true, order: 2 },
      { field: 'total_transfers', label: 'إجمالي التحويلات', defaultLabel: 'إجمالي التحويلات', visible: true, order: 3 },
      { field: 'total_commission', label: 'إجمالي العمولات', defaultLabel: 'إجمالي العمولات', visible: true, order: 4 },
    ],
  },
  // المحاسبية
  {
    key: 'account_movement_report',
    name: 'تقرير حركة الحسابات',
    description: 'حركة الحسابات المحاسبية',
    category: 'accounting',
    enabled: true,
    columns: [
      { field: 'entry_date', label: 'التاريخ', defaultLabel: 'التاريخ', visible: true, order: 0 },
      { field: 'entry_number', label: 'رقم القيد', defaultLabel: 'رقم القيد', visible: true, order: 1 },
      { field: 'description', label: 'البيان', defaultLabel: 'البيان', visible: true, order: 2 },
      { field: 'debit', label: 'مدين', defaultLabel: 'مدين', visible: true, order: 3 },
      { field: 'credit', label: 'دائن', defaultLabel: 'دائن', visible: true, order: 4 },
      { field: 'balance', label: 'الرصيد', defaultLabel: 'الرصيد', visible: true, order: 5 },
    ],
  },
  {
    key: 'account_statement_report',
    name: 'كشف حساب مفصل',
    description: 'كشف حساب تفصيلي لكل حساب',
    category: 'accounting',
    enabled: true,
    columns: [
      { field: 'entry_date', label: 'التاريخ', defaultLabel: 'التاريخ', visible: true, order: 0 },
      { field: 'entry_number', label: 'رقم القيد', defaultLabel: 'رقم القيد', visible: true, order: 1 },
      { field: 'reference_type', label: 'نوع المرجع', defaultLabel: 'نوع المرجع', visible: true, order: 2 },
      { field: 'description', label: 'البيان', defaultLabel: 'البيان', visible: true, order: 3 },
      { field: 'debit', label: 'مدين', defaultLabel: 'مدين', visible: true, order: 4 },
      { field: 'credit', label: 'دائن', defaultLabel: 'دائن', visible: true, order: 5 },
      { field: 'balance', label: 'الرصيد', defaultLabel: 'الرصيد', visible: true, order: 6 },
    ],
  },
  {
    key: 'trial_balance_report',
    name: 'ميزان المراجعة',
    description: 'ميزان المراجعة للحسابات',
    category: 'accounting',
    enabled: true,
    columns: [
      { field: 'account_code', label: 'رقم الحساب', defaultLabel: 'رقم الحساب', visible: true, order: 0 },
      { field: 'account_name', label: 'اسم الحساب', defaultLabel: 'اسم الحساب', visible: true, order: 1 },
      { field: 'opening_debit', label: 'رصيد أول مدين', defaultLabel: 'رصيد أول مدين', visible: true, order: 2 },
      { field: 'opening_credit', label: 'رصيد أول دائن', defaultLabel: 'رصيد أول دائن', visible: true, order: 3 },
      { field: 'movement_debit', label: 'حركة مدين', defaultLabel: 'حركة مدين', visible: true, order: 4 },
      { field: 'movement_credit', label: 'حركة دائن', defaultLabel: 'حركة دائن', visible: true, order: 5 },
      { field: 'closing_debit', label: 'رصيد ختامي مدين', defaultLabel: 'رصيد ختامي مدين', visible: true, order: 6 },
      { field: 'closing_credit', label: 'رصيد ختامي دائن', defaultLabel: 'رصيد ختامي دائن', visible: true, order: 7 },
    ],
  },
  {
    key: 'vouchers_report',
    name: 'تقرير السندات',
    description: 'سندات القبض والصرف',
    category: 'financial',
    enabled: true,
    columns: [
      { field: 'voucher_number', label: 'رقم السند', defaultLabel: 'رقم السند', visible: true, order: 0 },
      { field: 'voucher_type', label: 'نوع السند', defaultLabel: 'نوع السند', visible: true, order: 1 },
      { field: 'voucher_date', label: 'التاريخ', defaultLabel: 'التاريخ', visible: true, order: 2 },
      { field: 'amount', label: 'المبلغ', defaultLabel: 'المبلغ', visible: true, order: 3 },
      { field: 'description', label: 'الوصف', defaultLabel: 'الوصف', visible: true, order: 4 },
      { field: 'beneficiary', label: 'المستفيد', defaultLabel: 'المستفيد', visible: true, order: 5 },
    ],
  },
  {
    key: 'journal_entries_report',
    name: 'تقرير القيود',
    description: 'قيود اليومية المحاسبية',
    category: 'accounting',
    enabled: true,
    columns: [
      { field: 'entry_number', label: 'رقم القيد', defaultLabel: 'رقم القيد', visible: true, order: 0 },
      { field: 'entry_date', label: 'التاريخ', defaultLabel: 'التاريخ', visible: true, order: 1 },
      { field: 'description', label: 'البيان', defaultLabel: 'البيان', visible: true, order: 2 },
      { field: 'total_debit', label: 'إجمالي المدين', defaultLabel: 'إجمالي المدين', visible: true, order: 3 },
      { field: 'total_credit', label: 'إجمالي الدائن', defaultLabel: 'إجمالي الدائن', visible: true, order: 4 },
      { field: 'reference_type', label: 'نوع المرجع', defaultLabel: 'نوع المرجع', visible: true, order: 5 },
      { field: 'status', label: 'الحالة', defaultLabel: 'الحالة', visible: true, order: 6 },
    ],
  },
  {
    key: 'vat_return_report',
    name: 'إقرار ضريبة القيمة المضافة',
    description: 'تقرير الإقرار الضريبي',
    category: 'financial',
    enabled: true,
    columns: [
      { field: 'description', label: 'البند', defaultLabel: 'البند', visible: true, order: 0 },
      { field: 'amount', label: 'المبلغ', defaultLabel: 'المبلغ', visible: true, order: 1 },
      { field: 'vat_amount', label: 'مبلغ الضريبة', defaultLabel: 'مبلغ الضريبة', visible: true, order: 2 },
      { field: 'adjustment', label: 'التعديل', defaultLabel: 'التعديل', visible: true, order: 3 },
    ],
  },
];

// ─── Icons Map ──────────────────────────────────────────
const REPORT_ICONS: Record<string, React.ReactNode> = {
  sales_report: <BarChart3 className="w-5 h-5" />,
  commissions_report: <Wallet className="w-5 h-5" />,
  purchases_report: <ShoppingCart className="w-5 h-5" />,
  inventory_report: <Package className="w-5 h-5" />,
  profit_report: <TrendingUp className="w-5 h-5" />,
  customers_report: <Users className="w-5 h-5" />,
  suppliers_report: <Truck className="w-5 h-5" />,
  transfers_report: <ArrowRightLeft className="w-5 h-5" />,
  partner_report: <Building2 className="w-5 h-5" />,
  account_movement_report: <BookOpen className="w-5 h-5" />,
  account_statement_report: <ClipboardList className="w-5 h-5" />,
  trial_balance_report: <Scale className="w-5 h-5" />,
  vouchers_report: <Receipt className="w-5 h-5" />,
  journal_entries_report: <Calculator className="w-5 h-5" />,
  vat_return_report: <DollarSign className="w-5 h-5" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  sales: 'المبيعات',
  purchases: 'المشتريات',
  inventory: 'المخزون',
  financial: 'المالية',
  accounting: 'المحاسبة',
  other: 'أخرى',
};

const CATEGORY_COLORS: Record<string, string> = {
  sales: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  purchases: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  inventory: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  financial: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  accounting: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

// ─── Hook for persisting report configs ─────────────────
function useBuiltInReportConfigs() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['builtin-report-configs', companyId],
    queryFn: async () => {
      if (!companyId) return {};
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .eq('company_id', companyId)
        .like('key', 'report_config_%');

      if (error) throw error;
      const configs: Record<string, { columns: ReportColumnConfig[]; enabled: boolean }> = {};
      data?.forEach(row => {
        const reportKey = row.key.replace('report_config_', '');
        try {
          configs[reportKey] = JSON.parse(row.value || '{}');
        } catch { /* ignore parse errors */ }
      });
      return configs;
    },
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ reportKey, config }: { reportKey: string; config: { columns: ReportColumnConfig[]; enabled: boolean } }) => {
      if (!companyId) throw new Error('No company');
      const settingKey = `report_config_${reportKey}`;
      const value = JSON.stringify(config);

      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', settingKey)
        .eq('company_id', companyId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('app_settings')
          .update({ value })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('app_settings')
          .insert({ key: settingKey, value, company_id: companyId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builtin-report-configs', companyId] });
    },
  });

  return { configs: query.data || {}, isLoading: query.isLoading, saveConfig: saveMutation };
}

// ─── Main Component ─────────────────────────────────────
export function BuiltInReportsConfig() {
  const { configs, isLoading, saveConfig } = useBuiltInReportConfigs();
  const [editDialog, setEditDialog] = useState(false);
  const [editingReport, setEditingReport] = useState<(typeof BUILT_IN_REPORTS)[0] | null>(null);
  const [editColumns, setEditColumns] = useState<ReportColumnConfig[]>([]);
  const [editEnabled, setEditEnabled] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  const getReportConfig = (report: (typeof BUILT_IN_REPORTS)[0]) => {
    const saved = configs[report.key];
    if (saved) {
      return {
        ...report,
        columns: saved.columns || report.columns,
        enabled: saved.enabled ?? report.enabled,
      };
    }
    return report;
  };

  const openEditDialog = (report: (typeof BUILT_IN_REPORTS)[0]) => {
    const config = getReportConfig(report);
    setEditingReport(report);
    setEditColumns([...config.columns]);
    setEditEnabled(config.enabled);
    setEditDialog(true);
  };

  const handleColumnToggle = (field: string, visible: boolean) => {
    setEditColumns(prev => prev.map(col =>
      col.field === field ? { ...col, visible } : col
    ));
  };

  const handleColumnLabelChange = (field: string, label: string) => {
    setEditColumns(prev => prev.map(col =>
      col.field === field ? { ...col, label } : col
    ));
  };

  const handleResetColumns = () => {
    if (editingReport) {
      setEditColumns([...editingReport.columns]);
      setEditEnabled(true);
      toast.info('تم إعادة تعيين الأعمدة للقيم الافتراضية');
    }
  };

  const handleSave = async () => {
    if (!editingReport) return;
    try {
      await saveConfig.mutateAsync({
        reportKey: editingReport.key,
        config: { columns: editColumns, enabled: editEnabled },
      });
      toast.success('تم حفظ إعدادات التقرير بنجاح');
      setEditDialog(false);
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleToggleEnabled = async (report: (typeof BUILT_IN_REPORTS)[0]) => {
    const config = getReportConfig(report);
    try {
      await saveConfig.mutateAsync({
        reportKey: report.key,
        config: { columns: config.columns, enabled: !config.enabled },
      });
      toast.success(config.enabled ? 'تم تعطيل التقرير' : 'تم تفعيل التقرير');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const categories = ['all', 'sales', 'purchases', 'inventory', 'financial', 'accounting', 'other'];
  const filteredReports = activeCategory === 'all'
    ? BUILT_IN_REPORTS
    : BUILT_IN_REPORTS.filter(r => r.category === activeCategory);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>التقارير المدمجة</CardTitle>
              <CardDescription>
                تخصيص أعمدة وعناوين جميع التقارير المدمجة في النظام
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={activeCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className="text-xs"
              >
                {cat === 'all' ? 'الكل' : CATEGORY_LABELS[cat]}
                {cat !== 'all' && (
                  <Badge variant="secondary" className="mr-1 text-[10px] px-1.5 py-0">
                    {BUILT_IN_REPORTS.filter(r => r.category === cat).length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map(report => {
              const config = getReportConfig(report);
              const visibleCols = config.columns.filter(c => c.visible).length;
              const totalCols = config.columns.length;
              const hasCustomization = !!configs[report.key];

              return (
                <div
                  key={report.key}
                  className={`border rounded-xl p-4 transition-all hover:shadow-md cursor-pointer group ${
                    !config.enabled ? 'opacity-60 bg-muted/30' : 'bg-card'
                  }`}
                  onClick={() => openEditDialog(report)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {REPORT_ICONS[report.key] || <FileText className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{report.name}</h4>
                        <p className="text-xs text-muted-foreground">{report.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={(e) => {
                        e; // prevent card click
                        handleToggleEnabled(report);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] ${CATEGORY_COLORS[report.category]}`}>
                        {CATEGORY_LABELS[report.category]}
                      </Badge>
                      {hasCustomization && (
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                          مخصص
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {visibleCols}/{totalCols} أعمدة
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {config.columns.slice(0, 4).map(col => (
                      <span
                        key={col.field}
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          col.visible
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground line-through'
                        }`}
                      >
                        {col.label}
                      </span>
                    ))}
                    {config.columns.length > 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        +{config.columns.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingReport && (REPORT_ICONS[editingReport.key] || <FileText className="w-5 h-5" />)}
              تعديل {editingReport?.name}
            </DialogTitle>
            <DialogDescription>
              تخصيص الأعمدة المعروضة وعناوينها
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[55vh] pr-4">
            <div className="space-y-4">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <Label className="font-medium">تفعيل التقرير</Label>
                  <p className="text-xs text-muted-foreground">إظهار أو إخفاء التقرير من قائمة التقارير</p>
                </div>
                <Switch checked={editEnabled} onCheckedChange={setEditEnabled} />
              </div>

              {/* Columns */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">الأعمدة</Label>
                  <Button variant="ghost" size="sm" onClick={handleResetColumns} className="text-xs gap-1">
                    <RotateCcw className="w-3 h-3" />
                    إعادة تعيين
                  </Button>
                </div>
                <div className="border rounded-lg divide-y">
                  {editColumns.map(column => (
                    <div key={column.field} className="flex items-center gap-4 p-3 hover:bg-muted/30 transition-colors">
                      <Checkbox
                        checked={column.visible}
                        onCheckedChange={(checked) => handleColumnToggle(column.field, !!checked)}
                      />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {column.visible ? (
                          <Eye className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-[10px] text-muted-foreground">الحقل</Label>
                            <p className="text-sm font-mono text-muted-foreground">{column.field}</p>
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">العنوان</Label>
                            <Input
                              value={column.label}
                              onChange={(e) => handleColumnLabelChange(column.field, e.target.value)}
                              className="h-8 text-sm"
                              placeholder={column.defaultLabel}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={saveConfig.isPending} className="gap-2">
              <Save className="w-4 h-4" />
              حفظ الإعدادات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
