import { useState, useMemo } from 'react';
import { useSales } from '@/hooks/useDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Users, TrendingUp, Calendar, Printer, FileSpreadsheet } from 'lucide-react';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { Button } from '@/components/ui/button';
import { usePrintReport } from '@/hooks/usePrintReport';
import { useExcelExport } from '@/hooks/useExcelExport';

export function CommissionsReport() {
  const { data: sales, isLoading } = useSales();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { printReport } = usePrintReport();
  const { exportToExcel } = useExcelExport();

  const filteredSales = useMemo(() => {
    if (!sales) return [];
    
    return sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      if (startDate && saleDate < new Date(startDate)) return false;
      if (endDate && saleDate > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });
  }, [sales, startDate, endDate]);

  // Group commissions by seller
  const sellerStats = useMemo(() => {
    if (!filteredSales) return [];

    const sellersMap: Record<string, {
      name: string;
      salesCount: number;
      totalCommissions: number;
      totalSalesAmount: number;
      totalProfit: number;
      sales: typeof filteredSales;
    }> = {};

    filteredSales.forEach(sale => {
      const sellerName = sale.seller_name || 'غير محدد';
      
      if (!sellersMap[sellerName]) {
        sellersMap[sellerName] = {
          name: sellerName,
          salesCount: 0,
          totalCommissions: 0,
          totalSalesAmount: 0,
          totalProfit: 0,
          sales: []
        };
      }
      
      sellersMap[sellerName].salesCount += 1;
      sellersMap[sellerName].totalCommissions += Number(sale.commission || 0);
      sellersMap[sellerName].totalSalesAmount += Number(sale.sale_price);
      sellersMap[sellerName].totalProfit += Number(sale.profit);
      sellersMap[sellerName].sales.push(sale);
    });

    return Object.values(sellersMap).sort((a, b) => b.totalCommissions - a.totalCommissions);
  }, [filteredSales]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalCommissions = sellerStats.reduce((sum, s) => sum + s.totalCommissions, 0);
  const totalSellers = sellerStats.filter(s => s.name !== 'غير محدد').length;
  const totalSalesCount = sellerStats.reduce((sum, s) => sum + s.salesCount, 0);
  const averageCommission = totalSalesCount > 0 ? totalCommissions / totalSalesCount : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencySimple = (value: number) => new Intl.NumberFormat('ar-SA').format(value);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const handlePrint = () => {
    printReport({
      title: 'تقرير العمولات',
      subtitle: 'تفاصيل عمولات البائعين',
      columns: [
        { header: 'البائع', key: 'seller' },
        { header: 'عدد المبيعات', key: 'sales_count' },
        { header: 'إجمالي المبيعات', key: 'total_sales' },
        { header: 'إجمالي العمولات', key: 'total_commissions' },
        { header: 'متوسط العمولة', key: 'avg_commission' },
        { header: 'إجمالي الأرباح', key: 'total_profit' },
      ],
      data: sellerStats.map(seller => ({
        seller: seller.name,
        sales_count: seller.salesCount,
        total_sales: `${formatCurrencySimple(seller.totalSalesAmount)} ريال`,
        total_commissions: `${formatCurrencySimple(seller.totalCommissions)} ريال`,
        avg_commission: `${formatCurrencySimple(seller.salesCount > 0 ? seller.totalCommissions / seller.salesCount : 0)} ريال`,
        total_profit: `${formatCurrencySimple(seller.totalProfit)} ريال`,
      })),
      summaryCards: [
        { label: 'إجمالي العمولات', value: `${formatCurrencySimple(totalCommissions)} ريال` },
        { label: 'عدد البائعين', value: String(totalSellers) },
        { label: 'عدد المبيعات', value: String(totalSalesCount) },
        { label: 'متوسط العمولة', value: `${formatCurrencySimple(averageCommission)} ريال` },
      ],
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: 'تقرير العمولات',
      columns: [
        { header: 'البائع', key: 'seller' },
        { header: 'عدد المبيعات', key: 'sales_count' },
        { header: 'إجمالي المبيعات', key: 'total_sales' },
        { header: 'إجمالي العمولات', key: 'total_commissions' },
        { header: 'متوسط العمولة', key: 'avg_commission' },
        { header: 'إجمالي الأرباح', key: 'total_profit' },
      ],
      data: sellerStats.map(seller => ({
        seller: seller.name,
        sales_count: seller.salesCount,
        total_sales: seller.totalSalesAmount,
        total_commissions: seller.totalCommissions,
        avg_commission: seller.salesCount > 0 ? seller.totalCommissions / seller.salesCount : 0,
        total_profit: seller.totalProfit,
      })),
      summaryData: [
        { label: 'إجمالي العمولات', value: totalCommissions },
        { label: 'عدد البائعين', value: totalSellers },
        { label: 'عدد المبيعات', value: totalSalesCount },
        { label: 'متوسط العمولة', value: averageCommission },
      ],
      fileName: `تقرير_العمولات_${new Date().toLocaleDateString('ar-SA')}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">تقرير العمولات</h2>
          <p className="text-muted-foreground">تفاصيل عمولات البائعين</p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            طباعة
          </Button>
          <Button onClick={handleExportExcel} className="gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">عدد البائعين</p>
                <p className="text-2xl font-bold text-foreground">{totalSellers}</p>
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
                <p className="text-sm text-muted-foreground">عدد المبيعات</p>
                <p className="text-2xl font-bold text-foreground">{totalSalesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">متوسط العمولة</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(averageCommission)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sellers Summary */}
      <Card>
        <CardHeader>
          <CardTitle>ملخص عمولات البائعين</CardTitle>
        </CardHeader>
        <CardContent>
          {sellerStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد مبيعات مسجلة في هذه الفترة
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">البائع</TableHead>
                  <TableHead className="text-right">عدد المبيعات</TableHead>
                  <TableHead className="text-right">إجمالي المبيعات</TableHead>
                  <TableHead className="text-right">إجمالي العمولات</TableHead>
                  <TableHead className="text-right">متوسط العمولة</TableHead>
                  <TableHead className="text-right">إجمالي الأرباح</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellerStats.map((seller, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{seller.name}</TableCell>
                    <TableCell>{seller.salesCount}</TableCell>
                    <TableCell>{formatCurrency(seller.totalSalesAmount)}</TableCell>
                    <TableCell className="text-yellow-600 font-medium">{formatCurrency(seller.totalCommissions)}</TableCell>
                    <TableCell>{formatCurrency(seller.salesCount > 0 ? seller.totalCommissions / seller.salesCount : 0)}</TableCell>
                    <TableCell className="text-green-600 font-medium">{formatCurrency(seller.totalProfit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detailed Sales with Commissions */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل المبيعات والعمولات</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد مبيعات مسجلة في هذه الفترة
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم البيع</TableHead>
                  <TableHead className="text-right">البائع</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">السيارة</TableHead>
                  <TableHead className="text-right">سعر البيع</TableHead>
                  <TableHead className="text-right">العمولة</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.sale_number}</TableCell>
                    <TableCell>{sale.seller_name || 'غير محدد'}</TableCell>
                    <TableCell>{sale.customer?.name || '-'}</TableCell>
                    <TableCell>{sale.car?.name || '-'}</TableCell>
                    <TableCell>{formatCurrency(Number(sale.sale_price))}</TableCell>
                    <TableCell className="text-yellow-600 font-medium">{formatCurrency(Number(sale.commission || 0))}</TableCell>
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
