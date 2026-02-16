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
import { Car, Fuel, Wrench, Plus, DollarSign, Trash2 } from 'lucide-react';
import { useFleetVehicles, useAddFleetVehicle, useDeleteFleetVehicle, useFleetServiceLogs, useAddFleetServiceLog } from '@/hooks/useModuleData';

export function FleetPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ name: '', license_plate: '', brand: '', model: '', year: 2024, fuel_type: 'gasoline', driver_name: '' });
  const [newService, setNewService] = useState({ vehicle_id: '', service_type: '', service_date: '', cost: 0, vendor: '', description: '' });

  const { data: vehicles = [], isLoading } = useFleetVehicles();
  const { data: services = [] } = useFleetServiceLogs();
  const addVehicle = useAddFleetVehicle();
  const deleteVehicle = useDeleteFleetVehicle();
  const addService = useAddFleetServiceLog();

  const statusLabels: Record<string, string> = { active: 'نشط', in_maintenance: 'في الصيانة', available: 'متاح' };
  const statusColors: Record<string, string> = { active: 'bg-green-100 text-green-800', in_maintenance: 'bg-orange-100 text-orange-800', available: 'bg-blue-100 text-blue-800' };

  const handleAddVehicle = () => {
    if (!newVehicle.name) return;
    addVehicle.mutate(newVehicle, { onSuccess: () => { setShowAdd(false); setNewVehicle({ name: '', license_plate: '', brand: '', model: '', year: 2024, fuel_type: 'gasoline', driver_name: '' }); } });
  };

  const handleAddService = () => {
    if (!newService.vehicle_id || !newService.service_type) return;
    addService.mutate(newService, { onSuccess: () => { setShowAddService(false); setNewService({ vehicle_id: '', service_type: '', service_date: '', cost: 0, vendor: '', description: '' }); } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center"><Car className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-foreground">إدارة الأسطول</h1><p className="text-sm text-muted-foreground">تتبع المركبات والصيانة والوقود</p></div>
        </div>
        <Button className="gap-1" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" />إضافة مركبة</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Car className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{vehicles.length}</p><p className="text-xs text-muted-foreground">إجمالي المركبات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Fuel className="w-8 h-8 mx-auto text-orange-500 mb-1" /><p className="text-2xl font-bold">{vehicles.filter((v: any) => v.status === 'active').length}</p><p className="text-xs text-muted-foreground">نشطة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Wrench className="w-8 h-8 mx-auto text-red-500 mb-1" /><p className="text-2xl font-bold">{vehicles.filter((v: any) => v.status === 'in_maintenance').length}</p><p className="text-xs text-muted-foreground">في الصيانة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><DollarSign className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{services.reduce((s: number, sv: any) => s + (sv.cost || 0), 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">تكاليف الصيانة</p></CardContent></Card>
      </div>

      <Tabs defaultValue="vehicles">
        <TabsList><TabsTrigger value="vehicles">المركبات</TabsTrigger><TabsTrigger value="services">سجل الصيانة</TabsTrigger></TabsList>

        <TabsContent value="vehicles" className="mt-4">
          <Card><CardContent className="pt-4">
            {isLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> :
            vehicles.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد مركبات.</p> :
            <Table>
              <TableHeader><TableRow><TableHead>اللوحة</TableHead><TableHead>الماركة</TableHead><TableHead>الموديل</TableHead><TableHead>السائق</TableHead><TableHead>الوقود</TableHead><TableHead>العداد</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
              <TableBody>{vehicles.map((v: any) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono font-bold">{v.license_plate || '-'}</TableCell>
                  <TableCell>{v.brand || '-'}</TableCell>
                  <TableCell>{v.model || '-'}</TableCell>
                  <TableCell>{v.driver_name || <span className="text-muted-foreground">غير معين</span>}</TableCell>
                  <TableCell>{v.fuel_type === 'gasoline' ? 'بنزين' : v.fuel_type === 'diesel' ? 'ديزل' : v.fuel_type}</TableCell>
                  <TableCell>{(v.odometer || 0).toLocaleString()} كم</TableCell>
                  <TableCell><Badge className={statusColors[v.status] || ''}>{statusLabels[v.status] || v.status}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteVehicle.mutate(v.id)}><Trash2 className="w-4 h-4" /></Button></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <div className="flex justify-end mb-4"><Button className="gap-1" onClick={() => setShowAddService(true)}><Plus className="w-4 h-4" />سجل صيانة</Button></div>
          <Card><CardContent className="pt-4">
            {services.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد سجلات صيانة.</p> :
            <Table>
              <TableHeader><TableRow><TableHead>نوع الخدمة</TableHead><TableHead>التاريخ</TableHead><TableHead>التكلفة</TableHead><TableHead>مزود الخدمة</TableHead><TableHead>الوصف</TableHead></TableRow></TableHeader>
              <TableBody>{services.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.service_type}</TableCell>
                  <TableCell>{s.service_date}</TableCell>
                  <TableCell>{(s.cost || 0).toLocaleString()} ر.س</TableCell>
                  <TableCell>{s.vendor || '-'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{s.description || '-'}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>إضافة مركبة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>اسم المركبة *</Label><Input value={newVehicle.name} onChange={e => setNewVehicle(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>رقم اللوحة</Label><Input value={newVehicle.license_plate} onChange={e => setNewVehicle(p => ({ ...p, license_plate: e.target.value }))} /></div>
              <div><Label>الماركة</Label><Input value={newVehicle.brand} onChange={e => setNewVehicle(p => ({ ...p, brand: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>الموديل</Label><Input value={newVehicle.model} onChange={e => setNewVehicle(p => ({ ...p, model: e.target.value }))} /></div>
              <div><Label>السائق</Label><Input value={newVehicle.driver_name} onChange={e => setNewVehicle(p => ({ ...p, driver_name: e.target.value }))} /></div>
            </div>
            <Button onClick={handleAddVehicle} disabled={addVehicle.isPending} className="w-full">{addVehicle.isPending ? 'جاري...' : 'إضافة المركبة'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddService} onOpenChange={setShowAddService}>
        <DialogContent><DialogHeader><DialogTitle>إضافة سجل صيانة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>المركبة *</Label>
              <Select value={newService.vehicle_id} onValueChange={v => setNewService(p => ({ ...p, vehicle_id: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر المركبة" /></SelectTrigger>
                <SelectContent>{vehicles.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.name} - {v.license_plate}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>نوع الخدمة *</Label><Input value={newService.service_type} onChange={e => setNewService(p => ({ ...p, service_type: e.target.value }))} /></div>
              <div><Label>التاريخ</Label><Input type="date" value={newService.service_date} onChange={e => setNewService(p => ({ ...p, service_date: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>التكلفة</Label><Input type="number" value={newService.cost} onChange={e => setNewService(p => ({ ...p, cost: Number(e.target.value) }))} /></div>
              <div><Label>مزود الخدمة</Label><Input value={newService.vendor} onChange={e => setNewService(p => ({ ...p, vendor: e.target.value }))} /></div>
            </div>
            <Button onClick={handleAddService} disabled={addService.isPending} className="w-full">{addService.isPending ? 'جاري...' : 'إضافة سجل الصيانة'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
