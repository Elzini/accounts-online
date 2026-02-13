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
import { Plus, Wrench, Clock, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';

const priorityLabels: Record<string, string> = { low: 'منخفض', medium: 'متوسط', high: 'عالي', urgent: 'عاجل' };
const statusLabels: Record<string, string> = { pending: 'بانتظار', in_progress: 'قيد التنفيذ', completed: 'مكتمل' };

export function WorkOrdersPage() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', dueDate: '' });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['work-orders', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('work_orders').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const num = `WO-${String(orders.length + 1).padStart(3, '0')}`;
      const { error } = await supabase.from('work_orders').insert({ company_id: companyId!, order_number: num, title: form.title, description: form.description || null, priority: form.priority, due_date: form.dueDate || null, status: 'pending' });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['work-orders'] }); toast.success('تم إنشاء أمر العمل'); setShowAdd(false); setForm({ title: '', description: '', priority: 'medium', dueDate: '' }); },
    onError: () => toast.error('حدث خطأ'),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => { const { error } = await supabase.from('work_orders').update({ status }).eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['work-orders'] }); toast.success('تم التحديث'); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('work_orders').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['work-orders'] }); toast.success('تم الحذف'); },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">أوامر العمل</h1><p className="text-muted-foreground">تتبع وإدارة أوامر العمل والخدمات</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />أمر عمل جديد</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>أمر عمل جديد</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>العنوان</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div><Label>الوصف</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>الأولوية</Label><Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(priorityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>الموعد</Label><Input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} /></div>
              </div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.title}>حفظ</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Wrench className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{orders.length}</div><p className="text-sm text-muted-foreground">إجمالي الأوامر</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto mb-2 text-orange-600" /><div className="text-2xl font-bold">{orders.filter((o: any) => o.status === 'in_progress').length}</div><p className="text-sm text-muted-foreground">قيد التنفيذ</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{orders.filter((o: any) => o.status === 'completed').length}</div><p className="text-sm text-muted-foreground">مكتملة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" /><div className="text-2xl font-bold">{orders.filter((o: any) => o.priority === 'urgent').length}</div><p className="text-sm text-muted-foreground">عاجلة</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-6">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> : orders.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد أوامر عمل</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>الرقم</TableHead><TableHead>العنوان</TableHead><TableHead>الأولوية</TableHead><TableHead>الموعد</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
            <TableBody>
              {orders.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono">{o.order_number}</TableCell>
                  <TableCell className="font-medium">{o.title}</TableCell>
                  <TableCell><Badge variant={o.priority === 'urgent' ? 'destructive' : o.priority === 'high' ? 'default' : 'secondary'}>{priorityLabels[o.priority]}</Badge></TableCell>
                  <TableCell>{o.due_date || '-'}</TableCell>
                  <TableCell>
                    <Select value={o.status} onValueChange={v => updateStatus.mutate({ id: o.id, status: v })}>
                      <SelectTrigger className="h-7 w-28"><Badge variant={o.status === 'completed' ? 'default' : 'secondary'}>{statusLabels[o.status]}</Badge></SelectTrigger>
                      <SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(o.id)}><Trash2 className="w-3 h-3" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}
