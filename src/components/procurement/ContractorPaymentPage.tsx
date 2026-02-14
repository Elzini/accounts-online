import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Trash2, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

export function ContractorPaymentPage() {
  const { t, language } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ contractorName: '', amount: '', project: '', notes: '' });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['contractor-payments', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('purchase_orders')
        .select('*').eq('company_id', companyId!)
        .like('order_number', 'CP-%')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const num = `CP-${String(payments.length + 1).padStart(4, '0')}`;
      const { error } = await supabase.from('purchase_orders').insert({
        company_id: companyId!, order_number: num, order_date: new Date().toISOString().split('T')[0],
        status: 'draft', total_amount: Number(form.amount) || 0,
        notes: `${form.contractorName} | ${form.project ? form.project + ' | ' : ''}${form.notes}`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-payments'] });
      toast.success(language === 'ar' ? 'تم إنشاء سند الصرف' : 'Payment voucher created');
      setShowAdd(false); setForm({ contractorName: '', amount: '', project: '', notes: '' });
    },
    onError: () => toast.error(t.mod_error),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contractor-payments'] }); toast.success(t.mod_deleted); },
  });

  const filtered = payments.filter((p: any) => p.order_number?.includes(search) || p.notes?.includes(search));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{language === 'ar' ? 'سند صرف مقاول' : 'Contractor Payment Voucher'}</h1>
          <p className="text-muted-foreground">{language === 'ar' ? 'إدارة سندات صرف المقاولين' : 'Manage contractor payment vouchers'}</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{language === 'ar' ? 'سند جديد' : 'New Voucher'}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{language === 'ar' ? 'سند صرف مقاول جديد' : 'New Contractor Payment'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{language === 'ar' ? 'اسم المقاول' : 'Contractor Name'}</Label><Input value={form.contractorName} onChange={e => setForm(p => ({ ...p, contractorName: e.target.value }))} /></div>
              <div><Label>{language === 'ar' ? 'المشروع' : 'Project'}</Label><Input value={form.project} onChange={e => setForm(p => ({ ...p, project: e.target.value }))} /></div>
              <div><Label>{t.amount}</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
              <div><Label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>{t.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><Banknote className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{payments.length}</div><p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي السندات' : 'Total Vouchers'}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-orange-600">{payments.filter((p: any) => p.status === 'draft').length}</div><p className="text-sm text-muted-foreground">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-primary">{payments.reduce((s: number, p: any) => s + Number(p.total_amount || 0), 0).toLocaleString()} {t.mod_currency}</div><p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي المبلغ' : 'Total Amount'}</p></CardContent></Card>
      </div>

      <Card>
        <div className="p-4"><div className="flex items-center gap-2"><Search className="w-4 h-4 text-muted-foreground" /><Input placeholder={t.mod_search} value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" /></div></div>
        <CardContent>
          {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{language === 'ar' ? 'لا توجد سندات' : 'No vouchers'}</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>{language === 'ar' ? 'رقم السند' : 'Voucher #'}</TableHead><TableHead>{t.date}</TableHead><TableHead>{t.amount}</TableHead><TableHead>{language === 'ar' ? 'التفاصيل' : 'Details'}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.actions}</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono">{p.order_number}</TableCell>
                    <TableCell>{p.order_date}</TableCell>
                    <TableCell>{Number(p.total_amount || 0).toLocaleString()} {t.mod_currency}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{p.notes || '-'}</TableCell>
                    <TableCell><Badge variant={p.status === 'confirmed' ? 'default' : 'secondary'}>{p.status === 'confirmed' ? (language === 'ar' ? 'معتمد' : 'Approved') : (language === 'ar' ? 'مسودة' : 'Draft')}</Badge></TableCell>
                    <TableCell>{p.status === 'draft' && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="w-3 h-3" /></Button>}</TableCell>
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
