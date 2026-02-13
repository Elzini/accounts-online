import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

export function StockVouchersPage() {
  const { t } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'issue', notes: '' });

  const typeLabels: Record<string, string> = { receipt: t.sv_type_receipt, issue: t.sv_type_issue, transfer: t.sv_type_transfer };

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['stock-vouchers', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('stock_vouchers').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const num = `SV-${String(vouchers.length + 1).padStart(3, '0')}`;
      const { error } = await supabase.from('stock_vouchers').insert({ company_id: companyId!, voucher_number: num, voucher_type: form.type, voucher_date: new Date().toISOString().split('T')[0], status: 'draft', notes: form.notes || null });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-vouchers'] }); toast.success(t.sv_created); setShowAdd(false); setForm({ type: 'issue', notes: '' }); },
    onError: () => toast.error(t.mod_error),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('stock_vouchers').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-vouchers'] }); toast.success(t.mod_deleted); },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">{t.sv_title}</h1><p className="text-muted-foreground">{t.sv_subtitle}</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />{t.sv_new}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.sv_new_title}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t.sv_type}</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="issue">{t.sv_type_issue}</SelectItem><SelectItem value="receipt">{t.sv_type_receipt}</SelectItem><SelectItem value="transfer">{t.sv_type_transfer}</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>{t.notes}</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>{t.save}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">{t.sv_all} ({vouchers.length})</TabsTrigger>
          <TabsTrigger value="receipt" className="gap-1"><ArrowDownToLine className="w-3 h-3" />{t.sv_type_receipt}</TabsTrigger>
          <TabsTrigger value="issue" className="gap-1"><ArrowUpFromLine className="w-3 h-3" />{t.sv_type_issue}</TabsTrigger>
          <TabsTrigger value="transfer" className="gap-1"><ArrowLeftRight className="w-3 h-3" />{t.sv_type_transfer}</TabsTrigger>
        </TabsList>
        {['all', 'receipt', 'issue', 'transfer'].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <Card><CardContent className="pt-6">
              {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>{t.sv_number}</TableHead><TableHead>{t.sv_type}</TableHead><TableHead>{t.date}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.actions}</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {vouchers.filter((v: any) => tab === 'all' || v.voucher_type === tab).map((v: any) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-mono">{v.voucher_number}</TableCell>
                        <TableCell><Badge variant="outline">{typeLabels[v.voucher_type] || v.voucher_type}</Badge></TableCell>
                        <TableCell>{v.voucher_date}</TableCell>
                        <TableCell><Badge variant={v.status === 'approved' ? 'default' : 'secondary'}>{v.status === 'approved' ? t.sv_status_approved : v.status === 'pending' ? t.sv_status_pending : t.sv_status_draft}</Badge></TableCell>
                        <TableCell>{v.status === 'draft' && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(v.id)}><Trash2 className="w-3 h-3" /></Button>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent></Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}