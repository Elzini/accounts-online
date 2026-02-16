import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarDays, Plus, Users, Clock, BarChart3, Calendar } from 'lucide-react';

export function PlanningPage() {
  const shifts = [
    { id: 1, employee: 'أحمد محمد', role: 'كاشير', date: '2024-01-20', start: '08:00', end: '16:00', hours: 8, status: 'confirmed' },
    { id: 2, employee: 'سارة علي', role: 'خدمة عملاء', date: '2024-01-20', start: '09:00', end: '17:00', hours: 8, status: 'confirmed' },
    { id: 3, employee: 'خالد سعد', role: 'مستودعات', date: '2024-01-20', start: '07:00', end: '15:00', hours: 8, status: 'draft' },
    { id: 4, employee: 'نورة فهد', role: 'محاسبة', date: '2024-01-21', start: '08:00', end: '16:00', hours: 8, status: 'confirmed' },
    { id: 5, employee: 'محمد عبدالله', role: 'مبيعات', date: '2024-01-21', start: '10:00', end: '18:00', hours: 8, status: 'draft' },
  ];

  const weekDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">التخطيط</h1>
            <p className="text-sm text-muted-foreground">جدولة ورديات الموظفين وتوزيع المهام</p>
          </div>
        </div>
        <Button className="gap-1"><Plus className="w-4 h-4" />وردية جديدة</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{shifts.length}</p><p className="text-xs text-muted-foreground">ورديات مجدولة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{shifts.reduce((s, sh) => s + sh.hours, 0)}</p><p className="text-xs text-muted-foreground">ساعات مخططة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Calendar className="w-8 h-8 mx-auto text-purple-500 mb-1" /><p className="text-2xl font-bold">{shifts.filter(s => s.status === 'confirmed').length}</p><p className="text-xs text-muted-foreground">مؤكدة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><BarChart3 className="w-8 h-8 mx-auto text-orange-500 mb-1" /><p className="text-2xl font-bold">{shifts.filter(s => s.status === 'draft').length}</p><p className="text-xs text-muted-foreground">مسودة</p></CardContent></Card>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">قائمة</TabsTrigger>
          <TabsTrigger value="calendar">تقويم</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>الموظف</TableHead><TableHead>الدور</TableHead><TableHead>التاريخ</TableHead>
                <TableHead>من</TableHead><TableHead>إلى</TableHead><TableHead>الساعات</TableHead><TableHead>الحالة</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {shifts.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.employee}</TableCell>
                    <TableCell><Badge variant="outline">{s.role}</Badge></TableCell>
                    <TableCell>{s.date}</TableCell>
                    <TableCell>{s.start}</TableCell>
                    <TableCell>{s.end}</TableCell>
                    <TableCell>{s.hours}h</TableCell>
                    <TableCell><Badge variant={s.status === 'confirmed' ? 'default' : 'secondary'}>{s.status === 'confirmed' ? 'مؤكد' : 'مسودة'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <Card><CardContent className="pt-4">
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map(d => <div key={d} className="text-center text-xs font-bold text-muted-foreground p-2">{d}</div>)}
              {Array.from({ length: 7 }).map((_, i) => (
                <Card key={i} className="min-h-[100px] p-2">
                  <p className="text-xs font-bold">{20 + i}</p>
                  {shifts.filter(s => s.date === `2024-01-${20 + i}`).map(s => (
                    <div key={s.id} className="text-[10px] bg-primary/10 rounded px-1 py-0.5 mt-1 truncate">{s.employee} ({s.start})</div>
                  ))}
                </Card>
              ))}
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
