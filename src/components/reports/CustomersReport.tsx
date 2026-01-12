import { useState, useMemo } from 'react';
import { useCustomers, useSales } from '@/hooks/useDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, ShoppingCart, DollarSign, Calendar, Printer, FileSpreadsheet } from 'lucide-react';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { Button } from '@/components/ui/button';
import { usePrintReport } from '@/hooks/usePrintReport';
import { useExcelExport } from '@/hooks/useExcelExport';

export function CustomersReport() {
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: sales, isLoading: salesLoading } = useSales();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { printReport } = usePrintReport();
  const { exportToExcel } = useExcelExport();

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    
    return customers.filter(customer => {
      const createdAt = new Date(customer.created_at);
      if (startDate && createdAt < new Date(startDate)) return false;
      if (endDate && createdAt > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });
  }, [customers, startDate, endDate]);

  // Calculate sales per customer
  const customerStats = useMemo(() => {
    if (!filteredCustomers || !sales) return [];

    return filteredCustomers.map(customer => {
      const customerSales = sales.filter(sale => sale.customer_id === customer.id);
      const totalPurchases = customerSales.reduce((sum, sale) => sum + Number(sale.sale_price), 0);
      const totalProfit = customerSales.reduce((sum, sale) => sum + Number(sale.profit), 0);
      
      return {
        ...customer,
        salesCount: customerSales.length,
        totalPurchases,
        totalProfit,
        lastPurchaseDate: customerSales.length > 0 
          ? customerSales.sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime())[0].sale_date
          : null
      };
    });
  }, [filteredCustomers, sales]);

  if (customersLoading || salesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalCustomers = customerStats.length;
  const activeCustomers = customerStats.filter(c => c.salesCount > 0).length;
  const totalSalesAmount = customerStats.reduce((sum, c) => sum + c.totalPurchases, 0);
  const totalSalesCount = customerStats.reduce((sum, c) => sum + c.salesCount, 0);

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
      title: 'تقرير العملاء',
      subtitle: 'إحصائيات وتفاصيل العملاء',
      columns: [
        { header: 'الاسم', key: 'name' },
        { header: 'رقم الهوية', key: 'id_number' },
        { header: 'رقم الهاتف', key: 'phone' },
        { header: 'العنوان', key: 'address' },
        { header: 'عدد المشتريات', key: 'sales_count' },
        { header: 'إجمالي المشتريات', key: 'total_purchases' },
        { header: 'تاريخ التسجيل', key: 'created_at' },
      ],
      data: customerStats.map(customer => ({
        name: customer.name,
        id_number: customer.id_number || '-',
        phone: customer.phone,
        address: customer.address || '-',
        sales_count: customer.salesCount,
        total_purchases: `${formatCurrencySimple(customer.totalPurchases)} ريال`,
        created_at: formatDate(customer.created_at),
      })),
      summaryCards: [
        { label: 'إجمالي العملاء', value: String(totalCustomers) },
        { label: 'العملاء النشطين', value: String(activeCustomers) },
        { label: 'إجمالي المبيعات', value: `${formatCurrencySimple(totalSalesAmount)} ريال` },
        { label: 'عدد العمليات', value: String(totalSalesCount) },
      ],
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: 'تقرير العملاء',
      columns: [
        { header: 'الاسم', key: 'name' },
        { header: 'رقم الهوية', key: 'id_number' },
        { header: 'رقم السجل', key: 'registration_number' },
        { header: 'رقم الهاتف', key: 'phone' },
        { header: 'العنوان', key: 'address' },
        { header: 'عدد المشتريات', key: 'sales_count' },
        { header: 'إجمالي المشتريات', key: 'total_purchases' },
        { header: 'إجمالي الأرباح', key: 'total_profit' },
        { header: 'تاريخ التسجيل', key: 'created_at' },
      ],
      data: customerStats.map(customer => ({
        name: customer.name,
        id_number: customer.id_number || '-',
        registration_number: customer.registration_number || '-',
        phone: customer.phone,
        address: customer.address || '-',
        sales_count: customer.salesCount,
        total_purchases: customer.totalPurchases,
        total_profit: customer.totalProfit,
        created_at: formatDate(customer.created_at),
      })),
      summaryData: [
        { label: 'إجمالي العملاء', value: totalCustomers },
        { label: 'العملاء النشطين', value: activeCustomers },
        { label: 'إجمالي المبيعات', value: totalSalesAmount },
        { label: 'عدد العمليات', value: totalSalesCount },
      ],
      fileName: `تقرير_العملاء_${new Date().toLocaleDateString('ar-SA')}`,
    });
  };

  // Sort customers by sales count (top customers first)
  const sortedCustomers = [...customerStats].sort((a, b) => b.totalPurchases - a.totalPurchases);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">تقرير العملاء</h2>
          <p className="text-muted-foreground">إحصائيات وتفاصيل العملاء</p>
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
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي العملاء</p>
                <p className="text-2xl font-bold text-foreground">{totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">العملاء النشطين</p>
                <p className="text-2xl font-bold text-foreground">{activeCustomers}</p>
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
                <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalSalesAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">عدد عمليات البيع</p>
                <p className="text-2xl font-bold text-foreground">{totalSalesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>أفضل العملاء</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا يوجد عملاء مسجلين
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">رقم الهاتف</TableHead>
                  <TableHead className="text-right">عدد المشتريات</TableHead>
                  <TableHead className="text-right">إجمالي المشتريات</TableHead>
                  <TableHead className="text-right">إجمالي الأرباح</TableHead>
                  <TableHead className="text-right">آخر شراء</TableHead>
                  <TableHead className="text-right">تاريخ التسجيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.salesCount}</TableCell>
                    <TableCell>{formatCurrency(customer.totalPurchases)}</TableCell>
                    <TableCell className="text-green-600 font-medium">{formatCurrency(customer.totalProfit)}</TableCell>
                    <TableCell>{customer.lastPurchaseDate ? formatDate(customer.lastPurchaseDate) : '-'}</TableCell>
                    <TableCell>{formatDate(customer.created_at)}</TableCell>
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
