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

const typeLabels: Record<string, string> = { receipt: 'إضافة', issue: 'صرف', transfer: 'تحويل' };

export function StockVouchersPage() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'issue', notes: '' });

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-vouchers'] }); toast.success('تم إنشاء الإذن المخزني'); setShowAdd(false); setForm({ type: 'issue', notes: '' }); },
    onError: () => toast.error('حدث خطأ'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('stock_vouchers').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-vouchers'] }); toast.success('تم الحذف'); },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">الأذون المخزنية</h1><p className="text-muted-foreground">أذون الصرف والإضافة والتحويل بين المستودعات</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />إذن جديد</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>إذن مخزني جديد</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>النوع</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="issue">صرف</SelectItem><SelectItem value="receipt">إضافة</SelectItem><SelectItem value="transfer">تحويل</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>حفظ</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">الكل ({vouchers.length})</TabsTrigger>
          <TabsTrigger value="receipt" className="gap-1"><ArrowDownToLine className="w-3 h-3" />إضافة</TabsTrigger>
          <TabsTrigger value="issue" className="gap-1"><ArrowUpFromLine className="w-3 h-3" />صرف</TabsTrigger>
          <TabsTrigger value="transfer" className="gap-1"><ArrowLeftRight className="w-3 h-3" />تحويل</TabsTrigger>
        </TabsList>
        {['all', 'receipt', 'issue', 'transfer'].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <Card><CardContent className="pt-6">
              {isLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>الرقم</TableHead><TableHead>النوع</TableHead><TableHead>التاريخ</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {vouchers.filter((v: any) => tab === 'all' || v.voucher_type === tab).map((v: any) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-mono">{v.voucher_number}</TableCell>
                        <TableCell><Badge variant="outline">{typeLabels[v.voucher_type] || v.voucher_type}</Badge></TableCell>
                        <TableCell>{v.voucher_date}</TableCell>
                        <TableCell><Badge variant={v.status === 'approved' ? 'default' : 'secondary'}>{v.status === 'approved' ? 'معتمد' : v.status === 'pending' ? 'بانتظار' : 'مسودة'}</Badge></TableCell>
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
