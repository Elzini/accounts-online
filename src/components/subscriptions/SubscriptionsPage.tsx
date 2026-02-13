import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, RefreshCw, Calendar, DollarSign, Users } from 'lucide-react';
import { toast } from 'sonner';

export function SubscriptionsPage() {
  const subscriptions = [
    { id: '1', customer: 'شركة التقنية', plan: 'الخطة الذهبية', amount: 5000, cycle: 'شهري', startDate: '2024-01-01', nextBilling: '2024-02-01', status: 'active' },
    { id: '2', customer: 'مؤسسة البناء', plan: 'الخطة الفضية', amount: 3000, cycle: 'ربع سنوي', startDate: '2024-01-15', nextBilling: '2024-04-15', status: 'active' },
    { id: '3', customer: 'شركة الإبداع', plan: 'الخطة البرونزية', amount: 1500, cycle: 'شهري', startDate: '2023-06-01', nextBilling: '2024-02-01', status: 'overdue' },
    { id: '4', customer: 'دار الطباعة', plan: 'الخطة الذهبية', amount: 5000, cycle: 'سنوي', startDate: '2023-03-01', nextBilling: '2024-03-01', status: 'active' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الاشتراكات والفوترة المتكررة</h1>
          <p className="text-muted-foreground">إدارة الاشتراكات والعضويات والفوترة التلقائية</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('إنشاء اشتراك جديد')}><Plus className="w-4 h-4" />اشتراك جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{subscriptions.length}</div><p className="text-sm text-muted-foreground">الاشتراكات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{subscriptions.filter(s => s.status === 'active').reduce((t, s) => t + s.amount, 0).toLocaleString()} ر.س</div><p className="text-sm text-muted-foreground">الإيراد المتكرر</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><RefreshCw className="w-8 h-8 mx-auto mb-2 text-blue-600" /><div className="text-2xl font-bold">{subscriptions.filter(s => s.status === 'active').length}</div><p className="text-sm text-muted-foreground">نشطة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-destructive">{subscriptions.filter(s => s.status === 'overdue').length}</div><p className="text-sm text-muted-foreground">متأخرة</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>العميل</TableHead><TableHead>الخطة</TableHead><TableHead>المبلغ</TableHead><TableHead>الدورة</TableHead><TableHead>بداية</TableHead><TableHead>الفوترة التالية</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
            <TableBody>
              {subscriptions.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.customer}</TableCell>
                  <TableCell>{s.plan}</TableCell>
                  <TableCell>{s.amount.toLocaleString()} ر.س</TableCell>
                  <TableCell>{s.cycle}</TableCell>
                  <TableCell>{s.startDate}</TableCell>
                  <TableCell>{s.nextBilling}</TableCell>
                  <TableCell><Badge variant={s.status === 'active' ? 'default' : 'destructive'}>{s.status === 'active' ? 'نشط' : 'متأخر'}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
