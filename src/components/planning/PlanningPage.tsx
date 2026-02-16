import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarDays, Plus, Users, Clock, Calendar, Trash2 } from 'lucide-react';
import { usePlanningShifts, useAddPlanningShift, useDeletePlanningShift } from '@/hooks/useModuleData';

export function PlanningPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [newShift, setNewShift] = useState({ employee_name: '', role: '', shift_date: '', start_time: '08:00', end_time: '16:00' });

  const { data: shifts = [], isLoading } = usePlanningShifts();
  const addShift = useAddPlanningShift();
  const deleteShift = useDeletePlanningShift();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center"><CalendarDays className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-foreground">التخطيط</h1><p className="text-sm text-muted-foreground">جدولة ورديات الموظفين</p></div>
        </div>
        <Button className="gap-1" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" />وردية جديدة</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{shifts.length}</p><p className="text-xs text-muted-foreground">ورديات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{shifts.filter((s: any) => s.status === 'planned').length}</p><p className="text-xs text-muted-foreground">مخططة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Calendar className="w-8 h-8 mx-auto text-purple-500 mb-1" /><p className="text-2xl font-bold">{shifts.filter((s: any) => s.status === 'confirmed').length}</p><p className="text-xs text-muted-foreground">مؤكدة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CalendarDays className="w-8 h-8 mx-auto text-orange-500 mb-1" /><p className="text-2xl font-bold">{new Set(shifts.map((s: any) => s.employee_name)).size}</p><p className="text-xs text-muted-foreground">موظفين</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-4">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> :
        shifts.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد ورديات.</p> :
        <Table>
          <TableHeader><TableRow><TableHead>الموظف</TableHead><TableHead>الدور</TableHead><TableHead>التاريخ</TableHead><TableHead>من</TableHead><TableHead>إلى</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
          <TableBody>{shifts.map((s: any) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.employee_name}</TableCell>
              <TableCell><Badge variant="outline">{s.role || '-'}</Badge></TableCell>
              <TableCell>{s.shift_date}</TableCell>
              <TableCell>{s.start_time}</TableCell>
              <TableCell>{s.end_time}</TableCell>
              <TableCell><Badge variant={s.status === 'confirmed' ? 'default' : 'secondary'}>{s.status === 'confirmed' ? 'مؤكد' : 'مخطط'}</Badge></TableCell>
              <TableCell><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteShift.mutate(s.id)}><Trash2 className="w-4 h-4" /></Button></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>}
      </CardContent></Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>وردية جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>اسم الموظف *</Label><Input value={newShift.employee_name} onChange={e => setNewShift(p => ({ ...p, employee_name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>الدور</Label><Input value={newShift.role} onChange={e => setNewShift(p => ({ ...p, role: e.target.value }))} /></div>
              <div><Label>التاريخ *</Label><Input type="date" value={newShift.shift_date} onChange={e => setNewShift(p => ({ ...p, shift_date: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>من</Label><Input type="time" value={newShift.start_time} onChange={e => setNewShift(p => ({ ...p, start_time: e.target.value }))} /></div>
              <div><Label>إلى</Label><Input type="time" value={newShift.end_time} onChange={e => setNewShift(p => ({ ...p, end_time: e.target.value }))} /></div>
            </div>
            <Button onClick={() => { if (!newShift.employee_name || !newShift.shift_date) return; addShift.mutate(newShift, { onSuccess: () => { setShowAdd(false); setNewShift({ employee_name: '', role: '', shift_date: '', start_time: '08:00', end_time: '16:00' }); } }); }} disabled={addShift.isPending} className="w-full">{addShift.isPending ? 'جاري...' : 'إضافة الوردية'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
