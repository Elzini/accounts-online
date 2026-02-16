import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';
import { EditReviewDialog } from '@/components/common/EditReviewDialog';

const stageColors: Record<string, string> = { new: 'bg-blue-100 text-blue-800', qualified: 'bg-purple-100 text-purple-800', proposal: 'bg-orange-100 text-orange-800', negotiation: 'bg-yellow-100 text-yellow-800', won: 'bg-green-100 text-green-800', lost: 'bg-red-100 text-red-800' };

export function CRMPage() {
  const { t } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', source: '', expectedValue: '' });
  const [reviewData, setReviewData] = useState<{ open: boolean; oldData: any; newData: any } | null>(null);

  const stageLabels: Record<string, string> = { new: t.crm_stage_new, qualified: t.crm_stage_qualified, proposal: t.crm_stage_proposal, negotiation: t.crm_stage_negotiation, won: t.crm_stage_won, lost: t.crm_stage_lost };

  const fieldLabels: Record<string, string> = {
    status: t.crm_stage,
    name: t.name,
    email: t.email,
    phone: t.phone,
    source: t.crm_source,
    expected_value: t.crm_expected_value,
  };

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['crm-leads', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('crm_leads').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('crm_leads').insert({ company_id: companyId!, name: form.name, email: form.email || null, phone: form.phone || null, source: form.source || null, expected_value: Number(form.expectedValue) || 0, status: 'new' });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-leads'] }); toast.success(t.crm_added); setShowAdd(false); setForm({ name: '', email: '', phone: '', source: '', expectedValue: '' }); },
    onError: () => toast.error(t.mod_error),
  });

  const updateStage = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('crm_leads').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-leads'] }); toast.success(t.crm_updated); setReviewData(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('crm_leads').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-leads'] }); toast.success(t.mod_deleted); },
  });

  const handleStageChange = (lead: any, newStatus: string) => {
    setReviewData({
      open: true,
      oldData: { ...lead, status: lead.status },
      newData: { ...lead, status: newStatus },
    });
  };

  const confirmUpdate = () => {
    if (!reviewData) return;
    const { oldData, newData } = reviewData;
    updateStage.mutate({ id: oldData.id, status: newData.status });
  };

  const stages = ['new', 'qualified', 'proposal', 'negotiation', 'won'];
  const pipeline = stages.map(s => ({ stage: s, count: leads.filter((l: any) => l.status === s).length, value: leads.filter((l: any) => l.status === s).reduce((sum: number, l: any) => sum + Number(l.expected_value || 0), 0) }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">{t.crm_title}</h1><p className="text-muted-foreground">{t.crm_subtitle}</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{t.crm_new}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.crm_new_title}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t.name}</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t.email}</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
                <div><Label>{t.phone}</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t.crm_source}</Label><Input value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} placeholder={t.crm_source_placeholder} /></div>
                <div><Label>{t.crm_expected_value}</Label><Input type="number" value={form.expectedValue} onChange={e => setForm(p => ({ ...p, expectedValue: e.target.value }))} /></div>
              </div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.name}>{t.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {pipeline.map(p => (
          <Card key={p.stage}><CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">{stageLabels[p.stage]}</p>
            <div className="text-xl font-bold">{p.count}</div>
            <p className="text-xs text-muted-foreground">{p.value.toLocaleString()} {t.mod_currency}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card><CardContent className="pt-6">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : leads.length === 0 ? <p className="text-center py-8 text-muted-foreground">{t.crm_no_leads}</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>{t.name}</TableHead><TableHead>{t.phone}</TableHead><TableHead>{t.crm_stage}</TableHead><TableHead>{t.crm_value}</TableHead><TableHead>{t.crm_source}</TableHead><TableHead>{t.actions}</TableHead></TableRow></TableHeader>
            <TableBody>
              {leads.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell dir="ltr">{l.phone || '-'}</TableCell>
                  <TableCell>
                    <Select value={l.status} onValueChange={v => handleStageChange(l, v)}>
                      <SelectTrigger className="h-7 w-24"><Badge className={stageColors[l.status]}>{stageLabels[l.status]}</Badge></SelectTrigger>
                      <SelectContent>{Object.entries(stageLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{Number(l.expected_value || 0).toLocaleString()} {t.mod_currency}</TableCell>
                  <TableCell>{l.source || '-'}</TableCell>
                  <TableCell><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(l.id)}><Trash2 className="w-3 h-3" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      {reviewData && (
        <EditReviewDialog
          open={reviewData.open}
          onOpenChange={(open) => !open && setReviewData(null)}
          onConfirm={confirmUpdate}
          isPending={updateStage.isPending}
          oldData={reviewData.oldData}
          newData={reviewData.newData}
          fieldLabels={fieldLabels}
        />
      )}
    </div>
  );
}
