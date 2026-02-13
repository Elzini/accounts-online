import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Timer, Clock, BarChart3, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';

export function TimeTrackingPage() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ projectName: '', taskName: '', hours: '', billable: true, date: new Date().toISOString().split('T')[0] });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['time-entries', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('time_entries').select('*').eq('company_id', companyId!).order('entry_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('time_entries').insert({ company_id: companyId!, project_name: form.projectName || null, task_name: form.taskName || null, hours: Number(form.hours) || 0, billable: form.billable, entry_date: form.date });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['time-entries'] }); toast.success('تم تسجيل الوقت'); setShowAdd(false); setForm({ projectName: '', taskName: '', hours: '', billable: true, date: new Date().toISOString().split('T')[0] }); },
    onError: () => toast.error('حدث خطأ'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('time_entries').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['time-entries'] }); toast.success('تم الحذف'); },
  });

  const totalHours = entries.reduce((s: number, e: any) => s + Number(e.hours || 0), 0);
  const billableHours = entries.filter((e: any) => e.billable).reduce((s: number, e: any) => s + Number(e.hours || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">تتبع الوقت</h1><p className="text-muted-foreground">تسجيل ساعات العمل والمشاريع</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />تسجيل وقت</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>تسجيل وقت جديد</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>المشروع</Label><Input value={form.projectName} onChange={e => setForm(p => ({ ...p, projectName: e.target.value }))} /></div>
              <div><Label>المهمة</Label><Input value={form.taskName} onChange={e => setForm(p => ({ ...p, taskName: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>الساعات</Label><Input type="number" step="0.5" value={form.hours} onChange={e => setForm(p => ({ ...p, hours: e.target.value }))} /></div>
                <div><Label>التاريخ</Label><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
              </div>
              <div className="flex items-center gap-2"><Checkbox checked={form.billable} onCheckedChange={c => setForm(p => ({ ...p, billable: !!c }))} /><Label>قابل للفوترة</Label></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.hours}>حفظ</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Timer className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{totalHours}h</div><p className="text-sm text-muted-foreground">إجمالي الساعات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{billableHours}h</div><p className="text-sm text-muted-foreground">قابلة للفوترة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-600" /><div className="text-2xl font-bold">{totalHours > 0 ? ((billableHours / totalHours) * 100).toFixed(0) : 0}%</div><p className="text-sm text-muted-foreground">نسبة الفوترة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{entries.length}</div><p className="text-sm text-muted-foreground">تسجيلات</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-6">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> : entries.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد تسجيلات</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>المشروع</TableHead><TableHead>المهمة</TableHead><TableHead>التاريخ</TableHead><TableHead>الساعات</TableHead><TableHead>فوترة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
            <TableBody>
              {entries.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.project_name || '-'}</TableCell>
                  <TableCell>{e.task_name || '-'}</TableCell>
                  <TableCell>{e.entry_date}</TableCell>
                  <TableCell className="font-bold">{e.hours}h</TableCell>
                  <TableCell><Badge variant={e.billable ? 'default' : 'secondary'}>{e.billable ? 'نعم' : 'لا'}</Badge></TableCell>
                  <TableCell><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(e.id)}><Trash2 className="w-3 h-3" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}
