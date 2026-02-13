import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Wrench, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function WorkOrdersPage() {
  const orders = [
    { id: '1', number: 'WO-001', title: 'صيانة مكيفات الطابق الثاني', customer: 'شركة التقنية', assignee: 'أحمد محمد', priority: 'high', status: 'in_progress', dueDate: '2024-01-25', estimatedHours: 4 },
    { id: '2', number: 'WO-002', title: 'تركيب شبكة إنترنت', customer: 'مؤسسة البناء', assignee: 'خالد سعد', priority: 'medium', status: 'pending', dueDate: '2024-01-28', estimatedHours: 8 },
    { id: '3', number: 'WO-003', title: 'إصلاح نظام الإنذار', customer: 'دار الطباعة', assignee: 'فهد العلي', priority: 'urgent', status: 'pending', dueDate: '2024-01-22', estimatedHours: 2 },
    { id: '4', number: 'WO-004', title: 'فحص دوري للمعدات', customer: 'شركة الإبداع', assignee: 'أحمد محمد', priority: 'low', status: 'completed', dueDate: '2024-01-20', estimatedHours: 3 },
  ];

  const priorityLabels: Record<string, string> = { low: 'منخفض', medium: 'متوسط', high: 'عالي', urgent: 'عاجل' };
  const statusLabels: Record<string, string> = { pending: 'بانتظار', in_progress: 'قيد التنفيذ', completed: 'مكتمل' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">أوامر العمل</h1>
          <p className="text-muted-foreground">تتبع وإدارة أوامر العمل والخدمات</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('إنشاء أمر عمل جديد')}><Plus className="w-4 h-4" />أمر عمل جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Wrench className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{orders.length}</div><p className="text-sm text-muted-foreground">إجمالي الأوامر</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto mb-2 text-orange-600" /><div className="text-2xl font-bold">{orders.filter(o => o.status === 'in_progress').length}</div><p className="text-sm text-muted-foreground">قيد التنفيذ</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{orders.filter(o => o.status === 'completed').length}</div><p className="text-sm text-muted-foreground">مكتملة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" /><div className="text-2xl font-bold">{orders.filter(o => o.priority === 'urgent').length}</div><p className="text-sm text-muted-foreground">عاجلة</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>الرقم</TableHead><TableHead>العنوان</TableHead><TableHead>العميل</TableHead><TableHead>المسؤول</TableHead><TableHead>الأولوية</TableHead><TableHead>الموعد</TableHead><TableHead>الساعات</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
            <TableBody>
              {orders.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono">{o.number}</TableCell>
                  <TableCell className="font-medium">{o.title}</TableCell>
                  <TableCell>{o.customer}</TableCell>
                  <TableCell>{o.assignee}</TableCell>
                  <TableCell><Badge variant={o.priority === 'urgent' ? 'destructive' : o.priority === 'high' ? 'default' : 'secondary'}>{priorityLabels[o.priority]}</Badge></TableCell>
                  <TableCell>{o.dueDate}</TableCell>
                  <TableCell>{o.estimatedHours}h</TableCell>
                  <TableCell><Badge variant={o.status === 'completed' ? 'default' : 'secondary'}>{statusLabels[o.status]}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
