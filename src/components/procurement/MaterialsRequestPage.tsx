import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

export function MaterialsRequestPage() {
  const { t, language } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ department: '', items: '', notes: '', urgency: 'normal' });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['materials-requests', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('purchase_orders')
        .select('*').eq('company_id', companyId!)
        .like('order_number', 'MR-%')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const num = `MR-${String(requests.length + 1).padStart(4, '0')}`;
      const { error } = await supabase.from('purchase_orders').insert({
        company_id: companyId!, order_number: num, order_date: new Date().toISOString().split('T')[0],
        status: 'draft', notes: `${form.department ? form.department + ' | ' : ''}${form.notes}`, total_amount: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials-requests'] });
      toast.success(language === 'ar' ? 'تم إنشاء طلب المواد' : 'Materials request created');
      setShowAdd(false); setForm({ department: '', items: '', notes: '', urgency: 'normal' });
    },
    onError: () => toast.error(t.mod_error),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['materials-requests'] }); toast.success(t.mod_deleted); },
  });

  const filtered = requests.filter((r: any) => r.order_number?.includes(search) || r.notes?.includes(search));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{language === 'ar' ? 'طلب مواد' : 'Materials Request'}</h1>
          <p className="text-muted-foreground">{language === 'ar' ? 'إدارة طلبات المواد من الأقسام' : 'Manage department material requests'}</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{language === 'ar' ? 'طلب جديد' : 'New Request'}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{language === 'ar' ? 'طلب مواد جديد' : 'New Materials Request'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{language === 'ar' ? 'القسم الطالب' : 'Department'}</Label><Input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} /></div>
              <div><Label>{language === 'ar' ? 'المواد المطلوبة' : 'Requested Items'}</Label><Textarea value={form.items} onChange={e => setForm(p => ({ ...p, items: e.target.value }))} placeholder={language === 'ar' ? 'اكتب المواد المطلوبة...' : 'Enter requested materials...'} /></div>
              <div><Label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>{t.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><Package className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{requests.length}</div><p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي الطلبات' : 'Total Requests'}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-orange-600">{requests.filter((r: any) => r.status === 'draft').length}</div><p className="text-sm text-muted-foreground">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-green-600">{requests.filter((r: any) => r.status === 'confirmed').length}</div><p className="text-sm text-muted-foreground">{language === 'ar' ? 'معتمدة' : 'Approved'}</p></CardContent></Card>
      </div>

      <Card>
        <div className="p-4"><div className="flex items-center gap-2"><Search className="w-4 h-4 text-muted-foreground" /><Input placeholder={t.mod_search} value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" /></div></div>
        <CardContent>
          {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{language === 'ar' ? 'لا توجد طلبات' : 'No requests'}</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>{language === 'ar' ? 'رقم الطلب' : 'Request #'}</TableHead><TableHead>{t.date}</TableHead><TableHead>{language === 'ar' ? 'ملاحظات' : 'Notes'}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.actions}</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.order_number}</TableCell>
                    <TableCell>{r.order_date}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{r.notes || '-'}</TableCell>
                    <TableCell><Badge variant={r.status === 'confirmed' ? 'default' : 'secondary'}>{r.status === 'confirmed' ? (language === 'ar' ? 'معتمد' : 'Approved') : (language === 'ar' ? 'مسودة' : 'Draft')}</Badge></TableCell>
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
