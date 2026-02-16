import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Wrench, Calendar, AlertTriangle, CheckCircle, Plus, Clock, Settings, Hammer } from 'lucide-react';
import { toast } from 'sonner';

export function MaintenancePage() {
  const requests = [
    { id: 'MR-001', equipment: 'مكيف مركزي - الدور الثاني', type: 'corrective', priority: 'high', requestedBy: 'أحمد', date: '2024-01-18', assignedTo: 'فريق الصيانة', status: 'in_progress' },
    { id: 'MR-002', equipment: 'طابعة HP LaserJet', type: 'corrective', priority: 'medium', requestedBy: 'سارة', date: '2024-01-17', assignedTo: 'محمد تقني', status: 'pending' },
    { id: 'MR-003', equipment: 'مصعد المبنى الرئيسي', type: 'preventive', priority: 'high', requestedBy: 'النظام', date: '2024-01-15', assignedTo: 'شركة أوتيس', status: 'scheduled' },
    { id: 'MR-004', equipment: 'نظام الإنذار', type: 'preventive', priority: 'low', requestedBy: 'النظام', date: '2024-01-10', assignedTo: 'فريق السلامة', status: 'completed' },
  ];

  const equipment = [
    { id: 1, name: 'مكيف مركزي - الدور الأول', category: 'تكييف', location: 'المبنى A', lastMaint: '2024-01-01', nextMaint: '2024-04-01', status: 'operational', health: 85 },
    { id: 2, name: 'مولد كهربائي 500KVA', category: 'كهرباء', location: 'غرفة المولدات', lastMaint: '2023-12-15', nextMaint: '2024-03-15', status: 'operational', health: 92 },
    { id: 3, name: 'مصعد المبنى الرئيسي', category: 'مصاعد', location: 'المبنى A', lastMaint: '2023-11-20', nextMaint: '2024-01-20', status: 'needs_maintenance', health: 65 },
    { id: 4, name: 'نظام إطفاء الحريق', category: 'سلامة', location: 'جميع المباني', lastMaint: '2024-01-10', nextMaint: '2024-07-10', status: 'operational', health: 98 },
  ];

  const schedule = [
    { id: 1, equipment: 'مكيف مركزي', task: 'تنظيف وصيانة دورية', frequency: 'شهري', nextDate: '2024-02-01', assignedTo: 'فريق التكييف' },
    { id: 2, equipment: 'مولد كهربائي', task: 'فحص شامل وتغيير زيت', frequency: 'ربع سنوي', nextDate: '2024-03-15', assignedTo: 'فريق الكهرباء' },
    { id: 3, equipment: 'مصاعد', task: 'فحص سلامة وصيانة', frequency: 'شهري', nextDate: '2024-01-20', assignedTo: 'شركة أوتيس' },
    { id: 4, equipment: 'أنظمة الحريق', task: 'اختبار واعتماد', frequency: 'نصف سنوي', nextDate: '2024-07-10', assignedTo: 'الدفاع المدني' },
  ];

  const priorityColors: Record<string, string> = { high: 'bg-red-100 text-red-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-green-100 text-green-800' };
  const statusLabels: Record<string, string> = { in_progress: 'جاري', pending: 'معلق', scheduled: 'مجدول', completed: 'مكتمل', operational: 'يعمل', needs_maintenance: 'يحتاج صيانة' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-stone-500 to-gray-700 flex items-center justify-center">
            <Hammer className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">الصيانة</h1>
            <p className="text-sm text-muted-foreground">جدولة صيانة المعدات والأصول</p>
          </div>
        </div>
        <Button className="gap-1"><Plus className="w-4 h-4" />طلب صيانة</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Wrench className="w-8 h-8 mx-auto text-blue-500 mb-1" />
          <p className="text-2xl font-bold">{requests.filter(r => r.status !== 'completed').length}</p><p className="text-xs text-muted-foreground">طلبات مفتوحة</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto text-red-500 mb-1" />
          <p className="text-2xl font-bold">{requests.filter(r => r.priority === 'high').length}</p><p className="text-xs text-muted-foreground">أولوية عالية</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Calendar className="w-8 h-8 mx-auto text-orange-500 mb-1" />
          <p className="text-2xl font-bold">{schedule.length}</p><p className="text-xs text-muted-foreground">صيانة مجدولة</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-1" />
          <p className="text-2xl font-bold">{equipment.filter(e => e.status === 'operational').length}</p><p className="text-xs text-muted-foreground">معدات تعمل</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">طلبات الصيانة</TabsTrigger>
          <TabsTrigger value="equipment">المعدات</TabsTrigger>
          <TabsTrigger value="schedule">الجدولة الوقائية</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>الرقم</TableHead><TableHead>المعدة</TableHead><TableHead>النوع</TableHead>
                <TableHead>الأولوية</TableHead><TableHead>الطالب</TableHead><TableHead>المسؤول</TableHead><TableHead>الحالة</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {requests.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.id}</TableCell>
                    <TableCell className="font-medium">{r.equipment}</TableCell>
                    <TableCell>{r.type === 'corrective' ? 'إصلاحية' : 'وقائية'}</TableCell>
                    <TableCell><Badge className={priorityColors[r.priority]}>{r.priority === 'high' ? 'عالية' : r.priority === 'medium' ? 'متوسطة' : 'منخفضة'}</Badge></TableCell>
                    <TableCell>{r.requestedBy}</TableCell>
                    <TableCell>{r.assignedTo}</TableCell>
                    <TableCell><Badge variant={r.status === 'completed' ? 'default' : 'secondary'}>{statusLabels[r.status]}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="equipment" className="mt-4">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>المعدة</TableHead><TableHead>الفئة</TableHead><TableHead>الموقع</TableHead>
                <TableHead>آخر صيانة</TableHead><TableHead>الصيانة القادمة</TableHead><TableHead>الصحة</TableHead><TableHead>الحالة</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {equipment.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>{e.category}</TableCell>
                    <TableCell>{e.location}</TableCell>
                    <TableCell>{e.lastMaint}</TableCell>
                    <TableCell>{e.nextMaint}</TableCell>
                    <TableCell><div className="flex items-center gap-2 w-24"><Progress value={e.health} className="h-2" /><span className="text-xs">{e.health}%</span></div></TableCell>
                    <TableCell><Badge variant={e.status === 'operational' ? 'default' : 'destructive'}>{statusLabels[e.status]}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>المعدة</TableHead><TableHead>المهمة</TableHead><TableHead>التكرار</TableHead>
                <TableHead>التاريخ القادم</TableHead><TableHead>المسؤول</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {schedule.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.equipment}</TableCell>
                    <TableCell>{s.task}</TableCell>
                    <TableCell><Badge variant="outline">{s.frequency}</Badge></TableCell>
                    <TableCell>{s.nextDate}</TableCell>
                    <TableCell>{s.assignedTo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
