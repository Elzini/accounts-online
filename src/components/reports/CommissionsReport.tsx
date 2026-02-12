import { useState, useMemo } from 'react';
import { useSales } from '@/hooks/useDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Users, TrendingUp, Calendar, Printer, FileSpreadsheet } from 'lucide-react';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePrintReport } from '@/hooks/usePrintReport';
import { useExcelExport } from '@/hooks/useExcelExport';
import { useLanguage } from '@/contexts/LanguageContext';

export function CommissionsReport() {
  const { data: sales, isLoading } = useSales();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSeller, setSelectedSeller] = useState<string>('all');
  const { printReport } = usePrintReport();
  const { exportToExcel } = useExcelExport();
  const { t, language } = useLanguage();

  const locale = language === 'ar' ? 'ar-SA' : 'en-US';
  const formatCurrency = (amount: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount);
  const formatCurrencySimple = (value: number) => new Intl.NumberFormat(locale).format(value);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(locale);

  const sellers = useMemo(() => {
    if (!sales) return [];
    const sellerNames = new Set<string>();
    sales.forEach(sale => { if (sale.seller_name) sellerNames.add(sale.seller_name); });
    return Array.from(sellerNames).sort();
  }, [sales]);

  const filteredSales = useMemo(() => {
    if (!sales) return [];
    return sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      if (startDate && saleDate < new Date(startDate)) return false;
      if (endDate && saleDate > new Date(endDate + 'T23:59:59')) return false;
      if (selectedSeller !== 'all' && sale.seller_name !== selectedSeller) return false;
      return true;
    });
  }, [sales, startDate, endDate, selectedSeller]);

  const sellerStats = useMemo(() => {
    if (!filteredSales) return [];
    const sellersMap: Record<string, { name: string; salesCount: number; totalCommissions: number; totalSalesAmount: number; totalProfit: number; sales: typeof filteredSales }> = {};
    filteredSales.forEach(sale => {
      const sellerName = sale.seller_name || t.rpt_comm_unassigned;
      if (!sellersMap[sellerName]) sellersMap[sellerName] = { name: sellerName, salesCount: 0, totalCommissions: 0, totalSalesAmount: 0, totalProfit: 0, sales: [] };
      sellersMap[sellerName].salesCount += 1;
      sellersMap[sellerName].totalCommissions += Number(sale.commission || 0);
      sellersMap[sellerName].totalSalesAmount += Number(sale.sale_price);
      sellersMap[sellerName].totalProfit += Number(sale.profit);
      sellersMap[sellerName].sales.push(sale);
    });
    return Object.values(sellersMap).sort((a, b) => b.totalCommissions - a.totalCommissions);
  }, [filteredSales, t.rpt_comm_unassigned]);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  const totalCommissions = sellerStats.reduce((sum, s) => sum + s.totalCommissions, 0);
  const totalSellers = sellerStats.filter(s => s.name !== t.rpt_comm_unassigned).length;
  const totalSalesCount = sellerStats.reduce((sum, s) => sum + s.salesCount, 0);
  const averageCommission = totalSalesCount > 0 ? totalCommissions / totalSalesCount : 0;

  const handlePrint = () => {
    const reportTitle = selectedSeller === 'all' ? t.rpt_comm_title : `${t.rpt_comm_title}: ${selectedSeller}`;
    printReport({
      title: reportTitle, subtitle: t.rpt_comm_subtitle,
      columns: selectedSeller === 'all' ? [
        { header: t.rpt_comm_col_seller, key: 'seller' }, { header: t.rpt_comm_sales_count, key: 'sales_count' },
        { header: t.rpt_comm_col_total_sales, key: 'total_sales' }, { header: t.rpt_comm_col_total_comm, key: 'total_commissions' },
        { header: t.rpt_comm_col_avg, key: 'avg_commission' }, { header: t.rpt_comm_col_total_profit, key: 'total_profit' },
      ] : [
        { header: t.rpt_sales_col_number, key: 'sale_number' }, { header: t.rpt_sales_col_customer, key: 'customer' },
        { header: t.rpt_sales_col_item, key: 'car' }, { header: t.rpt_sales_col_price, key: 'sale_price' },
        { header: t.rpt_sales_col_commission, key: 'commission' }, { header: t.rpt_sales_col_date, key: 'date' },
      ],
      data: selectedSeller === 'all'
        ? sellerStats.map(s => ({ seller: s.name, sales_count: s.salesCount, total_sales: `${formatCurrencySimple(s.totalSalesAmount)} ${t.rpt_currency}`, total_commissions: `${formatCurrencySimple(s.totalCommissions)} ${t.rpt_currency}`, avg_commission: `${formatCurrencySimple(s.salesCount > 0 ? s.totalCommissions / s.salesCount : 0)} ${t.rpt_currency}`, total_profit: `${formatCurrencySimple(s.totalProfit)} ${t.rpt_currency}` }))
        : filteredSales.map(sale => ({ sale_number: sale.sale_number, customer: sale.customer?.name || '-', car: sale.car?.name || '-', sale_price: `${formatCurrencySimple(Number(sale.sale_price))} ${t.rpt_currency}`, commission: `${formatCurrencySimple(Number(sale.commission || 0))} ${t.rpt_currency}`, date: formatDate(sale.sale_date) })),
      summaryCards: [
        { label: t.rpt_comm_total, value: `${formatCurrencySimple(totalCommissions)} ${t.rpt_currency}` },
        { label: selectedSeller === 'all' ? t.rpt_comm_sellers_count : t.rpt_comm_col_seller, value: selectedSeller === 'all' ? String(totalSellers) : selectedSeller },
        { label: t.rpt_comm_sales_count, value: String(totalSalesCount) },
        { label: t.rpt_comm_average, value: `${formatCurrencySimple(averageCommission)} ${t.rpt_currency}` },
      ],
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: selectedSeller === 'all' ? t.rpt_comm_title : `${t.rpt_comm_title}: ${selectedSeller}`,
      columns: selectedSeller === 'all' ? [
        { header: t.rpt_comm_col_seller, key: 'seller' }, { header: t.rpt_comm_sales_count, key: 'sales_count' },
        { header: t.rpt_comm_col_total_sales, key: 'total_sales' }, { header: t.rpt_comm_col_total_comm, key: 'total_commissions' },
        { header: t.rpt_comm_col_avg, key: 'avg_commission' }, { header: t.rpt_comm_col_total_profit, key: 'total_profit' },
      ] : [
        { header: t.rpt_sales_col_number, key: 'sale_number' }, { header: t.rpt_sales_col_customer, key: 'customer' },
        { header: t.rpt_sales_col_item, key: 'car' }, { header: t.rpt_sales_col_price, key: 'sale_price' },
        { header: t.rpt_sales_col_commission, key: 'commission' }, { header: t.rpt_sales_col_date, key: 'date' },
      ],
      data: selectedSeller === 'all'
        ? sellerStats.map(s => ({ seller: s.name, sales_count: s.salesCount, total_sales: s.totalSalesAmount, total_commissions: s.totalCommissions, avg_commission: s.salesCount > 0 ? s.totalCommissions / s.salesCount : 0, total_profit: s.totalProfit }))
        : filteredSales.map(sale => ({ sale_number: sale.sale_number, customer: sale.customer?.name || '-', car: sale.car?.name || '-', sale_price: Number(sale.sale_price), commission: Number(sale.commission || 0), date: formatDate(sale.sale_date) })),
      summaryData: [
        { label: t.rpt_comm_total, value: totalCommissions },
        { label: selectedSeller === 'all' ? t.rpt_comm_sellers_count : t.rpt_comm_col_seller, value: selectedSeller === 'all' ? totalSellers : selectedSeller },
        { label: t.rpt_comm_sales_count, value: totalSalesCount },
        { label: t.rpt_comm_average, value: averageCommission },
      ],
      fileName: `${t.rpt_comm_title}_${new Date().toLocaleDateString(locale)}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h2 className="text-2xl font-bold text-foreground">{t.rpt_comm_title}</h2><p className="text-muted-foreground">{t.rpt_comm_subtitle}</p></div>
        <div className="flex flex-wrap items-center gap-4">
          <Select value={selectedSeller} onValueChange={setSelectedSeller}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder={t.rpt_comm_select} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.rpt_comm_select_all}</SelectItem>
              {sellers.map(seller => <SelectItem key={seller} value={seller}>{seller}</SelectItem>)}
            </SelectContent>
          </Select>
          <DateRangeFilter startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} />
          <Button onClick={handlePrint} variant="outline" className="gap-2"><Printer className="w-4 h-4" />{t.rpt_print}</Button>
          <Button onClick={handleExportExcel} className="gap-2"><FileSpreadsheet className="w-4 h-4" />{t.rpt_export_excel}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center"><DollarSign className="w-6 h-6 text-yellow-600" /></div><div><p className="text-sm text-muted-foreground">{t.rpt_comm_total}</p><p className="text-2xl font-bold text-foreground">{formatCurrency(totalCommissions)}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><Users className="w-6 h-6 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">{selectedSeller === 'all' ? t.rpt_comm_sellers_count : t.rpt_comm_col_seller}</p><p className="text-2xl font-bold text-foreground">{selectedSeller === 'all' ? totalSellers : selectedSeller}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-green-600" /></div><div><p className="text-sm text-muted-foreground">{t.rpt_comm_sales_count}</p><p className="text-2xl font-bold text-foreground">{totalSalesCount}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center"><Calendar className="w-6 h-6 text-purple-600" /></div><div><p className="text-sm text-muted-foreground">{t.rpt_comm_average}</p><p className="text-2xl font-bold text-foreground">{formatCurrency(averageCommission)}</p></div></div></CardContent></Card>
      </div>

      {selectedSeller === 'all' && (
        <Card><CardHeader><CardTitle>{t.rpt_comm_summary}</CardTitle></CardHeader><CardContent>
          {sellerStats.length === 0 ? (<div className="text-center py-8 text-muted-foreground">{t.rpt_comm_no_data}</div>) : (
            <Table><TableHeader><TableRow>
              <TableHead className="text-right">{t.rpt_comm_col_seller}</TableHead><TableHead className="text-right">{t.rpt_comm_sales_count}</TableHead>
              <TableHead className="text-right">{t.rpt_comm_col_total_sales}</TableHead><TableHead className="text-right">{t.rpt_comm_col_total_comm}</TableHead>
              <TableHead className="text-right">{t.rpt_comm_col_avg}</TableHead><TableHead className="text-right">{t.rpt_comm_col_total_profit}</TableHead>
            </TableRow></TableHeader><TableBody>
              {sellerStats.map((seller, i) => (<TableRow key={i} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedSeller(seller.name)}>
                <TableCell className="font-medium">{seller.name}</TableCell><TableCell>{seller.salesCount}</TableCell>
                <TableCell>{formatCurrency(seller.totalSalesAmount)}</TableCell><TableCell className="text-yellow-600 font-medium">{formatCurrency(seller.totalCommissions)}</TableCell>
                <TableCell>{formatCurrency(seller.salesCount > 0 ? seller.totalCommissions / seller.salesCount : 0)}</TableCell><TableCell className="text-green-600 font-medium">{formatCurrency(seller.totalProfit)}</TableCell>
              </TableRow>))}
            </TableBody></Table>
          )}
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>{selectedSeller === 'all' ? t.rpt_comm_details : `${t.rpt_comm_details} - ${selectedSeller}`}</CardTitle></CardHeader><CardContent>
        {filteredSales.length === 0 ? (<div className="text-center py-8 text-muted-foreground">{t.rpt_comm_no_data}</div>) : (
          <Table><TableHeader><TableRow>
            <TableHead className="text-right">{t.rpt_sales_col_number}</TableHead>
            {selectedSeller === 'all' && <TableHead className="text-right">{t.rpt_comm_col_seller}</TableHead>}
            <TableHead className="text-right">{t.rpt_sales_col_customer}</TableHead><TableHead className="text-right">{t.rpt_sales_col_item}</TableHead>
            <TableHead className="text-right">{t.rpt_sales_col_price}</TableHead><TableHead className="text-right">{t.rpt_sales_col_commission}</TableHead>
            <TableHead className="text-right">{t.rpt_sales_col_date}</TableHead>
          </TableRow></TableHeader><TableBody>
            {filteredSales.map((sale) => (<TableRow key={sale.id}>
              <TableCell className="font-medium">{sale.sale_number}</TableCell>
              {selectedSeller === 'all' && <TableCell>{sale.seller_name || t.rpt_comm_unassigned}</TableCell>}
              <TableCell>{sale.customer?.name || '-'}</TableCell><TableCell>{sale.car?.name || '-'}</TableCell>
              <TableCell>{formatCurrency(Number(sale.sale_price))}</TableCell><TableCell className="text-yellow-600 font-medium">{formatCurrency(Number(sale.commission || 0))}</TableCell>
              <TableCell>{formatDate(sale.sale_date)}</TableCell>
            </TableRow>))}
          </TableBody></Table>
        )}
      </CardContent></Card>
    </div>
  );
}
