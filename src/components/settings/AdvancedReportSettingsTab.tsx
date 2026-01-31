import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Loader2, 
  FileText, 
  Palette, 
  Settings2, 
  Move, 
  Eye, 
  EyeOff,
  RotateCcw,
  Save,
  GripVertical,
  Trash2,
  Plus
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

// Report types available for customization
const REPORT_TYPES = [
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

interface ColumnConfig {
  id: string;
  name: string;
  visible: boolean;
  width: number;
  height: number;
}

interface ReportConfig {
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

export function AdvancedReportSettingsTab() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  
  const [selectedReportType, setSelectedReportType] = useState('payroll');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    id: 'payroll',
    columns: REPORT_TYPES.find(r => r.id === 'payroll')?.columns || [],
    headerColor: '#3b82f6',
    paperOrientation: 'landscape',
    fontSize: 'medium',
    showLogo: true,
    showHeader: true,
    showFooter: true,
    rowHeight: 35,
  });

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Load settings when report type changes
  useEffect(() => {
    loadReportSettings(selectedReportType);
  }, [selectedReportType, companyId]);

  const loadReportSettings = async (reportType: string) => {
    if (!companyId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('company_id', companyId)
        .eq('key', `report_config_${reportType}`)
        .single();

      if (data?.value) {
        const savedConfig = JSON.parse(data.value);
        setReportConfig(savedConfig);
      } else {
        // Use default config for this report type
        const defaultReport = REPORT_TYPES.find(r => r.id === reportType);
        if (defaultReport) {
          setReportConfig({
            id: reportType,
            columns: [...defaultReport.columns],
            headerColor: '#3b82f6',
            paperOrientation: 'landscape',
            fontSize: 'medium',
            showLogo: true,
            showHeader: true,
            showFooter: true,
            rowHeight: 35,
          });
        }
      }
    } catch (error) {
      console.error('Error loading report settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!companyId) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    setIsSaving(true);
    try {
      const key = `report_config_${selectedReportType}`;
      const value = JSON.stringify(reportConfig);

      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('company_id', companyId)
        .eq('key', key)
        .single();

      if (existing) {
        await supabase
          .from('app_settings')
          .update({ value })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('app_settings')
          .insert({
            company_id: companyId,
            key,
            value,
          });
      }

      queryClient.invalidateQueries({ queryKey: ['report-config', companyId, selectedReportType] });
      toast.success('تم حفظ إعدادات التقرير بنجاح');
    } catch (error) {
      console.error('Error saving report settings:', error);
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    const defaultReport = REPORT_TYPES.find(r => r.id === selectedReportType);
    if (defaultReport) {
      setReportConfig({
        id: selectedReportType,
        columns: [...defaultReport.columns],
        headerColor: '#3b82f6',
        paperOrientation: 'landscape',
        fontSize: 'medium',
        showLogo: true,
        showHeader: true,
        showFooter: true,
        rowHeight: 35,
      });
      toast.info('تم إعادة الإعدادات للقيم الافتراضية');
    }
  };

  const toggleColumnVisibility = (columnId: string) => {
    setReportConfig(prev => ({
      ...prev,
      columns: prev.columns.map(col => 
        col.id === columnId ? { ...col, visible: !col.visible } : col
      ),
    }));
  };

  const updateColumnWidth = (columnId: string, width: number) => {
    setReportConfig(prev => ({
      ...prev,
      columns: prev.columns.map(col => 
        col.id === columnId ? { ...col, width } : col
      ),
    }));
  };

  const updateColumnHeight = (columnId: string, height: number) => {
    setReportConfig(prev => ({
      ...prev,
      columns: prev.columns.map(col => 
        col.id === columnId ? { ...col, height } : col
      ),
    }));
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            اختيار نوع التقرير
          </CardTitle>
          <CardDescription>
            اختر التقرير الذي تريد تخصيصه
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedReportType} onValueChange={setSelectedReportType}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="اختر نوع التقرير" />
            </SelectTrigger>
            <SelectContent>
              {REPORT_TYPES.map(report => (
                <SelectItem key={report.id} value={report.id}>
                  {report.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs defaultValue="columns" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="columns">تخصيص الأعمدة</TabsTrigger>
          <TabsTrigger value="style">التنسيق والألوان</TabsTrigger>
          <TabsTrigger value="layout">تخطيط الصفحة</TabsTrigger>
        </TabsList>

        {/* Columns Customization Tab */}
        <TabsContent value="columns">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Move className="w-5 h-5" />
                تخصيص أعمدة التقرير
              </CardTitle>
              <CardDescription>
                اسحب الأعمدة لإعادة ترتيبها، وتحكم في الإظهار والإخفاء والحجم
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {reportConfig.columns.map((column, index) => (
                  <div
                    key={column.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className={`p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-move ${
                      !column.visible ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Drag Handle */}
                      <div className="cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-5 h-5 text-muted-foreground" />
                      </div>
                      
                      {/* Column Name */}
                      <div className="min-w-[120px] font-medium">
                        {column.name}
                      </div>
                      
                      {/* Visibility Toggle */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleColumnVisibility(column.id)}
                        className="gap-2"
                      >
                        {column.visible ? (
                          <><Eye className="w-4 h-4" /> ظاهر</>
                        ) : (
                          <><EyeOff className="w-4 h-4" /> مخفي</>
                        )}
                      </Button>
                      
                      {/* Width Slider */}
                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <Label className="text-xs whitespace-nowrap">العرض:</Label>
                        <Slider
                          value={[column.width]}
                          onValueChange={([value]) => updateColumnWidth(column.id, value)}
                          min={30}
                          max={300}
                          step={5}
                          className="flex-1"
                        />
                        <span className="text-xs w-12 text-muted-foreground">{column.width}px</span>
                      </div>
                      
                      {/* Height Slider */}
                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <Label className="text-xs whitespace-nowrap">الارتفاع:</Label>
                        <Slider
                          value={[column.height]}
                          onValueChange={([value]) => updateColumnHeight(column.id, value)}
                          min={25}
                          max={80}
                          step={5}
                          className="flex-1"
                        />
                        <span className="text-xs w-12 text-muted-foreground">{column.height}px</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Style Tab */}
        <TabsContent value="style">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                تنسيق التقرير
              </CardTitle>
              <CardDescription>
                تخصيص ألوان وأحجام الخطوط
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Header Color */}
                <div className="space-y-2">
                  <Label>لون رأس الجدول</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={reportConfig.headerColor}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, headerColor: e.target.value }))}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={reportConfig.headerColor}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, headerColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                {/* Font Size */}
                <div className="space-y-2">
                  <Label>حجم الخط</Label>
                  <Select
                    value={reportConfig.fontSize}
                    onValueChange={(value: 'small' | 'medium' | 'large') => 
                      setReportConfig(prev => ({ ...prev, fontSize: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">صغير (11px)</SelectItem>
                      <SelectItem value="medium">متوسط (12px)</SelectItem>
                      <SelectItem value="large">كبير (14px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row Height */}
              <div className="space-y-2">
                <Label>ارتفاع الصفوف الافتراضي</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[reportConfig.rowHeight]}
                    onValueChange={([value]) => setReportConfig(prev => ({ ...prev, rowHeight: value }))}
                    min={25}
                    max={80}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm w-16 text-muted-foreground">{reportConfig.rowHeight}px</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                تخطيط الصفحة
              </CardTitle>
              <CardDescription>
                التحكم في اتجاه الطباعة والعناصر
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Paper Orientation */}
              <div className="space-y-2">
                <Label>اتجاه الصفحة</Label>
                <Select
                  value={reportConfig.paperOrientation}
                  onValueChange={(value: 'portrait' | 'landscape') => 
                    setReportConfig(prev => ({ ...prev, paperOrientation: value }))
                  }
                >
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">طولي (Portrait)</SelectItem>
                    <SelectItem value="landscape">عرضي (Landscape)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Toggle Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="show_logo">إظهار الشعار</Label>
                  <Switch
                    id="show_logo"
                    checked={reportConfig.showLogo}
                    onCheckedChange={(checked) => setReportConfig(prev => ({ ...prev, showLogo: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="show_header">إظهار رأس التقرير</Label>
                  <Switch
                    id="show_header"
                    checked={reportConfig.showHeader}
                    onCheckedChange={(checked) => setReportConfig(prev => ({ ...prev, showHeader: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="show_footer">إظهار التذييل</Label>
                  <Switch
                    id="show_footer"
                    checked={reportConfig.showFooter}
                    onCheckedChange={(checked) => setReportConfig(prev => ({ ...prev, showFooter: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>معاينة التقرير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-white overflow-x-auto">
            {/* Header Preview */}
            {reportConfig.showHeader && (
              <div className="flex justify-between items-center border-b-2 pb-4 mb-4" style={{ borderColor: reportConfig.headerColor }}>
                <div className="text-right">
                  <div className="text-lg font-bold">اسم الشركة</div>
                  <div className="text-xs text-gray-500">عنوان الشركة</div>
                </div>
                {reportConfig.showLogo && (
                  <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                    الشعار
                  </div>
                )}
              </div>
            )}

            {/* Table Preview */}
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  {reportConfig.columns.filter(c => c.visible).map(col => (
                    <th 
                      key={col.id}
                      className="p-2 text-white text-right border"
                      style={{ 
                        backgroundColor: reportConfig.headerColor,
                        width: `${col.width}px`,
                        height: `${col.height}px`,
                      }}
                    >
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-50">
                  {reportConfig.columns.filter(c => c.visible).map(col => (
                    <td 
                      key={col.id}
                      className="p-2 border border-gray-200"
                      style={{ height: `${reportConfig.rowHeight}px` }}
                    >
                      بيانات
                    </td>
                  ))}
                </tr>
                <tr>
                  {reportConfig.columns.filter(c => c.visible).map(col => (
                    <td 
                      key={col.id}
                      className="p-2 border border-gray-200"
                      style={{ height: `${reportConfig.rowHeight}px` }}
                    >
                      بيانات
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            {/* Footer Preview */}
            {reportConfig.showFooter && (
              <div className="mt-4 pt-2 border-t text-xs text-gray-400 flex justify-between">
                <span>{new Date().toLocaleDateString('ar-SA')}</span>
                <span>صفحة 1</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end sticky bottom-4 bg-background p-4 rounded-lg shadow-lg border">
        <Button variant="outline" onClick={handleResetDefaults} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          إعادة للافتراضي
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ الإعدادات
        </Button>
      </div>
    </div>
  );
}
