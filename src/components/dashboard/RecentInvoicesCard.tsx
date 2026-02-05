import { FileText, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSales } from '@/hooks/useDatabase';
import { ActivePage } from '@/types';

interface RecentInvoicesCardProps {
  setActivePage: (page: ActivePage) => void;
}

export function RecentInvoicesCard({ setActivePage }: RecentInvoicesCardProps) {
  const { data: sales = [] } = useSales();

  // Get the 5 most recent sales
  const recentSales = sales
    .sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime())
    .slice(0, 5);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = () => {
    // Sales are always completed when saved
    return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100">مكتمل</Badge>;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg">أحدث الفواتير</CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">فواتير اليوم</p>
          </div>
        </div>
        <Button
          variant="link"
          size="sm"
          onClick={() => setActivePage('sales')}
          className="text-primary gap-1"
        >
          عرض الكل
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {recentSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mb-3 opacity-50" />
            <p>لا توجد فواتير في هذه الفترة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-semibold">رقم الفاتورة</TableHead>
                  <TableHead className="text-right font-semibold">العميل</TableHead>
                  <TableHead className="text-right font-semibold">التاريخ</TableHead>
                  <TableHead className="text-right font-semibold">الإجمالي</TableHead>
                  <TableHead className="text-right font-semibold">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setActivePage('sales')}>
                    <TableCell className="font-medium">#{sale.id.slice(0, 6)}</TableCell>
                    <TableCell>{sale.customer?.name || 'عميل غير محدد'}</TableCell>
                    <TableCell>{formatDate(sale.sale_date)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(Number(sale.sale_price))}</TableCell>
                    <TableCell>{getStatusBadge()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
