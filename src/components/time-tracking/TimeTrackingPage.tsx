import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Plus, Clock, Play, Pause, Timer, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export function TimeTrackingPage() {
  const [isTracking, setIsTracking] = useState(false);
  const entries = [
    { id: '1', employee: 'أحمد محمد', project: 'مشروع ERP', task: 'تطوير واجهة المستخدم', date: '2024-01-18', hours: 6.5, billable: true },
    { id: '2', employee: 'خالد سعد', project: 'مشروع الموقع', task: 'تصميم الصفحة الرئيسية', date: '2024-01-18', hours: 4, billable: true },
    { id: '3', employee: 'فهد العلي', project: 'مشروع ERP', task: 'اختبار النظام', date: '2024-01-18', hours: 3, billable: false },
    { id: '4', employee: 'أحمد محمد', project: 'دعم فني', task: 'حل مشكلة العميل', date: '2024-01-17', hours: 2, billable: true },
  ];

  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const billableHours = entries.filter(e => e.billable).reduce((s, e) => s + e.hours, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">تتبع الوقت</h1>
          <p className="text-muted-foreground">تسجيل ساعات العمل والمشاريع</p>
        </div>
        <Button className="gap-2" variant={isTracking ? 'destructive' : 'default'} onClick={() => { setIsTracking(!isTracking); toast.success(isTracking ? 'تم إيقاف التتبع' : 'بدأ التتبع'); }}>
          {isTracking ? <><Pause className="w-4 h-4" />إيقاف</> : <><Play className="w-4 h-4" />بدء التتبع</>}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Timer className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{totalHours}h</div><p className="text-sm text-muted-foreground">إجمالي الساعات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{billableHours}h</div><p className="text-sm text-muted-foreground">ساعات قابلة للفوترة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-600" /><div className="text-2xl font-bold">{((billableHours/totalHours)*100).toFixed(0)}%</div><p className="text-sm text-muted-foreground">نسبة الفوترة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{entries.length}</div><p className="text-sm text-muted-foreground">تسجيلات</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>الموظف</TableHead><TableHead>المشروع</TableHead><TableHead>المهمة</TableHead><TableHead>التاريخ</TableHead><TableHead>الساعات</TableHead><TableHead>قابل للفوترة</TableHead></TableRow></TableHeader>
            <TableBody>
              {entries.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.employee}</TableCell>
                  <TableCell>{e.project}</TableCell>
                  <TableCell>{e.task}</TableCell>
                  <TableCell>{e.date}</TableCell>
                  <TableCell className="font-bold">{e.hours}h</TableCell>
                  <TableCell><Badge variant={e.billable ? 'default' : 'secondary'}>{e.billable ? 'نعم' : 'لا'}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
