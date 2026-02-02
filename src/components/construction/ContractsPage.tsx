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
import { Plus, Pencil, Trash2, FileText, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Contract {
  id: string;
  contract_number: number;
  project_id: string | null;
  contract_type: string;
  title: string;
  description: string | null;
  contractor_name: string | null;
  contractor_phone: string | null;
  contractor_address: string | null;
  contract_value: number;
  advance_payment: number;
  advance_percentage: number;
  retention_percentage: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  payment_terms: string | null;
  notes: string | null;
  created_at: string;
  project?: { project_name: string } | null;
}

const typeLabels: Record<string, string> = {
  main: 'عقد رئيسي',
  subcontract: 'عقد باطن',
  supply: 'عقد توريد',
  service: 'عقد خدمات',
};

const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  active: 'نشط',
  suspended: 'موقوف',
  completed: 'مكتمل',
  terminated: 'منتهي',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  active: 'bg-green-500',
  suspended: 'bg-yellow-500',
  completed: 'bg-blue-500',
  terminated: 'bg-red-500',
};

export function ContractsPage() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [formData, setFormData] = useState({
    project_id: '',
    contract_type: 'main',
    title: '',
    description: '',
    contractor_name: '',
    contractor_phone: '',
    contractor_address: '',
    contract_value: '',
    advance_payment: '',
    advance_percentage: '',
    retention_percentage: '10',
    start_date: '',
    end_date: '',
    status: 'draft',
    payment_terms: '',
    notes: '',
  });

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*, project:projects(project_name)')
        .eq('company_id', companyId)
        .order('contract_number', { ascending: false });

      if (error) throw error;
      return data as Contract[];
    },
    enabled: !!companyId,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-list', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, project_name, project_code')
        .eq('company_id', companyId)
        .order('project_name');

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createContract = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('contracts').insert({
        company_id: companyId,
        project_id: data.project_id || null,
        contract_type: data.contract_type,
        title: data.title,
        description: data.description || null,
        contractor_name: data.contractor_name || null,
        contractor_phone: data.contractor_phone || null,
        contractor_address: data.contractor_address || null,
        contract_value: parseFloat(data.contract_value) || 0,
        advance_payment: parseFloat(data.advance_payment) || 0,
        advance_percentage: parseFloat(data.advance_percentage) || 0,
        retention_percentage: parseFloat(data.retention_percentage) || 10,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        status: data.status,
        payment_terms: data.payment_terms || null,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('تم إنشاء العقد بنجاح');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('حدث خطأ أثناء إنشاء العقد');
    },
  });

  const updateContract = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('contracts')
        .update({
          project_id: data.project_id || null,
          contract_type: data.contract_type,
          title: data.title,
          description: data.description || null,
          contractor_name: data.contractor_name || null,
          contractor_phone: data.contractor_phone || null,
          contractor_address: data.contractor_address || null,
          contract_value: parseFloat(data.contract_value) || 0,
          advance_payment: parseFloat(data.advance_payment) || 0,
          advance_percentage: parseFloat(data.advance_percentage) || 0,
          retention_percentage: parseFloat(data.retention_percentage) || 10,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          status: data.status,
          payment_terms: data.payment_terms || null,
          notes: data.notes || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('تم تحديث العقد بنجاح');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('حدث خطأ أثناء تحديث العقد');
    },
  });

  const deleteContract = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contracts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('تم حذف العقد بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حذف العقد');
    },
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingContract(null);
    setFormData({
      project_id: '',
      contract_type: 'main',
      title: '',
      description: '',
      contractor_name: '',
      contractor_phone: '',
      contractor_address: '',
      contract_value: '',
      advance_payment: '',
      advance_percentage: '',
      retention_percentage: '10',
      start_date: '',
      end_date: '',
      status: 'draft',
      payment_terms: '',
      notes: '',
    });
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      project_id: contract.project_id || '',
      contract_type: contract.contract_type,
      title: contract.title,
      description: contract.description || '',
      contractor_name: contract.contractor_name || '',
      contractor_phone: contract.contractor_phone || '',
      contractor_address: contract.contractor_address || '',
      contract_value: contract.contract_value?.toString() || '',
      advance_payment: contract.advance_payment?.toString() || '',
      advance_percentage: contract.advance_percentage?.toString() || '',
      retention_percentage: contract.retention_percentage?.toString() || '10',
      start_date: contract.start_date || '',
      end_date: contract.end_date || '',
      status: contract.status,
      payment_terms: contract.payment_terms || '',
      notes: contract.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingContract) {
      updateContract.mutate({ id: editingContract.id, data: formData });
    } else {
      createContract.mutate(formData);
    }
  };

  const filteredContracts = contracts.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contractor_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <FileText className="h-6 w-6" />
            إدارة العقود
          </h1>
          <p className="text-muted-foreground">
            إدارة العقود مع المقاولين والموردين
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 ml-2" />
          عقد جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث عن عقد..."
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
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد عقود
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم العقد</TableHead>
                  <TableHead>عنوان العقد</TableHead>
                  <TableHead>نوع العقد</TableHead>
                  <TableHead>المشروع</TableHead>
                  <TableHead>المقاول</TableHead>
                  <TableHead>قيمة العقد</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      #{contract.contract_number}
                    </TableCell>
                    <TableCell>{contract.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {typeLabels[contract.contract_type] || contract.contract_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{contract.project?.project_name || '-'}</TableCell>
                    <TableCell>{contract.contractor_name || '-'}</TableCell>
                    <TableCell>{formatCurrency(contract.contract_value)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[contract.status]}>
                        {statusLabels[contract.status] || contract.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(contract)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذا العقد؟')) {
                              deleteContract.mutate(contract.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingContract ? 'تعديل العقد' : 'إضافة عقد جديد'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>عنوان العقد *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>نوع العقد</Label>
                <Select
                  value={formData.contract_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, contract_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">عقد رئيسي</SelectItem>
                    <SelectItem value="subcontract">عقد باطن</SelectItem>
                    <SelectItem value="supply">عقد توريد</SelectItem>
                    <SelectItem value="service">عقد خدمات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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
                  <SelectItem value="">بدون مشروع</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم المقاول/المورد</Label>
                <Input
                  value={formData.contractor_name}
                  onChange={(e) =>
                    setFormData({ ...formData, contractor_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                <Input
                  value={formData.contractor_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, contractor_phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>قيمة العقد (ر.س)</Label>
                <Input
                  type="number"
                  value={formData.contract_value}
                  onChange={(e) =>
                    setFormData({ ...formData, contract_value: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>الدفعة المقدمة</Label>
                <Input
                  type="number"
                  value={formData.advance_payment}
                  onChange={(e) =>
                    setFormData({ ...formData, advance_payment: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>نسبة الضمان %</Label>
                <Input
                  type="number"
                  value={formData.retention_percentage}
                  onChange={(e) =>
                    setFormData({ ...formData, retention_percentage: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>تاريخ البدء</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ الانتهاء</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
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
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="suspended">موقوف</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="terminated">منتهي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>شروط الدفع</Label>
              <Textarea
                value={formData.payment_terms}
                onChange={(e) =>
                  setFormData({ ...formData, payment_terms: e.target.value })
                }
                rows={2}
              />
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
                disabled={createContract.isPending || updateContract.isPending}
              >
                {editingContract ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
