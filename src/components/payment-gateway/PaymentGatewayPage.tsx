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
import { useLanguage } from '@/contexts/LanguageContext';

export function PaymentGatewayPage() {
  const { t } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ amount: '', customerName: '', paymentMethod: 'card', customerEmail: '' });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['payment-transactions', companyId],
    queryFn: async () => { const { data, error } = await supabase.from('payment_transactions').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }); if (error) throw error; return data; },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => { const ref = `PAY-${String(transactions.length + 1).padStart(3, '0')}`; const { error } = await supabase.from('payment_transactions').insert({ company_id: companyId!, transaction_ref: ref, amount: Number(form.amount) || 0, customer_name: form.customerName || null, customer_email: form.customerEmail || null, payment_method: form.paymentMethod, status: 'pending' }); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payment-transactions'] }); toast.success(t.pg_created); setShowAdd(false); setForm({ amount: '', customerName: '', paymentMethod: 'card', customerEmail: '' }); },
    onError: () => toast.error(t.mod_error),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('payment_transactions').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payment-transactions'] }); toast.success(t.mod_deleted); },
  });

  const totalSuccess = transactions.filter((tx: any) => tx.status === 'success').reduce((s: number, tx: any) => s + Number(tx.amount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">{t.pg_title}</h1><p className="text-muted-foreground">{t.pg_subtitle}</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Link2 className="w-4 h-4" />{t.pg_new}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.pg_new_title}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t.amount}</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
              <div><Label>{t.pg_customer_name}</Label><Input value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} /></div>
              <div><Label>{t.pg_payment_method}</Label><Select value={form.paymentMethod} onValueChange={v => setForm(p => ({ ...p, paymentMethod: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="card">{t.pg_method_card}</SelectItem><SelectItem value="bank_transfer">{t.pg_method_bank}</SelectItem><SelectItem value="cash">{t.pg_method_cash}</SelectItem></SelectContent></Select></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.amount}>{t.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><CreditCard className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{transactions.length}</div><p className="text-sm text-muted-foreground">{t.pg_transactions}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-green-600">{totalSuccess.toLocaleString()} {t.mod_currency}</div><p className="text-sm text-muted-foreground">{t.pg_successful}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-destructive">{transactions.filter((tx: any) => tx.status === 'failed').length}</div><p className="text-sm text-muted-foreground">{t.pg_failed}</p></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle className="text-base">{t.pg_transactions}</CardTitle></CardHeader><CardContent>
        {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : transactions.length === 0 ? <p className="text-center py-8 text-muted-foreground">{t.mod_no_data}</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>{t.pg_ref}</TableHead><TableHead>{t.pg_customer}</TableHead><TableHead>{t.amount}</TableHead><TableHead>{t.pg_method}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.actions}</TableHead></TableRow></TableHeader>
            <TableBody>
              {transactions.map((tx: any) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono">{tx.transaction_ref}</TableCell>
                  <TableCell>{tx.customer_name || '-'}</TableCell>
                  <TableCell>{Number(tx.amount || 0).toLocaleString()} {t.mod_currency}</TableCell>
                  <TableCell>{tx.payment_method}</TableCell>
                  <TableCell><Badge variant={tx.status === 'success' ? 'default' : tx.status === 'failed' ? 'destructive' : 'secondary'}>{tx.status === 'success' ? t.pg_status_success : tx.status === 'failed' ? t.pg_status_failed : t.pg_status_pending}</Badge></TableCell>
                  <TableCell><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(tx.id)}><Trash2 className="w-3 h-3" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}