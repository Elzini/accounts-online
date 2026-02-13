import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, CheckCircle, XCircle, FileText, Send, RefreshCw, Shield } from 'lucide-react';
import { toast } from 'sonner';

export function ZatcaSandboxPage() {
  const [invoiceXml, setInvoiceXml] = useState('');
  const logs = [
    { id: '1', type: 'clearance', invoiceNo: 'INV-001', date: '2024-01-18 14:30', status: 'success', message: 'تم التصديق بنجاح' },
    { id: '2', type: 'reporting', invoiceNo: 'INV-002', date: '2024-01-18 15:00', status: 'success', message: 'تم الإبلاغ بنجاح' },
    { id: '3', type: 'clearance', invoiceNo: 'INV-003', date: '2024-01-18 15:30', status: 'error', message: 'خطأ في التوقيع الرقمي - Invalid signature' },
    { id: '4', type: 'compliance', invoiceNo: 'CSR-001', date: '2024-01-18 10:00', status: 'success', message: 'تم الحصول على Compliance CSID' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">بيئة محاكاة ZATCA</h1>
          <p className="text-muted-foreground">اختبار الفوترة الإلكترونية في بيئة Sandbox قبل الإنتاج</p>
        </div>
        <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600"><Shield className="w-3 h-3" />وضع المحاكاة</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Send className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{logs.length}</div><p className="text-sm text-muted-foreground">إجمالي الاختبارات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{logs.filter(l => l.status === 'success').length}</div><p className="text-sm text-muted-foreground">ناجحة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><XCircle className="w-8 h-8 mx-auto mb-2 text-destructive" /><div className="text-2xl font-bold">{logs.filter(l => l.status === 'error').length}</div><p className="text-sm text-muted-foreground">فاشلة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-green-600">{((logs.filter(l => l.status === 'success').length / logs.length) * 100).toFixed(0)}%</div><p className="text-sm text-muted-foreground">نسبة النجاح</p></CardContent></Card>
      </div>

      <Tabs defaultValue="test">
        <TabsList>
          <TabsTrigger value="test" className="gap-1"><Play className="w-3 h-3" />اختبار جديد</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1"><FileText className="w-3 h-3" />سجل الاختبارات</TabsTrigger>
        </TabsList>
        <TabsContent value="test" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">إرسال فاتورة تجريبية</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>نوع العملية</Label>
                  <Select defaultValue="clearance">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clearance">تصديق (Clearance)</SelectItem>
                      <SelectItem value="reporting">إبلاغ (Reporting)</SelectItem>
                      <SelectItem value="compliance">Compliance CSID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>رقم الفاتورة</Label><Input placeholder="INV-XXX" /></div>
              </div>
              <div><Label>XML الفاتورة (اختياري)</Label><Textarea placeholder="الصق محتوى XML للفاتورة هنا أو اتركه فارغاً لاستخدام نموذج تجريبي..." value={invoiceXml} onChange={e => setInvoiceXml(e.target.value)} rows={6} className="font-mono text-xs" /></div>
              <div className="flex gap-2">
                <Button className="gap-2" onClick={() => toast.success('تم إرسال الفاتورة التجريبية - انتظر النتيجة')}><Send className="w-4 h-4" />إرسال للاختبار</Button>
                <Button variant="outline" className="gap-2" onClick={() => toast.info('تم تحميل نموذج XML تجريبي')}><RefreshCw className="w-4 h-4" />نموذج تجريبي</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader><TableRow><TableHead>النوع</TableHead><TableHead>رقم الفاتورة</TableHead><TableHead>التاريخ</TableHead><TableHead>الحالة</TableHead><TableHead>الرسالة</TableHead></TableRow></TableHeader>
                <TableBody>
                  {logs.map(l => (
                    <TableRow key={l.id}>
                      <TableCell><Badge variant="outline">{l.type}</Badge></TableCell>
                      <TableCell className="font-mono">{l.invoiceNo}</TableCell>
                      <TableCell>{l.date}</TableCell>
                      <TableCell><Badge variant={l.status === 'success' ? 'default' : 'destructive'}>{l.status === 'success' ? 'ناجح' : 'فاشل'}</Badge></TableCell>
                      <TableCell className="text-sm">{l.message}</TableCell>
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
