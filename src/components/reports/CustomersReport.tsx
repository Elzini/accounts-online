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
import { useLanguage } from '@/contexts/LanguageContext';
import { useNumberFormat } from '@/hooks/useNumberFormat';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIndustryFeatures } from '@/hooks/useIndustryFeatures';

export function CustomersReport() {
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: sales, isLoading: salesLoading } = useSales();
  const { companyId, company } = useCompany();
  const isCarDealership = useIndustryFeatures().hasCarInventory;
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const { printReport } = usePrintReport();
  const { exportToExcel } = useExcelExport();
  const { t, language } = useLanguage();
  const locale = language === 'ar' ? 'ar-SA' : 'en-US';

  // Fetch invoices for non-car companies
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['company-invoices-customers-report', companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('invoices')
        .select('*')
        .eq('company_id', companyId!)
        .eq('invoice_type', 'sales')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId && !isCarDealership,
  });

  // Unify sales data
  const unifiedSales = useMemo(() => {
    if (isCarDealership) return sales || [];
    return invoices.map((inv: any) => ({
      id: inv.id,
      sale_number: inv.invoice_number,
      sale_price: inv.total || inv.subtotal || 0,
      sale_date: inv.invoice_date || inv.created_at,
      profit: 0,
      commission: 0,
      customer_id: inv.customer_id,
      customer: { name: inv.customer_name },
      car: null,
      _taxAmount: inv.vat_amount || 0,
      _total: inv.total || 0,
    }));
  }, [isCarDealership, sales, invoices]);

  // Filter sales by date and customer
  const filteredSales = useMemo(() => {
    if (!unifiedSales) return [];
    
    return unifiedSales.filter((sale: any) => {
      const saleDate = new Date(sale.sale_date);
      if (startDate && saleDate < new Date(startDate)) return false;
      if (endDate && saleDate > new Date(endDate + 'T23:59:59')) return false;
      if (selectedCustomer !== 'all') {
        if (isCarDealership) {
          if (sale.customer_id !== selectedCustomer) return false;
        } else {
          // For non-car, match by customer name from customers list
          const cust = customers?.find((c: any) => c.id === selectedCustomer);
          if (cust && sale.customer?.name !== cust.name) return false;
        }
      }
      return true;
    });
  }, [unifiedSales, startDate, endDate, selectedCustomer, isCarDealership, customers]);

  // Calculate stats per customer
  const customerStats = useMemo(() => {
    if (!customers) return [];

    const relevantSales = (unifiedSales || []).filter((sale: any) => {
      const saleDate = new Date(sale.sale_date);
      if (startDate && saleDate < new Date(startDate)) return false;
      if (endDate && saleDate > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });

    return customers.map((customer: any) => {
      const customerSales = relevantSales.filter((sale: any) => {
        if (isCarDealership) return sale.customer_id === customer.id;
        return sale.customer?.name === customer.name;
      });
      const totalPurchases = customerSales.reduce((sum: number, sale: any) => sum + Number(sale.sale_price), 0);
      const totalProfit = customerSales.reduce((sum: number, sale: any) => sum + Number(sale.profit || 0), 0);
      
      return {
        ...customer,
        salesCount: customerSales.length,
        totalPurchases,
        totalProfit,
        lastPurchaseDate: customerSales.length > 0 
          ? customerSales.sort((a: any, b: any) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime())[0].sale_date
          : null
      };
    }).filter((c: any) => selectedCustomer === 'all' || c.id === selectedCustomer);
  }, [customers, unifiedSales, startDate, endDate, selectedCustomer, isCarDealership]);

  if (customersLoading || salesLoading || invoicesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedCustomerData = selectedCustomer !== 'all' ? customerStats[0] : null;
  const totalCustomers = selectedCustomer === 'all' ? customerStats.length : 1;
  const activeCustomers = customerStats.filter((c: any) => c.salesCount > 0).length;
  const totalSalesAmount = customerStats.reduce((sum: number, c: any) => sum + c.totalPurchases, 0);
  const totalSalesCount = customerStats.reduce((sum: number, c: any) => sum + c.salesCount, 0);

  const { decimals } = useNumberFormat();
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(decimals === 0 ? Math.round(amount) : amount);
  };

  const formatCurrencySimple = (value: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(decimals === 0 ? Math.round(value) : value);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const reportTitle = selectedCustomer === 'all' 
    ? `${t.rpt_cust_title} - ${t.rpt_cust_select_all}` 
    : `${t.rpt_cust_title}: ${selectedCustomerData?.name}`;

  const handlePrint = () => {
    printReport({
      title: reportTitle,
      subtitle: 'إحصائيات وتفاصيل العملاء',
      columns: selectedCustomer === 'all' ? [
        { header: 'الاسم', key: 'name' },
        { header: 'رقم الهاتف', key: 'phone' },
        { header: 'عدد المشتريات', key: 'sales_count' },
        { header: 'إجمالي المشتريات', key: 'total_purchases' },
        ...(isCarDealership ? [{ header: 'إجمالي الأرباح', key: 'total_profit' }] : []),
        { header: 'آخر شراء', key: 'last_purchase' },
      ] : [
        { header: 'رقم الفاتورة', key: 'sale_number' },
        ...(isCarDealership ? [{ header: 'السيارة', key: 'car' }] : []),
        { header: 'المبلغ', key: 'sale_price' },
        ...(isCarDealership ? [{ header: 'الربح', key: 'profit' }] : []),
        { header: 'التاريخ', key: 'date' },
      ],
      data: selectedCustomer === 'all'
        ? customerStats.map((customer: any) => ({
            name: customer.name,
            phone: customer.phone,
            sales_count: customer.salesCount,
            total_purchases: `${formatCurrencySimple(customer.totalPurchases)} ريال`,
            total_profit: `${formatCurrencySimple(customer.totalProfit)} ريال`,
            last_purchase: customer.lastPurchaseDate ? formatDate(customer.lastPurchaseDate) : '-',
          }))
        : filteredSales.map((sale: any) => ({
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
        ...(isCarDealership ? [{ label: 'إجمالي الأرباح', value: `${formatCurrencySimple(customerStats.reduce((sum: number, c: any) => sum + c.totalProfit, 0))} ريال` }] : []),
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
        ...(isCarDealership ? [{ header: 'إجمالي الأرباح', key: 'total_profit' }] : []),
      ] : [
        { header: 'رقم الفاتورة', key: 'sale_number' },
        ...(isCarDealership ? [{ header: 'السيارة', key: 'car' }] : []),
        { header: 'المبلغ', key: 'sale_price' },
        ...(isCarDealership ? [{ header: 'الربح', key: 'profit' }] : []),
        { header: 'التاريخ', key: 'date' },
      ],
      data: selectedCustomer === 'all'
        ? customerStats.map((customer: any) => ({
            name: customer.name,
            id_number: customer.id_number || '-',
            registration_number: customer.registration_number || '-',
            phone: customer.phone,
            address: customer.address || '-',
            sales_count: customer.salesCount,
            total_purchases: customer.totalPurchases,
            total_profit: customer.totalProfit,
          }))
        : filteredSales.map((sale: any) => ({
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
  const sortedCustomers = [...customerStats].sort((a: any, b: any) => b.totalPurchases - a.totalPurchases);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t.rpt_cust_title}</h2>
          <p className="text-muted-foreground">{t.rpt_cust_subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t.rpt_cust_select} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.rpt_cust_select_all}</SelectItem>
              {customers?.map((customer: any) => (
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
            {t.rpt_print}
          </Button>
          <Button onClick={handleExportExcel} className="gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            {t.rpt_export_excel}
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
                <p className="text-sm text-muted-foreground">{selectedCustomer === 'all' ? t.rpt_cust_total : t.rpt_cust_select}</p>
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
                <p className="text-sm text-muted-foreground">{t.rpt_cust_purchases_count}</p>
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
                <p className="text-sm text-muted-foreground">{t.rpt_cust_purchases_total}</p>
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
                <p className="text-sm text-muted-foreground">{selectedCustomer === 'all' ? t.rpt_cust_active : t.rpt_cust_last_purchase}</p>
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
            <CardTitle>{t.rpt_cust_data}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t.rpt_cust_col_name}</p>
                <p className="font-medium">{selectedCustomerData.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.rpt_cust_col_phone}</p>
                <p className="font-medium">{selectedCustomerData.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.rpt_cust_col_id}</p>
                <p className="font-medium">{selectedCustomerData.id_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.rpt_cust_col_address}</p>
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
            <CardTitle>{t.rpt_cust_all}</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedCustomers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t.rpt_cust_no_data}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">{t.rpt_cust_col_name}</TableHead>
                    <TableHead className="text-right">{t.rpt_cust_col_phone}</TableHead>
                    <TableHead className="text-right">{t.rpt_cust_purchases_count}</TableHead>
                    <TableHead className="text-right">{t.rpt_cust_purchases_total}</TableHead>
                    {isCarDealership && <TableHead className="text-right">{t.rpt_cust_total_profit}</TableHead>}
                    <TableHead className="text-right">{t.rpt_cust_last_purchase}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCustomers.map((customer: any) => (
                    <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedCustomer(customer.id)}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.salesCount}</TableCell>
                      <TableCell>{formatCurrency(customer.totalPurchases)}</TableCell>
                      {isCarDealership && <TableCell className="text-green-600 font-medium">{formatCurrency(customer.totalProfit)}</TableCell>}
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
            <CardTitle>{t.rpt_cust_purchases}</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t.rpt_cust_no_purchases}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الفاتورة</TableHead>
                    {isCarDealership && <TableHead className="text-right">السيارة</TableHead>}
                    {isCarDealership && <TableHead className="text-right">الموديل</TableHead>}
                    <TableHead className="text-right">المبلغ</TableHead>
                    {isCarDealership && <TableHead className="text-right">الربح</TableHead>}
                    <TableHead className="text-right">التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale: any) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.sale_number}</TableCell>
                      {isCarDealership && <TableCell>{sale.car?.name || '-'}</TableCell>}
                      {isCarDealership && <TableCell>{sale.car?.model || '-'}</TableCell>}
                      <TableCell>{formatCurrency(Number(sale.sale_price))}</TableCell>
                      {isCarDealership && <TableCell className="text-green-600 font-medium">{formatCurrency(Number(sale.profit))}</TableCell>}
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
