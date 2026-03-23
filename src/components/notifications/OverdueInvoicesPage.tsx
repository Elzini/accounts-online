import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Bell, Loader2, AlertTriangle, Mail, Clock, DollarSign, RefreshCw } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { invokeOverdueNotify } from '@/services/overdueInvoices';

interface OverdueItem {
  type: string;
  number: string;
  customer: string;
  amount: number;
  date: string;
  daysOverdue: number;
}

export function OverdueInvoicesPage() {
  const { companyId } = useCompany();
  const [daysOverdue, setDaysOverdue] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [overdueItems, setOverdueItems] = useState<OverdueItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const checkOverdue = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const data = await invokeOverdueNotify(daysOverdue);

      setOverdueItems(data.items || []);
      setTotalAmount(data.totalAmount || 0);

      if (data.totalOverdue > 0) {
        toast.warning(`يوجد ${data.totalOverdue} فاتورة متأخرة بإجمالي ${data.totalAmount.toLocaleString()} ر.س`);
      } else {
        toast.success('لا توجد فواتير متأخرة 🎉');
      }
    } catch (error: any) {
      toast.error(`خطأ: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount);

  const getSeverityColor = (days: number) => {
    if (days > 90) return 'destructive';
    if (days > 60) return 'default';
    return 'secondary';
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6" />
          إشعارات الفواتير المتأخرة
        </h1>
        <p className="text-muted-foreground">متابعة الفواتير الآجلة المتأخرة عن السداد وإرسال تنبيهات</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="grid gap-2">
              <Label>عدد أيام التأخر (الحد الأدنى)</Label>
              <Input
                type="number"
                value={daysOverdue}
                onChange={e => setDaysOverdue(parseInt(e.target.value) || 30)}
                className="w-32"
                min={1}
              />
            </div>
            <Button onClick={checkOverdue} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <RefreshCw className="w-4 h-4 ml-2" />}
              فحص الفواتير المتأخرة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {overdueItems.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">عدد الفواتير المتأخرة</p>
                    <p className="text-2xl font-bold text-amber-600">{overdueItems.length}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-rose-50 dark:bg-rose-950/30 border-rose-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي المبالغ المتأخرة</p>
                    <p className="text-2xl font-bold text-rose-600">{formatCurrency(totalAmount)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-rose-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">متوسط أيام التأخر</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round(overdueItems.reduce((s, i) => s + i.daysOverdue, 0) / overdueItems.length)} يوم
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">تفاصيل الفواتير المتأخرة</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">#</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">رقم الفاتورة</TableHead>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right">تاريخ الفاتورة</TableHead>
                    <TableHead className="text-right">أيام التأخر</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueItems.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.type === 'sale' ? 'بيع' : 'فاتورة'}</Badge>
                      </TableCell>
                      <TableCell className="font-mono">{item.number || '-'}</TableCell>
                      <TableCell className="font-medium">{item.customer}</TableCell>
                      <TableCell className="font-mono text-rose-600">{formatCurrency(item.amount)}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>
                        <Badge variant={getSeverityColor(item.daysOverdue)}>
                          {item.daysOverdue} يوم
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="text-xs">متأخرة</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
