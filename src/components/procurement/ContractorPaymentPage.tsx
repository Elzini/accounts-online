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
import { usePurchaseOrders, useCreatePurchaseOrder } from '@/hooks/procurement/useProcurementService';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

export function ContractorPaymentPage() {
  const { t, language } = useLanguage();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ contractorName: '', amount: '', project: '', notes: '' });

  const { data: payments = [], isLoading } = usePurchaseOrders(companyId, 'CP');
  const addMutation = useCreatePurchaseOrder(companyId, 'CP');

  const handleAdd = () => {
    const num = `CP-${String(payments.length + 1).padStart(4, '0')}`;
    addMutation.mutate(
      { order_number: num, order_date: new Date().toISOString().split('T')[0], status: 'draft', total_amount: Number(form.amount) || 0, notes: `${form.contractorName} | ${form.project ? form.project + ' | ' : ''}${form.notes}` },
      {
        onSuccess: () => { toast.success(language === 'ar' ? 'تم إنشاء سند الصرف' : 'Payment voucher created'); setShowAdd(false); setForm({ contractorName: '', amount: '', project: '', notes: '' }); },
        onError: () => toast.error(t.mod_error),
      }
    );
  };

  const filtered = payments.filter((p: any) => !search || (p.notes || '').toLowerCase().includes(search.toLowerCase()) || (p.order_number || '').includes(search));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">{language === 'ar' ? 'سندات صرف المقاولين' : 'Contractor Payments'}</h1><p className="text-muted-foreground">{language === 'ar' ? 'إدارة المدفوعات للمقاولين والموردين' : 'Manage contractor payments'}</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{language === 'ar' ? 'سند صرف جديد' : 'New Payment'}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{language === 'ar' ? 'إنشاء سند صرف' : 'Create Payment Voucher'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{language === 'ar' ? 'اسم المقاول' : 'Contractor Name'}</Label><Input value={form.contractorName} onChange={e => setForm({ ...form, contractorName: e.target.value })} /></div>
              <div><Label>{language === 'ar' ? 'المبلغ' : 'Amount'}</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
              <div><Label>{language === 'ar' ? 'المشروع' : 'Project'}</Label><Input value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} /></div>
              <div><Label>{t.notes}</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              <Button className="w-full" onClick={handleAdd} disabled={addMutation.isPending}>{t.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><Banknote className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{payments.length}</div><p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي السندات' : 'Total Vouchers'}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-green-600">{payments.reduce((s: number, p: any) => s + (p.total_amount || 0), 0).toLocaleString()}</div><p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي المبالغ' : 'Total Amount'}</p></CardContent></Card>
      </div>
      <Card>
        <div className="p-4"><div className="flex items-center gap-2"><Search className="w-4 h-4" /><Input placeholder={t.mod_search} value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" /></div></div>
        <CardContent>
          {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : filtered.length === 0 ? <p className="text-center py-8 text-muted-foreground">{language === 'ar' ? 'لا توجد سندات صرف' : 'No payment vouchers'}</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>{language === 'ar' ? 'رقم السند' : 'Voucher #'}</TableHead><TableHead>{t.date}</TableHead><TableHead>{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.notes}</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono">{p.order_number}</TableCell>
                    <TableCell>{p.order_date}</TableCell>
                    <TableCell className="font-bold">{(p.total_amount || 0).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="secondary">{p.status}</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate">{p.notes || '-'}</TableCell>
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
