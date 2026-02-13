import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Plus, Target, TrendingUp, Award, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

export function SalesTargetsPage() {
  const { t } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ employeeName: '', targetAmount: '', periodStart: '', periodEnd: '' });

  const { data: targets = [], isLoading } = useQuery({
    queryKey: ['sales-targets', companyId],
    queryFn: async () => { const { data, error } = await supabase.from('sales_targets').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }); if (error) throw error; return data; },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => { const { error } = await supabase.from('sales_targets').insert({ company_id: companyId!, employee_name: form.employeeName, target_amount: Number(form.targetAmount) || 0, achieved_amount: 0, period_start: form.periodStart, period_end: form.periodEnd, status: 'active' }); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sales-targets'] }); toast.success(t.target_created); setShowAdd(false); setForm({ employeeName: '', targetAmount: '', periodStart: '', periodEnd: '' }); },
    onError: () => toast.error(t.mod_error),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('sales_targets').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sales-targets'] }); toast.success(t.mod_deleted); },
  });

  const totalTarget = targets.reduce((s: number, tt: any) => s + Number(tt.target_amount || 0), 0);
  const totalAchieved = targets.reduce((s: number, tt: any) => s + Number(tt.achieved_amount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">{t.target_title}</h1><p className="text-muted-foreground">{t.target_subtitle}</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{t.target_new}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.target_new_title}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t.target_employee}</Label><Input value={form.employeeName} onChange={e => setForm(p => ({ ...p, employeeName: e.target.value }))} /></div>
              <div><Label>{t.target_amount}</Label><Input type="number" value={form.targetAmount} onChange={e => setForm(p => ({ ...p, targetAmount: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t.target_period_start}</Label><Input type="date" value={form.periodStart} onChange={e => setForm(p => ({ ...p, periodStart: e.target.value }))} /></div>
                <div><Label>{t.target_period_end}</Label><Input type="date" value={form.periodEnd} onChange={e => setForm(p => ({ ...p, periodEnd: e.target.value }))} /></div>
              </div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.employeeName || !form.periodStart || !form.periodEnd}>{t.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Target className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{totalTarget.toLocaleString()} {t.mod_currency}</div><p className="text-sm text-muted-foreground">{t.target_targets}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{totalAchieved.toLocaleString()} {t.mod_currency}</div><p className="text-sm text-muted-foreground">{t.target_achieved}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Award className="w-8 h-8 mx-auto mb-2 text-yellow-500" /><div className="text-2xl font-bold">{totalTarget > 0 ? ((totalAchieved / totalTarget) * 100).toFixed(0) : 0}%</div><p className="text-sm text-muted-foreground">{t.target_achievement}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto mb-2 text-blue-600" /><div className="text-2xl font-bold">{targets.filter((tt: any) => Number(tt.achieved_amount) >= Number(tt.target_amount) && Number(tt.target_amount) > 0).length}/{targets.length}</div><p className="text-sm text-muted-foreground">{t.target_met_target}</p></CardContent></Card>
      </div>
      <Card><CardContent className="pt-6">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : targets.length === 0 ? <p className="text-center py-8 text-muted-foreground">{t.target_no_targets}</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>{t.target_employee}</TableHead><TableHead>{t.target_period}</TableHead><TableHead>{t.target_targets}</TableHead><TableHead>{t.target_achieved}</TableHead><TableHead>{t.target_progress}</TableHead><TableHead>{t.actions}</TableHead></TableRow></TableHeader>
            <TableBody>
              {targets.map((tt: any) => {
                const pct = Number(tt.target_amount) > 0 ? (Number(tt.achieved_amount) / Number(tt.target_amount)) * 100 : 0;
                return (
                  <TableRow key={tt.id}>
                    <TableCell className="font-medium">{tt.employee_name}</TableCell>
                    <TableCell>{tt.period_start} → {tt.period_end}</TableCell>
                    <TableCell>{Number(tt.target_amount).toLocaleString()} {t.mod_currency}</TableCell>
                    <TableCell>{Number(tt.achieved_amount).toLocaleString()} {t.mod_currency}</TableCell>
                    <TableCell className="w-32"><div className="flex items-center gap-2"><Progress value={Math.min(pct, 100)} className="h-2" /><span className="text-xs">{pct.toFixed(0)}%</span></div></TableCell>
                    <TableCell><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(tt.id)}><Trash2 className="w-3 h-3" /></Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}