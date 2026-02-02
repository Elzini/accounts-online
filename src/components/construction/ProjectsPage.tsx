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
import { Plus, Pencil, Trash2, Building2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Project {
  id: string;
  project_number: number;
  project_code: string | null;
  project_name: string;
  client_name: string | null;
  client_contact: string | null;
  contract_number: string | null;
  contract_date: string | null;
  contract_value: number;
  location: string | null;
  site_address: string | null;
  start_date: string | null;
  expected_end_date: string | null;
  actual_end_date: string | null;
  cost_to_date: number;
  revenue_to_date: number;
  profit_to_date: number;
  retention_percentage: number;
  retention_amount: number;
  completion_percentage: number;
  billed_amount: number;
  collected_amount: number;
  status: string;
  description: string | null;
  notes: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  active: 'bg-green-500',
  on_hold: 'bg-yellow-500',
  completed: 'bg-blue-500',
  cancelled: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  active: 'نشط',
  on_hold: 'معلق',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

export function ProjectsPage() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    project_name: '',
    project_code: '',
    client_name: '',
    client_contact: '',
    contract_number: '',
    contract_date: '',
    contract_value: '',
    location: '',
    site_address: '',
    start_date: '',
    expected_end_date: '',
    retention_percentage: '10',
    status: 'draft',
    description: '',
    notes: '',
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('company_id', companyId)
        .order('project_number', { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
    enabled: !!companyId,
  });

  const createProject = useMutation({
    mutationFn: async (data: typeof formData) => {
      const insertData = {
        company_id: companyId!,
        project_name: data.project_name,
        project_code: data.project_code || null,
        client_name: data.client_name || null,
        client_contact: data.client_contact || null,
        contract_number: data.contract_number || null,
        contract_date: data.contract_date || null,
        contract_value: parseFloat(data.contract_value) || 0,
        location: data.location || null,
        site_address: data.site_address || null,
        start_date: data.start_date || null,
        expected_end_date: data.expected_end_date || null,
        retention_percentage: parseFloat(data.retention_percentage) || 10,
        status: data.status,
        description: data.description || null,
        notes: data.notes || null,
      };
      const { error } = await supabase.from('projects').insert([insertData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('تم إنشاء المشروع بنجاح');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('حدث خطأ أثناء إنشاء المشروع');
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('projects')
        .update({
          project_name: data.project_name,
          project_code: data.project_code || null,
          client_name: data.client_name || null,
          client_contact: data.client_contact || null,
          contract_number: data.contract_number || null,
          contract_date: data.contract_date || null,
          contract_value: parseFloat(data.contract_value) || 0,
          location: data.location || null,
          site_address: data.site_address || null,
          start_date: data.start_date || null,
          expected_end_date: data.expected_end_date || null,
          retention_percentage: parseFloat(data.retention_percentage) || 10,
          status: data.status,
          description: data.description || null,
          notes: data.notes || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('تم تحديث المشروع بنجاح');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('حدث خطأ أثناء تحديث المشروع');
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('تم حذف المشروع بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حذف المشروع');
    },
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProject(null);
    setFormData({
      project_name: '',
      project_code: '',
      client_name: '',
      client_contact: '',
      contract_number: '',
      contract_date: '',
      contract_value: '',
      location: '',
      site_address: '',
      start_date: '',
      expected_end_date: '',
      retention_percentage: '10',
      status: 'draft',
      description: '',
      notes: '',
    });
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      project_name: project.project_name,
      project_code: project.project_code || '',
      client_name: project.client_name || '',
      client_contact: project.client_contact || '',
      contract_number: project.contract_number || '',
      contract_date: project.contract_date || '',
      contract_value: project.contract_value?.toString() || '',
      location: project.location || '',
      site_address: project.site_address || '',
      start_date: project.start_date || '',
      expected_end_date: project.expected_end_date || '',
      retention_percentage: project.retention_percentage?.toString() || '10',
      status: project.status || 'draft',
      description: project.description || '',
      notes: project.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject) {
      updateProject.mutate({ id: editingProject.id, data: formData });
    } else {
      createProject.mutate(formData);
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.project_code?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <Building2 className="h-6 w-6" />
            إدارة المشاريع
          </h1>
          <p className="text-muted-foreground">
            إدارة مشاريع المقاولات والعقود
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 ml-2" />
          مشروع جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث عن مشروع..."
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
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد مشاريع
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم المشروع</TableHead>
                  <TableHead>اسم المشروع</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>قيمة العقد</TableHead>
                  <TableHead>نسبة الإنجاز</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      {project.project_code || `#${project.project_number}`}
                    </TableCell>
                    <TableCell>{project.project_name}</TableCell>
                    <TableCell>{project.client_name || '-'}</TableCell>
                    <TableCell>{formatCurrency(project.contract_value)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${project.completion_percentage || 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {project.completion_percentage || 0}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[project.status]}>
                        {statusLabels[project.status] || project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(project)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
                              deleteProject.mutate(project.id);
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
              {editingProject ? 'تعديل المشروع' : 'إضافة مشروع جديد'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم المشروع *</Label>
                <Input
                  value={formData.project_name}
                  onChange={(e) =>
                    setFormData({ ...formData, project_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>كود المشروع</Label>
                <Input
                  value={formData.project_code}
                  onChange={(e) =>
                    setFormData({ ...formData, project_code: e.target.value })
                  }
                  placeholder="مثال: PRJ-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم العميل</Label>
                <Input
                  value={formData.client_name}
                  onChange={(e) =>
                    setFormData({ ...formData, client_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>رقم التواصل</Label>
                <Input
                  value={formData.client_contact}
                  onChange={(e) =>
                    setFormData({ ...formData, client_contact: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رقم العقد</Label>
                <Input
                  value={formData.contract_number}
                  onChange={(e) =>
                    setFormData({ ...formData, contract_number: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ العقد</Label>
                <Input
                  type="date"
                  value={formData.contract_date}
                  onChange={(e) =>
                    setFormData({ ...formData, contract_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الموقع</Label>
                <Input
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>عنوان الموقع</Label>
                <Input
                  value={formData.site_address}
                  onChange={(e) =>
                    setFormData({ ...formData, site_address: e.target.value })
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
                <Label>تاريخ الانتهاء المتوقع</Label>
                <Input
                  type="date"
                  value={formData.expected_end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, expected_end_date: e.target.value })
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
                    <SelectItem value="on_hold">معلق</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
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
                disabled={createProject.isPending || updateProject.isPending}
              >
                {editingProject ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
