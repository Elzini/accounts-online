import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Truck, Plus, MapPin, CheckCircle, Users, Navigation, Trash2 } from 'lucide-react';
import { useFieldServiceOrders, useAddFieldServiceOrder, useUpdateFieldServiceOrder, useDeleteFieldServiceOrder } from '@/hooks/useModuleData';

export function FieldServicePage() {
  const [showAdd, setShowAdd] = useState(false);
  const [newOrder, setNewOrder] = useState({ title: '', customer_name: '', customer_phone: '', customer_address: '', technician_name: '', service_type: '', priority: 'medium', scheduled_date: '', notes: '' });

  const { data: orders = [], isLoading } = useFieldServiceOrders();
  const addOrder = useAddFieldServiceOrder();
  const updateOrder = useUpdateFieldServiceOrder();
  const deleteOrder = useDeleteFieldServiceOrder();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"><Truck className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-foreground">الخدمة الميدانية</h1><p className="text-sm text-muted-foreground">إدارة الفنيين والزيارات</p></div>
        </div>
        <Button className="gap-1" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" />مهمة جديدة</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Truck className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{orders.length}</p><p className="text-xs text-muted-foreground">مهام</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Navigation className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{orders.filter((t: any) => t.status === 'in_progress').length}</p><p className="text-xs text-muted-foreground">جارية</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto text-emerald-500 mb-1" /><p className="text-2xl font-bold">{orders.filter((t: any) => t.status === 'completed').length}</p><p className="text-xs text-muted-foreground">مكتملة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto text-purple-500 mb-1" /><p className="text-2xl font-bold">{new Set(orders.map((t: any) => t.technician_name).filter(Boolean)).size}</p><p className="text-xs text-muted-foreground">فنيين</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-4">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> :
        orders.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد مهام.</p> :
        <Table>
          <TableHeader><TableRow><TableHead>المهمة</TableHead><TableHead>العميل</TableHead><TableHead>العنوان</TableHead><TableHead>الفني</TableHead><TableHead>النوع</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
          <TableBody>{orders.map((t: any) => (
            <TableRow key={t.id}>
              <TableCell className="font-medium">{t.title}</TableCell>
              <TableCell>{t.customer_name || '-'}</TableCell>
              <TableCell className="flex items-center gap-1"><MapPin className="w-3 h-3" />{t.customer_address || '-'}</TableCell>
              <TableCell>{t.technician_name || '-'}</TableCell>
              <TableCell><Badge variant="outline">{t.service_type || '-'}</Badge></TableCell>
              <TableCell>
                <Select value={t.status} onValueChange={v => updateOrder.mutate({ id: t.id, status: v })}>
                  <SelectTrigger className="w-24 h-7"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="new">جديد</SelectItem><SelectItem value="scheduled">مجدول</SelectItem><SelectItem value="in_progress">جاري</SelectItem><SelectItem value="completed">مكتمل</SelectItem></SelectContent>
                </Select>
              </TableCell>
              <TableCell><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteOrder.mutate(t.id)}><Trash2 className="w-4 h-4" /></Button></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>}
      </CardContent></Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>مهمة ميدانية جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>عنوان المهمة *</Label><Input value={newOrder.title} onChange={e => setNewOrder(p => ({ ...p, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>العميل</Label><Input value={newOrder.customer_name} onChange={e => setNewOrder(p => ({ ...p, customer_name: e.target.value }))} /></div>
              <div><Label>الهاتف</Label><Input value={newOrder.customer_phone} onChange={e => setNewOrder(p => ({ ...p, customer_phone: e.target.value }))} /></div>
            </div>
            <div><Label>العنوان</Label><Input value={newOrder.customer_address} onChange={e => setNewOrder(p => ({ ...p, customer_address: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>الفني</Label><Input value={newOrder.technician_name} onChange={e => setNewOrder(p => ({ ...p, technician_name: e.target.value }))} /></div>
              <div><Label>نوع الخدمة</Label><Input value={newOrder.service_type} onChange={e => setNewOrder(p => ({ ...p, service_type: e.target.value }))} /></div>
            </div>
            <div><Label>الموعد</Label><Input type="datetime-local" value={newOrder.scheduled_date} onChange={e => setNewOrder(p => ({ ...p, scheduled_date: e.target.value }))} /></div>
            <Button onClick={() => { if (!newOrder.title) return; addOrder.mutate(newOrder, { onSuccess: () => { setShowAdd(false); setNewOrder({ title: '', customer_name: '', customer_phone: '', customer_address: '', technician_name: '', service_type: '', priority: 'medium', scheduled_date: '', notes: '' }); } }); }} disabled={addOrder.isPending} className="w-full">{addOrder.isPending ? 'جاري...' : 'إضافة المهمة'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
