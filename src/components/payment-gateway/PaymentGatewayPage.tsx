import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Link2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';

export function PaymentGatewayPage() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ amount: '', customerName: '', paymentMethod: 'card', customerEmail: '' });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['payment-transactions', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('payment_transactions').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const ref = `PAY-${String(transactions.length + 1).padStart(3, '0')}`;
      const { error } = await supabase.from('payment_transactions').insert({ company_id: companyId!, transaction_ref: ref, amount: Number(form.amount) || 0, customer_name: form.customerName || null, customer_email: form.customerEmail || null, payment_method: form.paymentMethod, status: 'pending' });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payment-transactions'] }); toast.success('تم إنشاء المعاملة'); setShowAdd(false); setForm({ amount: '', customerName: '', paymentMethod: 'card', customerEmail: '' }); },
    onError: () => toast.error('حدث خطأ'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('payment_transactions').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payment-transactions'] }); toast.success('تم الحذف'); },
  });

  const totalSuccess = transactions.filter((t: any) => t.status === 'success').reduce((s: number, t: any) => s + Number(t.amount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">بوابة الدفع الإلكتروني</h1><p className="text-muted-foreground">تحصيل المدفوعات وإدارة المعاملات</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Link2 className="w-4 h-4" />معاملة جديدة</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>معاملة دفع جديدة</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>المبلغ</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
              <div><Label>اسم العميل</Label><Input value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} /></div>
              <div><Label>وسيلة الدفع</Label><Select value={form.paymentMethod} onValueChange={v => setForm(p => ({ ...p, paymentMethod: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="card">بطاقة</SelectItem><SelectItem value="bank_transfer">تحويل بنكي</SelectItem><SelectItem value="cash">نقدي</SelectItem></SelectContent></Select></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.amount}>حفظ</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><CreditCard className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{transactions.length}</div><p className="text-sm text-muted-foreground">المعاملات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-green-600">{totalSuccess.toLocaleString()} ر.س</div><p className="text-sm text-muted-foreground">مدفوعات ناجحة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-destructive">{transactions.filter((t: any) => t.status === 'failed').length}</div><p className="text-sm text-muted-foreground">فاشلة</p></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base">المعاملات</CardTitle></CardHeader><CardContent>
        {isLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> : transactions.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد معاملات</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>المرجع</TableHead><TableHead>العميل</TableHead><TableHead>المبلغ</TableHead><TableHead>الوسيلة</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
            <TableBody>
              {transactions.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono">{t.transaction_ref}</TableCell>
                  <TableCell>{t.customer_name || '-'}</TableCell>
                  <TableCell>{Number(t.amount || 0).toLocaleString()} ر.س</TableCell>
                  <TableCell>{t.payment_method}</TableCell>
                  <TableCell><Badge variant={t.status === 'success' ? 'default' : t.status === 'failed' ? 'destructive' : 'secondary'}>{t.status === 'success' ? 'ناجح' : t.status === 'failed' ? 'فاشل' : 'معلق'}</Badge></TableCell>
                  <TableCell><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(t.id)}><Trash2 className="w-3 h-3" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}
