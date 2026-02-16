import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarCheck, Plus, Clock, Users, CheckCircle, XCircle } from 'lucide-react';

export function AppointmentsPage() {
  const appointments = [
    { id: 1, customer: 'محمد أحمد', service: 'صيانة دورية', date: '2024-01-20', time: '09:00', duration: '60 دقيقة', assignedTo: 'فني أحمد', status: 'confirmed' },
    { id: 2, customer: 'سعد العتيبي', service: 'فحص شامل', date: '2024-01-20', time: '10:30', duration: '90 دقيقة', assignedTo: 'فني خالد', status: 'confirmed' },
    { id: 3, customer: 'فهد محمد', service: 'تغيير زيت', date: '2024-01-20', time: '14:00', duration: '30 دقيقة', assignedTo: 'فني سعد', status: 'pending' },
    { id: 4, customer: 'عمر خالد', service: 'إصلاح مكيف', date: '2024-01-21', time: '11:00', duration: '120 دقيقة', assignedTo: 'فني أحمد', status: 'cancelled' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">المواعيد</h1>
            <p className="text-sm text-muted-foreground">حجز مواعيد أونلاين من العملاء</p>
          </div>
        </div>
        <Button className="gap-1"><Plus className="w-4 h-4" />موعد جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><CalendarCheck className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{appointments.length}</p><p className="text-xs text-muted-foreground">مواعيد اليوم</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{appointments.filter(a => a.status === 'confirmed').length}</p><p className="text-xs text-muted-foreground">مؤكدة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto text-orange-500 mb-1" /><p className="text-2xl font-bold">{appointments.filter(a => a.status === 'pending').length}</p><p className="text-xs text-muted-foreground">بانتظار</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><XCircle className="w-8 h-8 mx-auto text-red-500 mb-1" /><p className="text-2xl font-bold">{appointments.filter(a => a.status === 'cancelled').length}</p><p className="text-xs text-muted-foreground">ملغاة</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-4">
        <Table>
          <TableHeader><TableRow>
            <TableHead>العميل</TableHead><TableHead>الخدمة</TableHead><TableHead>التاريخ</TableHead>
            <TableHead>الوقت</TableHead><TableHead>المدة</TableHead><TableHead>المسؤول</TableHead><TableHead>الحالة</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {appointments.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.customer}</TableCell>
                <TableCell>{a.service}</TableCell>
                <TableCell>{a.date}</TableCell>
                <TableCell>{a.time}</TableCell>
                <TableCell>{a.duration}</TableCell>
                <TableCell>{a.assignedTo}</TableCell>
                <TableCell><Badge variant={a.status === 'confirmed' ? 'default' : a.status === 'pending' ? 'secondary' : 'destructive'}>
                  {a.status === 'confirmed' ? 'مؤكد' : a.status === 'pending' ? 'بانتظار' : 'ملغى'}
                </Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
