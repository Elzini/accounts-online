import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, CalendarCheck, Clock, Users, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export function BookingsPage() {
  const bookings = [
    { id: '1', customer: 'أحمد محمد', service: 'استشارة مالية', date: '2024-01-25', time: '10:00', duration: '60 دقيقة', staff: 'م. سعيد', status: 'confirmed' },
    { id: '2', customer: 'فاطمة علي', service: 'مراجعة حسابات', date: '2024-01-25', time: '14:00', duration: '90 دقيقة', staff: 'م. خالد', status: 'pending' },
    { id: '3', customer: 'محمد سعد', service: 'استشارة ضريبية', date: '2024-01-26', time: '09:00', duration: '45 دقيقة', staff: 'م. سعيد', status: 'confirmed' },
    { id: '4', customer: 'نورة العمري', service: 'تدقيق مالي', date: '2024-01-24', time: '11:00', duration: '120 دقيقة', staff: 'م. فهد', status: 'completed' },
    { id: '5', customer: 'عبدالرحمن حسن', service: 'استشارة مالية', date: '2024-01-23', time: '16:00', duration: '60 دقيقة', staff: 'م. سعيد', status: 'cancelled' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الحجوزات والمواعيد</h1>
          <p className="text-muted-foreground">إدارة حجز المواعيد والخدمات</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('إنشاء حجز جديد')}><Plus className="w-4 h-4" />حجز جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><CalendarCheck className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{bookings.filter(b => b.status === 'confirmed').length}</div><p className="text-sm text-muted-foreground">مؤكدة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto mb-2 text-orange-600" /><div className="text-2xl font-bold">{bookings.filter(b => b.status === 'pending').length}</div><p className="text-sm text-muted-foreground">بانتظار التأكيد</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{bookings.filter(b => b.status === 'completed').length}</div><p className="text-sm text-muted-foreground">مكتملة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><XCircle className="w-8 h-8 mx-auto mb-2 text-destructive" /><div className="text-2xl font-bold">{bookings.filter(b => b.status === 'cancelled').length}</div><p className="text-sm text-muted-foreground">ملغية</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>العميل</TableHead><TableHead>الخدمة</TableHead><TableHead>التاريخ</TableHead><TableHead>الوقت</TableHead><TableHead>المدة</TableHead><TableHead>الموظف</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
            <TableBody>
              {bookings.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.customer}</TableCell>
                  <TableCell>{b.service}</TableCell>
                  <TableCell>{b.date}</TableCell>
                  <TableCell>{b.time}</TableCell>
                  <TableCell>{b.duration}</TableCell>
                  <TableCell>{b.staff}</TableCell>
                  <TableCell><Badge variant={b.status === 'confirmed' ? 'default' : b.status === 'completed' ? 'default' : b.status === 'cancelled' ? 'destructive' : 'secondary'}>{b.status === 'confirmed' ? 'مؤكد' : b.status === 'completed' ? 'مكتمل' : b.status === 'cancelled' ? 'ملغي' : 'بانتظار'}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
