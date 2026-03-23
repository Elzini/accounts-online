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
import { Plus, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { usePurchaseOrders, useCreatePurchaseOrder, useUpdatePurchaseOrderStatus } from '@/hooks/procurement/useProcurementService';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  received: 'bg-primary/10 text-primary',
  cancelled: 'bg-destructive/10 text-destructive',
};

export function PurchaseOrdersPage() {
  const { t } = useLanguage();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ supplier: '', deliveryDate: '', notes: '', items: '' });

  const statusLabels: Record<string, string> = { draft: t.po_status_draft, sent: t.po_status_sent, confirmed: t.po_status_confirmed, received: t.po_status_received, cancelled: t.po_status_cancelled };

  const { data: orders = [], isLoading } = usePurchaseOrders(companyId);
  const addMutation = useCreatePurchaseOrder(companyId);
  const updateStatus = useUpdatePurchaseOrderStatus(companyId);

  const handleAdd = () => {
    const num = `PO-${String(orders.length + 1).padStart(3, '0')}`;
    addMutation.mutate(
      { order_number: num, order_date: new Date().toISOString().split('T')[0], status: 'draft', total_amount: 0, notes: form.notes || null, expected_delivery: form.deliveryDate || null },
      {
        onSuccess: () => { toast.success(t.po_created); setShowAdd(false); setForm({ supplier: '', deliveryDate: '', notes: '', items: '' }); },
        onError: () => toast.error(t.mod_error),
      }
    );
  };

  const handleStatusChange = (id: string, status: string) => {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => toast.success(t.po_updated),
      onError: () => toast.error(t.mod_error),
    });
  };

  const filtered = orders.filter((o: any) => !search || (o.order_number || '').toLowerCase().includes(search.toLowerCase()) || (o.notes || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">{t.po_title}</h1><p className="text-muted-foreground">{t.po_subtitle}</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{t.po_new}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.po_new_title}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t.po_supplier}</Label><Input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} /></div>
              <div><Label>{t.po_delivery_date}</Label><Input type="date" value={form.deliveryDate} onChange={e => setForm({ ...form, deliveryDate: e.target.value })} /></div>
              <div><Label>{t.po_items}</Label><Textarea value={form.items} onChange={e => setForm({ ...form, items: e.target.value })} rows={3} /></div>
              <div><Label>{t.notes}</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              <Button className="w-full" onClick={handleAdd} disabled={addMutation.isPending}>{t.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{orders.length}</div><p className="text-sm text-muted-foreground">{t.po_total}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-blue-600">{orders.filter((o: any) => o.status === 'sent').length}</div><p className="text-sm text-muted-foreground">{t.po_status_sent}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-green-600">{orders.filter((o: any) => o.status === 'confirmed').length}</div><p className="text-sm text-muted-foreground">{t.po_status_confirmed}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-orange-600">{orders.filter((o: any) => o.status === 'draft').length}</div><p className="text-sm text-muted-foreground">{t.po_status_draft}</p></CardContent></Card>
      </div>
      <Card>
        <div className="p-4"><div className="flex items-center gap-2"><Search className="w-4 h-4" /><Input placeholder={t.mod_search} value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" /></div></div>
        <CardContent>
          {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : filtered.length === 0 ? <p className="text-center py-8 text-muted-foreground">{t.po_no_orders}</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>{t.po_order_number}</TableHead><TableHead>{t.date}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.po_delivery_date}</TableHead><TableHead>{t.notes}</TableHead><TableHead>{t.actions}</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono">{o.order_number}</TableCell>
                    <TableCell>{o.order_date}</TableCell>
                    <TableCell><Badge className={statusColors[o.status] || ''}>{statusLabels[o.status] || o.status}</Badge></TableCell>
                    <TableCell>{o.expected_delivery || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{o.notes || '-'}</TableCell>
                    <TableCell>
                      <Select value={o.status} onValueChange={(v) => handleStatusChange(o.id, v)}>
                        <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
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
