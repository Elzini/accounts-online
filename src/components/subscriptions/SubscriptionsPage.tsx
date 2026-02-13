import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, RefreshCw, Users, DollarSign, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

export function SubscriptionsPage() {
  const { t } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ planName: '', amount: '', cycle: 'monthly' });

  const cycleLabels: Record<string, string> = { monthly: t.sub_cycle_monthly, quarterly: t.sub_cycle_quarterly, yearly: t.sub_cycle_yearly };

  const { data: subs = [], isLoading } = useQuery({
    queryKey: ['subscriptions', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('subscriptions').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('subscriptions').insert({ company_id: companyId!, plan_name: form.planName, amount: Number(form.amount) || 0, billing_cycle: form.cycle, start_date: new Date().toISOString().split('T')[0], status: 'active' });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); toast.success(t.sub_created); setShowAdd(false); setForm({ planName: '', amount: '', cycle: 'monthly' }); },
    onError: () => toast.error(t.mod_error),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('subscriptions').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); toast.success(t.mod_deleted); },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">{t.sub_title}</h1><p className="text-muted-foreground">{t.sub_subtitle}</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{t.sub_new}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.sub_new_title}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t.sub_plan_name}</Label><Input value={form.planName} onChange={e => setForm(p => ({ ...p, planName: e.target.value }))} /></div>
              <div><Label>{t.amount}</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
              <div><Label>{t.sub_billing_cycle}</Label><Select value={form.cycle} onValueChange={v => setForm(p => ({ ...p, cycle: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">{t.sub_cycle_monthly}</SelectItem><SelectItem value="quarterly">{t.sub_cycle_quarterly}</SelectItem><SelectItem value="yearly">{t.sub_cycle_yearly}</SelectItem></SelectContent></Select></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.planName}>{t.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{subs.length}</div><p className="text-sm text-muted-foreground">{t.sub_subscriptions}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{subs.filter((s: any) => s.status === 'active').reduce((tt: number, s: any) => tt + Number(s.amount || 0), 0).toLocaleString()} {t.mod_currency}</div><p className="text-sm text-muted-foreground">{t.sub_recurring_revenue}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><RefreshCw className="w-8 h-8 mx-auto mb-2 text-blue-600" /><div className="text-2xl font-bold">{subs.filter((s: any) => s.status === 'active').length}</div><p className="text-sm text-muted-foreground">{t.sub_active}</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-6">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : subs.length === 0 ? <p className="text-center py-8 text-muted-foreground">{t.sub_no_subs}</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>{t.sub_plan}</TableHead><TableHead>{t.amount}</TableHead><TableHead>{t.sub_cycle}</TableHead><TableHead>{t.sub_start}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.actions}</TableHead></TableRow></TableHeader>
            <TableBody>
              {subs.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.plan_name}</TableCell>
                  <TableCell>{Number(s.amount || 0).toLocaleString()} {t.mod_currency}</TableCell>
                  <TableCell>{cycleLabels[s.billing_cycle] || s.billing_cycle}</TableCell>
                  <TableCell>{s.start_date}</TableCell>
                  <TableCell><Badge variant={s.status === 'active' ? 'default' : 'destructive'}>{s.status === 'active' ? t.sub_status_active : t.sub_status_stopped}</Badge></TableCell>
                  <TableCell><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(s.id)}><Trash2 className="w-3 h-3" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}