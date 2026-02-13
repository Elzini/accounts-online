import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, PackageCheck, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';

export function GoodsReceiptPage() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ notes: '' });

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ['goods-receipts', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('goods_receipts').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const num = `GR-${String(receipts.length + 1).padStart(3, '0')}`;
      const { error } = await supabase.from('goods_receipts').insert({ company_id: companyId!, receipt_number: num, receipt_date: new Date().toISOString().split('T')[0], status: 'pending', notes: form.notes || null });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goods-receipts'] }); toast.success('تم إنشاء إذن الاستلام'); setShowAdd(false); setForm({ notes: '' }); },
    onError: () => toast.error('حدث خطأ'),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">أذون الاستلام</h1><p className="text-muted-foreground">إدارة استلام البضائع من أوامر الشراء</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />إذن استلام جديد</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>إذن استلام جديد</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm({ notes: e.target.value })} /></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>حفظ</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><PackageCheck className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{receipts.length}</div><p className="text-sm text-muted-foreground">إجمالي الاستلامات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><ClipboardCheck className="w-8 h-8 mx-auto mb-2 text-blue-600" /><div className="text-2xl font-bold">{receipts.filter((r: any) => r.status === 'complete').length}</div><p className="text-sm text-muted-foreground">مكتملة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-orange-600">{receipts.filter((r: any) => r.status === 'pending').length}</div><p className="text-sm text-muted-foreground">معلقة</p></CardContent></Card>
      </div>

      <Card>
        <div className="p-4"><div className="flex items-center gap-2"><Search className="w-4 h-4" /><Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" /></div></div>
        <CardContent>
          {isLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> : receipts.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد أذون استلام</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>رقم الإذن</TableHead><TableHead>التاريخ</TableHead><TableHead>الحالة</TableHead><TableHead>ملاحظات</TableHead></TableRow></TableHeader>
              <TableBody>
                {receipts.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.receipt_number}</TableCell>
                    <TableCell>{r.receipt_date}</TableCell>
                    <TableCell><Badge variant={r.status === 'complete' ? 'default' : 'secondary'}>{r.status === 'complete' ? 'مكتمل' : 'معلق'}</Badge></TableCell>
                    <TableCell>{r.notes || '-'}</TableCell>
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
