import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, GitBranch, CheckCircle2, Clock, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export function ApprovalsPage() {
  const { t, direction, language } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: t.approval_status_pending, variant: 'outline' },
    approved: { label: t.approval_status_approved, variant: 'default' },
    rejected: { label: t.approval_status_rejected, variant: 'destructive' },
    cancelled: { label: t.approval_status_cancelled, variant: 'secondary' },
  };

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
      toast.success(t.approval_toast_created);
      queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
      setShowForm(false);
    },
    onError: () => toast.error(t.approval_toast_error),
  });

  const pendingCount = requests.filter((r: any) => r.status === 'pending').length;
  const approvedCount = requests.filter((r: any) => r.status === 'approved').length;

  return (
    <div className="space-y-6" dir={direction}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.approval_title}</h1>
          <p className="text-muted-foreground">{t.approval_subtitle}</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 ml-2" />
          {t.approval_new_path}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <GitBranch className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{t.approval_workflows}</p>
              <p className="text-xl font-bold">{workflows.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-muted-foreground">{t.approval_under_review}</p>
              <p className="text-xl font-bold">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">{t.approval_approved}</p>
              <p className="text-xl font-bold">{approvedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">{t.approval_total_requests}</p>
              <p className="text-xl font-bold">{requests.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows */}
      <Card>
        <CardHeader><CardTitle>{t.approval_list_workflows}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">{t.approval_col_path}</TableHead>
                <TableHead className="text-right">{t.approval_col_type}</TableHead>
                <TableHead className="text-right">{t.approval_col_min}</TableHead>
                <TableHead className="text-right">{t.approval_col_max}</TableHead>
                <TableHead className="text-right">{t.approval_col_status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {t.no_data}
                  </TableCell>
                </TableRow>
              ) : (
                workflows.map((w: any) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.name}</TableCell>
                    <TableCell>{w.entity_type}</TableCell>
                    <TableCell>{w.min_amount?.toLocaleString() || '0'}</TableCell>
                    <TableCell>{w.max_amount?.toLocaleString() || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={w.is_active ? 'default' : 'secondary'}>
                        {w.is_active ? t.active : t.inactive}
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
        <CardHeader><CardTitle>{t.approval_list_requests}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">{t.approval_col_path}</TableHead>
                <TableHead className="text-right">{t.approval_col_type}</TableHead>
                <TableHead className="text-right">{t.approval_col_stage}</TableHead>
                <TableHead className="text-right">{t.approval_col_status}</TableHead>
                <TableHead className="text-right">{t.approval_col_date}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {t.no_data}
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{(r as any).approval_workflows?.name || '-'}</TableCell>
                    <TableCell>{r.entity_type}</TableCell>
                    <TableCell>{t.approval_col_stage} {r.current_step}</TableCell>
                    <TableCell>
                      <Badge variant={statusMap[r.status]?.variant || 'outline'}>
                        {statusMap[r.status]?.label || r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(r.requested_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Workflow Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md" dir={direction}>
          <DialogHeader><DialogTitle>{t.approval_new_path}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>{t.approval_col_path}</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>{t.approval_col_type}</Label>
              <Input value={form.entity_type} onChange={(e) => setForm(f => ({ ...f, entity_type: e.target.value }))} placeholder="journal_entry, expense, purchase" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t.approval_col_min}</Label>
                <Input type="number" value={form.min_amount} onChange={(e) => setForm(f => ({ ...f, min_amount: e.target.value }))} />
              </div>
              <div>
                <Label>{t.approval_col_max}</Label>
                <Input type="number" value={form.max_amount} onChange={(e) => setForm(f => ({ ...f, max_amount: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>{t.cancel}</Button>
            <Button onClick={() => addWorkflow.mutate()} disabled={!form.name}>{t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
