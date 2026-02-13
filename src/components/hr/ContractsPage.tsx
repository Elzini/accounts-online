import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText, CheckCircle, AlertTriangle, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

export function EmployeeContractsPage() {
  const { t } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ employeeName: '', contractType: 'full-time', startDate: '', endDate: '', salary: '', position: '', department: '' });
  const typeLabels: Record<string, string> = { 'full-time': t.ec_type_fulltime, 'part-time': t.ec_type_parttime, temporary: t.ec_type_temporary };

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['employee-contracts', companyId],
    queryFn: async () => { const { data, error } = await supabase.from('employee_contracts').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }); if (error) throw error; return data; },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => { const { error } = await supabase.from('employee_contracts').insert({ company_id: companyId!, employee_name: form.employeeName, contract_type: form.contractType, start_date: form.startDate, end_date: form.endDate || null, salary: Number(form.salary) || 0, position: form.position || null, department: form.department || null, status: 'active' }); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employee-contracts'] }); toast.success(t.ec_created); setShowAdd(false); setForm({ employeeName: '', contractType: 'full-time', startDate: '', endDate: '', salary: '', position: '', department: '' }); },
    onError: () => toast.error(t.mod_error),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('employee_contracts').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employee-contracts'] }); toast.success(t.mod_deleted); },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">{t.ec_title}</h1><p className="text-muted-foreground">{t.ec_subtitle}</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{t.ec_new}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.ec_new_title}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t.ec_employee_name}</Label><Input value={form.employeeName} onChange={e => setForm(p => ({ ...p, employeeName: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t.ec_contract_type}</Label><Select value={form.contractType} onValueChange={v => setForm(p => ({ ...p, contractType: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="full-time">{t.ec_type_fulltime}</SelectItem><SelectItem value="part-time">{t.ec_type_parttime}</SelectItem><SelectItem value="temporary">{t.ec_type_temporary}</SelectItem></SelectContent></Select></div>
                <div><Label>{t.ec_salary}</Label><Input type="number" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t.ec_start_date}</Label><Input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} /></div>
                <div><Label>{t.ec_end_date}</Label><Input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t.ec_position}</Label><Input value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} /></div>
                <div><Label>{t.ec_department}</Label><Input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} /></div>
              </div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.employeeName || !form.startDate}>{t.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><FileText className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{contracts.length}</div><p className="text-sm text-muted-foreground">{t.ec_total_contracts}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{contracts.filter((c: any) => c.status === 'active').length}</div><p className="text-sm text-muted-foreground">{t.ec_active}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><AlertTriangle className="w-8 h-8 mx-auto mb-2 text-orange-600" /><div className="text-2xl font-bold">{contracts.filter((c: any) => c.status === 'expiring_soon').length}</div><p className="text-sm text-muted-foreground">{t.ec_expiring_soon}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto mb-2 text-destructive" /><div className="text-2xl font-bold">{contracts.filter((c: any) => c.status === 'expired').length}</div><p className="text-sm text-muted-foreground">{t.ec_expired}</p></CardContent></Card>
      </div>
      <Card><CardContent className="pt-6">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : contracts.length === 0 ? <p className="text-center py-8 text-muted-foreground">{t.ec_no_contracts}</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>{t.ec_employee}</TableHead><TableHead>{t.ec_department}</TableHead><TableHead>{t.ec_type}</TableHead><TableHead>{t.ec_start}</TableHead><TableHead>{t.ec_end}</TableHead><TableHead>{t.ec_salary}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.actions}</TableHead></TableRow></TableHeader>
            <TableBody>
              {contracts.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.employee_name}</TableCell>
                  <TableCell>{c.department || '-'}</TableCell>
                  <TableCell>{typeLabels[c.contract_type] || c.contract_type}</TableCell>
                  <TableCell>{c.start_date}</TableCell>
                  <TableCell>{c.end_date || '-'}</TableCell>
                  <TableCell>{Number(c.salary || 0).toLocaleString()} {t.mod_currency}</TableCell>
                  <TableCell><Badge variant={c.status === 'active' ? 'default' : c.status === 'expired' ? 'destructive' : 'secondary'}>{c.status === 'active' ? t.ec_status_active : c.status === 'expiring_soon' ? t.ec_status_expiring : t.ec_status_expired}</Badge></TableCell>
                  <TableCell><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="w-3 h-3" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}