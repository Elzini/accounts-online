import { useState } from 'react';
import { Plus, Pencil, Trash2, FileText, Eye, Copy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useCustomReports, 
  useCreateCustomReport, 
  useUpdateCustomReport, 
  useDeleteCustomReport 
} from '@/hooks/useSystemControl';
import { SOURCE_TABLES, TABLE_FIELDS, CustomReport, ReportColumn } from '@/services/systemControl';
import { toast } from 'sonner';

export function CustomReportsTab() {
  const { data: reports = [], isLoading } = useCustomReports();
  const createReport = useCreateCustomReport();
  const updateReport = useUpdateCustomReport();
  const deleteReport = useDeleteCustomReport();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<CustomReport | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    report_type: 'table' as const,
    source_table: '',
    columns: [] as ReportColumn[],
    is_active: true,
  });

  const openCreateDialog = () => {
    setEditingReport(null);
    setFormData({
      name: '',
      description: '',
      report_type: 'table',
      source_table: '',
      columns: [],
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (report: CustomReport) => {
    setEditingReport(report);
    setFormData({
      name: report.name,
      description: report.description || '',
      report_type: report.report_type as 'table',
      source_table: report.source_table,
      columns: report.columns,
      is_active: report.is_active,
    });
    setDialogOpen(true);
  };

  const handleSourceTableChange = (table: string) => {
    const fields = TABLE_FIELDS[table] || [];
    const columns: ReportColumn[] = fields.map((field, index) => ({
      field: field.field,
      label: field.label,
      visible: true,
      order: index,
    }));
    setFormData(prev => ({ ...prev, source_table: table, columns }));
  };

  const handleColumnToggle = (field: string, visible: boolean) => {
    setFormData(prev => ({
      ...prev,
      columns: prev.columns.map(col => 
        col.field === field ? { ...col, visible } : col
      ),
    }));
  };

  const handleColumnLabelChange = (field: string, label: string) => {
    setFormData(prev => ({
      ...prev,
      columns: prev.columns.map(col => 
        col.field === field ? { ...col, label } : col
      ),
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.source_table) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    try {
      if (editingReport) {
        await updateReport.mutateAsync({
          id: editingReport.id,
          updates: {
            name: formData.name,
            description: formData.description,
            report_type: formData.report_type,
            source_table: formData.source_table,
            columns: formData.columns,
            is_active: formData.is_active,
          },
        });
        toast.success('تم تحديث التقرير بنجاح');
      } else {
        await createReport.mutateAsync({
          name: formData.name,
          description: formData.description,
          report_type: formData.report_type,
          source_table: formData.source_table,
          columns: formData.columns,
          filters: [],
          grouping: [],
          sorting: [],
          styling: {},
          is_active: formData.is_active,
        });
        toast.success('تم إنشاء التقرير بنجاح');
      }
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('حدث خطأ أثناء حفظ التقرير');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التقرير؟')) return;
    try {
      await deleteReport.mutateAsync(id);
      toast.success('تم حذف التقرير');
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const handleToggleActive = async (report: CustomReport) => {
    try {
      await updateReport.mutateAsync({
        id: report.id,
        updates: { is_active: !report.is_active },
      });
      toast.success(report.is_active ? 'تم تعطيل التقرير' : 'تم تفعيل التقرير');
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const getSourceTableLabel = (table: string) => {
    return SOURCE_TABLES.find(t => t.value === table)?.label || table;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>التقارير المخصصة</CardTitle>
                <CardDescription>
                  إنشاء وإدارة تقارير مخصصة حسب احتياجاتك
                </CardDescription>
              </div>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 ml-2" />
              إنشاء تقرير
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد تقارير مخصصة بعد</p>
              <p className="text-sm">أنشئ تقريرك الأول الآن</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم التقرير</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>مصدر البيانات</TableHead>
                  <TableHead>عدد الأعمدة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {report.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getSourceTableLabel(report.source_table)}</Badge>
                    </TableCell>
                    <TableCell>
                      {report.columns.filter(c => c.visible).length} / {report.columns.length}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={report.is_active}
                        onCheckedChange={() => handleToggleActive(report)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(report)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(report.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingReport ? 'تعديل التقرير' : 'إنشاء تقرير جديد'}</DialogTitle>
            <DialogDescription>
              حدد مصدر البيانات والأعمدة التي تريد عرضها
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم التقرير *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="مثال: تقرير المبيعات الشهري"
                  />
                </div>

                <div className="space-y-2">
                  <Label>مصدر البيانات *</Label>
                  <Select
                    value={formData.source_table}
                    onValueChange={handleSourceTableChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مصدر البيانات" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_TABLES.map((table) => (
                        <SelectItem key={table.value} value={table.value}>
                          {table.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف مختصر للتقرير..."
                  rows={2}
                />
              </div>

              {formData.columns.length > 0 && (
                <div className="space-y-3">
                  <Label>الأعمدة</Label>
                  <div className="border rounded-lg divide-y">
                    {formData.columns.map((column) => (
                      <div key={column.field} className="flex items-center gap-4 p-3">
                        <Checkbox
                          checked={column.visible}
                          onCheckedChange={(checked) => handleColumnToggle(column.field, !!checked)}
                        />
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">الحقل</Label>
                            <p className="text-sm font-mono">{column.field}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">العنوان</Label>
                            <Input
                              value={column.label}
                              onChange={(e) => handleColumnLabelChange(column.field, e.target.value)}
                              className="h-8"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={createReport.isPending || updateReport.isPending}>
              {editingReport ? 'تحديث' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
