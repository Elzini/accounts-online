import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Globe, Link2, CheckCircle, Settings, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export function PaymentGatewayPage() {
  const gateways = [
    { id: '1', name: 'مدى', provider: 'PayTabs', status: 'active', transactions: 145, volume: 125000 },
    { id: '2', name: 'Apple Pay', provider: 'Moyasar', status: 'active', transactions: 68, volume: 52000 },
    { id: '3', name: 'Visa/Mastercard', provider: 'Tap', status: 'active', transactions: 230, volume: 310000 },
    { id: '4', name: 'STC Pay', provider: 'STC', status: 'inactive', transactions: 0, volume: 0 },
  ];

  const recentPayments = [
    { id: '1', reference: 'PAY-001', customer: 'أحمد محمد', amount: 1500, method: 'مدى', date: '2024-01-18 14:30', status: 'success' },
    { id: '2', reference: 'PAY-002', customer: 'سارة الخالد', amount: 3200, method: 'Apple Pay', date: '2024-01-18 15:12', status: 'success' },
    { id: '3', reference: 'PAY-003', customer: 'خالد سعد', amount: 850, method: 'Visa', date: '2024-01-18 16:45', status: 'failed' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">بوابة الدفع الإلكتروني</h1>
          <p className="text-muted-foreground">تحصيل المدفوعات أونلاين وإدارة وسائل الدفع</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('إنشاء رابط دفع')}><Link2 className="w-4 h-4" />رابط دفع جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {gateways.filter(g => g.status === 'active').map(g => (
          <Card key={g.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{g.name}</span>
                <Badge variant="default" className="text-xs">نشط</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{g.provider}</p>
              <p className="text-lg font-bold mt-2">{g.volume.toLocaleString()} ر.س</p>
              <p className="text-xs text-muted-foreground">{g.transactions} عملية</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">آخر المدفوعات</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>المرجع</TableHead><TableHead>العميل</TableHead><TableHead>المبلغ</TableHead><TableHead>الوسيلة</TableHead><TableHead>التاريخ</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
            <TableBody>
              {recentPayments.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono">{p.reference}</TableCell>
                  <TableCell>{p.customer}</TableCell>
                  <TableCell>{p.amount.toLocaleString()} ر.س</TableCell>
                  <TableCell>{p.method}</TableCell>
                  <TableCell>{p.date}</TableCell>
                  <TableCell><Badge variant={p.status === 'success' ? 'default' : 'destructive'}>{p.status === 'success' ? 'ناجح' : 'فاشل'}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
