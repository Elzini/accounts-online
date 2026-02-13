import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone, QrCode, Barcode, Camera, Package, CheckCircle, Search, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function MobileInventoryPage() {
  const recentScans = [
    { barcode: '6281001234567', item: 'زيت محرك 5W-30', qty: 45, location: 'رف A1', time: '14:30' },
    { barcode: '6281001234568', item: 'فلتر هواء', qty: 120, location: 'رف B3', time: '14:25' },
    { barcode: '6281001234569', item: 'بطارية 70 أمبير', qty: 18, location: 'رف C1', time: '14:20' },
    { barcode: '6281001234570', item: 'إطار 205/55R16', qty: 32, location: 'رف D2', time: '14:15' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">جرد المخزون بالجوال</h1>
          <p className="text-muted-foreground">مسح الباركود والجرد باستخدام كاميرا الجوال</p>
        </div>
        <Badge variant="outline" className="gap-1"><Smartphone className="w-3 h-3" />متوافق مع الجوال</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Barcode className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{recentScans.length}</div><p className="text-sm text-muted-foreground">مسحوضات اليوم</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Package className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">215</div><p className="text-sm text-muted-foreground">أصناف تم جردها</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-blue-600" /><div className="text-2xl font-bold">98%</div><p className="text-sm text-muted-foreground">دقة المطابقة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Upload className="w-8 h-8 mx-auto mb-2 text-purple-600" /><div className="text-2xl font-bold">3</div><p className="text-sm text-muted-foreground">جلسات مرفوعة</p></CardContent></Card>
      </div>

      <Tabs defaultValue="scan">
        <TabsList>
          <TabsTrigger value="scan" className="gap-1"><Camera className="w-3 h-3" />المسح</TabsTrigger>
          <TabsTrigger value="history" className="gap-1"><Search className="w-3 h-3" />السجل</TabsTrigger>
        </TabsList>
        <TabsContent value="scan" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">مسح الباركود</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-12 text-center">
                <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-4">وجّه الكاميرا نحو الباركود</p>
                <Button className="gap-2" onClick={() => toast.info('يتطلب فتح التطبيق من الجوال')}><QrCode className="w-4 h-4" />فتح الماسح</Button>
              </div>
              <div className="flex gap-2">
                <Input placeholder="أو أدخل الباركود يدوياً..." className="flex-1" />
                <Button variant="outline">بحث</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-3">
              {recentScans.map((scan, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{scan.item}</p>
                    <p className="text-xs text-muted-foreground font-mono">{scan.barcode} • {scan.location}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold">{scan.qty}</p>
                    <p className="text-xs text-muted-foreground">{scan.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
