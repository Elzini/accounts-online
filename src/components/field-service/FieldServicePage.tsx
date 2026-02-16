import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Truck, Plus, MapPin, Clock, Users, CheckCircle, Navigation } from 'lucide-react';

export function FieldServicePage() {
  const tasks = [
    { id: 'FS-001', customer: 'شركة الراجحي', address: 'الرياض - حي العليا', technician: 'أحمد فني', date: '2024-01-20', time: '09:00', type: 'تركيب', duration: '3 ساعات', status: 'in_progress' },
    { id: 'FS-002', customer: 'مؤسسة النور', address: 'جدة - حي الروضة', technician: 'خالد فني', date: '2024-01-20', time: '11:00', type: 'صيانة', duration: '2 ساعة', status: 'scheduled' },
    { id: 'FS-003', customer: 'محل الأمان', address: 'الدمام - حي الفيصلية', technician: 'سعد فني', date: '2024-01-19', time: '14:00', type: 'إصلاح', duration: '1.5 ساعة', status: 'completed' },
    { id: 'FS-004', customer: 'فندق القصر', address: 'الرياض - طريق الملك فهد', technician: 'أحمد فني', date: '2024-01-21', time: '08:00', type: 'فحص', duration: '4 ساعات', status: 'scheduled' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">الخدمة الميدانية</h1>
            <p className="text-sm text-muted-foreground">إدارة الفنيين والزيارات الميدانية</p>
          </div>
        </div>
        <Button className="gap-1"><Plus className="w-4 h-4" />مهمة جديدة</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Truck className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{tasks.length}</p><p className="text-xs text-muted-foreground">مهام</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Navigation className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{tasks.filter(t => t.status === 'in_progress').length}</p><p className="text-xs text-muted-foreground">في الطريق</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto text-emerald-500 mb-1" /><p className="text-2xl font-bold">{tasks.filter(t => t.status === 'completed').length}</p><p className="text-xs text-muted-foreground">مكتملة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto text-purple-500 mb-1" /><p className="text-2xl font-bold">3</p><p className="text-xs text-muted-foreground">فنيين نشطين</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-4">
        <Table>
          <TableHeader><TableRow>
            <TableHead>الرقم</TableHead><TableHead>العميل</TableHead><TableHead>العنوان</TableHead>
            <TableHead>الفني</TableHead><TableHead>التاريخ</TableHead><TableHead>النوع</TableHead><TableHead>المدة</TableHead><TableHead>الحالة</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {tasks.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-mono">{t.id}</TableCell>
                <TableCell className="font-medium">{t.customer}</TableCell>
                <TableCell className="flex items-center gap-1"><MapPin className="w-3 h-3" />{t.address}</TableCell>
                <TableCell>{t.technician}</TableCell>
                <TableCell>{t.date} {t.time}</TableCell>
                <TableCell><Badge variant="outline">{t.type}</Badge></TableCell>
                <TableCell>{t.duration}</TableCell>
                <TableCell><Badge variant={t.status === 'completed' ? 'default' : t.status === 'in_progress' ? 'secondary' : 'outline'}>
                  {t.status === 'completed' ? 'مكتمل' : t.status === 'in_progress' ? 'جاري' : 'مجدول'}
                </Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
