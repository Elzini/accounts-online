import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, GitBranch, CheckCircle2, XCircle, Clock, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { toast } from 'sonner';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'قيد المراجعة', variant: 'outline' },
  approved: { label: 'معتمد', variant: 'default' },
  rejected: { label: 'مرفوض', variant: 'destructive' },
  cancelled: { label: 'ملغي', variant: 'secondary' },
};

export function ApprovalsPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ name: '', entity_type: 'journal_entry', min_amount: '', max_amount: '' });

  const { data: workflows = [], isLoading: loadingWorkflows } = useQuery({
    queryKey: ['approval-workflows', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('approval_workflows')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: requests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['approval-requests', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('approval_requests')
        .select('*, approval_workflows(name)')
        .eq('company_id', companyId)
        .order('requested_at', { ascending: false });
      return data || [];
    },
    enabled: !!companyId,
  });

  const addWorkflow = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company');
      const { error } = await supabase.from('approval_workflows').insert({
        company_id: companyId,
        name: form.name,
        entity_type: form.entity_type,
        min_amount: form.min_amount ? parseFloat(form.min_amount) : 0,
        max_amount: form.max_amount ? parseFloat(form.max_amount) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إنشاء سير العمل');
      queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
      setShowForm(false);
    },
    onError: () => toast.error('خطأ في الإنشاء'),
  });

  const pendingCount = requests.filter((r: any) => r.status === 'pending').length;
  const approvedCount = requests.filter((r: any) => r.status === 'approved').length;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">سير العمل والموافقات</h1>
          <p className="text-muted-foreground">إدارة مسارات الاعتماد والموافقات المالية</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 ml-2" />
          مسار جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <GitBranch className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">مسارات العمل</p>
              <p className="text-xl font-bold">{workflows.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-muted-foreground">قيد المراجعة</p>
              <p className="text-xl font-bold">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">معتمدة</p>
              <p className="text-xl font-bold">{approvedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
              <p className="text-xl font-bold">{requests.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows */}
      <Card>
        <CardHeader><CardTitle>مسارات الاعتماد</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المسار</TableHead>
                <TableHead className="text-right">نوع المعاملة</TableHead>
                <TableHead className="text-right">الحد الأدنى</TableHead>
                <TableHead className="text-right">الحد الأقصى</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    لا توجد مسارات اعتماد
                  </TableCell>
                </TableRow>
              ) : (
                workflows.map((w: any) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.name}</TableCell>
                    <TableCell>{w.entity_type}</TableCell>
                    <TableCell>{w.min_amount?.toLocaleString() || '0'}</TableCell>
                    <TableCell>{w.max_amount?.toLocaleString() || 'غير محدد'}</TableCell>
                    <TableCell>
                      <Badge variant={w.is_active ? 'default' : 'secondary'}>
                        {w.is_active ? 'نشط' : 'معطل'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Requests */}
      <Card>
        <CardHeader><CardTitle>طلبات الموافقة</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المسار</TableHead>
                <TableHead className="text-right">نوع المعاملة</TableHead>
                <TableHead className="text-right">المرحلة</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    لا توجد طلبات موافقة
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{(r as any).approval_workflows?.name || '-'}</TableCell>
                    <TableCell>{r.entity_type}</TableCell>
                    <TableCell>المرحلة {r.current_step}</TableCell>
                    <TableCell>
                      <Badge variant={statusMap[r.status]?.variant || 'outline'}>
                        {statusMap[r.status]?.label || r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(r.requested_at).toLocaleDateString('ar-SA')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Workflow Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>مسار اعتماد جديد</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>اسم المسار</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: اعتماد مشتريات فوق 10,000" />
            </div>
            <div>
              <Label>نوع المعاملة</Label>
              <Input value={form.entity_type} onChange={(e) => setForm(f => ({ ...f, entity_type: e.target.value }))} placeholder="journal_entry, expense, purchase" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الحد الأدنى</Label>
                <Input type="number" value={form.min_amount} onChange={(e) => setForm(f => ({ ...f, min_amount: e.target.value }))} />
              </div>
              <div>
                <Label>الحد الأقصى</Label>
                <Input type="number" value={form.max_amount} onChange={(e) => setForm(f => ({ ...f, max_amount: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            <Button onClick={() => addWorkflow.mutate()} disabled={!form.name}>إنشاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
