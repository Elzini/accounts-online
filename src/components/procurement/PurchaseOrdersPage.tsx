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
import { Plus, Search, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ supplier: '', deliveryDate: '', notes: '', items: '' });

  const statusLabels: Record<string, string> = { draft: t.po_status_draft, sent: t.po_status_sent, confirmed: t.po_status_confirmed, received: t.po_status_received, cancelled: t.po_status_cancelled };

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['purchase-orders', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('purchase_orders').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const num = `PO-${String(orders.length + 1).padStart(3, '0')}`;
      const { error } = await supabase.from('purchase_orders').insert({
        company_id: companyId!, order_number: num, supplier_id: null, order_date: new Date().toISOString().split('T')[0],
        expected_delivery: form.deliveryDate || null, status: 'draft', notes: form.notes || null, total_amount: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchase-orders'] }); toast.success(t.po_created); setShowAdd(false); setForm({ supplier: '', deliveryDate: '', notes: '', items: '' }); },
    onError: () => toast.error(t.mod_error),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchase-orders'] }); toast.success(t.mod_deleted); },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('purchase_orders').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchase-orders'] }); toast.success(t.po_status_updated); },
  });

  const filtered = orders.filter((o: any) => o.order_number?.includes(search) || o.notes?.includes(search));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">{t.po_title}</h1><p className="text-muted-foreground">{t.po_subtitle}</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{t.po_new}</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{t.po_new_title}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t.po_expected_delivery}</Label><Input type="date" value={form.deliveryDate} onChange={e => setForm(p => ({ ...p, deliveryDate: e.target.value }))} /></div>
              <div><Label>{t.po_notes}</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder={t.po_notes_placeholder} /></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>{addMutation.isPending ? t.po_saving : t.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{orders.length}</div><p className="text-sm text-muted-foreground">{t.po_total_orders}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-blue-600">{orders.filter((o: any) => o.status === 'sent').length}</div><p className="text-sm text-muted-foreground">{t.po_sent}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-green-600">{orders.filter((o: any) => o.status === 'confirmed').length}</div><p className="text-sm text-muted-foreground">{t.po_confirmed}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-primary">{orders.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0).toLocaleString()} {t.mod_currency}</div><p className="text-sm text-muted-foreground">{t.po_total_value}</p></CardContent></Card>
      </div>

      <Card>
        <div className="p-4"><div className="flex items-center gap-2"><Search className="w-4 h-4 text-muted-foreground" /><Input placeholder={t.mod_search} value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" /></div></div>
        <CardContent>
          {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : filtered.length === 0 ? <p className="text-center py-8 text-muted-foreground">{t.po_no_orders}</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>{t.po_number}</TableHead><TableHead>{t.po_date}</TableHead><TableHead>{t.po_delivery}</TableHead><TableHead>{t.po_status}</TableHead><TableHead>{t.po_amount}</TableHead><TableHead>{t.actions}</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono">{o.order_number}</TableCell>
                    <TableCell>{o.order_date}</TableCell>
                    <TableCell>{o.expected_delivery || '-'}</TableCell>
                    <TableCell>
                      <Select value={o.status} onValueChange={v => updateStatus.mutate({ id: o.id, status: v })}>
                        <SelectTrigger className="h-7 w-24"><Badge className={statusColors[o.status]}>{statusLabels[o.status]}</Badge></SelectTrigger>
                        <SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{Number(o.total_amount || 0).toLocaleString()} {t.mod_currency}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {o.status === 'draft' && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(o.id)}><Trash2 className="w-3 h-3" /></Button>}
                      </div>
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