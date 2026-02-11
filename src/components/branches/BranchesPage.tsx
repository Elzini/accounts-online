import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Plus, Building2, Pencil, Trash2, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export function BranchesPage() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', address: '', phone: '', manager_name: '', is_main: false });

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from('branches').select('*').eq('company_id', companyId).order('is_main', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const resetForm = () => {
    setFormData({ name: '', code: '', address: '', phone: '', manager_name: '', is_main: false });
    setEditingBranch(null);
  };

  const saveBranch = useMutation({
    mutationFn: async (form: typeof formData) => {
      if (!companyId) throw new Error('No company');
      if (editingBranch) {
        const { error } = await supabase.from('branches').update(form).eq('id', editingBranch.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('branches').insert({ company_id: companyId, ...form });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success(editingBranch ? 'تم تحديث الفرع' : 'تم إضافة الفرع');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (e: any) => toast.error(e.message?.includes('duplicate') ? 'رمز الفرع مستخدم مسبقاً' : 'حدث خطأ'),
  });

  const deleteBranch = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('branches').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('تم حذف الفرع');
      setDeleteId(null);
    },
  });

  const openEdit = (branch: any) => {
    setEditingBranch(branch);
    setFormData({ name: branch.name, code: branch.code || '', address: branch.address || '', phone: branch.phone || '', manager_name: branch.manager_name || '', is_main: branch.is_main });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Building2 className="w-6 h-6" />إدارة الفروع</h1>
          <p className="text-muted-foreground">إضافة وإدارة فروع الشركة</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(v) => { setIsDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />إضافة فرع</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingBranch ? 'تعديل الفرع' : 'إضافة فرع جديد'}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveBranch.mutate(formData); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>اسم الفرع *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div className="space-y-2"><Label>رمز الفرع</Label><Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="BR-001" dir="ltr" /></div>
              </div>
              <div className="space-y-2"><Label>العنوان</Label><Textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>الهاتف</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} dir="ltr" /></div>
                <div className="space-y-2"><Label>المدير</Label><Input value={formData.manager_name} onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })} /></div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border"><Label>فرع رئيسي</Label><Switch checked={formData.is_main} onCheckedChange={(v) => setFormData({ ...formData, is_main: v })} /></div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={saveBranch.isPending}>{saveBranch.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}{editingBranch ? 'تحديث' : 'إضافة'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{branches.length}</div><p className="text-sm text-muted-foreground">إجمالي الفروع</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{branches.filter((b: any) => b.is_active).length}</div><p className="text-sm text-muted-foreground">فروع نشطة</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{branches.filter((b: any) => b.is_main).length}</div><p className="text-sm text-muted-foreground">فروع رئيسية</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>قائمة الفروع</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الرمز</TableHead>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">العنوان</TableHead>
                <TableHead className="text-right">الهاتف</TableHead>
                <TableHead className="text-right">المدير</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-center">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono">{b.code || '-'}</TableCell>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{b.address || '-'}</TableCell>
                  <TableCell dir="ltr">{b.phone || '-'}</TableCell>
                  <TableCell>{b.manager_name || '-'}</TableCell>
                  <TableCell>{b.is_main ? <Badge>رئيسي</Badge> : <Badge variant="secondary">فرعي</Badge>}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(b)}><Pencil className="w-4 h-4" /></Button>
                      {!b.is_main && <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteId(b.id)}><Trash2 className="w-4 h-4" /></Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {branches.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد فروع مسجلة</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>حذف الفرع</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف هذا الفرع؟</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteBranch.mutate(deleteId)} className="bg-destructive text-destructive-foreground">حذف</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
