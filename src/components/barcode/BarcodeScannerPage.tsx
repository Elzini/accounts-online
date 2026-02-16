import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScanBarcode, Package, Search, CheckCircle, ArrowRightLeft, Truck, History } from 'lucide-react';
import { toast } from 'sonner';

export function BarcodeScannerPage() {
  const [scannedCode, setScannedCode] = useState('');
  
  const recentScans = [
    { id: 1, barcode: '6281001234567', product: 'زيت محرك 5W-30', action: 'استلام', qty: 10, date: '2024-01-18 14:30', user: 'أحمد' },
    { id: 2, barcode: '6281001234568', product: 'فلتر هواء', action: 'صرف', qty: 5, date: '2024-01-18 14:25', user: 'سعد' },
    { id: 3, barcode: '6281001234569', product: 'بطارية 70 أمبير', action: 'جرد', qty: 18, date: '2024-01-18 14:20', user: 'أحمد' },
    { id: 4, barcode: '6281001234570', product: 'إطار 205/55R16', action: 'نقل', qty: 4, date: '2024-01-18 14:15', user: 'خالد' },
  ];

  const handleScan = () => {
    if (scannedCode) {
      toast.success(`تم مسح الباركود: ${scannedCode}`);
      setScannedCode('');
    }
  };

  const operations = [
    { name: 'استلام بضائع', icon: Truck, color: 'text-green-500', desc: 'مسح المنتجات عند الاستلام' },
    { name: 'صرف من المستودع', icon: Package, color: 'text-blue-500', desc: 'مسح المنتجات عند الصرف' },
    { name: 'نقل بين مستودعات', icon: ArrowRightLeft, color: 'text-purple-500', desc: 'نقل منتجات بين المواقع' },
    { name: 'جرد المخزون', icon: Search, color: 'text-orange-500', desc: 'جرد وتحديث الكميات' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center">
            <ScanBarcode className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">ماسح الباركود</h1>
            <p className="text-sm text-muted-foreground">عمليات المستودع بالباركود</p>
          </div>
        </div>
      </div>

      {/* Scanner */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 items-center max-w-lg mx-auto">
            <ScanBarcode className="w-6 h-6 text-muted-foreground" />
            <Input placeholder="امسح أو أدخل الباركود..." value={scannedCode} onChange={e => setScannedCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan()} className="text-center text-lg font-mono" autoFocus />
            <Button onClick={handleScan}>بحث</Button>
          </div>
        </CardContent>
      </Card>

      {/* Operations */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {operations.map(op => (
          <Card key={op.name} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-4 text-center">
              <op.icon className={`w-8 h-8 mx-auto ${op.color} mb-2`} />
              <p className="font-medium text-sm">{op.name}</p>
              <p className="text-xs text-muted-foreground">{op.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Scans */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4" />
            <h3 className="font-bold">آخر عمليات المسح</h3>
          </div>
          <Table>
            <TableHeader><TableRow>
              <TableHead>الباركود</TableHead><TableHead>المنتج</TableHead><TableHead>العملية</TableHead>
              <TableHead>الكمية</TableHead><TableHead>التاريخ</TableHead><TableHead>المستخدم</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {recentScans.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.barcode}</TableCell>
                  <TableCell className="font-medium">{s.product}</TableCell>
                  <TableCell><Badge variant="outline">{s.action}</Badge></TableCell>
                  <TableCell>{s.qty}</TableCell>
                  <TableCell>{s.date}</TableCell>
                  <TableCell>{s.user}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
