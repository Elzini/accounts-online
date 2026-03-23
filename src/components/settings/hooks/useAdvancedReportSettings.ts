/**
 * Advanced Report Settings - Logic Hook
 * Extracted from AdvancedReportSettingsTab.tsx (647 lines)
 */
import { useState, useEffect, useRef } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/hooks/modules/useControlCenterServices';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

// Report types available for customization
export const REPORT_TYPES = [
  { id: 'payroll', name: 'مسير الرواتب', columns: [
    { id: 'index', name: 'م', visible: true, width: 40, height: 35 },
    { id: 'name', name: 'الاسم', visible: true, width: 120, height: 35 },
    { id: 'job_title', name: 'المسمى الوظيفي', visible: true, width: 100, height: 35 },
    { id: 'base_salary', name: 'الراتب', visible: true, width: 80, height: 35 },
    { id: 'bonus', name: 'الحوافز', visible: true, width: 70, height: 35 },
    { id: 'overtime', name: 'أوفرتايم', visible: true, width: 70, height: 35 },
    { id: 'gross_salary', name: 'إجمالي الراتب', visible: true, width: 90, height: 35 },
    { id: 'advances', name: 'سلفيات', visible: true, width: 70, height: 35 },
    { id: 'deductions', name: 'خصم', visible: true, width: 70, height: 35 },
    { id: 'notes', name: 'ملاحظات', visible: true, width: 100, height: 35 },
    { id: 'absence', name: 'قيمة الغياب', visible: true, width: 80, height: 35 },
    { id: 'total_deductions', name: 'إجمالي المستقطع', visible: true, width: 90, height: 35 },
    { id: 'net_salary', name: 'صافي الراتب', visible: true, width: 90, height: 35 },
    { id: 'employee_signature', name: 'توقيع الموظف', visible: true, width: 100, height: 35 },
  ]},
  { id: 'sales', name: 'تقرير المبيعات', columns: [
    { id: 'index', name: 'م', visible: true, width: 40, height: 35 },
    { id: 'date', name: 'التاريخ', visible: true, width: 100, height: 35 },
    { id: 'car_name', name: 'السيارة', visible: true, width: 150, height: 35 },
    { id: 'customer', name: 'العميل', visible: true, width: 120, height: 35 },
    { id: 'purchase_price', name: 'سعر الشراء', visible: true, width: 90, height: 35 },
    { id: 'sale_price', name: 'سعر البيع', visible: true, width: 90, height: 35 },
    { id: 'profit', name: 'الربح', visible: true, width: 80, height: 35 },
  ]},
  { id: 'inventory', name: 'تقرير المخزون', columns: [
    { id: 'index', name: 'م', visible: true, width: 40, height: 35 },
    { id: 'inventory_number', name: 'رقم المخزون', visible: true, width: 80, height: 35 },
    { id: 'name', name: 'اسم السيارة', visible: true, width: 150, height: 35 },
    { id: 'chassis', name: 'رقم الشاسيه', visible: true, width: 150, height: 35 },
    { id: 'color', name: 'اللون', visible: true, width: 80, height: 35 },
    { id: 'purchase_price', name: 'سعر الشراء', visible: true, width: 90, height: 35 },
    { id: 'status', name: 'الحالة', visible: true, width: 80, height: 35 },
  ]},
  { id: 'customers', name: 'تقرير العملاء', columns: [
    { id: 'index', name: 'م', visible: true, width: 40, height: 35 },
    { id: 'name', name: 'الاسم', visible: true, width: 150, height: 35 },
    { id: 'phone', name: 'الهاتف', visible: true, width: 120, height: 35 },
    { id: 'id_number', name: 'رقم الهوية', visible: true, width: 120, height: 35 },
    { id: 'address', name: 'العنوان', visible: true, width: 150, height: 35 },
    { id: 'total_purchases', name: 'إجمالي المشتريات', visible: true, width: 100, height: 35 },
  ]},
  { id: 'suppliers', name: 'تقرير الموردين', columns: [
    { id: 'index', name: 'م', visible: true, width: 40, height: 35 },
    { id: 'name', name: 'الاسم', visible: true, width: 150, height: 35 },
    { id: 'phone', name: 'الهاتف', visible: true, width: 120, height: 35 },
    { id: 'id_number', name: 'رقم الهوية', visible: true, width: 120, height: 35 },
    { id: 'address', name: 'العنوان', visible: true, width: 150, height: 35 },
    { id: 'total_supplies', name: 'إجمالي التوريدات', visible: true, width: 100, height: 35 },
  ]},
  { id: 'journal_entries', name: 'دفتر اليومية', columns: [
    { id: 'entry_number', name: 'رقم القيد', visible: true, width: 80, height: 35 },
    { id: 'date', name: 'التاريخ', visible: true, width: 100, height: 35 },
    { id: 'description', name: 'البيان', visible: true, width: 200, height: 35 },
    { id: 'debit', name: 'مدين', visible: true, width: 90, height: 35 },
    { id: 'credit', name: 'دائن', visible: true, width: 90, height: 35 },
  ]},
];

