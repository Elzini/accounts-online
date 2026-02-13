import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, BookOpen, Users, FileText, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export function BookkeepingServicePage() {
  const clients = [
    { id: '1', name: 'مؤسسة الريادة', contact: 'سعيد أحمد', plan: 'شامل', status: 'active', monthlyFee: 3000, pendingTasks: 2, lastUpdate: '2024-01-18' },
    { id: '2', name: 'شركة الابتكار', contact: 'خالد محمد', plan: 'أساسي', status: 'active', monthlyFee: 1500, pendingTasks: 5, lastUpdate: '2024-01-15' },
    { id: '3', name: 'مطعم الضيافة', contact: 'فهد سعد', plan: 'شامل', status: 'active', monthlyFee: 3000, pendingTasks: 0, lastUpdate: '2024-01-20' },
    { id: '4', name: 'متجر النور', contact: 'نورة علي', plan: 'أساسي', status: 'paused', monthlyFee: 1500, pendingTasks: 8, lastUpdate: '2024-01-05' },
  ];

  const tasks = [
    { id: '1', client: 'مؤسسة الريادة', task: 'إقفال شهر يناير', dueDate: '2024-02-05', assignee: 'م. سارة', status: 'in_progress' },
    { id: '2', client: 'مؤسسة الريادة', task: 'إعداد إقرار ضريبي Q4', dueDate: '2024-01-31', assignee: 'م. أحمد', status: 'pending' },
    { id: '3', client: 'شركة الابتكار', task: 'تسوية بنكية ديسمبر', dueDate: '2024-01-25', assignee: 'م. سارة', status: 'pending' },
    { id: '4', client: 'مطعم الضيافة', task: 'مراجعة الرواتب', dueDate: '2024-01-28', assignee: 'م. خالد', status: 'completed' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">مسك الدفاتر كخدمة</h1>
          <p className="text-muted-foreground">إدارة حسابات العملاء وتقديم خدمات المحاسبة</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('إضافة عميل جديد')}><Plus className="w-4 h-4" />عميل جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{clients.filter(c => c.status === 'active').length}</div><p className="text-sm text-muted-foreground">عملاء نشطين</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{clients.filter(c => c.status === 'active').reduce((s, c) => s + c.monthlyFee, 0).toLocaleString()} ر.س</div><p className="text-sm text-muted-foreground">إيراد شهري</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto mb-2 text-orange-600" /><div className="text-2xl font-bold">{tasks.filter(t => t.status !== 'completed').length}</div><p className="text-sm text-muted-foreground">مهام معلقة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{tasks.filter(t => t.status === 'completed').length}</div><p className="text-sm text-muted-foreground">مهام مكتملة</p></CardContent></Card>
      </div>

      <Tabs defaultValue="clients">
        <TabsList>
          <TabsTrigger value="clients">العملاء</TabsTrigger>
          <TabsTrigger value="tasks">المهام</TabsTrigger>
        </TabsList>
        <TabsContent value="clients" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader><TableRow><TableHead>العميل</TableHead><TableHead>جهة الاتصال</TableHead><TableHead>الخطة</TableHead><TableHead>الرسوم</TableHead><TableHead>مهام معلقة</TableHead><TableHead>آخر تحديث</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
                <TableBody>
                  {clients.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.contact}</TableCell>
                      <TableCell><Badge variant="outline">{c.plan}</Badge></TableCell>
                      <TableCell>{c.monthlyFee.toLocaleString()} ر.س</TableCell>
                      <TableCell><Badge variant={c.pendingTasks > 3 ? 'destructive' : 'secondary'}>{c.pendingTasks}</Badge></TableCell>
                      <TableCell>{c.lastUpdate}</TableCell>
                      <TableCell><Badge variant={c.status === 'active' ? 'default' : 'secondary'}>{c.status === 'active' ? 'نشط' : 'متوقف'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader><TableRow><TableHead>العميل</TableHead><TableHead>المهمة</TableHead><TableHead>الموعد</TableHead><TableHead>المسؤول</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
                <TableBody>
                  {tasks.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>{t.client}</TableCell>
                      <TableCell className="font-medium">{t.task}</TableCell>
                      <TableCell>{t.dueDate}</TableCell>
                      <TableCell>{t.assignee}</TableCell>
                      <TableCell><Badge variant={t.status === 'completed' ? 'default' : t.status === 'in_progress' ? 'secondary' : 'outline'}>{t.status === 'completed' ? 'مكتمل' : t.status === 'in_progress' ? 'قيد التنفيذ' : 'معلق'}</Badge></TableCell>
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
