import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle2, Clock, XCircle, Shield, GitBranch, Users, 
  ArrowRight, Eye, MessageSquare, Calendar, UserCheck 
} from 'lucide-react';
import { supabase } from '@/hooks/modules/useMiscServices';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export function ApprovalDashboard() {
  const { language } = useLanguage();
  const isRtl = language === 'ar';
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; action: string; requestId: string }>({ open: false, action: '', requestId: '' });
  const [comments, setComments] = useState('');
  const [delegateDialog, setDelegateDialog] = useState(false);
  const [delegateForm, setDelegateForm] = useState({ delegate_user_id: '', start_date: '', end_date: '', reason: '' });

  const { data: requests = [] } = useQuery({
    queryKey: ['approval-requests-dashboard', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('approval_requests')
        .select('*, approval_workflows(name, entity_type, min_amount, max_amount)')
        .eq('company_id', companyId)
        .order('requested_at', { ascending: false });
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: workflows = [] } = useQuery({
    queryKey: ['approval-workflows-dashboard', companyId],
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
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['approval-actions-dashboard', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const requestIds = requests.map((r: any) => r.id);
      if (requestIds.length === 0) return [];
      const { data } = await supabase
        .from('approval_actions')
        .select('*')
        .in('request_id', requestIds)
        .order('acted_at', { ascending: false });
      return data || [];
    },
    enabled: !!companyId && requests.length > 0,
  });

  const { data: delegations = [] } = useQuery({
    queryKey: ['approval-delegations', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('approval_delegations' as any)
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!companyId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['company-users', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username')
        .eq('company_id', companyId);
      return data || [];
    },
    enabled: !!companyId,
  });

  const processAction = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const request = requests.find((r: any) => r.id === requestId);
      if (!request) throw new Error('Request not found');

      // Get steps for the workflow
      const { data: steps } = await supabase
        .from('approval_steps')
        .select('*')
        .eq('workflow_id', request.workflow_id)
        .order('step_order', { ascending: true });

      const currentStep = steps?.find((s: any) => s.step_order === (request.current_step || 1));
      if (!currentStep) throw new Error('Step not found');

      // Record action
      await supabase.from('approval_actions').insert({
        request_id: requestId,
        step_id: currentStep.id,
        acted_by: user.id,
        action,
        comments: comments || null,
      });

      if (action === 'approve') {
        const nextStep = steps?.find((s: any) => s.step_order === (request.current_step || 1) + 1);
        if (nextStep) {
          await supabase.from('approval_requests').update({
            current_step: nextStep.step_order,
          }).eq('id', requestId);
        } else {
          await supabase.from('approval_requests').update({
            status: 'approved',
            completed_at: new Date().toISOString(),
          }).eq('id', requestId);
        }
      } else if (action === 'reject') {
        await supabase.from('approval_requests').update({
          status: 'rejected',
          completed_at: new Date().toISOString(),
        }).eq('id', requestId);
      }
    },
    onSuccess: () => {
      toast.success(isRtl ? 'تم تنفيذ الإجراء بنجاح' : 'Action completed');
      queryClient.invalidateQueries({ queryKey: ['approval-requests-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['approval-actions-dashboard'] });
      setActionDialog({ open: false, action: '', requestId: '' });
      setComments('');
    },
    onError: () => toast.error(isRtl ? 'حدث خطأ' : 'Error occurred'),
  });

  const addDelegation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('approval_delegations' as any).insert({
        company_id: companyId,
        delegator_user_id: user.id,
        delegate_user_id: delegateForm.delegate_user_id,
        start_date: delegateForm.start_date,
        end_date: delegateForm.end_date,
        reason: delegateForm.reason || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(isRtl ? 'تم إضافة التفويض' : 'Delegation added');
      queryClient.invalidateQueries({ queryKey: ['approval-delegations'] });
      setDelegateDialog(false);
    },
  });

  const pending = requests.filter((r: any) => r.status === 'pending');
  const approved = requests.filter((r: any) => r.status === 'approved');
  const rejected = requests.filter((r: any) => r.status === 'rejected');

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: isRtl ? 'معلق' : 'Pending', variant: 'outline' },
      approved: { label: isRtl ? 'معتمد' : 'Approved', variant: 'default' },
      rejected: { label: isRtl ? 'مرفوض' : 'Rejected', variant: 'destructive' },
    };
    const s = map[status] || map.pending;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{isRtl ? 'لوحة الموافقات' : 'Approvals Dashboard'}</h2>
        <Button variant="outline" onClick={() => setDelegateDialog(true)}>
          <UserCheck className="h-4 w-4 me-2" />
          {isRtl ? 'تفويض صلاحية' : 'Delegate'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pending.length}</p>
              <p className="text-sm text-muted-foreground">{isRtl ? 'معلقة' : 'Pending'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{approved.length}</p>
              <p className="text-sm text-muted-foreground">{isRtl ? 'معتمدة' : 'Approved'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{rejected.length}</p>
              <p className="text-sm text-muted-foreground">{isRtl ? 'مرفوضة' : 'Rejected'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <GitBranch className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{workflows.length}</p>
              <p className="text-sm text-muted-foreground">{isRtl ? 'مسارات' : 'Workflows'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">{isRtl ? `معلقة (${pending.length})` : `Pending (${pending.length})`}</TabsTrigger>
          <TabsTrigger value="all">{isRtl ? 'الكل' : 'All'}</TabsTrigger>
          <TabsTrigger value="workflows">{isRtl ? 'المسارات' : 'Workflows'}</TabsTrigger>
          <TabsTrigger value="delegations">{isRtl ? 'التفويضات' : 'Delegations'}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRtl ? 'الطلب' : 'Request'}</TableHead>
                    <TableHead>{isRtl ? 'النوع' : 'Type'}</TableHead>
                    <TableHead>{isRtl ? 'المسار' : 'Workflow'}</TableHead>
                    <TableHead>{isRtl ? 'المرحلة' : 'Step'}</TableHead>
                    <TableHead>{isRtl ? 'التاريخ' : 'Date'}</TableHead>
                    <TableHead>{isRtl ? 'إجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {isRtl ? 'لا توجد طلبات معلقة' : 'No pending requests'}
                      </TableCell>
                    </TableRow>
                  ) : pending.map((req: any) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.entity_id?.slice(0, 8)}...</TableCell>
                      <TableCell><Badge variant="secondary">{req.entity_type}</Badge></TableCell>
                      <TableCell>{req.approval_workflows?.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{isRtl ? `مرحلة ${req.current_step || 1}` : `Step ${req.current_step || 1}`}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(req.requested_at).toLocaleDateString('ar-SA')}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="default" onClick={() => { setActionDialog({ open: true, action: 'approve', requestId: req.id }); }}>
                            <CheckCircle2 className="h-3 w-3 me-1" />
                            {isRtl ? 'موافقة' : 'Approve'}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => { setActionDialog({ open: true, action: 'reject', requestId: req.id }); }}>
                            <XCircle className="h-3 w-3 me-1" />
                            {isRtl ? 'رفض' : 'Reject'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRtl ? 'الطلب' : 'Request'}</TableHead>
                    <TableHead>{isRtl ? 'النوع' : 'Type'}</TableHead>
                    <TableHead>{isRtl ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead>{isRtl ? 'المسار' : 'Workflow'}</TableHead>
                    <TableHead>{isRtl ? 'التاريخ' : 'Date'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req: any) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.entity_id?.slice(0, 8)}...</TableCell>
                      <TableCell><Badge variant="secondary">{req.entity_type}</Badge></TableCell>
                      <TableCell>{statusBadge(req.status)}</TableCell>
                      <TableCell>{req.approval_workflows?.name}</TableCell>
                      <TableCell className="text-sm">{new Date(req.requested_at).toLocaleDateString('ar-SA')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map((wf: any) => (
              <Card key={wf.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    {wf.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRtl ? 'النوع' : 'Type'}</span>
                      <Badge variant="secondary">{wf.entity_type}</Badge>
                    </div>
                    {wf.min_amount != null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{isRtl ? 'الحد الأدنى' : 'Min Amount'}</span>
                        <span>{Number(wf.min_amount).toLocaleString()}</span>
                      </div>
                    )}
                    {wf.max_amount != null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{isRtl ? 'الحد الأعلى' : 'Max Amount'}</span>
                        <span>{Number(wf.max_amount).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRtl ? 'مراحل الموافقة' : 'Steps'}</span>
                      <span>{wf.approval_steps?.length || 0}</span>
                    </div>
                    {/* Visual steps flow */}
                    {wf.approval_steps?.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mt-2">
                        {wf.approval_steps.sort((a: any, b: any) => a.step_order - b.step_order).map((step: any, i: number) => (
                          <div key={step.id} className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {step.approver_role || `${isRtl ? 'مرحلة' : 'Step'} ${step.step_order}`}
                            </Badge>
                            {i < wf.approval_steps.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="delegations">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRtl ? 'المفوَّض إليه' : 'Delegate'}</TableHead>
                    <TableHead>{isRtl ? 'من' : 'From'}</TableHead>
                    <TableHead>{isRtl ? 'إلى' : 'To'}</TableHead>
                    <TableHead>{isRtl ? 'السبب' : 'Reason'}</TableHead>
                    <TableHead>{isRtl ? 'الحالة' : 'Status'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {delegations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {isRtl ? 'لا توجد تفويضات' : 'No delegations'}
                      </TableCell>
                    </TableRow>
                  ) : delegations.map((d: any) => {
                    const delegateUser = users.find((u: any) => u.user_id === d.delegate_user_id);
                    return (
                      <TableRow key={d.id}>
                        <TableCell>{delegateUser?.username || d.delegate_user_id?.slice(0, 8)}</TableCell>
                        <TableCell>{d.start_date}</TableCell>
                        <TableCell>{d.end_date}</TableCell>
                        <TableCell>{d.reason || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={d.is_active ? 'default' : 'secondary'}>
                            {d.is_active ? (isRtl ? 'فعال' : 'Active') : (isRtl ? 'منتهي' : 'Expired')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(o) => !o && setActionDialog({ open: false, action: '', requestId: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'approve' 
                ? (isRtl ? 'تأكيد الموافقة' : 'Confirm Approval') 
                : (isRtl ? 'تأكيد الرفض' : 'Confirm Rejection')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isRtl ? 'ملاحظات' : 'Comments'}</Label>
              <Textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder={isRtl ? 'أضف ملاحظة...' : 'Add a comment...'} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, action: '', requestId: '' })}>
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant={actionDialog.action === 'approve' ? 'default' : 'destructive'}
              onClick={() => processAction.mutate({ requestId: actionDialog.requestId, action: actionDialog.action })}
            >
              {actionDialog.action === 'approve' ? (isRtl ? 'موافقة' : 'Approve') : (isRtl ? 'رفض' : 'Reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delegation Dialog */}
      <Dialog open={delegateDialog} onOpenChange={setDelegateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRtl ? 'تفويض صلاحية الموافقة' : 'Delegate Approval Authority'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isRtl ? 'تفويض إلى' : 'Delegate to'}</Label>
              <Select value={delegateForm.delegate_user_id} onValueChange={(v) => setDelegateForm(f => ({ ...f, delegate_user_id: v }))}>
                <SelectTrigger><SelectValue placeholder={isRtl ? 'اختر المستخدم' : 'Select user'} /></SelectTrigger>
                <SelectContent>
                  {users.map((u: any) => (
                    <SelectItem key={u.user_id} value={u.user_id}>{u.username || u.user_id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRtl ? 'من تاريخ' : 'From'}</Label>
                <Input type="date" value={delegateForm.start_date} onChange={(e) => setDelegateForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <Label>{isRtl ? 'إلى تاريخ' : 'To'}</Label>
                <Input type="date" value={delegateForm.end_date} onChange={(e) => setDelegateForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>{isRtl ? 'السبب' : 'Reason'}</Label>
              <Input value={delegateForm.reason} onChange={(e) => setDelegateForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => addDelegation.mutate()} disabled={!delegateForm.delegate_user_id || !delegateForm.start_date || !delegateForm.end_date}>
              {isRtl ? 'حفظ التفويض' : 'Save Delegation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
