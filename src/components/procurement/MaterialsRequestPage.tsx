import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Package } from 'lucide-react';
import { toast } from 'sonner';
import { usePurchaseOrders, useCreatePurchaseOrder } from '@/hooks/procurement/useProcurementService';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

export function MaterialsRequestPage() {
  const { t, language } = useLanguage();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ department: '', items: '', notes: '', urgency: 'normal' });

  const { data: requests = [], isLoading } = usePurchaseOrders(companyId, 'MR');
  const addMutation = useCreatePurchaseOrder(companyId, 'MR');

  const handleAdd = () => {
    const num = `MR-${String(requests.length + 1).padStart(4, '0')}`;
    addMutation.mutate(
      { order_number: num, order_date: new Date().toISOString().split('T')[0], status: 'draft', total_amount: 0, notes: `${form.department ? form.department + ' | ' : ''}${form.notes}` },
      {
        onSuccess: () => { toast.success(language === 'ar' ? 'تم إنشاء طلب المواد' : 'Materials request created'); setShowAdd(false); setForm({ department: '', items: '', notes: '', urgency: 'normal' }); },
        onError: () => toast.error(t.mod_error),
      }
    );
  };

  const filtered = requests.filter((r: any) => !search || (r.notes || '').toLowerCase().includes(search.toLowerCase()) || (r.order_number || '').includes(search));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">{language === 'ar' ? 'طلبات المواد' : 'Materials Requests'}</h1><p className="text-muted-foreground">{language === 'ar' ? 'إدارة طلبات شراء المواد والمستلزمات' : 'Manage materials purchase requests'}</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{language === 'ar' ? 'طلب جديد' : 'New Request'}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{language === 'ar' ? 'إنشاء طلب مواد' : 'Create Materials Request'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{language === 'ar' ? 'القسم' : 'Department'}</Label><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
              <div><Label>{language === 'ar' ? 'المواد المطلوبة' : 'Required Items'}</Label><Textarea value={form.items} onChange={e => setForm({ ...form, items: e.target.value })} /></div>
              <div><Label>{t.notes}</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              <Button className="w-full" onClick={handleAdd} disabled={addMutation.isPending}>{t.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><Package className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{requests.length}</div><p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي الطلبات' : 'Total Requests'}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-orange-600">{requests.filter((r: any) => r.status === 'draft').length}</div><p className="text-sm text-muted-foreground">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</p></CardContent></Card>
      </div>
      <Card>
        <div className="p-4"><div className="flex items-center gap-2"><Search className="w-4 h-4" /><Input placeholder={t.mod_search} value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" /></div></div>
        <CardContent>
          {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : filtered.length === 0 ? <p className="text-center py-8 text-muted-foreground">{language === 'ar' ? 'لا توجد طلبات' : 'No requests'}</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>{language === 'ar' ? 'رقم الطلب' : 'Request #'}</TableHead><TableHead>{t.date}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.notes}</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.order_number}</TableCell>
                    <TableCell>{r.order_date}</TableCell>
                    <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate">{r.notes || '-'}</TableCell>
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
