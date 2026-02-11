import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Receipt, Settings, Shield, FileCheck, AlertTriangle, CheckCircle, 
  Upload, RefreshCw, Eye, Send, Clock, Server 
} from 'lucide-react';
import { toast } from 'sonner';

export function ZatcaPluginPage() {
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [sandboxMode, setSandboxMode] = useState(true);

  const invoices = [
    { id: 'INV-2024-001', date: '2024-01-15', customer: 'شركة التقنية', amount: 5750, status: 'submitted', zatcaStatus: 'cleared' },
    { id: 'INV-2024-002', date: '2024-01-16', customer: 'مؤسسة النور', amount: 3200, status: 'submitted', zatcaStatus: 'reported' },
    { id: 'INV-2024-003', date: '2024-01-17', customer: 'شركة البناء', amount: 12500, status: 'pending', zatcaStatus: 'pending' },
    { id: 'INV-2024-004', date: '2024-01-18', customer: 'مجموعة الأمل', amount: 8900, status: 'error', zatcaStatus: 'rejected' },
  ];

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      cleared: { label: 'مقبولة', variant: 'default' },
      reported: { label: 'مبلغ عنها', variant: 'secondary' },
      pending: { label: 'قيد المعالجة', variant: 'outline' },
      rejected: { label: 'مرفوضة', variant: 'destructive' },
    };
    const info = map[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="text-4xl">🧾</div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">الفوترة الإلكترونية ZATCA</h1>
          <p className="text-muted-foreground">الامتثال الكامل لمتطلبات هيئة الزكاة والضريبة والجمارك - المرحلة الثانية</p>
        </div>
        <Badge variant="outline" className="ms-auto gap-1">
          <CheckCircle className="w-3 h-3 text-green-500" />
          v2.1.0
        </Badge>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices" className="gap-2"><Receipt className="w-4 h-4" />الفواتير</TabsTrigger>
          <TabsTrigger value="compliance" className="gap-2"><Shield className="w-4 h-4" />الامتثال</TabsTrigger>
          <TabsTrigger value="settings" className="gap-2"><Settings className="w-4 h-4" />الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4 text-center">
              <FileCheck className="w-8 h-8 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold">156</p><p className="text-xs text-muted-foreground">فواتير مقبولة</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <Send className="w-8 h-8 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">23</p><p className="text-xs text-muted-foreground">مبلغ عنها</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <Clock className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
              <p className="text-2xl font-bold">5</p><p className="text-xs text-muted-foreground">قيد المعالجة</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <AlertTriangle className="w-8 h-8 mx-auto text-red-500 mb-2" />
              <p className="text-2xl font-bold">2</p><p className="text-xs text-muted-foreground">مرفوضة</p>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">سجل الفواتير الإلكترونية</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الفاتورة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>حالة ZATCA</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono">{inv.id}</TableCell>
                      <TableCell>{inv.date}</TableCell>
                      <TableCell>{inv.customer}</TableCell>
                      <TableCell>{inv.amount.toLocaleString()} ر.س</TableCell>
                      <TableCell>{getStatusBadge(inv.zatcaStatus)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost"><Eye className="w-3 h-3" /></Button>
                          <Button size="sm" variant="ghost"><RefreshCw className="w-3 h-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" />حالة الامتثال</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {['تسجيل الجهاز', 'شهادة CSR', 'توقيع رقمي', 'QR Code', 'XML Schema', 'UUID معرف فريد'].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="text-sm">{item}</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Server className="w-4 h-4" />معلومات الاتصال</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span>البيئة:</span><Badge>{sandboxMode ? 'تجريبية' : 'إنتاجية'}</Badge></div>
                <div className="flex justify-between text-sm"><span>آخر اتصال:</span><span>منذ 5 دقائق</span></div>
                <div className="flex justify-between text-sm"><span>حالة الخادم:</span><Badge variant="default">متصل</Badge></div>
                <div className="flex justify-between text-sm"><span>الشهادة:</span><span>صالحة حتى 2025-06-15</span></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">إعدادات ZATCA</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><Label>الإرسال التلقائي</Label><p className="text-xs text-muted-foreground">إرسال الفواتير تلقائياً عند الإنشاء</p></div>
                <Switch checked={autoSubmit} onCheckedChange={setAutoSubmit} />
              </div>
              <div className="flex items-center justify-between">
                <div><Label>وضع الاختبار (Sandbox)</Label><p className="text-xs text-muted-foreground">استخدام بيئة ZATCA التجريبية</p></div>
                <Switch checked={sandboxMode} onCheckedChange={setSandboxMode} />
              </div>
              <div className="space-y-2">
                <Label>نوع الفاتورة الافتراضي</Label>
                <Select defaultValue="standard">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">فاتورة ضريبية</SelectItem>
                    <SelectItem value="simplified">فاتورة ضريبية مبسطة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>OTP Code</Label>
                <Input placeholder="أدخل رمز OTP من ZATCA" />
              </div>
              <Button onClick={() => toast.success('تم حفظ الإعدادات')}>حفظ الإعدادات</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
