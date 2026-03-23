import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { GitBranch, Plus, CheckCircle2, XCircle, Clock, ArrowLeft, User, Loader2, Trash2 } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/hooks/modules/useMiscServices';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ApprovalStep {
  id: string;
  step_order: number;
  approver_role: string | null;
  approver_user_id: string | null;
  is_mandatory: boolean | null;
}

interface ApprovalRequest {
  id: string;
  entity_type: string;
  entity_id: string;
  status: string;
  current_step: number | null;
  requested_at: string;
  requested_by: string;
  notes: string | null;
  approval_workflows: { name: string } | null;
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'قيد الانتظار', variant: 'secondary' },
  approved: { label: 'معتمد', variant: 'default' },
  rejected: { label: 'مرفوض', variant: 'destructive' },
  cancelled: { label: 'ملغي', variant: 'outline' },
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'المدير العام',
  accountant: 'المحاسب',
  sales_manager: 'مدير المبيعات',
  financial_manager: 'المدير المالي',
  ceo: 'الرئيس التنفيذي',
};

export function InvoiceApprovalWorkflow() {
  const { companyId } = useCompany();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showNewWorkflow, setShowNewWorkflow] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({ name: '', entity_type: 'invoice', min_amount: '', max_amount: '' });
  const [newSteps, setNewSteps] = useState<{ role: string; mandatory: boolean }[]>([
    { role: 'accountant', mandatory: true },
  ]);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [actionComment, setActionComment] = useState('');

  const { data: workflows = [] } = useQuery({
    queryKey: ['approval-workflows', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('approval_workflows')
        .select('*, approval_steps(*)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['approval-requests', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('approval_requests')
        .select('*, approval_workflows(name)')
        .eq('company_id', companyId)
        .order('requested_at', { ascending: false })
        .limit(50);
      return (data || []) as ApprovalRequest[];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company');
      const { data: wf, error: wfErr } = await supabase
        .from('approval_workflows')
        .insert({
          company_id: companyId,
          name: newWorkflow.name,
          entity_type: newWorkflow.entity_type,
          min_amount: newWorkflow.min_amount ? parseFloat(newWorkflow.min_amount) : null,
          max_amount: newWorkflow.max_amount ? parseFloat(newWorkflow.max_amount) : null,
          is_active: true,
        })
        .select()
        .single();
      if (wfErr) throw wfErr;

      const stepsData = newSteps.map((s, i) => ({
        workflow_id: wf.id,
        step_order: i + 1,
        approver_role: s.role,
        is_mandatory: s.mandatory,
      }));
      const { error: stErr } = await supabase.from('approval_steps').insert(stepsData);
      if (stErr) throw stErr;
    },
    onSuccess: () => {
      toast.success('تم إنشاء سلسلة الاعتماد بنجاح');
      setShowNewWorkflow(false);
      setNewWorkflow({ name: '', entity_type: 'invoice', min_amount: '', max_amount: '' });
      setNewSteps([{ role: 'accountant', mandatory: true }]);
      queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
    },
    onError: () => toast.error('خطأ في إنشاء سلسلة الاعتماد'),
  });

  const approveMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: 'approved' | 'rejected' }) => {
      if (!user) throw new Error('Not authenticated');
      const request = requests.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');

      const { error: actErr } = await supabase.from('approval_actions').insert({
        request_id: requestId,
        step_id: requestId,
        acted_by: user.id,
        action,
        comments: actionComment || null,
      });
      if (actErr) throw actErr;

      const { error: reqErr } = await supabase
        .from('approval_requests')
        .update({
          status: action,
          current_step: action === 'approved' ? (request.current_step || 0) + 1 : request.current_step,
          completed_at: action === 'rejected' ? new Date().toISOString() : null,
        })
        .eq('id', requestId);
      if (reqErr) throw reqErr;
    },
    onSuccess: () => {
      toast.success('تم تسجيل القرار');
      setSelectedRequest(null);
      setActionComment('');
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
    },
    onError: () => toast.error('خطأ في تسجيل القرار'),
  });

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="w-6 h-6" />
            سلاسل اعتماد الفواتير
          </h1>
          <p className="text-muted-foreground">إنشاء وإدارة مراحل اعتماد الفواتير والمستندات المالية</p>
        </div>
        <Dialog open={showNewWorkflow} onOpenChange={setShowNewWorkflow}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 ml-2" /> سلسلة اعتماد جديدة</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader><DialogTitle>إنشاء سلسلة اعتماد</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">اسم السلسلة</label>
                <Input value={newWorkflow.name} onChange={e => setNewWorkflow(p => ({ ...p, name: e.target.value }))} placeholder="مثال: اعتماد فواتير أكثر من 10,000" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">نوع المستند</label>
                  <Select value={newWorkflow.entity_type} onValueChange={v => setNewWorkflow(p => ({ ...p, entity_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice">فاتورة بيع</SelectItem>
                      <SelectItem value="purchase">فاتورة شراء</SelectItem>
                      <SelectItem value="expense">مصروف</SelectItem>
                      <SelectItem value="payment">سند صرف</SelectItem>
                      <SelectItem value="receipt">سند قبض</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">الحد الأدنى للمبلغ</label>
                  <Input type="number" value={newWorkflow.min_amount} onChange={e => setNewWorkflow(p => ({ ...p, min_amount: e.target.value }))} placeholder="0" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">مراحل الاعتماد</label>
                <div className="space-y-2">
                  {newSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">{i + 1}</div>
                      {i > 0 && <ArrowLeft className="w-4 h-4 text-muted-foreground" />}
                      <Select value={step.role} onValueChange={v => {
                        const updated = [...newSteps];
                        updated[i].role = v;
                        setNewSteps(updated);
                      }}>
                        <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(ROLE_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {newSteps.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => setNewSteps(s => s.filter((_, j) => j !== i))}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setNewSteps(s => [...s, { role: 'admin', mandatory: true }])}>
                    <Plus className="w-4 h-4 ml-1" /> إضافة مرحلة
                  </Button>
                </div>
              </div>

              {/* Visual workflow preview */}
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium mb-2">معاينة سلسلة الاعتماد:</p>
                <div className="flex items-center gap-1 flex-wrap">
                  <Badge variant="outline">إنشاء المستند</Badge>
                  {newSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <ArrowLeft className="w-3 h-3 text-muted-foreground" />
                      <Badge variant="default">{ROLE_LABELS[step.role] || step.role}</Badge>
                    </div>
                  ))}
                  <ArrowLeft className="w-3 h-3 text-muted-foreground" />
                  <Badge className="bg-emerald-500">معتمد ✓</Badge>
                </div>
              </div>

              <Button className="w-full" onClick={() => createWorkflowMutation.mutate()} disabled={!newWorkflow.name || createWorkflowMutation.isPending}>
                {createWorkflowMutation.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <GitBranch className="w-4 h-4 ml-2" />}
                إنشاء السلسلة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Workflows */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workflows.map((wf: any) => (
          <Card key={wf.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{wf.name}</CardTitle>
                <Badge variant={wf.is_active ? 'default' : 'secondary'}>{wf.is_active ? 'نشط' : 'معطل'}</Badge>
              </div>
              <CardDescription>
                {wf.entity_type === 'invoice' ? 'فواتير البيع' : wf.entity_type === 'purchase' ? 'فواتير الشراء' : wf.entity_type}
                {wf.min_amount ? ` | أكثر من ${wf.min_amount.toLocaleString()} ر.س` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 flex-wrap">
                {(wf.approval_steps || [])
                  .sort((a: ApprovalStep, b: ApprovalStep) => a.step_order - b.step_order)
                  .map((step: ApprovalStep, i: number) => (
                    <div key={step.id} className="flex items-center gap-1">
                      {i > 0 && <ArrowLeft className="w-3 h-3 text-muted-foreground" />}
                      <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs">
                        <User className="w-3 h-3" />
                        {ROLE_LABELS[step.approver_role || ''] || step.approver_role}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {workflows.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد سلاسل اعتماد. أنشئ واحدة للبدء.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle>طلبات الاعتماد</CardTitle>
          <CardDescription>الفواتير والمستندات المعلقة للاعتماد</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">لا توجد طلبات اعتماد حالياً</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">سلسلة الاعتماد</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">المرحلة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => {
                  const status = STATUS_MAP[r.status] || { label: r.status, variant: 'outline' as const };
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.approval_workflows?.name || '-'}</TableCell>
                      <TableCell>{r.entity_type}</TableCell>
                      <TableCell>المرحلة {r.current_step || 1}</TableCell>
                      <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                      <TableCell className="text-sm">{new Date(r.requested_at).toLocaleDateString('ar-SA')}</TableCell>
                      <TableCell>
                        {r.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="default" onClick={() => approveMutation.mutate({ requestId: r.id, action: 'approved' })}>
                              <CheckCircle2 className="w-3 h-3 ml-1" /> اعتماد
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => approveMutation.mutate({ requestId: r.id, action: 'rejected' })}>
                              <XCircle className="w-3 h-3 ml-1" /> رفض
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
