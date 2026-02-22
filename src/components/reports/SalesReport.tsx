import { useState, useMemo } from 'react';
import { useSales } from '@/hooks/useDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, ShoppingCart, TrendingUp, Calendar, Printer, FileSpreadsheet } from 'lucide-react';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { Button } from '@/components/ui/button';
import { usePrintReport } from '@/hooks/usePrintReport';
import { useExcelExport } from '@/hooks/useExcelExport';
import { useFiscalYearFilter } from '@/hooks/useFiscalYearFilter';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function SalesReport() {
  const { data: sales, isLoading } = useSales();
  const { companyId, company } = useCompany();
  const isCarDealership = company?.company_type === 'car_dealership';
  const { filterByFiscalYear } = useFiscalYearFilter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { printReport } = usePrintReport();
  const { exportToExcel } = useExcelExport();
  const { t, language } = useLanguage();

  // Fetch invoices for non-car companies
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['company-invoices-report', companyId],
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

  const locale = language === 'ar' ? 'ar-SA' : 'en-US';

  // Unify data for non-car companies
  const unifiedSales = useMemo(() => {
    if (isCarDealership) return sales || [];
    return invoices.map((inv: any) => ({
      id: inv.id,
      sale_number: inv.invoice_number,
      sale_price: inv.subtotal || 0,
      sale_date: inv.invoice_date || inv.created_at,
      profit: 0,
      commission: 0,
      other_expenses: 0,
      customer: { name: inv.customer_name },
      car: null,
      _taxAmount: inv.vat_amount || 0,
      _total: inv.total || 0,
    }));
  }, [isCarDealership, sales, invoices]);

  const filteredSales = useMemo(() => {
    if (!unifiedSales) return [];
    let result = filterByFiscalYear(unifiedSales, 'sale_date');
    return result.filter((sale: any) => {
      const saleDate = new Date(sale.sale_date);
      if (startDate && saleDate < new Date(startDate)) return false;
      if (endDate && saleDate > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });
  }, [unifiedSales, startDate, endDate, filterByFiscalYear]);

  if (isLoading || invoicesLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  const salesData = filteredSales;
  const totalSales = salesData.reduce((sum: number, sale: any) => sum + Number(isCarDealership ? sale.sale_price : (sale._total || sale.sale_price)), 0);
  const totalProfit = salesData.reduce((sum: number, sale: any) => sum + Number(sale.profit), 0);
  const totalCommissions = salesData.reduce((sum: number, sale: any) => sum + Number(sale.commission || 0), 0);

  const formatCurrency = (amount: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount);
  const formatCurrencySimple = (value: number) => new Intl.NumberFormat(locale).format(value);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(locale);

  const salesByMonth: Record<string, { count: number; total: number; profit: number }> = {};
  salesData.forEach((sale: any) => {
    const date = new Date(sale.sale_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!salesByMonth[monthKey]) salesByMonth[monthKey] = { count: 0, total: 0, profit: 0 };
    salesByMonth[monthKey].count += 1;
    salesByMonth[monthKey].total += Number(isCarDealership ? sale.sale_price : (sale._total || sale.sale_price));
    salesByMonth[monthKey].profit += Number(sale.profit);
  });
  const monthlyData = Object.entries(salesByMonth).sort(([a], [b]) => b.localeCompare(a)).map(([month, data]) => ({
    month: new Date(month + '-01').toLocaleDateString(locale, { year: 'numeric', month: 'long' }), ...data
  }));

  const handlePrint = () => {
    printReport({
      title: t.rpt_sales_title, subtitle: t.rpt_sales_subtitle,
      columns: isCarDealership ? [
        { header: t.rpt_sales_col_number, key: 'sale_number' }, { header: t.rpt_sales_col_customer, key: 'customer' },
        { header: t.rpt_sales_col_item, key: 'car' }, { header: t.rpt_sales_col_chassis, key: 'chassis_number' },
        { header: t.rpt_sales_col_price, key: 'sale_price' }, { header: t.rpt_sales_col_commission, key: 'commission' },
        { header: t.rpt_sales_col_expenses, key: 'expenses' }, { header: t.rpt_sales_col_profit, key: 'profit' },
        { header: t.rpt_sales_col_date, key: 'date' },
      ] : [
        { header: t.rpt_sales_col_number, key: 'sale_number' }, { header: t.rpt_sales_col_customer, key: 'customer' },
        { header: t.rpt_sales_col_price, key: 'sale_price' }, { header: 'الضريبة', key: 'tax' },
        { header: 'الإجمالي', key: 'total' }, { header: t.rpt_sales_col_date, key: 'date' },
      ],
      data: salesData.map((sale: any) => isCarDealership ? {
        sale_number: sale.sale_number, customer: sale.customer?.name || '-', car: sale.car?.name || '-', chassis_number: sale.car?.chassis_number || '-',
        sale_price: `${formatCurrencySimple(Number(sale.sale_price))} ${t.rpt_currency}`, commission: `${formatCurrencySimple(Number(sale.commission || 0))} ${t.rpt_currency}`,
        expenses: `${formatCurrencySimple(Number(sale.other_expenses || 0))} ${t.rpt_currency}`, profit: `${formatCurrencySimple(Number(sale.profit))} ${t.rpt_currency}`, date: formatDate(sale.sale_date),
      } : {
        sale_number: sale.sale_number, customer: sale.customer?.name || '-',
        sale_price: `${formatCurrencySimple(Number(sale.sale_price))} ${t.rpt_currency}`,
        tax: `${formatCurrencySimple(Number(sale._taxAmount || 0))} ${t.rpt_currency}`,
        total: `${formatCurrencySimple(Number(sale._total || 0))} ${t.rpt_currency}`,
        date: formatDate(sale.sale_date),
      }),
      summaryCards: [
        { label: t.rpt_sales_total, value: `${formatCurrencySimple(totalSales)} ${t.rpt_currency}` },
        ...(isCarDealership ? [
          { label: t.rpt_sales_total_profit, value: `${formatCurrencySimple(totalProfit)} ${t.rpt_currency}` },
          { label: t.rpt_sales_total_commissions, value: `${formatCurrencySimple(totalCommissions)} ${t.rpt_currency}` },
        ] : []),
        { label: t.rpt_sales_count, value: String(salesData.length) },
      ],
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: t.rpt_sales_title,
      columns: isCarDealership ? [
        { header: t.rpt_sales_col_number, key: 'sale_number' }, { header: t.rpt_sales_col_customer, key: 'customer' },
        { header: t.rpt_sales_col_item, key: 'car' }, { header: t.rpt_sales_col_chassis, key: 'chassis_number' },
        { header: t.rpt_sales_col_price, key: 'sale_price' }, { header: t.rpt_sales_col_commission, key: 'commission' },
        { header: t.rpt_sales_col_expenses, key: 'expenses' }, { header: t.rpt_sales_col_profit, key: 'profit' },
        { header: t.rpt_sales_col_date, key: 'date' },
      ] : [
        { header: t.rpt_sales_col_number, key: 'sale_number' }, { header: t.rpt_sales_col_customer, key: 'customer' },
        { header: t.rpt_sales_col_price, key: 'sale_price' }, { header: 'الضريبة', key: 'tax' },
        { header: 'الإجمالي', key: 'total' }, { header: t.rpt_sales_col_date, key: 'date' },
      ],
      data: salesData.map((sale: any) => isCarDealership ? {
        sale_number: sale.sale_number, customer: sale.customer?.name || '-', car: sale.car?.name || '-', chassis_number: sale.car?.chassis_number || '-',
        sale_price: Number(sale.sale_price), commission: Number(sale.commission || 0), expenses: Number(sale.other_expenses || 0), profit: Number(sale.profit), date: formatDate(sale.sale_date),
      } : {
        sale_number: sale.sale_number, customer: sale.customer?.name || '-',
        sale_price: Number(sale.sale_price), tax: Number(sale._taxAmount || 0), total: Number(sale._total || 0), date: formatDate(sale.sale_date),
      }),
      summaryData: [
        { label: t.rpt_sales_total, value: totalSales },
        ...(isCarDealership ? [
          { label: t.rpt_sales_total_profit, value: totalProfit },
          { label: t.rpt_sales_total_commissions, value: totalCommissions },
        ] : []),
        { label: t.rpt_sales_count, value: salesData.length },
      ],
      fileName: `${t.rpt_sales_title}_${new Date().toLocaleDateString(locale)}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h2 className="text-2xl font-bold text-foreground">{t.rpt_sales_title}</h2><p className="text-muted-foreground">{t.rpt_sales_subtitle}</p></div>
        <div className="flex items-center gap-4">
          <DateRangeFilter startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} />
          <Button onClick={handlePrint} variant="outline" className="gap-2"><Printer className="w-4 h-4" />{t.rpt_print}</Button>
          <Button onClick={handleExportExcel} className="gap-2"><FileSpreadsheet className="w-4 h-4" />{t.rpt_export_excel}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><ShoppingCart className="w-6 h-6 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">{t.rpt_sales_total}</p><p className="text-2xl font-bold text-foreground">{formatCurrency(totalSales)}</p></div></div></CardContent></Card>
        {isCarDealership && <Card><CardContent className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-green-600" /></div><div><p className="text-sm text-muted-foreground">{t.rpt_sales_total_profit}</p><p className="text-2xl font-bold text-foreground">{formatCurrency(totalProfit)}</p></div></div></CardContent></Card>}
        {isCarDealership && <Card><CardContent className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center"><DollarSign className="w-6 h-6 text-yellow-600" /></div><div><p className="text-sm text-muted-foreground">{t.rpt_sales_total_commissions}</p><p className="text-2xl font-bold text-foreground">{formatCurrency(totalCommissions)}</p></div></div></CardContent></Card>}
        <Card><CardContent className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center"><Calendar className="w-6 h-6 text-red-600" /></div><div><p className="text-sm text-muted-foreground">{t.rpt_sales_count}</p><p className="text-2xl font-bold text-foreground">{salesData.length}</p></div></div></CardContent></Card>
      </div>

      {monthlyData.length > 0 && (
        <Card><CardHeader><CardTitle>{t.rpt_sales_monthly}</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow>
            <TableHead className="text-right">{t.rpt_sales_col_month}</TableHead><TableHead className="text-right">{t.rpt_sales_count}</TableHead>
            <TableHead className="text-right">{t.rpt_sales_total}</TableHead>
            {isCarDealership && <TableHead className="text-right">{t.rpt_sales_total_profit}</TableHead>}
          </TableRow></TableHeader><TableBody>
            {monthlyData.map((row, i) => (<TableRow key={i}><TableCell className="font-medium">{row.month}</TableCell><TableCell>{row.count}</TableCell><TableCell>{formatCurrency(row.total)}</TableCell>{isCarDealership && <TableCell className="text-green-600 font-medium">{formatCurrency(row.profit)}</TableCell>}</TableRow>))}
          </TableBody></Table>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>{t.rpt_sales_all}</CardTitle></CardHeader><CardContent>
        {salesData.length === 0 ? (<div className="text-center py-8 text-muted-foreground">{t.rpt_sales_no_data}</div>) : (
          <Table><TableHeader><TableRow>
            <TableHead className="text-right">{t.rpt_sales_col_number}</TableHead>
            <TableHead className="text-right">{t.rpt_sales_col_customer}</TableHead>
            {isCarDealership && <TableHead className="text-right">{t.rpt_sales_col_item}</TableHead>}
            {isCarDealership && <TableHead className="text-right">{t.rpt_sales_col_chassis}</TableHead>}
            <TableHead className="text-right">{t.rpt_sales_col_price}</TableHead>
            {!isCarDealership && <TableHead className="text-right">الضريبة</TableHead>}
            {!isCarDealership && <TableHead className="text-right">الإجمالي</TableHead>}
            {isCarDealership && <TableHead className="text-right">{t.rpt_sales_col_commission}</TableHead>}
            {isCarDealership && <TableHead className="text-right">{t.rpt_sales_col_expenses}</TableHead>}
            {isCarDealership && <TableHead className="text-right">{t.rpt_sales_col_profit}</TableHead>}
            <TableHead className="text-right">{t.rpt_sales_col_date}</TableHead>
          </TableRow></TableHeader><TableBody>
            {salesData.map((sale: any) => (<TableRow key={sale.id}>
              <TableCell className="font-medium">{sale.sale_number}</TableCell>
              <TableCell>{sale.customer?.name || '-'}</TableCell>
              {isCarDealership && <TableCell>{sale.car?.name || '-'}</TableCell>}
              {isCarDealership && <TableCell className="font-mono text-sm">{sale.car?.chassis_number || '-'}</TableCell>}
              <TableCell>{formatCurrency(Number(sale.sale_price))}</TableCell>
              {!isCarDealership && <TableCell>{formatCurrency(Number(sale._taxAmount || 0))}</TableCell>}
              {!isCarDealership && <TableCell className="font-semibold text-primary">{formatCurrency(Number(sale._total || 0))}</TableCell>}
              {isCarDealership && <TableCell>{formatCurrency(Number(sale.commission || 0))}</TableCell>}
              {isCarDealership && <TableCell>{formatCurrency(Number(sale.other_expenses || 0))}</TableCell>}
              {isCarDealership && <TableCell className="text-green-600 font-medium">{formatCurrency(Number(sale.profit))}</TableCell>}
              <TableCell>{formatDate(sale.sale_date)}</TableCell>
            </TableRow>))}
          </TableBody></Table>
        )}
      </CardContent></Card>
    </div>
  );
}
