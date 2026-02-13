import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';

const stageLabels: Record<string, string> = { new: 'جديد', qualified: 'مؤهل', proposal: 'عرض سعر', negotiation: 'تفاوض', won: 'مكسوب', lost: 'خسارة' };
const stageColors: Record<string, string> = { new: 'bg-blue-100 text-blue-800', qualified: 'bg-purple-100 text-purple-800', proposal: 'bg-orange-100 text-orange-800', negotiation: 'bg-yellow-100 text-yellow-800', won: 'bg-green-100 text-green-800', lost: 'bg-red-100 text-red-800' };

export function CRMPage() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', source: '', expectedValue: '' });

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['crm-leads', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('crm_leads').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('crm_leads').insert({ company_id: companyId!, name: form.name, email: form.email || null, phone: form.phone || null, source: form.source || null, expected_value: Number(form.expectedValue) || 0, status: 'new' });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-leads'] }); toast.success('تم إضافة الفرصة'); setShowAdd(false); setForm({ name: '', email: '', phone: '', source: '', expectedValue: '' }); },
    onError: () => toast.error('حدث خطأ'),
  });

  const updateStage = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('crm_leads').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-leads'] }); toast.success('تم التحديث'); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('crm_leads').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-leads'] }); toast.success('تم الحذف'); },
  });

  const stages = ['new', 'qualified', 'proposal', 'negotiation', 'won'];
  const pipeline = stages.map(s => ({ stage: s, count: leads.filter((l: any) => l.status === s).length, value: leads.filter((l: any) => l.status === s).reduce((sum: number, l: any) => sum + Number(l.expected_value || 0), 0) }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">إدارة علاقات العملاء CRM</h1><p className="text-muted-foreground">تتبع فرص البيع وإدارة العملاء المحتملين</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />فرصة جديدة</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>فرصة بيع جديدة</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>الاسم</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>البريد</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
                <div><Label>الهاتف</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>المصدر</Label><Input value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} placeholder="موقع، إحالة..." /></div>
                <div><Label>القيمة المتوقعة</Label><Input type="number" value={form.expectedValue} onChange={e => setForm(p => ({ ...p, expectedValue: e.target.value }))} /></div>
              </div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.name}>حفظ</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {pipeline.map(p => (
          <Card key={p.stage}><CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">{stageLabels[p.stage]}</p>
            <div className="text-xl font-bold">{p.count}</div>
            <p className="text-xs text-muted-foreground">{p.value.toLocaleString()} ر.س</p>
          </CardContent></Card>
        ))}
      </div>

      <Card><CardContent className="pt-6">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> : leads.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد فرص بيع</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>الاسم</TableHead><TableHead>الهاتف</TableHead><TableHead>المرحلة</TableHead><TableHead>القيمة</TableHead><TableHead>المصدر</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
            <TableBody>
              {leads.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell dir="ltr">{l.phone || '-'}</TableCell>
                  <TableCell>
                    <Select value={l.status} onValueChange={v => updateStage.mutate({ id: l.id, status: v })}>
                      <SelectTrigger className="h-7 w-24"><Badge className={stageColors[l.status]}>{stageLabels[l.status]}</Badge></SelectTrigger>
                      <SelectContent>{Object.entries(stageLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{Number(l.expected_value || 0).toLocaleString()} ر.س</TableCell>
                  <TableCell>{l.source || '-'}</TableCell>
                  <TableCell><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(l.id)}><Trash2 className="w-3 h-3" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}
