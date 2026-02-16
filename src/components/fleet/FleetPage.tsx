import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Car, Fuel, Wrench, FileText, Plus, Calendar, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export function FleetPage() {
  const vehicles = [
    { id: 1, plate: 'أ ب ج 1234', make: 'تويوتا', model: 'كامري 2023', driver: 'أحمد محمد', status: 'active', mileage: 45000, nextService: '2024-02-15', fuelType: 'بنزين', insurance: '2024-06-30' },
    { id: 2, plate: 'د ه و 5678', make: 'هيونداي', model: 'إلنترا 2022', driver: 'سعد العتيبي', status: 'active', mileage: 62000, nextService: '2024-01-20', fuelType: 'بنزين', insurance: '2024-04-15' },
    { id: 3, plate: 'ز ح ط 9012', make: 'نيسان', model: 'باترول 2024', driver: 'خالد فهد', status: 'in_maintenance', mileage: 12000, nextService: '2024-03-01', fuelType: 'بنزين', insurance: '2025-01-01' },
    { id: 4, plate: 'ي ك ل 3456', make: 'تويوتا', model: 'هايلكس 2023', driver: null, status: 'available', mileage: 8000, nextService: '2024-04-10', fuelType: 'ديزل', insurance: '2024-09-20' },
  ];

  const fuelLogs = [
    { id: 1, vehicle: 'أ ب ج 1234', date: '2024-01-18', liters: 45, cost: 108, odometer: 45000, station: 'أرامكو' },
    { id: 2, vehicle: 'د ه و 5678', date: '2024-01-17', liters: 40, cost: 96, odometer: 62000, station: 'الحمراني' },
    { id: 3, vehicle: 'ز ح ط 9012', date: '2024-01-15', liters: 80, cost: 192, odometer: 12000, station: 'أرامكو' },
  ];

  const services = [
    { id: 1, vehicle: 'أ ب ج 1234', type: 'صيانة دورية', date: '2024-01-10', cost: 850, provider: 'عبداللطيف جميل', status: 'completed' },
    { id: 2, vehicle: 'ز ح ط 9012', type: 'إصلاح مكيف', date: '2024-01-18', cost: 1200, provider: 'الجميح', status: 'in_progress' },
    { id: 3, vehicle: 'د ه و 5678', type: 'تغيير إطارات', date: '2024-01-05', cost: 1600, provider: 'بريجستون', status: 'completed' },
  ];

  const statusLabels: Record<string, string> = { active: 'نشط', in_maintenance: 'في الصيانة', available: 'متاح' };
  const statusColors: Record<string, string> = { active: 'bg-green-100 text-green-800', in_maintenance: 'bg-orange-100 text-orange-800', available: 'bg-blue-100 text-blue-800' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">إدارة الأسطول</h1>
            <p className="text-sm text-muted-foreground">تتبع المركبات والصيانة والوقود</p>
          </div>
        </div>
        <Button className="gap-1"><Plus className="w-4 h-4" />إضافة مركبة</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Car className="w-8 h-8 mx-auto text-blue-500 mb-1" />
          <p className="text-2xl font-bold">{vehicles.length}</p><p className="text-xs text-muted-foreground">إجمالي المركبات</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Fuel className="w-8 h-8 mx-auto text-orange-500 mb-1" />
          <p className="text-2xl font-bold">{fuelLogs.reduce((s, f) => s + f.cost, 0)}</p><p className="text-xs text-muted-foreground">تكلفة الوقود (ر.س)</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Wrench className="w-8 h-8 mx-auto text-red-500 mb-1" />
          <p className="text-2xl font-bold">{vehicles.filter(v => v.status === 'in_maintenance').length}</p><p className="text-xs text-muted-foreground">في الصيانة</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <DollarSign className="w-8 h-8 mx-auto text-green-500 mb-1" />
          <p className="text-2xl font-bold">{services.reduce((s, sv) => s + sv.cost, 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">تكاليف الصيانة (ر.س)</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="vehicles">
        <TabsList>
          <TabsTrigger value="vehicles">المركبات</TabsTrigger>
          <TabsTrigger value="fuel">سجل الوقود</TabsTrigger>
          <TabsTrigger value="services">الصيانة</TabsTrigger>
          <TabsTrigger value="contracts">العقود</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="mt-4">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>اللوحة</TableHead><TableHead>الشركة</TableHead><TableHead>الموديل</TableHead>
                <TableHead>السائق</TableHead><TableHead>الوقود</TableHead><TableHead>العداد</TableHead>
                <TableHead>الصيانة القادمة</TableHead><TableHead>الحالة</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {vehicles.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono font-bold">{v.plate}</TableCell>
                    <TableCell>{v.make}</TableCell>
                    <TableCell>{v.model}</TableCell>
                    <TableCell>{v.driver || <span className="text-muted-foreground">غير معين</span>}</TableCell>
                    <TableCell>{v.fuelType}</TableCell>
                    <TableCell>{v.mileage.toLocaleString()} كم</TableCell>
                    <TableCell>{v.nextService}</TableCell>
                    <TableCell><Badge className={statusColors[v.status]}>{statusLabels[v.status]}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="fuel" className="mt-4">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>المركبة</TableHead><TableHead>التاريخ</TableHead><TableHead>اللترات</TableHead>
                <TableHead>التكلفة</TableHead><TableHead>العداد</TableHead><TableHead>المحطة</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {fuelLogs.map(f => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono">{f.vehicle}</TableCell>
                    <TableCell>{f.date}</TableCell>
                    <TableCell>{f.liters} لتر</TableCell>
                    <TableCell>{f.cost} ر.س</TableCell>
                    <TableCell>{f.odometer.toLocaleString()} كم</TableCell>
                    <TableCell>{f.station}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>المركبة</TableHead><TableHead>نوع الخدمة</TableHead><TableHead>التاريخ</TableHead>
                <TableHead>التكلفة</TableHead><TableHead>مزود الخدمة</TableHead><TableHead>الحالة</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {services.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono">{s.vehicle}</TableCell>
                    <TableCell className="font-medium">{s.type}</TableCell>
                    <TableCell>{s.date}</TableCell>
                    <TableCell>{s.cost.toLocaleString()} ر.س</TableCell>
                    <TableCell>{s.provider}</TableCell>
                    <TableCell><Badge variant={s.status === 'completed' ? 'default' : 'secondary'}>{s.status === 'completed' ? 'مكتمل' : 'جاري'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="contracts" className="mt-4">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>المركبة</TableHead><TableHead>نوع العقد</TableHead><TableHead>البداية</TableHead>
                <TableHead>النهاية</TableHead><TableHead>التكلفة الشهرية</TableHead><TableHead>الحالة</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {[
                  { vehicle: 'أ ب ج 1234', type: 'تأمين شامل', start: '2024-01-01', end: '2024-12-31', cost: 500, status: 'active' },
                  { vehicle: 'ي ك ل 3456', type: 'إيجار', start: '2024-01-01', end: '2025-01-01', cost: 2500, status: 'active' },
                ].map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono">{c.vehicle}</TableCell>
                    <TableCell>{c.type}</TableCell>
                    <TableCell>{c.start}</TableCell>
                    <TableCell>{c.end}</TableCell>
                    <TableCell>{c.cost.toLocaleString()} ر.س</TableCell>
                    <TableCell><Badge variant="default">نشط</Badge></TableCell>
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
