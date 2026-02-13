import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Timer, Clock, BarChart3, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

export function TimeTrackingPage() {
  const { t } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ projectName: '', taskName: '', hours: '', billable: true, date: new Date().toISOString().split('T')[0] });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['time-entries', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('time_entries').select('*').eq('company_id', companyId!).order('entry_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('time_entries').insert({ company_id: companyId!, project_name: form.projectName || null, task_name: form.taskName || null, hours: Number(form.hours) || 0, billable: form.billable, entry_date: form.date });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['time-entries'] }); toast.success(t.tt_created); setShowAdd(false); setForm({ projectName: '', taskName: '', hours: '', billable: true, date: new Date().toISOString().split('T')[0] }); },
    onError: () => toast.error(t.mod_error),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('time_entries').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['time-entries'] }); toast.success(t.mod_deleted); },
  });

  const totalHours = entries.reduce((s: number, e: any) => s + Number(e.hours || 0), 0);
  const billableHours = entries.filter((e: any) => e.billable).reduce((s: number, e: any) => s + Number(e.hours || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">{t.tt_title}</h1><p className="text-muted-foreground">{t.tt_subtitle}</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{t.tt_new}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.tt_new_title}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t.tt_project}</Label><Input value={form.projectName} onChange={e => setForm(p => ({ ...p, projectName: e.target.value }))} /></div>
              <div><Label>{t.tt_task}</Label><Input value={form.taskName} onChange={e => setForm(p => ({ ...p, taskName: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t.tt_hours}</Label><Input type="number" step="0.5" value={form.hours} onChange={e => setForm(p => ({ ...p, hours: e.target.value }))} /></div>
                <div><Label>{t.date}</Label><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
              </div>
              <div className="flex items-center gap-2"><Checkbox checked={form.billable} onCheckedChange={c => setForm(p => ({ ...p, billable: !!c }))} /><Label>{t.tt_billable}</Label></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.hours}>{t.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Timer className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{totalHours}h</div><p className="text-sm text-muted-foreground">{t.tt_total_hours}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{billableHours}h</div><p className="text-sm text-muted-foreground">{t.tt_billable_hours}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-600" /><div className="text-2xl font-bold">{totalHours > 0 ? ((billableHours / totalHours) * 100).toFixed(0) : 0}%</div><p className="text-sm text-muted-foreground">{t.tt_billing_rate}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{entries.length}</div><p className="text-sm text-muted-foreground">{t.tt_entries}</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-6">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : entries.length === 0 ? <p className="text-center py-8 text-muted-foreground">{t.tt_no_entries}</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>{t.tt_project}</TableHead><TableHead>{t.tt_task}</TableHead><TableHead>{t.date}</TableHead><TableHead>{t.tt_hours}</TableHead><TableHead>{t.tt_billing}</TableHead><TableHead>{t.actions}</TableHead></TableRow></TableHeader>
            <TableBody>
              {entries.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.project_name || '-'}</TableCell>
                  <TableCell>{e.task_name || '-'}</TableCell>
                  <TableCell>{e.entry_date}</TableCell>
                  <TableCell className="font-bold">{e.hours}h</TableCell>
                  <TableCell><Badge variant={e.billable ? 'default' : 'secondary'}>{e.billable ? t.tt_yes : t.tt_no}</Badge></TableCell>
                  <TableCell><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(e.id)}><Trash2 className="w-3 h-3" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}