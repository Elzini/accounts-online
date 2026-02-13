import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Users, DollarSign, Clock, CheckCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';

export function BookkeepingServicePage() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ clientName: '', contactPerson: '', phone: '', monthlyFee: '' });

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['bookkeeping-clients', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('bookkeeping_clients').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['bookkeeping-tasks', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('bookkeeping_tasks').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('bookkeeping_clients').insert({ company_id: companyId!, client_name: form.clientName, contact_person: form.contactPerson || null, phone: form.phone || null, monthly_fee: Number(form.monthlyFee) || 0, status: 'active' });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bookkeeping-clients'] }); toast.success('تم إضافة العميل'); setShowAdd(false); setForm({ clientName: '', contactPerson: '', phone: '', monthlyFee: '' }); },
    onError: () => toast.error('حدث خطأ'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('bookkeeping_clients').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bookkeeping-clients'] }); toast.success('تم الحذف'); },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">مسك الدفاتر كخدمة</h1><p className="text-muted-foreground">إدارة حسابات العملاء وتقديم خدمات المحاسبة</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />عميل جديد</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>عميل جديد</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>اسم العميل</Label><Input value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} /></div>
              <div><Label>جهة الاتصال</Label><Input value={form.contactPerson} onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))} /></div>
              <div><Label>الهاتف</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div><Label>الرسوم الشهرية</Label><Input type="number" value={form.monthlyFee} onChange={e => setForm(p => ({ ...p, monthlyFee: e.target.value }))} /></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.clientName}>حفظ</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{clients.filter((c: any) => c.status === 'active').length}</div><p className="text-sm text-muted-foreground">عملاء نشطين</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{clients.filter((c: any) => c.status === 'active').reduce((s: number, c: any) => s + Number(c.monthly_fee || 0), 0).toLocaleString()} ر.س</div><p className="text-sm text-muted-foreground">إيراد شهري</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto mb-2 text-orange-600" /><div className="text-2xl font-bold">{tasks.filter((t: any) => t.status !== 'completed').length}</div><p className="text-sm text-muted-foreground">مهام معلقة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{tasks.filter((t: any) => t.status === 'completed').length}</div><p className="text-sm text-muted-foreground">مهام مكتملة</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-6">
        {clientsLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> : clients.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد عملاء</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>العميل</TableHead><TableHead>جهة الاتصال</TableHead><TableHead>الرسوم</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
            <TableBody>
              {clients.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.client_name}</TableCell>
                  <TableCell>{c.contact_person || '-'}</TableCell>
                  <TableCell>{Number(c.monthly_fee || 0).toLocaleString()} ر.س</TableCell>
                  <TableCell><Badge variant={c.status === 'active' ? 'default' : 'secondary'}>{c.status === 'active' ? 'نشط' : 'متوقف'}</Badge></TableCell>
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
