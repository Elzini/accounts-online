import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Globe, FileText, DollarSign, CreditCard, Package, MessageSquare, User, Download } from 'lucide-react';
import { toast } from 'sonner';

export function CustomerPortalPage() {
  const portalStats = { activeCustomers: 45, pendingInvoices: 12, totalDue: 185000, messages: 8 };

  const invoices = [
    { id: '1', number: 'INV-101', customer: 'شركة التقنية', amount: 25000, dueDate: '2024-02-01', status: 'paid', viewedAt: '2024-01-20' },
    { id: '2', number: 'INV-102', customer: 'مؤسسة البناء', amount: 45000, dueDate: '2024-02-05', status: 'pending', viewedAt: '2024-01-18' },
    { id: '3', number: 'INV-103', customer: 'شركة الإبداع', amount: 15000, dueDate: '2024-01-25', status: 'overdue', viewedAt: null },
    { id: '4', number: 'INV-104', customer: 'دار الطباعة', amount: 8500, dueDate: '2024-02-10', status: 'pending', viewedAt: '2024-01-19' },
  ];

  const orders = [
    { id: '1', number: 'ORD-201', customer: 'شركة التقنية', date: '2024-01-18', items: 5, total: 12500, status: 'processing' },
    { id: '2', number: 'ORD-202', customer: 'مؤسسة البناء', date: '2024-01-19', items: 3, total: 8900, status: 'shipped' },
    { id: '3', number: 'ORD-203', customer: 'شركة الإبداع', date: '2024-01-20', items: 1, total: 3200, status: 'delivered' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">بوابة العملاء الذاتية</h1>
          <p className="text-muted-foreground">بوابة إلكترونية للعملاء لعرض الفواتير والطلبات والدفع</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('نسخ رابط البوابة')}><Globe className="w-4 h-4" />رابط البوابة</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><User className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{portalStats.activeCustomers}</div><p className="text-sm text-muted-foreground">عملاء مسجلين</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><FileText className="w-8 h-8 mx-auto mb-2 text-orange-600" /><div className="text-2xl font-bold">{portalStats.pendingInvoices}</div><p className="text-sm text-muted-foreground">فواتير معلقة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><DollarSign className="w-8 h-8 mx-auto mb-2 text-destructive" /><div className="text-2xl font-bold">{portalStats.totalDue.toLocaleString()} ر.س</div><p className="text-sm text-muted-foreground">مستحقات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><MessageSquare className="w-8 h-8 mx-auto mb-2 text-blue-600" /><div className="text-2xl font-bold">{portalStats.messages}</div><p className="text-sm text-muted-foreground">رسائل جديدة</p></CardContent></Card>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">الفواتير</TabsTrigger>
          <TabsTrigger value="orders">الطلبات</TabsTrigger>
        </TabsList>
        <TabsContent value="invoices" className="mt-4">
          <Card><CardContent className="pt-6">
            <Table>
              <TableHeader><TableRow><TableHead>الفاتورة</TableHead><TableHead>العميل</TableHead><TableHead>المبلغ</TableHead><TableHead>الاستحقاق</TableHead><TableHead>تم العرض</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
              <TableBody>
                {invoices.map(i => (
                  <TableRow key={i.id}>
                    <TableCell className="font-mono">{i.number}</TableCell>
                    <TableCell>{i.customer}</TableCell>
                    <TableCell>{i.amount.toLocaleString()} ر.س</TableCell>
                    <TableCell>{i.dueDate}</TableCell>
                    <TableCell>{i.viewedAt || <Badge variant="secondary">لم يُعرض</Badge>}</TableCell>
                    <TableCell><Badge variant={i.status === 'paid' ? 'default' : i.status === 'overdue' ? 'destructive' : 'secondary'}>{i.status === 'paid' ? 'مدفوع' : i.status === 'overdue' ? 'متأخر' : 'معلق'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="orders" className="mt-4">
          <Card><CardContent className="pt-6">
            <Table>
              <TableHeader><TableRow><TableHead>الطلب</TableHead><TableHead>العميل</TableHead><TableHead>التاريخ</TableHead><TableHead>الأصناف</TableHead><TableHead>المبلغ</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
              <TableBody>
                {orders.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono">{o.number}</TableCell>
                    <TableCell>{o.customer}</TableCell>
                    <TableCell>{o.date}</TableCell>
                    <TableCell>{o.items}</TableCell>
                    <TableCell>{o.total.toLocaleString()} ر.س</TableCell>
                    <TableCell><Badge variant={o.status === 'delivered' ? 'default' : 'secondary'}>{o.status === 'delivered' ? 'تم التسليم' : o.status === 'shipped' ? 'تم الشحن' : 'قيد المعالجة'}</Badge></TableCell>
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
