import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Plus, Search, ClipboardList, PackageCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function StocktakingPage() {
  const sessions = [
    { id: '1', name: 'جرد نهاية السنة 2024', warehouse: 'المستودع الرئيسي', date: '2024-12-31', status: 'in_progress', totalItems: 150, countedItems: 98, variance: 5 },
    { id: '2', name: 'جرد ربع سنوي Q3', warehouse: 'المستودع الفرعي', date: '2024-09-30', status: 'completed', totalItems: 80, countedItems: 80, variance: 2 },
    { id: '3', name: 'جرد مفاجئ', warehouse: 'المستودع الرئيسي', date: '2024-06-15', status: 'completed', totalItems: 50, countedItems: 50, variance: 0 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الجرد المخزني</h1>
          <p className="text-muted-foreground">الجرد الدوري والمستمر للمخزون</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('إنشاء جلسة جرد جديدة')}><Plus className="w-4 h-4" />جرد جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><ClipboardList className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{sessions.length}</div><p className="text-sm text-muted-foreground">جلسات الجرد</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><PackageCheck className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{sessions.filter(s => s.status === 'completed').length}</div><p className="text-sm text-muted-foreground">مكتملة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-orange-600">{sessions.filter(s => s.status === 'in_progress').length}</div><p className="text-sm text-muted-foreground">قيد التنفيذ</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><AlertTriangle className="w-8 h-8 mx-auto mb-2 text-destructive" /><div className="text-2xl font-bold">{sessions.reduce((s, v) => s + v.variance, 0)}</div><p className="text-sm text-muted-foreground">فروقات</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>الجلسة</TableHead><TableHead>المستودع</TableHead><TableHead>التاريخ</TableHead><TableHead>التقدم</TableHead><TableHead>الفروقات</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
            <TableBody>
              {sessions.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.warehouse}</TableCell>
                  <TableCell>{s.date}</TableCell>
                  <TableCell className="w-40">
                    <div className="flex items-center gap-2">
                      <Progress value={(s.countedItems / s.totalItems) * 100} className="h-2" />
                      <span className="text-xs">{s.countedItems}/{s.totalItems}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={s.variance > 0 ? 'destructive' : 'default'}>{s.variance}</Badge></TableCell>
                  <TableCell><Badge variant={s.status === 'completed' ? 'default' : 'secondary'}>{s.status === 'completed' ? 'مكتمل' : 'قيد التنفيذ'}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
