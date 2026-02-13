import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Plus, Target, TrendingUp, Award, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';

export function SalesTargetsPage() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ employeeName: '', targetAmount: '', periodStart: '', periodEnd: '' });

  const { data: targets = [], isLoading } = useQuery({
    queryKey: ['sales-targets', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('sales_targets').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('sales_targets').insert({ company_id: companyId!, employee_name: form.employeeName, target_amount: Number(form.targetAmount) || 0, achieved_amount: 0, period_start: form.periodStart, period_end: form.periodEnd, status: 'active' });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sales-targets'] }); toast.success('تم إنشاء الهدف'); setShowAdd(false); setForm({ employeeName: '', targetAmount: '', periodStart: '', periodEnd: '' }); },
    onError: () => toast.error('حدث خطأ'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('sales_targets').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sales-targets'] }); toast.success('تم الحذف'); },
  });

  const totalTarget = targets.reduce((s: number, t: any) => s + Number(t.target_amount || 0), 0);
  const totalAchieved = targets.reduce((s: number, t: any) => s + Number(t.achieved_amount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">المبيعات المستهدفة</h1><p className="text-muted-foreground">أهداف بيعية للموظفين والأقسام</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />هدف جديد</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>هدف بيعي جديد</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>اسم الموظف</Label><Input value={form.employeeName} onChange={e => setForm(p => ({ ...p, employeeName: e.target.value }))} /></div>
              <div><Label>المبلغ المستهدف</Label><Input type="number" value={form.targetAmount} onChange={e => setForm(p => ({ ...p, targetAmount: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>بداية الفترة</Label><Input type="date" value={form.periodStart} onChange={e => setForm(p => ({ ...p, periodStart: e.target.value }))} /></div>
                <div><Label>نهاية الفترة</Label><Input type="date" value={form.periodEnd} onChange={e => setForm(p => ({ ...p, periodEnd: e.target.value }))} /></div>
              </div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.employeeName || !form.periodStart || !form.periodEnd}>حفظ</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Target className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{totalTarget.toLocaleString()} ر.س</div><p className="text-sm text-muted-foreground">الأهداف</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{totalAchieved.toLocaleString()} ر.س</div><p className="text-sm text-muted-foreground">المحقق</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Award className="w-8 h-8 mx-auto mb-2 text-yellow-500" /><div className="text-2xl font-bold">{totalTarget > 0 ? ((totalAchieved / totalTarget) * 100).toFixed(0) : 0}%</div><p className="text-sm text-muted-foreground">الإنجاز</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto mb-2 text-blue-600" /><div className="text-2xl font-bold">{targets.filter((t: any) => Number(t.achieved_amount) >= Number(t.target_amount) && Number(t.target_amount) > 0).length}/{targets.length}</div><p className="text-sm text-muted-foreground">حققوا الهدف</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-6">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> : targets.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد أهداف</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>الموظف</TableHead><TableHead>الفترة</TableHead><TableHead>الهدف</TableHead><TableHead>المحقق</TableHead><TableHead>التقدم</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
            <TableBody>
              {targets.map((t: any) => {
                const pct = Number(t.target_amount) > 0 ? (Number(t.achieved_amount) / Number(t.target_amount)) * 100 : 0;
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.employee_name}</TableCell>
                    <TableCell>{t.period_start} → {t.period_end}</TableCell>
                    <TableCell>{Number(t.target_amount).toLocaleString()} ر.س</TableCell>
                    <TableCell>{Number(t.achieved_amount).toLocaleString()} ر.س</TableCell>
                    <TableCell className="w-32"><div className="flex items-center gap-2"><Progress value={Math.min(pct, 100)} className="h-2" /><span className="text-xs">{pct.toFixed(0)}%</span></div></TableCell>
                    <TableCell><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(t.id)}><Trash2 className="w-3 h-3" /></Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}
