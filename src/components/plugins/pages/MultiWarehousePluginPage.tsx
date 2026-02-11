import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  Warehouse, ArrowLeftRight, ClipboardCheck, Package, 
  MapPin, CheckCircle, TrendingUp, AlertTriangle 
} from 'lucide-react';

export function MultiWarehousePluginPage() {
  const warehouses = [
    { name: 'المستودع الرئيسي - الرياض', code: 'WH-001', items: 1250, capacity: 85, status: 'active' },
    { name: 'مستودع جدة', code: 'WH-002', items: 890, capacity: 62, status: 'active' },
    { name: 'مستودع الدمام', code: 'WH-003', items: 456, capacity: 45, status: 'active' },
    { name: 'مستودع المدينة', code: 'WH-004', items: 120, capacity: 15, status: 'maintenance' },
  ];

  const transfers = [
    { id: 'TR-001', from: 'الرياض', to: 'جدة', items: 50, date: '2024-01-18', status: 'in_transit' },
    { id: 'TR-002', from: 'جدة', to: 'الدمام', items: 30, date: '2024-01-17', status: 'delivered' },
    { id: 'TR-003', from: 'الرياض', to: 'المدينة', items: 25, date: '2024-01-19', status: 'pending' },
  ];

  const stocktakes = [
    { warehouse: 'المستودع الرئيسي', date: '2024-01-15', items: 1250, matched: 1238, variance: 12 },
    { warehouse: 'مستودع جدة', date: '2024-01-10', items: 890, matched: 885, variance: 5 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="text-4xl">🏭</div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">المستودعات المتعددة</h1>
          <p className="text-muted-foreground">إدارة مخزون متعددة المواقع مع تتبع التحويلات والجرد</p>
        </div>
        <Badge variant="outline" className="ms-auto gap-1"><CheckCircle className="w-3 h-3 text-green-500" />v1.3.0</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Warehouse className="w-8 h-8 mx-auto text-blue-500 mb-2" />
          <p className="text-2xl font-bold">4</p><p className="text-xs text-muted-foreground">مستودعات</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Package className="w-8 h-8 mx-auto text-green-500 mb-2" />
          <p className="text-2xl font-bold">2,716</p><p className="text-xs text-muted-foreground">إجمالي الأصناف</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <ArrowLeftRight className="w-8 h-8 mx-auto text-purple-500 mb-2" />
          <p className="text-2xl font-bold">15</p><p className="text-xs text-muted-foreground">تحويلات الشهر</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <ClipboardCheck className="w-8 h-8 mx-auto text-orange-500 mb-2" />
          <p className="text-2xl font-bold">2</p><p className="text-xs text-muted-foreground">عمليات جرد</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="warehouses">
        <TabsList>
          <TabsTrigger value="warehouses" className="gap-2"><Warehouse className="w-4 h-4" />المستودعات</TabsTrigger>
          <TabsTrigger value="transfers" className="gap-2"><ArrowLeftRight className="w-4 h-4" />التحويلات</TabsTrigger>
          <TabsTrigger value="stocktake" className="gap-2"><ClipboardCheck className="w-4 h-4" />الجرد</TabsTrigger>
        </TabsList>

        <TabsContent value="warehouses" className="mt-4 space-y-4">
          {warehouses.map((wh, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{wh.name}</p>
                      <p className="text-xs text-muted-foreground">{wh.code} • {wh.items} صنف</p>
                    </div>
                  </div>
                  <Badge variant={wh.status === 'active' ? 'default' : 'outline'}>
                    {wh.status === 'active' ? 'نشط' : 'صيانة'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={wh.capacity} className="flex-1" />
                  <span className="text-sm font-bold">{wh.capacity}%</span>
                  {wh.capacity > 80 && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="transfers" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">تحويلات المخزون</CardTitle>
              <Button size="sm">+ تحويل جديد</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الرقم</TableHead><TableHead>من</TableHead><TableHead>إلى</TableHead>
                    <TableHead>الأصناف</TableHead><TableHead>التاريخ</TableHead><TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono">{t.id}</TableCell>
                      <TableCell>{t.from}</TableCell><TableCell>{t.to}</TableCell>
                      <TableCell>{t.items}</TableCell><TableCell>{t.date}</TableCell>
                      <TableCell>
                        <Badge variant={t.status === 'delivered' ? 'default' : t.status === 'in_transit' ? 'secondary' : 'outline'}>
                          {t.status === 'delivered' ? 'تم التسليم' : t.status === 'in_transit' ? 'في الطريق' : 'معلق'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stocktake" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">عمليات الجرد</CardTitle>
              <Button size="sm">+ جرد جديد</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستودع</TableHead><TableHead>التاريخ</TableHead>
                    <TableHead>الأصناف</TableHead><TableHead>مطابق</TableHead><TableHead>فرق</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stocktakes.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell>{s.warehouse}</TableCell><TableCell>{s.date}</TableCell>
                      <TableCell>{s.items}</TableCell><TableCell>{s.matched}</TableCell>
                      <TableCell><Badge variant={s.variance > 10 ? 'destructive' : 'outline'}>{s.variance}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
