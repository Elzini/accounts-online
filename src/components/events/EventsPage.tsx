import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Plus, MapPin, Users, Ticket, Clock } from 'lucide-react';

export function EventsPage() {
  const events = [
    { id: 1, name: 'معرض السيارات 2024', type: 'معرض', location: 'مركز المعارض - الرياض', date: '2024-02-15', endDate: '2024-02-18', capacity: 500, registered: 320, tickets: 280, status: 'upcoming' },
    { id: 2, name: 'ورشة صيانة السيارات', type: 'ورشة', location: 'فرع جدة', date: '2024-01-25', endDate: '2024-01-25', capacity: 30, registered: 28, tickets: 25, status: 'upcoming' },
    { id: 3, name: 'مؤتمر التقنية المالية', type: 'مؤتمر', location: 'فندق الريتز كارلتون', date: '2024-01-10', endDate: '2024-01-11', capacity: 200, registered: 200, tickets: 195, status: 'completed' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">الأحداث والفعاليات</h1>
            <p className="text-sm text-muted-foreground">إدارة المؤتمرات والمعارض</p>
          </div>
        </div>
        <Button className="gap-1"><Plus className="w-4 h-4" />فعالية جديدة</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Calendar className="w-8 h-8 mx-auto text-purple-500 mb-1" /><p className="text-2xl font-bold">{events.length}</p><p className="text-xs text-muted-foreground">إجمالي الفعاليات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{events.reduce((s, e) => s + e.registered, 0)}</p><p className="text-xs text-muted-foreground">المسجلين</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Ticket className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{events.reduce((s, e) => s + e.tickets, 0)}</p><p className="text-xs text-muted-foreground">تذاكر مباعة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto text-orange-500 mb-1" /><p className="text-2xl font-bold">{events.filter(e => e.status === 'upcoming').length}</p><p className="text-xs text-muted-foreground">قادمة</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-4">
        <Table>
          <TableHeader><TableRow>
            <TableHead>الفعالية</TableHead><TableHead>النوع</TableHead><TableHead>الموقع</TableHead>
            <TableHead>التاريخ</TableHead><TableHead>السعة</TableHead><TableHead>المسجلين</TableHead><TableHead>التذاكر</TableHead><TableHead>الحالة</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {events.map(e => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell><Badge variant="outline">{e.type}</Badge></TableCell>
                <TableCell className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location}</TableCell>
                <TableCell>{e.date}</TableCell>
                <TableCell>{e.capacity}</TableCell>
                <TableCell>{e.registered}</TableCell>
                <TableCell>{e.tickets}</TableCell>
                <TableCell><Badge variant={e.status === 'upcoming' ? 'default' : 'secondary'}>{e.status === 'upcoming' ? 'قادمة' : 'مكتملة'}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
