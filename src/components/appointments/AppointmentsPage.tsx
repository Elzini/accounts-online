import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarCheck, Plus, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useBookings, useAddBooking, useUpdateBooking, useDeleteBooking } from '@/hooks/useModuleData';

export function AppointmentsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [newBooking, setNewBooking] = useState({ customer_name: '', customer_phone: '', service_type: '', booking_date: '', booking_time: '', duration_minutes: 60, notes: '' });

  const { data: appointments = [], isLoading } = useBookings();
  const addBooking = useAddBooking();
  const updateBooking = useUpdateBooking();
  const deleteBooking = useDeleteBooking();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center"><CalendarCheck className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-foreground">المواعيد</h1><p className="text-sm text-muted-foreground">حجز مواعيد أونلاين من العملاء</p></div>
        </div>
        <Button className="gap-1" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" />موعد جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><CalendarCheck className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{appointments.length}</p><p className="text-xs text-muted-foreground">مواعيد</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{appointments.filter((a: any) => a.status === 'confirmed').length}</p><p className="text-xs text-muted-foreground">مؤكدة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto text-orange-500 mb-1" /><p className="text-2xl font-bold">{appointments.filter((a: any) => a.status === 'pending').length}</p><p className="text-xs text-muted-foreground">بانتظار</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><XCircle className="w-8 h-8 mx-auto text-red-500 mb-1" /><p className="text-2xl font-bold">{appointments.filter((a: any) => a.status === 'cancelled').length}</p><p className="text-xs text-muted-foreground">ملغاة</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-4">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> :
        appointments.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد مواعيد.</p> :
        <Table>
          <TableHeader><TableRow><TableHead>العميل</TableHead><TableHead>الخدمة</TableHead><TableHead>التاريخ</TableHead><TableHead>الوقت</TableHead><TableHead>المدة</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
          <TableBody>{appointments.map((a: any) => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">{a.customer_name}</TableCell>
              <TableCell>{a.service_type || '-'}</TableCell>
              <TableCell>{a.booking_date}</TableCell>
              <TableCell>{a.booking_time || '-'}</TableCell>
              <TableCell>{a.duration_minutes || '-'} دقيقة</TableCell>
              <TableCell>
                <Select value={a.status} onValueChange={v => updateBooking.mutate({ id: a.id, status: v })}>
                  <SelectTrigger className="w-24 h-7"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="pending">بانتظار</SelectItem><SelectItem value="confirmed">مؤكد</SelectItem><SelectItem value="completed">مكتمل</SelectItem><SelectItem value="cancelled">ملغى</SelectItem></SelectContent>
                </Select>
              </TableCell>
              <TableCell><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteBooking.mutate(a.id)}><Trash2 className="w-4 h-4" /></Button></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>}
      </CardContent></Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>موعد جديد</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>اسم العميل *</Label><Input value={newBooking.customer_name} onChange={e => setNewBooking(p => ({ ...p, customer_name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>الهاتف</Label><Input value={newBooking.customer_phone} onChange={e => setNewBooking(p => ({ ...p, customer_phone: e.target.value }))} /></div>
              <div><Label>الخدمة</Label><Input value={newBooking.service_type} onChange={e => setNewBooking(p => ({ ...p, service_type: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>التاريخ *</Label><Input type="date" value={newBooking.booking_date} onChange={e => setNewBooking(p => ({ ...p, booking_date: e.target.value }))} /></div>
              <div><Label>الوقت</Label><Input type="time" value={newBooking.booking_time} onChange={e => setNewBooking(p => ({ ...p, booking_time: e.target.value }))} /></div>
              <div><Label>المدة (دقيقة)</Label><Input type="number" value={newBooking.duration_minutes} onChange={e => setNewBooking(p => ({ ...p, duration_minutes: Number(e.target.value) }))} /></div>
            </div>
            <Button onClick={() => { if (!newBooking.customer_name || !newBooking.booking_date) return; addBooking.mutate(newBooking, { onSuccess: () => { setShowAdd(false); setNewBooking({ customer_name: '', customer_phone: '', service_type: '', booking_date: '', booking_time: '', duration_minutes: 60, notes: '' }); } }); }} disabled={addBooking.isPending} className="w-full">{addBooking.isPending ? 'جاري...' : 'إضافة الموعد'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
