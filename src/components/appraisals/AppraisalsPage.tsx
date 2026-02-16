import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ClipboardCheck, Target, Users, Star, Plus, Trash2 } from 'lucide-react';
import { useAppraisals, useAddAppraisal, useUpdateAppraisal, useDeleteAppraisal } from '@/hooks/useModuleData';

export function AppraisalsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [newAppraisal, setNewAppraisal] = useState({ employee_name: '', department: '', reviewer_name: '', period: '', overall_rating: 0, feedback: '' });

  const { data: appraisals = [], isLoading } = useAppraisals();
  const addAppraisal = useAddAppraisal();
  const updateAppraisal = useUpdateAppraisal();
  const deleteAppraisal = useDeleteAppraisal();

  const statusLabels: Record<string, string> = { draft: 'مسودة', in_progress: 'قيد التقييم', completed: 'مكتمل' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center"><ClipboardCheck className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-foreground">تقييم الأداء</h1><p className="text-sm text-muted-foreground">تقييمات الموظفين وتتبع الأهداف</p></div>
        </div>
        <Button className="gap-1" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" />تقييم جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{appraisals.length}</p><p className="text-xs text-muted-foreground">تقييمات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><ClipboardCheck className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{appraisals.filter((a: any) => a.status === 'completed').length}</p><p className="text-xs text-muted-foreground">مكتملة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Star className="w-8 h-8 mx-auto text-yellow-500 mb-1" /><p className="text-2xl font-bold">{appraisals.filter((a: any) => a.overall_rating > 0).length > 0 ? (appraisals.filter((a: any) => a.overall_rating > 0).reduce((s: number, a: any) => s + a.overall_rating, 0) / appraisals.filter((a: any) => a.overall_rating > 0).length).toFixed(1) : '-'}</p><p className="text-xs text-muted-foreground">متوسط التقييم</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Target className="w-8 h-8 mx-auto text-purple-500 mb-1" /><p className="text-2xl font-bold">{appraisals.filter((a: any) => a.status === 'draft' || a.status === 'in_progress').length}</p><p className="text-xs text-muted-foreground">قيد العمل</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-4">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> :
        appraisals.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد تقييمات.</p> :
        <Table>
          <TableHeader><TableRow><TableHead>الموظف</TableHead><TableHead>القسم</TableHead><TableHead>المقيّم</TableHead><TableHead>الفترة</TableHead><TableHead>التقييم</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
          <TableBody>{appraisals.map((a: any) => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">{a.employee_name}</TableCell>
              <TableCell>{a.department || '-'}</TableCell>
              <TableCell>{a.reviewer_name || '-'}</TableCell>
              <TableCell>{a.period || '-'}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 cursor-pointer ${s <= (a.overall_rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} onClick={() => updateAppraisal.mutate({ id: a.id, overall_rating: s })} />)}
                </div>
              </TableCell>
              <TableCell>
                <Select value={a.status} onValueChange={v => updateAppraisal.mutate({ id: a.id, status: v })}>
                  <SelectTrigger className="w-28 h-7"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="draft">مسودة</SelectItem><SelectItem value="in_progress">قيد التقييم</SelectItem><SelectItem value="completed">مكتمل</SelectItem></SelectContent>
                </Select>
              </TableCell>
              <TableCell><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteAppraisal.mutate(a.id)}><Trash2 className="w-4 h-4" /></Button></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>}
      </CardContent></Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>تقييم جديد</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>اسم الموظف *</Label><Input value={newAppraisal.employee_name} onChange={e => setNewAppraisal(p => ({ ...p, employee_name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>القسم</Label><Input value={newAppraisal.department} onChange={e => setNewAppraisal(p => ({ ...p, department: e.target.value }))} /></div>
              <div><Label>المقيّم</Label><Input value={newAppraisal.reviewer_name} onChange={e => setNewAppraisal(p => ({ ...p, reviewer_name: e.target.value }))} /></div>
            </div>
            <div><Label>الفترة</Label><Input value={newAppraisal.period} onChange={e => setNewAppraisal(p => ({ ...p, period: e.target.value }))} placeholder="Q1 2025" /></div>
            <div><Label>ملاحظات</Label><Textarea value={newAppraisal.feedback} onChange={e => setNewAppraisal(p => ({ ...p, feedback: e.target.value }))} /></div>
            <Button onClick={() => { if (!newAppraisal.employee_name) return; addAppraisal.mutate(newAppraisal, { onSuccess: () => { setShowAdd(false); setNewAppraisal({ employee_name: '', department: '', reviewer_name: '', period: '', overall_rating: 0, feedback: '' }); } }); }} disabled={addAppraisal.isPending} className="w-full">{addAppraisal.isPending ? 'جاري...' : 'إضافة التقييم'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
