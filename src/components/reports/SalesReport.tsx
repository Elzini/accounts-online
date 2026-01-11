import { useSales } from '@/hooks/useDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, ShoppingCart, TrendingUp, Calendar } from 'lucide-react';

export function SalesReport() {
  const { data: sales, isLoading } = useSales();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const salesData = sales || [];
  
  const totalSales = salesData.reduce((sum, sale) => sum + Number(sale.sale_price), 0);
  const totalProfit = salesData.reduce((sum, sale) => sum + Number(sale.profit), 0);
  const totalCommissions = salesData.reduce((sum, sale) => sum + Number(sale.commission || 0), 0);
  const totalExpenses = salesData.reduce((sum, sale) => sum + Number(sale.other_expenses || 0), 0);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  // Group sales by month
  const salesByMonth: Record<string, { count: number; total: number; profit: number }> = {};
  salesData.forEach(sale => {
    const date = new Date(sale.sale_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!salesByMonth[monthKey]) {
      salesByMonth[monthKey] = { count: 0, total: 0, profit: 0 };
    }
    salesByMonth[monthKey].count += 1;
    salesByMonth[monthKey].total += Number(sale.sale_price);
    salesByMonth[monthKey].profit += Number(sale.profit);
  });

  const monthlyData = Object.entries(salesByMonth)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' }),
      ...data
    }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">تقرير المبيعات</h2>
        <p className="text-muted-foreground">إحصائيات وتفاصيل عمليات البيع</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalSales)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأرباح</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalProfit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي العمولات</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalCommissions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">عدد المبيعات</p>
                <p className="text-2xl font-bold text-foreground">{salesData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary */}
      {monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>ملخص المبيعات الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الشهر</TableHead>
                  <TableHead className="text-right">عدد المبيعات</TableHead>
                  <TableHead className="text-right">إجمالي المبيعات</TableHead>
                  <TableHead className="text-right">إجمالي الأرباح</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.month}</TableCell>
                    <TableCell>{row.count}</TableCell>
                    <TableCell>{formatCurrency(row.total)}</TableCell>
                    <TableCell className="text-green-600 font-medium">{formatCurrency(row.profit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* All Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>جميع المبيعات</CardTitle>
        </CardHeader>
        <CardContent>
          {salesData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد مبيعات مسجلة
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم البيع</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">السيارة</TableHead>
                  <TableHead className="text-right">سعر البيع</TableHead>
                  <TableHead className="text-right">العمولة</TableHead>
                  <TableHead className="text-right">المصاريف</TableHead>
                  <TableHead className="text-right">الربح</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.sale_number}</TableCell>
                    <TableCell>{sale.customer?.name || '-'}</TableCell>
                    <TableCell>{sale.car?.name || '-'}</TableCell>
                    <TableCell>{formatCurrency(Number(sale.sale_price))}</TableCell>
                    <TableCell>{formatCurrency(Number(sale.commission || 0))}</TableCell>
                    <TableCell>{formatCurrency(Number(sale.other_expenses || 0))}</TableCell>
                    <TableCell className="text-green-600 font-medium">{formatCurrency(Number(sale.profit))}</TableCell>
                    <TableCell>{formatDate(sale.sale_date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
