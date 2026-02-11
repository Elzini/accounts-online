import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageCircle, Send, Settings, Bell, CheckCircle, 
  Clock, AlertCircle, FileText, Users 
} from 'lucide-react';
import { toast } from 'sonner';

export function WhatsAppPluginPage() {
  const [autoInvoice, setAutoInvoice] = useState(true);
  const [autoReminder, setAutoReminder] = useState(false);

  const messages = [
    { to: '966501234567', type: 'فاتورة', ref: 'INV-001', date: '2024-01-18 14:30', status: 'delivered' },
    { to: '966509876543', type: 'تذكير دفع', ref: 'INV-089', date: '2024-01-18 10:00', status: 'read' },
    { to: '966507654321', type: 'تقرير', ref: 'RPT-015', date: '2024-01-17 09:00', status: 'sent' },
    { to: '966503456789', type: 'فاتورة', ref: 'INV-102', date: '2024-01-17 16:45', status: 'failed' },
  ];

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      delivered: { label: 'تم التسليم', variant: 'default' },
      read: { label: 'مقروءة', variant: 'secondary' },
      sent: { label: 'أرسلت', variant: 'outline' },
      failed: { label: 'فشلت', variant: 'destructive' },
    };
    const info = map[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="text-4xl">💬</div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">تكامل واتساب</h1>
          <p className="text-muted-foreground">إرسال الفواتير والتقارير عبر واتساب تلقائياً</p>
        </div>
        <Badge variant="outline" className="ms-auto gap-1"><CheckCircle className="w-3 h-3 text-green-500" />v1.1.0</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Send className="w-8 h-8 mx-auto text-green-500 mb-2" />
          <p className="text-2xl font-bold">1,245</p><p className="text-xs text-muted-foreground">رسائل مرسلة</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <CheckCircle className="w-8 h-8 mx-auto text-blue-500 mb-2" />
          <p className="text-2xl font-bold">98%</p><p className="text-xs text-muted-foreground">نسبة التسليم</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <FileText className="w-8 h-8 mx-auto text-purple-500 mb-2" />
          <p className="text-2xl font-bold">89</p><p className="text-xs text-muted-foreground">فواتير مرسلة</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Users className="w-8 h-8 mx-auto text-orange-500 mb-2" />
          <p className="text-2xl font-bold">156</p><p className="text-xs text-muted-foreground">جهات اتصال</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="messages">
        <TabsList>
          <TabsTrigger value="messages" className="gap-2"><MessageCircle className="w-4 h-4" />الرسائل</TabsTrigger>
          <TabsTrigger value="templates" className="gap-2"><FileText className="w-4 h-4" />القوالب</TabsTrigger>
          <TabsTrigger value="settings" className="gap-2"><Settings className="w-4 h-4" />الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">سجل الرسائل</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الرقم</TableHead><TableHead>النوع</TableHead>
                    <TableHead>المرجع</TableHead><TableHead>التاريخ</TableHead><TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{m.to}</TableCell>
                      <TableCell>{m.type}</TableCell>
                      <TableCell className="font-mono">{m.ref}</TableCell>
                      <TableCell>{m.date}</TableCell>
                      <TableCell>{getStatusBadge(m.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-4 space-y-4">
          {['قالب الفاتورة', 'قالب تذكير الدفع', 'قالب التقرير الشهري'].map((name, i) => (
            <Card key={i}>
              <CardHeader><CardTitle className="text-base">{name}</CardTitle></CardHeader>
              <CardContent>
                <Textarea defaultValue={i === 0 ? 'مرحباً {customer_name}، مرفق فاتورتكم رقم {invoice_number} بمبلغ {amount} ر.س. شكراً لتعاملكم معنا.' : i === 1 ? 'تذكير: فاتورة رقم {invoice_number} بمبلغ {amount} ر.س مستحقة بتاريخ {due_date}.' : 'مرفق التقرير الشهري لشهر {month}. إجمالي المبيعات: {total_sales} ر.س.'} rows={3} />
                <Button size="sm" className="mt-2" onClick={() => toast.success('تم حفظ القالب')}>حفظ</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">إعدادات واتساب</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>رقم WhatsApp Business API</Label>
                <Input placeholder="966xxxxxxxxx" />
              </div>
              <div className="space-y-2">
                <Label>API Token</Label>
                <Input type="password" placeholder="أدخل التوكن" />
              </div>
              <div className="flex items-center justify-between">
                <div><Label>إرسال تلقائي عند إنشاء فاتورة</Label></div>
                <Switch checked={autoInvoice} onCheckedChange={setAutoInvoice} />
              </div>
              <div className="flex items-center justify-between">
                <div><Label>تذكير تلقائي قبل تاريخ الاستحقاق</Label></div>
                <Switch checked={autoReminder} onCheckedChange={setAutoReminder} />
              </div>
              <Button onClick={() => toast.success('تم حفظ الإعدادات')}>حفظ الإعدادات</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
