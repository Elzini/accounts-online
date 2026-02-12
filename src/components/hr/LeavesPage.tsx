import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Plus, CalendarDays, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEmployees } from '@/hooks/usePayroll';
import { format, differenceInDays } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

export function LeavesPage() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const { data: employees = [] } = useEmployees();
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '', leave_type: 'annual', start_date: '', end_date: '', reason: '',
  });

  const leaveTypes: Record<string, string> = {
    annual: t.annual_leave, sick: t.sick_leave, unpaid: t.unpaid_leave,
    emergency: t.emergency_leave, maternity: t.maternity_leave, other: t.other_leave,
  };

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: t.pending_review, variant: 'outline' },
    approved: { label: t.accepted_status, variant: 'default' },
    rejected: { label: t.rejected_status, variant: 'destructive' },
    cancelled: { label: t.cancelled_status, variant: 'secondary' },
  };

  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ['leaves', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from('employee_leaves').select('*, employees(name)')
        .eq('company_id', companyId).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const addLeave = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!companyId) throw new Error('No company');
      const days = differenceInDays(new Date(data.end_date), new Date(data.start_date)) + 1;
      const { error } = await supabase.from('employee_leaves').insert({
        company_id: companyId, employee_id: data.employee_id, leave_type: data.leave_type,
        start_date: data.start_date, end_date: data.end_date, days_count: days, reason: data.reason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leaves'] }); toast.success(t.leave_submitted); setIsDialogOpen(false); },
    onError: () => toast.error(t.error_occurred),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('employee_leaves').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leaves'] }); toast.success(t.status_updated); },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><CalendarDays className="w-6 h-6" />{t.leaves_title}</h1>
          <p className="text-muted-foreground">{t.leaves_subtitle}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{t.request_leave}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.new_leave_request}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); addLeave.mutate(formData); }} className="space-y-4">
              <div className="space-y-2">
                <Label>{t.select_employee}</Label>
                <Select value={formData.employee_id} onValueChange={(v) => setFormData({ ...formData, employee_id: v })}>
                  <SelectTrigger><SelectValue placeholder={t.select_employee} /></SelectTrigger>
                  <SelectContent>{employees.filter(e => e.is_active).map((emp) => (<SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.leave_type}</Label>
                <Select value={formData.leave_type} onValueChange={(v) => setFormData({ ...formData, leave_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(leaveTypes).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{t.from_date}</Label><Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required /></div>
                <div className="space-y-2"><Label>{t.to_date}</Label><Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required /></div>
              </div>
              <div className="space-y-2"><Label>{t.reason}</Label><Textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} /></div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t.cancel}</Button>
                <Button type="submit" disabled={addLeave.isPending || !formData.employee_id || !formData.start_date || !formData.end_date}>
                  {addLeave.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}{t.submit_request}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>{t.leave_requests}</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">{t.name}</TableHead>
                  <TableHead className="text-right">{t.leave_type}</TableHead>
                  <TableHead className="text-right">{t.from_date}</TableHead>
                  <TableHead className="text-right">{t.to_date}</TableHead>
                  <TableHead className="text-right">{t.days_count}</TableHead>
                  <TableHead className="text-right">{t.status}</TableHead>
                  <TableHead className="text-right">{t.reason}</TableHead>
                  <TableHead className="text-center">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map((leave: any) => (
                  <TableRow key={leave.id}>
                    <TableCell className="font-medium">{leave.employees?.name}</TableCell>
                    <TableCell>{leaveTypes[leave.leave_type] || leave.leave_type}</TableCell>
                    <TableCell>{format(new Date(leave.start_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{format(new Date(leave.end_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{leave.days_count}</TableCell>
                    <TableCell><Badge variant={statusConfig[leave.status]?.variant || 'default'}>{statusConfig[leave.status]?.label || leave.status}</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate">{leave.reason || '-'}</TableCell>
                    <TableCell>
                      {leave.status === 'pending' && (
                        <div className="flex justify-center gap-1">
                          <Button size="icon" variant="ghost" className="text-emerald-600" onClick={() => updateStatus.mutate({ id: leave.id, status: 'approved' })}><CheckCircle className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => updateStatus.mutate({ id: leave.id, status: 'rejected' })}><XCircle className="w-4 h-4" /></Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {leaves.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">{t.no_leave_requests}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}