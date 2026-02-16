import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, ClipboardCheck, AlertTriangle, CheckCircle, Plus, XCircle, BarChart3, FileText } from 'lucide-react';

export function QualityControlPage() {
  const checks = [
    { id: 'QC-001', product: 'زيت محرك 5W-30', type: 'incoming', inspector: 'فهد أحمد', date: '2024-01-18', result: 'pass', defects: 0, batch: 'B-2024-045' },
    { id: 'QC-002', product: 'فلتر هواء', type: 'incoming', inspector: 'سعد محمد', date: '2024-01-17', result: 'pass', defects: 2, batch: 'B-2024-044' },
    { id: 'QC-003', product: 'بطارية 70 أمبير', type: 'incoming', inspector: 'فهد أحمد', date: '2024-01-16', result: 'fail', defects: 5, batch: 'B-2024-043' },
    { id: 'QC-004', product: 'إطار 205/55R16', type: 'random', inspector: 'سعد محمد', date: '2024-01-15', result: 'pass', defects: 0, batch: 'B-2024-042' },
  ];

  const alerts = [
    { id: 1, title: 'نسبة عيوب عالية - بطاريات', severity: 'high', date: '2024-01-16', status: 'open' },
    { id: 2, title: 'مورد لم يجتز الفحص 3 مرات', severity: 'medium', date: '2024-01-14', status: 'investigating' },
  ];

  const points = [
    { id: 1, name: 'فحص الاستلام', description: 'فحص البضائع الواردة', checklistItems: 8, passRate: 94 },
    { id: 2, name: 'فحص المخزون', description: 'فحص عشوائي للمخزون', checklistItems: 5, passRate: 98 },
    { id: 3, name: 'فحص ما قبل الشحن', description: 'فحص قبل تسليم العميل', checklistItems: 6, passRate: 99 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">مراقبة الجودة</h1>
            <p className="text-sm text-muted-foreground">فحوصات الجودة وتتبع العيوب</p>
          </div>
        </div>
        <Button className="gap-1"><Plus className="w-4 h-4" />فحص جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <ClipboardCheck className="w-8 h-8 mx-auto text-blue-500 mb-1" />
          <p className="text-2xl font-bold">{checks.length}</p><p className="text-xs text-muted-foreground">فحوصات هذا الشهر</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-1" />
          <p className="text-2xl font-bold">{((checks.filter(c => c.result === 'pass').length / checks.length) * 100).toFixed(0)}%</p><p className="text-xs text-muted-foreground">نسبة النجاح</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <XCircle className="w-8 h-8 mx-auto text-red-500 mb-1" />
          <p className="text-2xl font-bold">{checks.reduce((s, c) => s + c.defects, 0)}</p><p className="text-xs text-muted-foreground">إجمالي العيوب</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto text-orange-500 mb-1" />
          <p className="text-2xl font-bold">{alerts.filter(a => a.status === 'open').length}</p><p className="text-xs text-muted-foreground">تنبيهات مفتوحة</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="checks">
        <TabsList>
          <TabsTrigger value="checks">الفحوصات</TabsTrigger>
          <TabsTrigger value="alerts">التنبيهات</TabsTrigger>
          <TabsTrigger value="points">نقاط الفحص</TabsTrigger>
        </TabsList>

        <TabsContent value="checks" className="mt-4">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>الرقم</TableHead><TableHead>المنتج</TableHead><TableHead>النوع</TableHead>
                <TableHead>الدفعة</TableHead><TableHead>المفتش</TableHead><TableHead>العيوب</TableHead><TableHead>النتيجة</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {checks.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono">{c.id}</TableCell>
                    <TableCell className="font-medium">{c.product}</TableCell>
                    <TableCell>{c.type === 'incoming' ? 'استلام' : 'عشوائي'}</TableCell>
                    <TableCell className="font-mono text-xs">{c.batch}</TableCell>
                    <TableCell>{c.inspector}</TableCell>
                    <TableCell>{c.defects}</TableCell>
                    <TableCell><Badge variant={c.result === 'pass' ? 'default' : 'destructive'}>{c.result === 'pass' ? 'ناجح ✓' : 'فاشل ✗'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <div className="space-y-3">
            {alerts.map(a => (
              <Card key={a.id}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`w-5 h-5 ${a.severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.date}</p>
                    </div>
                  </div>
                  <Badge variant={a.status === 'open' ? 'destructive' : 'secondary'}>{a.status === 'open' ? 'مفتوح' : 'قيد التحقيق'}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="points" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {points.map(p => (
              <Card key={p.id}>
                <CardContent className="pt-4 space-y-3">
                  <h3 className="font-bold">{p.name}</h3>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                  <div className="flex justify-between text-sm"><span>عناصر القائمة:</span><span>{p.checklistItems}</span></div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm"><span>نسبة النجاح:</span><span>{p.passRate}%</span></div>
                    <Progress value={p.passRate} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
