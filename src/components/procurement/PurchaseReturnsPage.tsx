import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Trash2, RotateCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

export function PurchaseReturnsPage() {
  const { t, language } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ amount: '', reason: '', supplier: '' });

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ['purchase-returns', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('credit_debit_notes')
        .select('*').eq('company_id', companyId!).eq('note_type', 'debit')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const num = `PR-${String(returns.length + 1).padStart(4, '0')}`;
      const { error } = await supabase.from('credit_debit_notes').insert({
        company_id: companyId!, note_number: num, note_type: 'debit',
        note_date: new Date().toISOString().split('T')[0],
        total_amount: Number(form.amount) || 0, reason: form.reason || null, status: 'draft',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-returns'] });
      toast.success(language === 'ar' ? 'تم حفظ مرتجع المشتريات' : 'Purchase return saved');
      setShowAdd(false); setForm({ amount: '', reason: '', supplier: '' });
    },
    onError: () => toast.error(t.mod_error),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('credit_debit_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchase-returns'] }); toast.success(t.mod_deleted); },
  });

  const filtered = returns.filter((r: any) => r.note_number?.includes(search) || r.reason?.includes(search));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{language === 'ar' ? 'مرتجع مشتريات / إشعار مدين' : 'Purchase Returns / Debit Note'}</h1>
          <p className="text-muted-foreground">{language === 'ar' ? 'إدارة مرتجعات المشتريات وإشعارات المدين' : 'Manage purchase returns and debit notes'}</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{language === 'ar' ? 'سند جديد' : 'New Return'}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{language === 'ar' ? 'مرتجع مشتريات / إشعار مدين' : 'Purchase Return / Debit Note'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{language === 'ar' ? 'المورد' : 'Supplier'}</Label><Input value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))} /></div>
              <div><Label>{t.amount}</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
              <div><Label>{language === 'ar' ? 'السبب' : 'Reason'}</Label><Textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} /></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}><Save className="w-4 h-4 mr-2" />{t.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{returns.length}</div><p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي المرتجعات' : 'Total Returns'}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-orange-600">{returns.filter((r: any) => r.status === 'draft').length}</div><p className="text-sm text-muted-foreground">{language === 'ar' ? 'مسودة' : 'Draft'}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-primary">{returns.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0).toLocaleString()} {t.mod_currency}</div><p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي المبلغ' : 'Total Amount'}</p></CardContent></Card>
      </div>

      <Card>
        <div className="p-4"><div className="flex items-center gap-2"><Search className="w-4 h-4 text-muted-foreground" /><Input placeholder={t.mod_search} value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" /></div></div>
        <CardContent>
          {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{language === 'ar' ? 'لا توجد مرتجعات' : 'No returns'}</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>{language === 'ar' ? 'رقم المرتجع' : 'Return #'}</TableHead><TableHead>{t.date}</TableHead><TableHead>{t.amount}</TableHead><TableHead>{language === 'ar' ? 'السبب' : 'Reason'}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.actions}</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.note_number}</TableCell>
                    <TableCell>{r.note_date}</TableCell>
                    <TableCell>{Number(r.total_amount || 0).toLocaleString()} {t.mod_currency}</TableCell>
                    <TableCell className="text-sm">{r.reason || '-'}</TableCell>
                    <TableCell><Badge variant={r.status === 'approved' ? 'default' : 'secondary'}>{r.status === 'approved' ? (language === 'ar' ? 'معتمد' : 'Approved') : (language === 'ar' ? 'مسودة' : 'Draft')}</Badge></TableCell>
                    <TableCell>{r.status === 'draft' && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(r.id)}><Trash2 className="w-3 h-3" /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
