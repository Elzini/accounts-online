import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, RotateCcw, RotateCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

export function CreditDebitNotesPage() {
  const { t } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'credit', amount: '', reason: '' });

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['credit-debit-notes', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('credit_debit_notes').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const prefix = form.type === 'credit' ? 'CN' : 'DN';
      const num = `${prefix}-${String(notes.length + 1).padStart(3, '0')}`;
      const { error } = await supabase.from('credit_debit_notes').insert({ company_id: companyId!, note_number: num, note_type: form.type, note_date: new Date().toISOString().split('T')[0], total_amount: Number(form.amount) || 0, reason: form.reason || null, status: 'draft' });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['credit-debit-notes'] }); toast.success(t.cdn_created); setShowAdd(false); setForm({ type: 'credit', amount: '', reason: '' }); },
    onError: () => toast.error(t.mod_error),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('credit_debit_notes').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['credit-debit-notes'] }); toast.success(t.mod_deleted); },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">{t.cdn_title}</h1><p className="text-muted-foreground">{t.cdn_subtitle}</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{t.cdn_new}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.cdn_new_title}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t.cdn_type}</Label><Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="credit">{t.cdn_type_credit}</SelectItem><SelectItem value="debit">{t.cdn_type_debit}</SelectItem></SelectContent></Select></div>
              <div><Label>{t.amount}</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
              <div><Label>{t.cdn_reason}</Label><Textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} /></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>{t.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><RotateCcw className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{notes.filter((n: any) => n.note_type === 'credit').length}</div><p className="text-sm text-muted-foreground">{t.cdn_credit_notes}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><RotateCw className="w-8 h-8 mx-auto mb-2 text-red-600" /><div className="text-2xl font-bold">{notes.filter((n: any) => n.note_type === 'debit').length}</div><p className="text-sm text-muted-foreground">{t.cdn_debit_notes}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-green-600">{notes.filter((n: any) => n.note_type === 'credit').reduce((s: number, n: any) => s + Number(n.total_amount || 0), 0).toLocaleString()} {t.mod_currency}</div><p className="text-sm text-muted-foreground">{t.cdn_total_credit}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-red-600">{notes.filter((n: any) => n.note_type === 'debit').reduce((s: number, n: any) => s + Number(n.total_amount || 0), 0).toLocaleString()} {t.mod_currency}</div><p className="text-sm text-muted-foreground">{t.cdn_total_debit}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList><TabsTrigger value="all">{t.cdn_all}</TabsTrigger><TabsTrigger value="credit"><RotateCcw className="w-3 h-3 mr-1" />{t.cdn_type_credit}</TabsTrigger><TabsTrigger value="debit"><RotateCw className="w-3 h-3 mr-1" />{t.cdn_type_debit}</TabsTrigger></TabsList>
        {['all', 'credit', 'debit'].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <Card><CardContent className="pt-6">
              {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>{t.cdn_number}</TableHead><TableHead>{t.cdn_type}</TableHead><TableHead>{t.date}</TableHead><TableHead>{t.amount}</TableHead><TableHead>{t.cdn_reason}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.actions}</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {notes.filter((n: any) => tab === 'all' || n.note_type === tab).map((n: any) => (
                      <TableRow key={n.id}>
                        <TableCell className="font-mono">{n.note_number}</TableCell>
                        <TableCell><Badge variant={n.note_type === 'credit' ? 'default' : 'destructive'}>{n.note_type === 'credit' ? t.cdn_type_credit : t.cdn_type_debit}</Badge></TableCell>
                        <TableCell>{n.note_date}</TableCell>
                        <TableCell>{Number(n.total_amount || 0).toLocaleString()} {t.mod_currency}</TableCell>
                        <TableCell className="text-sm">{n.reason || '-'}</TableCell>
                        <TableCell><Badge variant={n.status === 'approved' ? 'default' : 'secondary'}>{n.status === 'approved' ? t.sv_status_approved : n.status === 'pending' ? t.sv_status_pending : t.sv_status_draft}</Badge></TableCell>
                        <TableCell>{n.status === 'draft' && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(n.id)}><Trash2 className="w-3 h-3" /></Button>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent></Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}