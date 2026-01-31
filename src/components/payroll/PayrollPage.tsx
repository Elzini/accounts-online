import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  usePayrollRecords, 
  usePayrollWithItems,
  useCreatePayroll,
  useUpdatePayrollItem,
  useUpdatePayrollTotals,
  useApprovePayroll,
  useDeletePayroll,
  useEmployees,
} from '@/hooks/usePayroll';
import { PayrollItem } from '@/services/payroll';
import { toast } from 'sonner';
import { 
  Loader2, 
  Plus, 
  FileText, 
  CheckCircle2,
  Printer,
  Trash2,
  Calculator,
  Calendar,
  DollarSign,
  Users,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUnifiedPrintReport, UnifiedReportColumn } from '@/hooks/useUnifiedPrintReport';
import { useAppSettings } from '@/hooks/useSettings';
import { useExcelExport } from '@/hooks/useExcelExport';

const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export function PayrollPage() {
  const { data: payrollRecords = [], isLoading } = usePayrollRecords();
  const { data: employees = [] } = useEmployees();
  const createPayroll = useCreatePayroll();
  const approvePayroll = useApprovePayroll();
  const deletePayroll = useDeletePayroll();
  const { data: settings } = useAppSettings();

  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null);
  const { data: selectedPayroll } = usePayrollWithItems(selectedPayrollId);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { printReport } = useUnifiedPrintReport();
  const { exportToExcel } = useExcelExport();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleCreatePayroll = async () => {
    try {
      const payroll = await createPayroll.mutateAsync({ month: newMonth, year: newYear });
      toast.success('تم إنشاء مسير الرواتب بنجاح');
      setIsCreateDialogOpen(false);
      setSelectedPayrollId(payroll.id);
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        toast.error('يوجد مسير رواتب لهذا الشهر بالفعل');
      } else {
        toast.error('حدث خطأ أثناء إنشاء مسير الرواتب');
      }
    }
  };

  const handleApprovePayroll = async () => {
    if (!selectedPayrollId) return;
    try {
      await approvePayroll.mutateAsync(selectedPayrollId);
      toast.success('تم اعتماد مسير الرواتب وإنشاء القيد المحاسبي');
    } catch (error) {
      toast.error('حدث خطأ أثناء الاعتماد');
    }
  };

  const handleDeletePayroll = async () => {
    if (!deleteId) return;
    try {
      await deletePayroll.mutateAsync(deleteId);
      toast.success('تم حذف مسير الرواتب');
      setDeleteId(null);
      if (selectedPayrollId === deleteId) {
        setSelectedPayrollId(null);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">مسودة</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-emerald-500">معتمد</Badge>;
      case 'paid':
        return <Badge variant="default" className="bg-blue-500">مدفوع</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="w-6 h-6" />
            مسير الرواتب الشهري
          </h1>
          <p className="text-muted-foreground">إدارة وإعداد رواتب الموظفين الشهرية</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={employees.length === 0}>
              <Plus className="w-4 h-4" />
              إنشاء مسير جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء مسير رواتب جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الشهر</Label>
                  <Select value={newMonth.toString()} onValueChange={(v) => setNewMonth(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month, i) => (
                        <SelectItem key={i} value={(i + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>السنة</Label>
                  <Select value={newYear.toString()} onValueChange={(v) => setNewYear(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026, 2027].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreatePayroll}
                disabled={createPayroll.isPending}
              >
                {createPayroll.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                إنشاء المسير
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {employees.length === 0 && (
        <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
              <AlertCircle className="w-5 h-5" />
              <p>يجب إضافة موظفين أولاً قبل إنشاء مسير الرواتب</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">سجلات المسيرات</TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedPayrollId}>
            تفاصيل المسير
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                سجلات مسيرات الرواتب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الشهر</TableHead>
                      <TableHead className="text-right">السنة</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">إجمالي الرواتب الأساسية</TableHead>
                      <TableHead className="text-right">إجمالي البدلات</TableHead>
                      <TableHead className="text-right">إجمالي الخصومات</TableHead>
                      <TableHead className="text-right">صافي الرواتب</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRecords.map((record) => (
                      <TableRow 
                        key={record.id}
                        className={selectedPayrollId === record.id ? 'bg-muted' : 'cursor-pointer hover:bg-muted/50'}
                        onClick={() => setSelectedPayrollId(record.id)}
                      >
                        <TableCell className="font-medium">{MONTHS[record.month - 1]}</TableCell>
                        <TableCell>{record.year}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>{formatCurrency(record.total_base_salaries)}</TableCell>
                        <TableCell>{formatCurrency(record.total_allowances)}</TableCell>
                        <TableCell className="text-rose-600">
                          {formatCurrency(record.total_deductions + record.total_advances + record.total_absences)}
                        </TableCell>
                        <TableCell className="font-bold text-emerald-600">
                          {formatCurrency(record.total_net_salaries)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPayrollId(record.id);
                              }}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                            {record.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteId(record.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {payrollRecords.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          لا توجد مسيرات رواتب
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          {selectedPayroll && (
            <PayrollDetailsSection 
              payroll={selectedPayroll}
              onApprove={handleApprovePayroll}
              isApproving={approvePayroll.isPending}
              onPrint={printReport}
              onExportExcel={exportToExcel}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف مسير الرواتب نهائياً. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePayroll} className="bg-destructive text-destructive-foreground">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface PayrollDetailsSectionProps {
  payroll: any;
  onApprove: () => void;
  isApproving: boolean;
  onPrint: (options: any) => void;
  onExportExcel: (options: any) => void;
}

function PayrollDetailsSection({ 
  payroll, 
  onApprove, 
  isApproving, 
  onPrint,
  onExportExcel,
}: PayrollDetailsSectionProps) {
  const updatePayrollItem = useUpdatePayrollItem();
  const updatePayrollTotals = useUpdatePayrollTotals();

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PayrollItem>>({});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const startEditing = (item: PayrollItem) => {
    setEditingItemId(item.id);
    setEditForm({
      base_salary: item.base_salary,
      housing_allowance: item.housing_allowance,
      transport_allowance: item.transport_allowance,
      bonus: item.bonus,
      overtime_hours: item.overtime_hours,
      overtime_rate: item.overtime_rate,
      overtime_amount: item.overtime_amount,
      advances_deducted: item.advances_deducted,
      absence_days: item.absence_days,
      absence_amount: item.absence_amount,
      other_deductions: item.other_deductions,
      deduction_notes: item.deduction_notes,
    });
  };

  const saveEditing = async () => {
    if (!editingItemId) return;
    try {
      await updatePayrollItem.mutateAsync({ itemId: editingItemId, updates: editForm });
      await updatePayrollTotals.mutateAsync(payroll.id);
      toast.success('تم حفظ التعديلات');
      setEditingItemId(null);
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const items: PayrollItem[] = payroll.items || [];

  const handlePrintPayroll = () => {
    // Prepare data for unified print
    const columns: UnifiedReportColumn[] = [
      { header: 'م', key: 'index', align: 'center', width: '40px' },
      { header: 'الاسم', key: 'name', align: 'right' },
      { header: 'المسمى الوظيفي', key: 'job_title', align: 'right' },
      { header: 'الراتب', key: 'base_salary', align: 'right', type: 'currency' },
      { header: 'الحوافز', key: 'bonus', align: 'right', type: 'currency' },
      { header: 'أوفرتايم', key: 'overtime', align: 'right', type: 'currency' },
      { header: 'إجمالي الراتب', key: 'gross_salary', align: 'right', type: 'currency' },
      { header: 'سلفيات', key: 'advances', align: 'right', type: 'currency' },
      { header: 'خصم', key: 'deductions', align: 'right', type: 'currency' },
      { header: 'ملاحظات', key: 'notes', align: 'right' },
      { header: 'قيمة الغياب', key: 'absence', align: 'right', type: 'currency' },
      { header: 'إجمالي المستقطع', key: 'total_deductions', align: 'right', type: 'currency', className: 'text-danger' },
      { header: 'صافي الراتب', key: 'net_salary', align: 'right', type: 'currency', className: 'text-success' },
    ];

    const data = items.map((item, index) => {
      const grossSalary = Number(item.base_salary) + Number(item.housing_allowance) + 
        Number(item.transport_allowance) + Number(item.bonus) + Number(item.overtime_amount);
      const totalDeductions = Number(item.advances_deducted) + Number(item.absence_amount) + 
        Number(item.other_deductions);
      
      return {
        index: index + 1,
        name: item.employee?.name || '-',
        job_title: item.employee?.job_title || '-',
        base_salary: item.base_salary,
        bonus: item.bonus,
        overtime: item.overtime_amount,
        gross_salary: grossSalary,
        advances: item.advances_deducted,
        deductions: item.other_deductions,
        notes: item.deduction_notes || '-',
        absence: item.absence_amount,
        total_deductions: totalDeductions,
        net_salary: item.net_salary,
      };
    });

    const grossTotal = payroll.total_base_salaries + payroll.total_allowances + 
      payroll.total_bonuses + payroll.total_overtime;
    const totalDeductionsSum = payroll.total_advances + payroll.total_deductions + payroll.total_absences;

    const summaryRow = {
      index: '',
      name: 'الإجمالي',
      job_title: '',
      base_salary: payroll.total_base_salaries,
      bonus: payroll.total_bonuses,
      overtime: payroll.total_overtime,
      gross_salary: grossTotal,
      advances: payroll.total_advances,
      deductions: payroll.total_deductions,
      notes: '',
      absence: payroll.total_absences,
      total_deductions: totalDeductionsSum,
      net_salary: payroll.total_net_salaries,
    };

    onPrint({
      title: 'مسير الرواتب',
      subtitle: `${MONTHS[payroll.month - 1]} ${payroll.year}`,
      columns,
      data,
      summaryRow,
      showSignatures: true,
      signatureLabels: ['توقيع المحاسب', 'توقيع المدير العام', 'توقيع المدير المالي'],
    });
  };

  const handleExportExcel = () => {
    const excelColumns = [
      { header: 'م', key: 'index' },
      { header: 'الاسم', key: 'name' },
      { header: 'المسمى الوظيفي', key: 'job_title' },
      { header: 'الراتب', key: 'base_salary' },
      { header: 'الحوافز', key: 'bonus' },
      { header: 'أوفرتايم', key: 'overtime' },
      { header: 'إجمالي الراتب', key: 'gross_salary' },
      { header: 'سلفيات', key: 'advances' },
      { header: 'خصم', key: 'deductions' },
      { header: 'ملاحظات', key: 'notes' },
      { header: 'قيمة الغياب', key: 'absence' },
      { header: 'إجمالي المستقطع', key: 'total_deductions' },
      { header: 'صافي الراتب', key: 'net_salary' },
    ];

    const excelData = items.map((item, index) => {
      const grossSalary = Number(item.base_salary) + Number(item.housing_allowance) + 
        Number(item.transport_allowance) + Number(item.bonus) + Number(item.overtime_amount);
      const totalDeductions = Number(item.advances_deducted) + Number(item.absence_amount) + 
        Number(item.other_deductions);
      
      return {
        index: index + 1,
        name: item.employee?.name || '-',
        job_title: item.employee?.job_title || '-',
        base_salary: Number(item.base_salary),
        bonus: Number(item.bonus),
        overtime: Number(item.overtime_amount),
        gross_salary: grossSalary,
        advances: Number(item.advances_deducted),
        deductions: Number(item.other_deductions),
        notes: item.deduction_notes || '-',
        absence: Number(item.absence_amount),
        total_deductions: totalDeductions,
        net_salary: Number(item.net_salary),
      };
    });

    onExportExcel({
      title: `مسير الرواتب - ${MONTHS[payroll.month - 1]} ${payroll.year}`,
      columns: excelColumns,
      data: excelData,
      fileName: `مسير_الرواتب_${MONTHS[payroll.month - 1]}_${payroll.year}`,
      summaryData: [
        { label: 'إجمالي الرواتب الأساسية', value: payroll.total_base_salaries },
        { label: 'إجمالي البدلات', value: payroll.total_allowances },
        { label: 'إجمالي الخصومات', value: payroll.total_advances + payroll.total_deductions + payroll.total_absences },
        { label: 'صافي الرواتب', value: payroll.total_net_salaries },
      ],
    });
    toast.success('تم تصدير مسير الرواتب بنجاح');
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-base px-3 py-1">
            {MONTHS[payroll.month - 1]} {payroll.year}
          </Badge>
          {payroll.status === 'draft' ? (
            <Badge variant="secondary">مسودة</Badge>
          ) : (
            <Badge variant="default" className="bg-emerald-500">معتمد</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-4 h-4 ml-2" />
            تصدير Excel
          </Button>
          <Button variant="outline" onClick={handlePrintPayroll}>
            <Printer className="w-4 h-4 ml-2" />
            طباعة
          </Button>
          {payroll.status === 'draft' && (
            <Button onClick={onApprove} disabled={isApproving} className="bg-emerald-600 hover:bg-emerald-700">
              {isApproving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              <CheckCircle2 className="w-4 h-4 ml-2" />
              اعتماد المسير
            </Button>
          )}
        </div>
      </div>

      {/* Table View */}
      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">المسمى الوظيفي</TableHead>
                <TableHead className="text-right">الراتب</TableHead>
                <TableHead className="text-right">الحوافز</TableHead>
                <TableHead className="text-right">أوفرتايم</TableHead>
                <TableHead className="text-right">إجمالي الراتب</TableHead>
                <TableHead className="text-right">سلفيات</TableHead>
                <TableHead className="text-right">خصم</TableHead>
                <TableHead className="text-right">ملاحظات</TableHead>
                <TableHead className="text-right">قيمة الغياب</TableHead>
                <TableHead className="text-right">إجمالي المستقطع</TableHead>
                <TableHead className="text-right">صافي الراتب</TableHead>
                <TableHead className="text-right">تعديل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const grossSalary = Number(item.base_salary) + Number(item.housing_allowance) + 
                  Number(item.transport_allowance) + Number(item.bonus) + Number(item.overtime_amount);
                const totalDeductions = Number(item.advances_deducted) + Number(item.absence_amount) + 
                  Number(item.other_deductions);

                if (editingItemId === item.id && payroll.status === 'draft') {
                  return (
                    <TableRow key={item.id} className="bg-blue-50 dark:bg-blue-950/30">
                      <TableCell>{item.employee?.name}</TableCell>
                      <TableCell>{item.employee?.job_title}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={editForm.base_salary}
                          onChange={(e) => setEditForm({ ...editForm, base_salary: parseFloat(e.target.value) || 0 })}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={editForm.bonus}
                          onChange={(e) => setEditForm({ ...editForm, bonus: parseFloat(e.target.value) || 0 })}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={editForm.overtime_amount}
                          onChange={(e) => setEditForm({ ...editForm, overtime_amount: parseFloat(e.target.value) || 0 })}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell className="font-medium">-</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={editForm.advances_deducted}
                          onChange={(e) => setEditForm({ ...editForm, advances_deducted: parseFloat(e.target.value) || 0 })}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={editForm.other_deductions}
                          onChange={(e) => setEditForm({ ...editForm, other_deductions: parseFloat(e.target.value) || 0 })}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editForm.deduction_notes || ''}
                          onChange={(e) => setEditForm({ ...editForm, deduction_notes: e.target.value })}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={editForm.absence_amount}
                          onChange={(e) => setEditForm({ ...editForm, absence_amount: parseFloat(e.target.value) || 0 })}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" onClick={saveEditing}>
                            حفظ
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingItemId(null)}>
                            إلغاء
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow 
                    key={item.id} 
                    className={payroll.status === 'draft' ? 'cursor-pointer hover:bg-muted/50' : ''}
                    onClick={() => payroll.status === 'draft' && startEditing(item)}
                  >
                    <TableCell className="font-medium">{item.employee?.name}</TableCell>
                    <TableCell>{item.employee?.job_title}</TableCell>
                    <TableCell>{formatCurrency(item.base_salary)}</TableCell>
                    <TableCell>{formatCurrency(item.bonus)}</TableCell>
                    <TableCell>{formatCurrency(item.overtime_amount)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(grossSalary)}</TableCell>
                    <TableCell>{formatCurrency(item.advances_deducted)}</TableCell>
                    <TableCell>{formatCurrency(item.other_deductions)}</TableCell>
                    <TableCell className="text-sm">{item.deduction_notes || '-'}</TableCell>
                    <TableCell>{formatCurrency(item.absence_amount)}</TableCell>
                    <TableCell className="text-rose-600">{formatCurrency(totalDeductions)}</TableCell>
                    <TableCell className="font-bold text-emerald-600">{formatCurrency(item.net_salary)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                );
              })}
              {/* Totals Row */}
              <TableRow className="font-bold bg-muted">
                <TableCell colSpan={2}>إجمالي الرواتب</TableCell>
                <TableCell>{formatCurrency(payroll.total_base_salaries)}</TableCell>
                <TableCell>{formatCurrency(payroll.total_bonuses)}</TableCell>
                <TableCell>{formatCurrency(payroll.total_overtime)}</TableCell>
                <TableCell>
                  {formatCurrency(
                    payroll.total_base_salaries + payroll.total_allowances + 
                    payroll.total_bonuses + payroll.total_overtime
                  )}
                </TableCell>
                <TableCell>{formatCurrency(payroll.total_advances)}</TableCell>
                <TableCell>{formatCurrency(payroll.total_deductions)}</TableCell>
                <TableCell></TableCell>
                <TableCell>{formatCurrency(payroll.total_absences)}</TableCell>
                <TableCell className="text-rose-600">
                  {formatCurrency(payroll.total_advances + payroll.total_deductions + payroll.total_absences)}
                </TableCell>
                <TableCell className="text-emerald-600">{formatCurrency(payroll.total_net_salaries)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
