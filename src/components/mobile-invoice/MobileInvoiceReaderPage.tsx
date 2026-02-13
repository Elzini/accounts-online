import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Camera, FileText, CheckCircle, QrCode, Upload, Eye } from 'lucide-react';
import { toast } from 'sonner';

export function MobileInvoiceReaderPage() {
  const scannedInvoices = [
    { id: '1', vendor: 'شركة الأمل للتجارة', amount: 8500, date: '2024-01-18', vatNumber: '300123456789003', status: 'verified', items: 5 },
    { id: '2', vendor: 'مؤسسة النجاح', amount: 2250, date: '2024-01-17', vatNumber: '300987654321003', status: 'verified', items: 3 },
    { id: '3', vendor: 'متجر البركة', amount: 450, date: '2024-01-16', vatNumber: '300111222333003', status: 'pending', items: 2 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">قراءة الفاتورة الإلكترونية</h1>
          <p className="text-muted-foreground">مسح وقراءة الفواتير الإلكترونية بكاميرا الجوال أو QR Code</p>
        </div>
        <Badge variant="outline" className="gap-1"><Smartphone className="w-3 h-3" />متوافق مع الجوال</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><FileText className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{scannedInvoices.length}</div><p className="text-sm text-muted-foreground">فواتير ممسوحة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{scannedInvoices.filter(i => i.status === 'verified').length}</div><p className="text-sm text-muted-foreground">تم التحقق</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{scannedInvoices.reduce((s, i) => s + i.amount, 0).toLocaleString()} ر.س</div><p className="text-sm text-muted-foreground">إجمالي المبالغ</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">مسح QR Code</CardTitle></CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center">
              <QrCode className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">امسح رمز QR الموجود على الفاتورة الإلكترونية</p>
              <Button className="gap-2" onClick={() => toast.info('يتطلب فتح التطبيق من الجوال')}><Camera className="w-4 h-4" />فتح الماسح</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">رفع صورة فاتورة</CardTitle></CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center">
              <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">ارفع صورة الفاتورة لقراءتها تلقائياً عبر OCR</p>
              <Button variant="outline" className="gap-2" onClick={() => toast.info('رفع صورة الفاتورة')}><Upload className="w-4 h-4" />اختر صورة</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">الفواتير الممسوحة</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {scannedInvoices.map(inv => (
            <div key={inv.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">{inv.vendor}</p>
                <p className="text-xs text-muted-foreground">الرقم الضريبي: {inv.vatNumber} • {inv.items} أصناف</p>
                <p className="text-xs text-muted-foreground">{inv.date}</p>
              </div>
              <div className="text-left flex items-center gap-3">
                <div>
                  <p className="font-bold">{inv.amount.toLocaleString()} ر.س</p>
                  <Badge variant={inv.status === 'verified' ? 'default' : 'secondary'} className="text-xs">{inv.status === 'verified' ? 'تم التحقق' : 'قيد المراجعة'}</Badge>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8"><Eye className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
