import { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Printer } from 'lucide-react';
import { useSales } from '@/hooks/useDatabase';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { usePrintReport } from '@/hooks/usePrintReport';

export function ProfitReport() {
  const { data: sales = [], isLoading } = useSales();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { printReport } = usePrintReport();

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      if (startDate && saleDate < new Date(startDate)) return false;
      if (endDate && saleDate > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });
  }, [sales, startDate, endDate]);

  const totalProfit = filteredSales.reduce((sum, sale) => sum + Number(sale.profit), 0);
  const totalSales = filteredSales.reduce((sum, sale) => sum + Number(sale.sale_price), 0);
  const totalCommissions = filteredSales.reduce((sum, sale) => sum + Number(sale.commission || 0), 0);
  const totalExpenses = filteredSales.reduce((sum, sale) => sum + Number(sale.other_expenses || 0), 0);
  const formatCurrency = (value: number) => new Intl.NumberFormat('ar-SA').format(value);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ar-SA');

  const handlePrint = () => {
    printReport({
      title: 'تقرير الأرباح',
      subtitle: 'تفاصيل الأرباح والمصاريف',
      columns: [
        { header: 'التاريخ', key: 'date' },
        { header: 'السيارة', key: 'car' },
        { header: 'سعر البيع', key: 'sale_price' },
        { header: 'العمولة', key: 'commission' },
        { header: 'المصاريف', key: 'expenses' },
        { header: 'الربح', key: 'profit' },
      ],
      data: filteredSales.map(sale => ({
        date: formatDate(sale.sale_date),
        car: sale.car?.name || '-',
        sale_price: `${formatCurrency(Number(sale.sale_price))} ريال`,
        commission: `${formatCurrency(Number(sale.commission || 0))} ريال`,
        expenses: `${formatCurrency(Number(sale.other_expenses || 0))} ريال`,
        profit: `${formatCurrency(Number(sale.profit))} ريال`,
      })),
      summaryCards: [
        { label: 'صافي الأرباح', value: `${formatCurrency(totalProfit)} ريال` },
        { label: 'إجمالي المبيعات', value: `${formatCurrency(totalSales)} ريال` },
        { label: 'إجمالي العمولات', value: `${formatCurrency(totalCommissions)} ريال` },
        { label: 'المصاريف الأخرى', value: `${formatCurrency(totalExpenses)} ريال` },
      ],
    });
  };

  if (isLoading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">تقرير الأرباح</h1>
          <p className="text-muted-foreground">تفاصيل الأرباح والمصاريف</p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            طباعة التقرير
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">صافي الأرباح</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(totalProfit)} ريال</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
              <p className="text-2xl font-bold">{formatCurrency(totalSales)} ريال</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-warning flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي العمولات</p>
              <p className="text-2xl font-bold">{formatCurrency(totalCommissions)} ريال</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المصاريف الأخرى</p>
              <p className="text-2xl font-bold">{formatCurrency(totalExpenses)} ريال</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-bold">تفاصيل الأرباح</h3>
        </div>
        {filteredSales.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد مبيعات في هذه الفترة
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-bold">التاريخ</TableHead>
                <TableHead className="text-right font-bold">السيارة</TableHead>
                <TableHead className="text-right font-bold">سعر البيع</TableHead>
                <TableHead className="text-right font-bold">العمولة</TableHead>
                <TableHead className="text-right font-bold">المصاريف</TableHead>
                <TableHead className="text-right font-bold">الربح</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{formatDate(sale.sale_date)}</TableCell>
                  <TableCell className="font-semibold">{sale.car?.name || '-'}</TableCell>
                  <TableCell>{formatCurrency(Number(sale.sale_price))} ريال</TableCell>
                  <TableCell>{formatCurrency(Number(sale.commission || 0))} ريال</TableCell>
                  <TableCell>{formatCurrency(Number(sale.other_expenses || 0))} ريال</TableCell>
                  <TableCell className="text-success font-bold">{formatCurrency(Number(sale.profit))} ريال</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
