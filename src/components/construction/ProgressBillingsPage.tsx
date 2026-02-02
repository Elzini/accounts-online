import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Receipt, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ProgressBilling {
  id: string;
  billing_number: number;
  project_id: string | null;
  contract_id: string | null;
  billing_date: string;
  period_start: string | null;
  period_end: string | null;
  work_completed_value: number;
  previous_billings: number;
  retention_amount: number;
  advance_deduction: number;
  other_deductions: number;
  vat_amount: number;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  project?: { project_name: string } | null;
  contract?: { title: string } | null;
}

const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  submitted: 'مقدم',
  approved: 'معتمد',
  paid: 'مدفوع',
  rejected: 'مرفوض',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  submitted: 'bg-blue-500',
  approved: 'bg-green-500',
  paid: 'bg-purple-500',
  rejected: 'bg-red-500',
};

export function ProgressBillingsPage() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBilling, setEditingBilling] = useState<ProgressBilling | null>(null);
  const [formData, setFormData] = useState({
    project_id: '',
    contract_id: '',
    billing_date: format(new Date(), 'yyyy-MM-dd'),
    period_start: '',
    period_end: '',
    work_completed_value: '',
    previous_billings: '',
    retention_amount: '',
    advance_deduction: '',
    other_deductions: '',
    vat_amount: '',
    status: 'draft',
    notes: '',
  });

  const { data: billings = [], isLoading } = useQuery({
    queryKey: ['progress-billings', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('progress_billings')
        .select('*, project:projects(project_name), contract:contracts(title)')
        .eq('company_id', companyId)
        .order('billing_number', { ascending: false });

      if (error) throw error;
      return data as ProgressBilling[];
    },
    enabled: !!companyId,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-list', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, project_name')
        .eq('company_id', companyId)
        .order('project_name');

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts-list', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('id, title, project_id')
        .eq('company_id', companyId)
        .order('title');

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createBilling = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('progress_billings').insert({
        company_id: companyId,
        project_id: data.project_id || null,
        contract_id: data.contract_id || null,
        billing_date: data.billing_date,
        period_start: data.period_start || null,
        period_end: data.period_end || null,
        work_completed_value: parseFloat(data.work_completed_value) || 0,
        previous_billings: parseFloat(data.previous_billings) || 0,
        retention_amount: parseFloat(data.retention_amount) || 0,
        advance_deduction: parseFloat(data.advance_deduction) || 0,
        other_deductions: parseFloat(data.other_deductions) || 0,
        vat_amount: parseFloat(data.vat_amount) || 0,
        status: data.status,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-billings'] });
      toast.success('تم إنشاء المستخلص بنجاح');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('حدث خطأ أثناء إنشاء المستخلص');
    },
  });

  const updateBilling = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('progress_billings')
        .update({
          project_id: data.project_id || null,
          contract_id: data.contract_id || null,
          billing_date: data.billing_date,
          period_start: data.period_start || null,
          period_end: data.period_end || null,
          work_completed_value: parseFloat(data.work_completed_value) || 0,
          previous_billings: parseFloat(data.previous_billings) || 0,
          retention_amount: parseFloat(data.retention_amount) || 0,
          advance_deduction: parseFloat(data.advance_deduction) || 0,
          other_deductions: parseFloat(data.other_deductions) || 0,
          vat_amount: parseFloat(data.vat_amount) || 0,
          status: data.status,
          notes: data.notes || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-billings'] });
      toast.success('تم تحديث المستخلص بنجاح');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('حدث خطأ أثناء تحديث المستخلص');
    },
  });

  const deleteBilling = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('progress_billings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-billings'] });
      toast.success('تم حذف المستخلص بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حذف المستخلص');
    },
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBilling(null);
    setFormData({
      project_id: '',
      contract_id: '',
      billing_date: format(new Date(), 'yyyy-MM-dd'),
      period_start: '',
      period_end: '',
      work_completed_value: '',
      previous_billings: '',
      retention_amount: '',
      advance_deduction: '',
      other_deductions: '',
      vat_amount: '',
      status: 'draft',
      notes: '',
    });
  };

  const handleEdit = (billing: ProgressBilling) => {
    setEditingBilling(billing);
    setFormData({
      project_id: billing.project_id || '',
      contract_id: billing.contract_id || '',
      billing_date: billing.billing_date,
      period_start: billing.period_start || '',
      period_end: billing.period_end || '',
      work_completed_value: billing.work_completed_value?.toString() || '',
      previous_billings: billing.previous_billings?.toString() || '',
      retention_amount: billing.retention_amount?.toString() || '',
      advance_deduction: billing.advance_deduction?.toString() || '',
      other_deductions: billing.other_deductions?.toString() || '',
      vat_amount: billing.vat_amount?.toString() || '',
      status: billing.status,
      notes: billing.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBilling) {
      updateBilling.mutate({ id: editingBilling.id, data: formData });
    } else {
      createBilling.mutate(formData);
    }
  };

  // Calculate net payable
  const calculateNetPayable = () => {
    const workCompleted = parseFloat(formData.work_completed_value) || 0;
    const previousBillings = parseFloat(formData.previous_billings) || 0;
    const retention = parseFloat(formData.retention_amount) || 0;
    const advance = parseFloat(formData.advance_deduction) || 0;
    const other = parseFloat(formData.other_deductions) || 0;
    const vat = parseFloat(formData.vat_amount) || 0;
    
    return workCompleted - previousBillings - retention - advance - other + vat;
  };

  const filteredBillings = billings.filter(
    (b) =>
      b.project?.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.contract?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            المستخلصات
          </h1>
          <p className="text-muted-foreground">
            إدارة مستخلصات الأعمال والدفعات
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 ml-2" />
          مستخلص جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث عن مستخلص..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : filteredBillings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد مستخلصات
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم المستخلص</TableHead>
                  <TableHead>المشروع</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>إجمالي الأعمال</TableHead>
                  <TableHead>المستخلص الحالي</TableHead>
                  <TableHead>الصافي المستحق</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBillings.map((billing) => {
                  const currentBilling = billing.work_completed_value - billing.previous_billings;
                  const netPayable = currentBilling - billing.retention_amount - billing.advance_deduction - billing.other_deductions + billing.vat_amount;
                  
                  return (
                    <TableRow key={billing.id}>
                      <TableCell className="font-medium">
                        #{billing.billing_number}
                      </TableCell>
                      <TableCell>{billing.project?.project_name || '-'}</TableCell>
                      <TableCell>
                        {format(new Date(billing.billing_date), 'yyyy-MM-dd')}
                      </TableCell>
                      <TableCell>{formatCurrency(billing.work_completed_value)}</TableCell>
                      <TableCell>{formatCurrency(currentBilling)}</TableCell>
                      <TableCell className="font-medium text-primary">
                        {formatCurrency(netPayable)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[billing.status]}>
                          {statusLabels[billing.status] || billing.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(billing)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => {
                              if (confirm('هل أنت متأكد من حذف هذا المستخلص؟')) {
                                deleteBilling.mutate(billing.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingBilling ? 'تعديل المستخلص' : 'إضافة مستخلص جديد'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المشروع</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, project_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المشروع" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.project_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>العقد</Label>
                <Select
                  value={formData.contract_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, contract_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العقد" />
                  </SelectTrigger>
                  <SelectContent>
                    {contracts
                      .filter((c) => !formData.project_id || c.project_id === formData.project_id)
                      .map((contract) => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>تاريخ المستخلص *</Label>
                <Input
                  type="date"
                  value={formData.billing_date}
                  onChange={(e) =>
                    setFormData({ ...formData, billing_date: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>فترة من</Label>
                <Input
                  type="date"
                  value={formData.period_start}
                  onChange={(e) =>
                    setFormData({ ...formData, period_start: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>فترة إلى</Label>
                <Input
                  type="date"
                  value={formData.period_end}
                  onChange={(e) =>
                    setFormData({ ...formData, period_end: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-4">
              <h3 className="font-semibold">تفاصيل المستخلص</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>إجمالي الأعمال المنفذة</Label>
                  <Input
                    type="number"
                    value={formData.work_completed_value}
                    onChange={(e) =>
                      setFormData({ ...formData, work_completed_value: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>المستخلصات السابقة</Label>
                  <Input
                    type="number"
                    value={formData.previous_billings}
                    onChange={(e) =>
                      setFormData({ ...formData, previous_billings: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>الضمان المحتجز</Label>
                  <Input
                    type="number"
                    value={formData.retention_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, retention_amount: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>خصم الدفعة المقدمة</Label>
                  <Input
                    type="number"
                    value={formData.advance_deduction}
                    onChange={(e) =>
                      setFormData({ ...formData, advance_deduction: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>خصومات أخرى</Label>
                  <Input
                    type="number"
                    value={formData.other_deductions}
                    onChange={(e) =>
                      setFormData({ ...formData, other_deductions: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ضريبة القيمة المضافة</Label>
                  <Input
                    type="number"
                    value={formData.vat_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, vat_amount: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحالة</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">مسودة</SelectItem>
                      <SelectItem value="submitted">مقدم</SelectItem>
                      <SelectItem value="approved">معتمد</SelectItem>
                      <SelectItem value="paid">مدفوع</SelectItem>
                      <SelectItem value="rejected">مرفوض</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-3 bg-background rounded border">
                <div className="flex justify-between items-center">
                  <span className="font-medium">الصافي المستحق:</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(calculateNetPayable())}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createBilling.isPending || updateBilling.isPending}
              >
                {editingBilling ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