export interface ColumnConfig {
  id: string;
  name: string;
  visible: boolean;
  width: number;
  height: number;
}

export interface ReportConfig {
  id: string;
  columns: ColumnConfig[];
  headerColor: string;
  paperOrientation: 'portrait' | 'landscape';
  fontSize: 'small' | 'medium' | 'large';
  showLogo: boolean;
  showHeader: boolean;
  showFooter: boolean;
  rowHeight: number;
}

const DEFAULT_CONFIG: Omit<ReportConfig, 'id' | 'columns'> = {
  headerColor: '#3b82f6',
  paperOrientation: 'landscape',
  fontSize: 'medium',
  showLogo: true,
  showHeader: true,
  showFooter: true,
  rowHeight: 35,
};

export function useAdvancedReportSettings() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  const [selectedReportType, setSelectedReportType] = useState('payroll');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    id: 'payroll',
    columns: REPORT_TYPES.find(r => r.id === 'payroll')?.columns || [],
    ...DEFAULT_CONFIG,
  });

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    loadReportSettings(selectedReportType);
  }, [selectedReportType, companyId]);

  const loadReportSettings = async (reportType: string) => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('app_settings').select('value')
        .eq('company_id', companyId).eq('key', `report_config_${reportType}`).single();

      if (data?.value) {
        setReportConfig(JSON.parse(data.value));
      } else {
        const defaultReport = REPORT_TYPES.find(r => r.id === reportType);
        if (defaultReport) {
          setReportConfig({ id: reportType, columns: [...defaultReport.columns], ...DEFAULT_CONFIG });
        }
      }
    } catch { /* use defaults */ } finally { setIsLoading(false); }
  };

  const handleSave = async () => {
    if (!companyId) { toast.error('يجب تسجيل الدخول أولاً'); return; }
    setIsSaving(true);
    try {
      const key = `report_config_${selectedReportType}`;
      const value = JSON.stringify(reportConfig);
      const { data: existing } = await supabase.from('app_settings').select('id').eq('company_id', companyId).eq('key', key).single();
      if (existing) await supabase.from('app_settings').update({ value }).eq('id', existing.id);
      else await supabase.from('app_settings').insert({ company_id: companyId, key, value });
      queryClient.invalidateQueries({ queryKey: ['report-config', companyId, selectedReportType] });
      toast.success('تم حفظ إعدادات التقرير بنجاح');
    } catch { toast.error('حدث خطأ أثناء حفظ الإعدادات'); } finally { setIsSaving(false); }
  };

  const handleResetDefaults = () => {
    const defaultReport = REPORT_TYPES.find(r => r.id === selectedReportType);
    if (defaultReport) {
      setReportConfig({ id: selectedReportType, columns: [...defaultReport.columns], ...DEFAULT_CONFIG });
      toast.info('تم إعادة الإعدادات للقيم الافتراضية');
    }
  };

  const toggleColumnVisibility = (columnId: string) => {
    setReportConfig(prev => ({ ...prev, columns: prev.columns.map(col => col.id === columnId ? { ...col, visible: !col.visible } : col) }));
  };

  const updateColumnWidth = (columnId: string, width: number) => {
    setReportConfig(prev => ({ ...prev, columns: prev.columns.map(col => col.id === columnId ? { ...col, width } : col) }));
  };

  const updateColumnHeight = (columnId: string, height: number) => {
    setReportConfig(prev => ({ ...prev, columns: prev.columns.map(col => col.id === columnId ? { ...col, height } : col) }));
  };

  const handleDragStart = (index: number) => { dragItem.current = index; };
  const handleDragEnter = (index: number) => { dragOverItem.current = index; };
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const columns = [...reportConfig.columns];
    const draggedItem = columns[dragItem.current];
    columns.splice(dragItem.current, 1);
    columns.splice(dragOverItem.current, 0, draggedItem);
    setReportConfig(prev => ({ ...prev, columns }));
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return {
    selectedReportType, setSelectedReportType,
    isLoading, isSaving,
    reportConfig, setReportConfig,
    handleSave, handleResetDefaults,
    toggleColumnVisibility, updateColumnWidth, updateColumnHeight,
    handleDragStart, handleDragEnter, handleDragEnd,
  };
}
