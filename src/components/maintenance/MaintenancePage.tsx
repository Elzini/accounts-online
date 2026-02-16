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
import { Textarea } from '@/components/ui/textarea';
import { Wrench, Calendar, AlertTriangle, CheckCircle, Plus, Hammer, Trash2 } from 'lucide-react';
import { useMaintenanceEquipment, useAddMaintenanceEquipment, useDeleteMaintenanceEquipment, useMaintenanceRequests, useAddMaintenanceRequest, useUpdateMaintenanceRequest } from '@/hooks/useModuleData';

export function MaintenancePage() {
  const [showAddEquip, setShowAddEquip] = useState(false);
  const [showAddReq, setShowAddReq] = useState(false);
  const [newEquip, setNewEquip] = useState({ name: '', code: '', category: '', location: '', assigned_to: '' });
  const [newReq, setNewReq] = useState({ title: '', equipment_id: '', priority: 'medium', maintenance_type: 'corrective', requested_by: '', description: '' });

  const { data: equipment = [], isLoading: loadingEquip } = useMaintenanceEquipment();
  const { data: requests = [], isLoading: loadingReqs } = useMaintenanceRequests();
  const addEquip = useAddMaintenanceEquipment();
  const deleteEquip = useDeleteMaintenanceEquipment();
  const addReq = useAddMaintenanceRequest();
  const updateReq = useUpdateMaintenanceRequest();

  const priorityColors: Record<string, string> = { high: 'bg-red-100 text-red-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-green-100 text-green-800' };
  const statusLabels: Record<string, string> = { pending: 'معلق', in_progress: 'جاري', completed: 'مكتمل', operational: 'يعمل', needs_maintenance: 'يحتاج صيانة' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-stone-500 to-gray-700 flex items-center justify-center"><Hammer className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-foreground">الصيانة</h1><p className="text-sm text-muted-foreground">جدولة صيانة المعدات والأصول</p></div>
        </div>
        <Button className="gap-1" onClick={() => setShowAddReq(true)}><Plus className="w-4 h-4" />طلب صيانة</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Wrench className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{requests.filter((r: any) => r.status !== 'completed').length}</p><p className="text-xs text-muted-foreground">طلبات مفتوحة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><AlertTriangle className="w-8 h-8 mx-auto text-red-500 mb-1" /><p className="text-2xl font-bold">{requests.filter((r: any) => r.priority === 'high').length}</p><p className="text-xs text-muted-foreground">أولوية عالية</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Calendar className="w-8 h-8 mx-auto text-orange-500 mb-1" /><p className="text-2xl font-bold">{equipment.length}</p><p className="text-xs text-muted-foreground">معدات مسجلة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{equipment.filter((e: any) => e.status === 'operational').length}</p><p className="text-xs text-muted-foreground">معدات تعمل</p></CardContent></Card>
      </div>

      <Tabs defaultValue="requests">
        <TabsList><TabsTrigger value="requests">طلبات الصيانة</TabsTrigger><TabsTrigger value="equipment">المعدات</TabsTrigger></TabsList>

        <TabsContent value="requests" className="mt-4">
          <Card><CardContent className="pt-4">
            {loadingReqs ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> :
            requests.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد طلبات صيانة.</p> :
            <Table>
              <TableHeader><TableRow><TableHead>العنوان</TableHead><TableHead>النوع</TableHead><TableHead>الأولوية</TableHead><TableHead>الطالب</TableHead><TableHead>المسؤول</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
              <TableBody>{requests.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell>{r.maintenance_type === 'corrective' ? 'إصلاحية' : 'وقائية'}</TableCell>
                  <TableCell><Badge className={priorityColors[r.priority] || ''}>{r.priority === 'high' ? 'عالية' : r.priority === 'medium' ? 'متوسطة' : 'منخفضة'}</Badge></TableCell>
                  <TableCell>{r.requested_by || '-'}</TableCell>
                  <TableCell>{r.assigned_to || '-'}</TableCell>
                  <TableCell>
                    <Select value={r.status} onValueChange={v => updateReq.mutate({ id: r.id, status: v })}>
                      <SelectTrigger className="w-24 h-7"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="pending">معلق</SelectItem><SelectItem value="in_progress">جاري</SelectItem><SelectItem value="completed">مكتمل</SelectItem></SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="equipment" className="mt-4">
          <div className="flex justify-end mb-4"><Button className="gap-1" onClick={() => setShowAddEquip(true)}><Plus className="w-4 h-4" />إضافة معدة</Button></div>
          <Card><CardContent className="pt-4">
            {loadingEquip ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> :
            equipment.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد معدات.</p> :
            <Table>
              <TableHeader><TableRow><TableHead>المعدة</TableHead><TableHead>الكود</TableHead><TableHead>الفئة</TableHead><TableHead>الموقع</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
              <TableBody>{equipment.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell className="font-mono">{e.code || '-'}</TableCell>
                  <TableCell>{e.category || '-'}</TableCell>
                  <TableCell>{e.location || '-'}</TableCell>
                  <TableCell><Badge variant={e.status === 'operational' ? 'default' : 'destructive'}>{statusLabels[e.status] || e.status}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteEquip.mutate(e.id)}><Trash2 className="w-4 h-4" /></Button></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddEquip} onOpenChange={setShowAddEquip}>
        <DialogContent><DialogHeader><DialogTitle>إضافة معدة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>اسم المعدة *</Label><Input value={newEquip.name} onChange={e => setNewEquip(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>الكود</Label><Input value={newEquip.code} onChange={e => setNewEquip(p => ({ ...p, code: e.target.value }))} /></div>
              <div><Label>الفئة</Label><Input value={newEquip.category} onChange={e => setNewEquip(p => ({ ...p, category: e.target.value }))} /></div>
            </div>
            <div><Label>الموقع</Label><Input value={newEquip.location} onChange={e => setNewEquip(p => ({ ...p, location: e.target.value }))} /></div>
            <Button onClick={() => { if (!newEquip.name) return; addEquip.mutate(newEquip, { onSuccess: () => { setShowAddEquip(false); setNewEquip({ name: '', code: '', category: '', location: '', assigned_to: '' }); } }); }} disabled={addEquip.isPending} className="w-full">{addEquip.isPending ? 'جاري...' : 'إضافة المعدة'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddReq} onOpenChange={setShowAddReq}>
        <DialogContent><DialogHeader><DialogTitle>طلب صيانة جديد</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>العنوان *</Label><Input value={newReq.title} onChange={e => setNewReq(p => ({ ...p, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>الأولوية</Label><Select value={newReq.priority} onValueChange={v => setNewReq(p => ({ ...p, priority: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">منخفضة</SelectItem><SelectItem value="medium">متوسطة</SelectItem><SelectItem value="high">عالية</SelectItem></SelectContent></Select></div>
              <div><Label>النوع</Label><Select value={newReq.maintenance_type} onValueChange={v => setNewReq(p => ({ ...p, maintenance_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="corrective">إصلاحية</SelectItem><SelectItem value="preventive">وقائية</SelectItem></SelectContent></Select></div>
            </div>
            <div><Label>المعدة</Label><Select value={newReq.equipment_id} onValueChange={v => setNewReq(p => ({ ...p, equipment_id: v }))}><SelectTrigger><SelectValue placeholder="اختر المعدة" /></SelectTrigger><SelectContent>{equipment.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>الطالب</Label><Input value={newReq.requested_by} onChange={e => setNewReq(p => ({ ...p, requested_by: e.target.value }))} /></div>
            <div><Label>الوصف</Label><Textarea value={newReq.description} onChange={e => setNewReq(p => ({ ...p, description: e.target.value }))} /></div>
            <Button onClick={() => { if (!newReq.title) return; addReq.mutate({ ...newReq, equipment_id: newReq.equipment_id || null }, { onSuccess: () => { setShowAddReq(false); setNewReq({ title: '', equipment_id: '', priority: 'medium', maintenance_type: 'corrective', requested_by: '', description: '' }); } }); }} disabled={addReq.isPending} className="w-full">{addReq.isPending ? 'جاري...' : 'إرسال الطلب'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
