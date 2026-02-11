import { useState } from 'react';
import { Ruler, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUnits, useAddUnit, useUpdateUnit, useDeleteUnit } from '@/hooks/useInventory';
import { toast } from 'sonner';

export function UnitsPage() {
  const { data: units = [], isLoading } = useUnits();
  const addMutation = useAddUnit();
  const updateMutation = useUpdateUnit();
  const deleteMutation = useDeleteUnit();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');

  const handleOpen = (u?: any) => {
    if (u) { setEditId(u.id); setName(u.name); setAbbreviation(u.abbreviation || ''); }
    else { setEditId(null); setName(''); setAbbreviation(''); }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('اسم الوحدة مطلوب'); return; }
    try {
      if (editId) { await updateMutation.mutateAsync({ id: editId, name, abbreviation }); toast.success('تم التحديث'); }
      else { await addMutation.mutateAsync({ name, abbreviation }); toast.success('تم الإضافة'); }
      setDialogOpen(false);
    } catch { toast.error('حدث خطأ'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد؟')) return;
    try { await deleteMutation.mutateAsync(id); toast.success('تم الحذف'); }
    catch { toast.error('لا يمكن حذف الوحدة - قد تكون مرتبطة بأصناف'); }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Ruler className="w-5 h-5 text-primary" /></div>
          <div><h1 className="text-xl font-bold text-foreground">وحدات القياس</h1><p className="text-sm text-muted-foreground">إدارة وحدات القياس للأصناف</p></div>
        </div>
        <Button onClick={() => handleOpen()} className="gap-2"><Plus className="w-4 h-4" /> إضافة وحدة</Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div> : (units as any[]).length === 0 ? (
          <div className="p-12 text-center"><Ruler className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" /><p className="text-muted-foreground">لا توجد وحدات قياس</p></div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead className="text-right">الاسم</TableHead><TableHead className="text-right">الاختصار</TableHead><TableHead className="text-right">إجراءات</TableHead></TableRow></TableHeader>
            <TableBody>
              {(units as any[]).map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.abbreviation || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleOpen(u)}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(u.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader><DialogTitle>{editId ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>الاسم *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="كيلوجرام" /></div>
            <div><Label>الاختصار</Label><Input value={abbreviation} onChange={e => setAbbreviation(e.target.value)} placeholder="كجم" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={addMutation.isPending || updateMutation.isPending}>{editId ? 'تحديث' : 'إضافة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
