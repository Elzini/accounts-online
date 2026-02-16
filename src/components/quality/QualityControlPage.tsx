import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, ClipboardCheck, AlertTriangle, CheckCircle, Plus, XCircle } from 'lucide-react';
import { useQualityChecks, useAddQualityCheck, useUpdateQualityCheck } from '@/hooks/useModuleData';

export function QualityControlPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [newCheck, setNewCheck] = useState({ title: '', check_type: 'incoming', product_name: '', batch_number: '', inspector_name: '' });

  const { data: checks = [], isLoading } = useQualityChecks();
  const addCheck = useAddQualityCheck();
  const updateCheck = useUpdateQualityCheck();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-foreground">مراقبة الجودة</h1><p className="text-sm text-muted-foreground">فحوصات الجودة وتتبع العيوب</p></div>
        </div>
        <Button className="gap-1" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" />فحص جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><ClipboardCheck className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{checks.length}</p><p className="text-xs text-muted-foreground">فحوصات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{checks.length > 0 ? ((checks.filter((c: any) => c.result === 'pass').length / checks.length) * 100).toFixed(0) : 0}%</p><p className="text-xs text-muted-foreground">نسبة النجاح</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><XCircle className="w-8 h-8 mx-auto text-red-500 mb-1" /><p className="text-2xl font-bold">{checks.reduce((s: number, c: any) => s + (c.defects_found || 0), 0)}</p><p className="text-xs text-muted-foreground">عيوب</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><AlertTriangle className="w-8 h-8 mx-auto text-orange-500 mb-1" /><p className="text-2xl font-bold">{checks.filter((c: any) => c.status === 'in_progress').length}</p><p className="text-xs text-muted-foreground">قيد الفحص</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-4">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> :
        checks.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد فحوصات.</p> :
        <Table>
          <TableHeader><TableRow><TableHead>العنوان</TableHead><TableHead>المنتج</TableHead><TableHead>النوع</TableHead><TableHead>الدفعة</TableHead><TableHead>المفتش</TableHead><TableHead>العيوب</TableHead><TableHead>النتيجة</TableHead></TableRow></TableHeader>
          <TableBody>{checks.map((c: any) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.title}</TableCell>
              <TableCell>{c.product_name || '-'}</TableCell>
              <TableCell>{c.check_type === 'incoming' ? 'استلام' : 'عشوائي'}</TableCell>
              <TableCell className="font-mono text-xs">{c.batch_number || '-'}</TableCell>
              <TableCell>{c.inspector_name || '-'}</TableCell>
              <TableCell>{c.defects_found || 0}</TableCell>
              <TableCell>
                <Select value={c.result || 'pending'} onValueChange={v => updateCheck.mutate({ id: c.id, result: v, status: v === 'pending' ? 'in_progress' : 'completed' })}>
                  <SelectTrigger className="w-24 h-7"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="pending">معلق</SelectItem><SelectItem value="pass">ناجح ✓</SelectItem><SelectItem value="fail">فاشل ✗</SelectItem></SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>}
      </CardContent></Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>فحص جودة جديد</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>عنوان الفحص *</Label><Input value={newCheck.title} onChange={e => setNewCheck(p => ({ ...p, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>المنتج</Label><Input value={newCheck.product_name} onChange={e => setNewCheck(p => ({ ...p, product_name: e.target.value }))} /></div>
              <div><Label>رقم الدفعة</Label><Input value={newCheck.batch_number} onChange={e => setNewCheck(p => ({ ...p, batch_number: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>النوع</Label><Select value={newCheck.check_type} onValueChange={v => setNewCheck(p => ({ ...p, check_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="incoming">استلام</SelectItem><SelectItem value="random">عشوائي</SelectItem><SelectItem value="production">تصنيع</SelectItem></SelectContent></Select></div>
              <div><Label>المفتش</Label><Input value={newCheck.inspector_name} onChange={e => setNewCheck(p => ({ ...p, inspector_name: e.target.value }))} /></div>
            </div>
            <Button onClick={() => { if (!newCheck.title) return; addCheck.mutate(newCheck, { onSuccess: () => { setShowAdd(false); setNewCheck({ title: '', check_type: 'incoming', product_name: '', batch_number: '', inspector_name: '' }); } }); }} disabled={addCheck.isPending} className="w-full">{addCheck.isPending ? 'جاري...' : 'إضافة الفحص'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
