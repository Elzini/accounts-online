import { useState, useMemo } from 'react';
import { useCustomers, useSales } from '@/hooks/useDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, ShoppingCart, DollarSign, Calendar, Printer, FileSpreadsheet } from 'lucide-react';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePrintReport } from '@/hooks/usePrintReport';
import { useExcelExport } from '@/hooks/useExcelExport';

export function CustomersReport() {
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: sales, isLoading: salesLoading } = useSales();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const { printReport } = usePrintReport();
  const { exportToExcel } = useExcelExport();

  // Filter sales by date and customer
  const filteredSales = useMemo(() => {
    if (!sales) return [];
    
    return sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      if (startDate && saleDate < new Date(startDate)) return false;
      if (endDate && saleDate > new Date(endDate + 'T23:59:59')) return false;
      if (selectedCustomer !== 'all' && sale.customer_id !== selectedCustomer) return false;
      return true;
    });
  }, [sales, startDate, endDate, selectedCustomer]);

  // Calculate stats per customer
  const customerStats = useMemo(() => {
    if (!customers || !sales) return [];

    const relevantSales = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      if (startDate && saleDate < new Date(startDate)) return false;
      if (endDate && saleDate > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });

    return customers.map(customer => {
      const customerSales = relevantSales.filter(sale => sale.customer_id === customer.id);
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
    }).filter(c => selectedCustomer === 'all' || c.id === selectedCustomer);
  }, [customers, sales, startDate, endDate, selectedCustomer]);

  if (customersLoading || salesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedCustomerData = selectedCustomer !== 'all' ? customerStats[0] : null;
  const totalCustomers = selectedCustomer === 'all' ? customerStats.length : 1;
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

  const reportTitle = selectedCustomer === 'all' 
    ? 'تقرير العملاء - إجمالي' 
    : `تقرير العميل: ${selectedCustomerData?.name}`;

  const handlePrint = () => {
    printReport({
      title: reportTitle,
      subtitle: 'إحصائيات وتفاصيل العملاء',
      columns: selectedCustomer === 'all' ? [
        { header: 'الاسم', key: 'name' },
        { header: 'رقم الهاتف', key: 'phone' },
        { header: 'عدد المشتريات', key: 'sales_count' },
        { header: 'إجمالي المشتريات', key: 'total_purchases' },
        { header: 'إجمالي الأرباح', key: 'total_profit' },
        { header: 'آخر شراء', key: 'last_purchase' },
      ] : [
        { header: 'رقم البيع', key: 'sale_number' },
        { header: 'السيارة', key: 'car' },
        { header: 'سعر البيع', key: 'sale_price' },
        { header: 'الربح', key: 'profit' },
        { header: 'التاريخ', key: 'date' },
      ],
      data: selectedCustomer === 'all'
        ? customerStats.map(customer => ({
            name: customer.name,
            phone: customer.phone,
            sales_count: customer.salesCount,
            total_purchases: `${formatCurrencySimple(customer.totalPurchases)} ريال`,
            total_profit: `${formatCurrencySimple(customer.totalProfit)} ريال`,
            last_purchase: customer.lastPurchaseDate ? formatDate(customer.lastPurchaseDate) : '-',
          }))
        : filteredSales.map(sale => ({
            sale_number: sale.sale_number,
            car: sale.car?.name || '-',
            sale_price: `${formatCurrencySimple(Number(sale.sale_price))} ريال`,
            profit: `${formatCurrencySimple(Number(sale.profit))} ريال`,
            date: formatDate(sale.sale_date),
          })),
      summaryCards: [
        { label: selectedCustomer === 'all' ? 'إجمالي العملاء' : 'العميل', value: selectedCustomer === 'all' ? String(totalCustomers) : selectedCustomerData?.name || '' },
        { label: 'عدد المشتريات', value: String(totalSalesCount) },
        { label: 'إجمالي المشتريات', value: `${formatCurrencySimple(totalSalesAmount)} ريال` },
        { label: 'إجمالي الأرباح', value: `${formatCurrencySimple(customerStats.reduce((sum, c) => sum + c.totalProfit, 0))} ريال` },
      ],
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: reportTitle,
      columns: selectedCustomer === 'all' ? [
        { header: 'الاسم', key: 'name' },
        { header: 'رقم الهوية', key: 'id_number' },
        { header: 'رقم السجل', key: 'registration_number' },
        { header: 'رقم الهاتف', key: 'phone' },
        { header: 'العنوان', key: 'address' },
        { header: 'عدد المشتريات', key: 'sales_count' },
        { header: 'إجمالي المشتريات', key: 'total_purchases' },
        { header: 'إجمالي الأرباح', key: 'total_profit' },
      ] : [
        { header: 'رقم البيع', key: 'sale_number' },
        { header: 'السيارة', key: 'car' },
        { header: 'سعر البيع', key: 'sale_price' },
        { header: 'الربح', key: 'profit' },
        { header: 'التاريخ', key: 'date' },
      ],
      data: selectedCustomer === 'all'
        ? customerStats.map(customer => ({
            name: customer.name,
            id_number: customer.id_number || '-',
            registration_number: customer.registration_number || '-',
            phone: customer.phone,
            address: customer.address || '-',
            sales_count: customer.salesCount,
            total_purchases: customer.totalPurchases,
            total_profit: customer.totalProfit,
          }))
        : filteredSales.map(sale => ({
            sale_number: sale.sale_number,
            car: sale.car?.name || '-',
            sale_price: Number(sale.sale_price),
            profit: Number(sale.profit),
            date: formatDate(sale.sale_date),
          })),
      summaryData: [
        { label: selectedCustomer === 'all' ? 'إجمالي العملاء' : 'العميل', value: selectedCustomer === 'all' ? totalCustomers : selectedCustomerData?.name || '' },
        { label: 'عدد المشتريات', value: totalSalesCount },
        { label: 'إجمالي المشتريات', value: totalSalesAmount },
      ],
      fileName: `تقرير_العملاء_${selectedCustomer === 'all' ? 'إجمالي' : selectedCustomerData?.name}_${new Date().toLocaleDateString('ar-SA')}`,
    });
  };

  // Sort customers by purchases
  const sortedCustomers = [...customerStats].sort((a, b) => b.totalPurchases - a.totalPurchases);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">تقرير العملاء</h2>
          <p className="text-muted-foreground">إحصائيات وتفاصيل العملاء</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="اختر العميل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع العملاء (إجمالي)</SelectItem>
              {customers?.map(customer => (
                <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                <p className="text-sm text-muted-foreground">{selectedCustomer === 'all' ? 'إجمالي العملاء' : 'العميل'}</p>
                <p className="text-2xl font-bold text-foreground">{selectedCustomer === 'all' ? totalCustomers : selectedCustomerData?.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">عدد المشتريات</p>
                <p className="text-2xl font-bold text-foreground">{totalSalesCount}</p>
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
                <p className="text-sm text-muted-foreground">إجمالي المشتريات</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalSalesAmount)}</p>
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
                <p className="text-sm text-muted-foreground">{selectedCustomer === 'all' ? 'العملاء النشطين' : 'آخر شراء'}</p>
                <p className="text-2xl font-bold text-foreground">
                  {selectedCustomer === 'all' 
                    ? activeCustomers 
                    : (selectedCustomerData?.lastPurchaseDate ? formatDate(selectedCustomerData.lastPurchaseDate) : '-')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Details - when specific customer selected */}
      {selectedCustomer !== 'all' && selectedCustomerData && (
        <Card>
          <CardHeader>
            <CardTitle>بيانات العميل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">الاسم</p>
                <p className="font-medium">{selectedCustomerData.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                <p className="font-medium">{selectedCustomerData.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">رقم الهوية</p>
                <p className="font-medium">{selectedCustomerData.id_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">العنوان</p>
                <p className="font-medium">{selectedCustomerData.address || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Customers - when all selected */}
      {selectedCustomer === 'all' && (
        <Card>
          <CardHeader>
            <CardTitle>جميع العملاء</CardTitle>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCustomers.map((customer) => (
                    <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedCustomer(customer.id)}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.salesCount}</TableCell>
                      <TableCell>{formatCurrency(customer.totalPurchases)}</TableCell>
                      <TableCell className="text-green-600 font-medium">{formatCurrency(customer.totalProfit)}</TableCell>
                      <TableCell>{customer.lastPurchaseDate ? formatDate(customer.lastPurchaseDate) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Customer Sales - when specific customer selected */}
      {selectedCustomer !== 'all' && (
        <Card>
          <CardHeader>
            <CardTitle>مشتريات العميل</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد مشتريات مسجلة لهذا العميل
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم البيع</TableHead>
                    <TableHead className="text-right">السيارة</TableHead>
                    <TableHead className="text-right">الموديل</TableHead>
                    <TableHead className="text-right">سعر البيع</TableHead>
                    <TableHead className="text-right">الربح</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.sale_number}</TableCell>
                      <TableCell>{sale.car?.name || '-'}</TableCell>
                      <TableCell>{sale.car?.model || '-'}</TableCell>
                      <TableCell>{formatCurrency(Number(sale.sale_price))}</TableCell>
                      <TableCell className="text-green-600 font-medium">{formatCurrency(Number(sale.profit))}</TableCell>
                      <TableCell>{formatDate(sale.sale_date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
