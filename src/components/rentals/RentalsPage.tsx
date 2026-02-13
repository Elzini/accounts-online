import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Home, Key, DollarSign, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';

export function RentalsPage() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ unitName: '', unitType: 'apartment', location: '', monthlyRent: '' });

  const { data: units = [], isLoading } = useQuery({
    queryKey: ['rental-units', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('rental_units').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('rental_units').insert({ company_id: companyId!, unit_name: form.unitName, unit_type: form.unitType, location: form.location || null, monthly_rent: Number(form.monthlyRent) || 0, status: 'available' });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rental-units'] }); toast.success('تم إضافة الوحدة'); setShowAdd(false); setForm({ unitName: '', unitType: 'apartment', location: '', monthlyRent: '' }); },
    onError: () => toast.error('حدث خطأ'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('rental_units').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rental-units'] }); toast.success('تم الحذف'); },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">إدارة الإيجارات والوحدات</h1><p className="text-muted-foreground">إدارة العقارات والوحدات والمستأجرين</p></div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />وحدة جديدة</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>وحدة جديدة</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>اسم الوحدة</Label><Input value={form.unitName} onChange={e => setForm(p => ({ ...p, unitName: e.target.value }))} /></div>
              <div><Label>الموقع</Label><Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} /></div>
              <div><Label>الإيجار الشهري</Label><Input type="number" value={form.monthlyRent} onChange={e => setForm(p => ({ ...p, monthlyRent: e.target.value }))} /></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.unitName}>حفظ</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><Home className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{units.length}</div><p className="text-sm text-muted-foreground">الوحدات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Key className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{units.filter((u: any) => u.status === 'occupied').length}</div><p className="text-sm text-muted-foreground">مؤجرة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><DollarSign className="w-8 h-8 mx-auto mb-2 text-blue-600" /><div className="text-2xl font-bold">{units.reduce((s: number, u: any) => s + Number(u.monthly_rent || 0), 0).toLocaleString()} ر.س</div><p className="text-sm text-muted-foreground">إجمالي الإيجارات</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-6">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> : units.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد وحدات</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>الوحدة</TableHead><TableHead>الموقع</TableHead><TableHead>الإيجار</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
            <TableBody>
              {units.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.unit_name}</TableCell>
                  <TableCell>{u.location || '-'}</TableCell>
                  <TableCell>{Number(u.monthly_rent || 0).toLocaleString()} ر.س</TableCell>
                  <TableCell><Badge variant={u.status === 'occupied' ? 'default' : 'secondary'}>{u.status === 'occupied' ? 'مؤجرة' : 'شاغرة'}</Badge></TableCell>
                  <TableCell><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(u.id)}><Trash2 className="w-3 h-3" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}
