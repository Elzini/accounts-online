import { useState, useMemo } from 'react';
import { useSuppliers, useCars } from '@/hooks/useDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Truck, Package, DollarSign, Calendar, Printer, FileSpreadsheet } from 'lucide-react';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { usePrintReport } from '@/hooks/usePrintReport';
import { useExcelExport } from '@/hooks/useExcelExport';
import { useIndustryLabels } from '@/hooks/useIndustryLabels';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNumberFormat } from '@/hooks/useNumberFormat';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function SuppliersReport() {
  const { companyId, company } = useCompany();
  const isCarDealership = company?.company_type === 'car_dealership';
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { data: cars, isLoading: carsLoading } = useCars();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const { printReport } = usePrintReport();
  const { exportToExcel } = useExcelExport();
  const labels = useIndustryLabels();
  const { t, language } = useLanguage();
  const locale = language === 'ar' ? 'ar-SA' : 'en-US';

  // Fetch purchase invoices for non-car companies
  const { data: purchaseInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['suppliers-report-invoices', companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('invoices')
        .select('*, invoice_items(*)')
        .eq('company_id', companyId!)
        .eq('invoice_type', 'purchase')
        .order('invoice_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId && !isCarDealership,
  });

  // Unified items: either cars or invoices
  const items = useMemo(() => {
    if (isCarDealership) {
      return (cars || []).map(car => ({
        id: car.id,
        supplier_id: car.supplier_id,
        date: car.purchase_date,
        amount: Number(car.purchase_price),
        taxable_amount: Number(car.purchase_price),
        vat_amount: 0,
        status: car.status,
        name: car.name,
        model: car.model || '-',
        reference: String(car.inventory_number),
        chassis: car.chassis_number,
      }));
    }
    return purchaseInvoices.map((inv: any) => ({
      id: inv.id,
      supplier_id: inv.supplier_id,
      date: inv.invoice_date,
      amount: Number(inv.total || 0),
      taxable_amount: Number(inv.taxable_amount || 0),
      vat_amount: Number(inv.vat_amount || 0),
      status: inv.status || 'draft',
      name: inv.customer_name || '-',
      model: inv.invoice_number || '-',
      reference: inv.supplier_invoice_number || inv.invoice_number || '-',
      chassis: '',
    }));
  }, [isCarDealership, cars, purchaseInvoices]);

  // Filter items by date and supplier
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const itemDate = new Date(item.date);
      if (startDate && itemDate < new Date(startDate)) return false;
      if (endDate && itemDate > new Date(endDate + 'T23:59:59')) return false;
      if (selectedSupplier !== 'all' && item.supplier_id !== selectedSupplier) return false;
      return true;
    });
  }, [items, startDate, endDate, selectedSupplier]);

  // Calculate stats per supplier
  const supplierStats = useMemo(() => {
    if (!suppliers) return [];

    const relevantItems = items.filter(item => {
      const itemDate = new Date(item.date);
      if (startDate && itemDate < new Date(startDate)) return false;
      if (endDate && itemDate > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });

    return suppliers.map(supplier => {
      const supplierItems = relevantItems.filter(item => item.supplier_id === supplier.id);
      const totalPurchases = supplierItems.reduce((sum, item) => sum + item.amount, 0);
      
      let availableCount = 0;
      let soldCount = 0;
      if (isCarDealership) {
        availableCount = supplierItems.filter(item => item.status === 'available').length;
        soldCount = supplierItems.filter(item => item.status === 'sold').length;
      } else {
        const approvedStatuses = ['issued', 'approved', 'معتمدة', 'معتمد'];
        const draftStatuses = ['draft', 'مسودة'];
        availableCount = supplierItems.filter(item => approvedStatuses.includes(item.status.toLowerCase())).length;
        soldCount = supplierItems.filter(item => draftStatuses.includes(item.status.toLowerCase())).length;
      }
      
      return {
        ...supplier,
        carsCount: supplierItems.length,
        availableCars: availableCount,
        soldCars: soldCount,
        totalPurchases,
        lastPurchaseDate: supplierItems.length > 0 
          ? supplierItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
          : null
      };
    }).filter(s => selectedSupplier === 'all' || s.id === selectedSupplier);
  }, [suppliers, items, startDate, endDate, selectedSupplier, isCarDealership]);

  const isLoading = suppliersLoading || (isCarDealership ? carsLoading : invoicesLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedSupplierData = selectedSupplier !== 'all' ? supplierStats[0] : null;
  const totalSuppliers = selectedSupplier === 'all' ? supplierStats.length : 1;
  const activeSuppliers = supplierStats.filter(s => s.carsCount > 0).length;
  const totalPurchasesAmount = supplierStats.reduce((sum, s) => sum + s.totalPurchases, 0);
  const totalCarsCount = supplierStats.reduce((sum, s) => sum + s.carsCount, 0);

  const { decimals: numDecimals } = useNumberFormat();
  const formatCurrency = (amount: number) => new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: numDecimals,
    maximumFractionDigits: numDecimals,
  }).format(numDecimals === 0 ? Math.round(amount) : amount);
  const formatCurrencySimple = (value: number) => new Intl.NumberFormat(locale, { minimumFractionDigits: numDecimals, maximumFractionDigits: numDecimals }).format(numDecimals === 0 ? Math.round(value) : value);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(locale);
  
  const getStatusText = (status: string) => {
    if (isCarDealership) {
      return status === 'available' ? t.rpt_status_available : status === 'transferred' ? t.rpt_status_transferred : t.rpt_status_sold;
    }
    const normalized = status.toLowerCase().trim();
    if (['issued', 'approved', 'معتمدة', 'معتمد'].includes(normalized)) return language === 'ar' ? 'معتمدة' : 'Approved';
    if (['draft', 'مسودة'].includes(normalized)) return language === 'ar' ? 'مسودة' : 'Draft';
    return status;
  };

  const col2Label = isCarDealership ? labels.itemName : (language === 'ar' ? 'اسم المورد' : 'Supplier');
  const col3Label = isCarDealership ? t.rpt_purch_col_model : (language === 'ar' ? 'رقم الفاتورة' : 'Invoice #');
  const availableLabel = isCarDealership ? t.rpt_supp_col_available : (language === 'ar' ? 'معتمدة' : 'Approved');
  const soldLabel = isCarDealership ? t.rpt_supp_col_sold : (language === 'ar' ? 'مسودة' : 'Draft');

  const reportTitle = selectedSupplier === 'all' 
    ? `${t.rpt_supp_title} - ${t.rpt_supp_select_all}` 
    : `${t.rpt_supp_title}: ${selectedSupplierData?.name}`;

  const handlePrint = () => {
    printReport({
      title: reportTitle,
      subtitle: t.rpt_supp_subtitle,
      columns: selectedSupplier === 'all' ? [
        { header: t.rpt_supp_col_name, key: 'name' },
        { header: t.rpt_supp_col_phone, key: 'phone' },
        { header: t.rpt_supp_items_count, key: 'cars_count' },
        { header: availableLabel, key: 'available' },
        { header: soldLabel, key: 'sold' },
        { header: t.rpt_supp_purchases_total, key: 'total_purchases' },
      ] : [
        { header: isCarDealership ? t.rpt_purch_col_number : (language === 'ar' ? 'المرجع' : 'Ref'), key: 'reference' },
        { header: col2Label, key: 'name' },
        { header: col3Label, key: 'model' },
        ...(!isCarDealership ? [
          { header: language === 'ar' ? 'المبلغ قبل الضريبة' : 'Subtotal', key: 'taxable_amount' },
          { header: language === 'ar' ? 'الضريبة' : 'VAT', key: 'vat_amount' },
        ] : []),
        { header: isCarDealership ? t.rpt_purch_col_price : (language === 'ar' ? 'الإجمالي مع الضريبة' : 'Total incl. VAT'), key: 'amount' },
        { header: t.rpt_purch_col_status, key: 'status' },
        { header: t.rpt_purch_col_date, key: 'date' },
      ],
      data: selectedSupplier === 'all'
        ? supplierStats.map(supplier => ({
            name: supplier.name,
            phone: supplier.phone,
            cars_count: supplier.carsCount,
            available: supplier.availableCars,
            sold: supplier.soldCars,
            total_purchases: `${formatCurrencySimple(supplier.totalPurchases)} ${t.rpt_currency}`,
          }))
        : filteredItems.map(item => ({
            reference: item.reference,
            name: item.name,
            model: item.model,
            taxable_amount: `${formatCurrencySimple(item.taxable_amount || 0)} ${t.rpt_currency}`,
            vat_amount: `${formatCurrencySimple(item.vat_amount || 0)} ${t.rpt_currency}`,
            amount: `${formatCurrencySimple(item.amount)} ${t.rpt_currency}`,
            status: getStatusText(item.status),
            date: formatDate(item.date),
          })),
      summaryCards: [
        { label: selectedSupplier === 'all' ? t.rpt_supp_total : t.rpt_supp_select, value: selectedSupplier === 'all' ? String(totalSuppliers) : selectedSupplierData?.name || '' },
        { label: t.rpt_supp_items_count, value: String(totalCarsCount) },
        { label: t.rpt_supp_purchases_total, value: `${formatCurrencySimple(totalPurchasesAmount)} ${t.rpt_currency}` },
      ],
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: reportTitle,
      columns: selectedSupplier === 'all' ? [
        { header: t.rpt_supp_col_name, key: 'name' },
        { header: t.rpt_cust_col_id, key: 'id_number' },
        { header: t.rpt_supp_col_phone, key: 'phone' },
        { header: t.rpt_cust_col_address, key: 'address' },
        { header: t.rpt_supp_items_count, key: 'cars_count' },
        { header: availableLabel, key: 'available' },
        { header: soldLabel, key: 'sold' },
        { header: t.rpt_supp_purchases_total, key: 'total_purchases' },
        { header: t.rpt_supp_col_notes, key: 'notes' },
      ] : [
        { header: isCarDealership ? t.rpt_purch_col_number : (language === 'ar' ? 'المرجع' : 'Ref'), key: 'reference' },
        { header: col2Label, key: 'name' },
        { header: col3Label, key: 'model' },
        ...(isCarDealership ? [{ header: t.rpt_purch_col_chassis, key: 'chassis' }] : []),
        ...(!isCarDealership ? [
          { header: language === 'ar' ? 'المبلغ قبل الضريبة' : 'Subtotal', key: 'taxable_amount' },
          { header: language === 'ar' ? 'الضريبة' : 'VAT', key: 'vat_amount' },
        ] : []),
        { header: isCarDealership ? t.rpt_purch_col_price : (language === 'ar' ? 'الإجمالي مع الضريبة' : 'Total incl. VAT'), key: 'amount' },
        { header: t.rpt_purch_col_status, key: 'status' },
        { header: t.rpt_purch_col_date, key: 'date' },
      ],
      data: selectedSupplier === 'all'
        ? supplierStats.map(supplier => ({
            name: supplier.name,
            id_number: supplier.id_number || '-',
            phone: supplier.phone,
            address: supplier.address || '-',
            cars_count: supplier.carsCount,
            available: supplier.availableCars,
            sold: supplier.soldCars,
            total_purchases: supplier.totalPurchases,
            notes: supplier.notes || '-',
          }))
        : filteredItems.map(item => ({
            reference: item.reference,
            name: item.name,
            model: item.model,
            chassis: item.chassis,
            taxable_amount: item.taxable_amount || 0,
            vat_amount: item.vat_amount || 0,
            amount: item.amount,
            status: getStatusText(item.status),
            date: formatDate(item.date),
          })),
      summaryData: [
        { label: selectedSupplier === 'all' ? t.rpt_supp_total : t.rpt_supp_select, value: selectedSupplier === 'all' ? totalSuppliers : selectedSupplierData?.name || '' },
        { label: t.rpt_supp_items_count, value: totalCarsCount },
        { label: t.rpt_supp_purchases_total, value: totalPurchasesAmount },
      ],
      fileName: `${t.rpt_supp_title}_${new Date().toLocaleDateString(locale)}`,
    });
  };

  // Sort suppliers by purchases
  const sortedSuppliers = [...supplierStats].sort((a, b) => b.totalPurchases - a.totalPurchases);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t.rpt_supp_title}</h2>
          <p className="text-muted-foreground">{t.rpt_supp_subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t.rpt_supp_select} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.rpt_supp_select_all}</SelectItem>
              {suppliers?.map(supplier => (
                <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
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
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{selectedSupplier === 'all' ? t.rpt_supp_total : t.rpt_supp_select}</p>
                <p className="text-2xl font-bold text-foreground">{selectedSupplier === 'all' ? totalSuppliers : selectedSupplierData?.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.rpt_supp_items_count}</p>
                <p className="text-2xl font-bold text-foreground">{totalCarsCount}</p>
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
                <p className="text-sm text-muted-foreground">{t.rpt_supp_purchases_total}</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalPurchasesAmount)}</p>
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
                <p className="text-sm text-muted-foreground">{selectedSupplier === 'all' ? t.rpt_supp_active : t.rpt_supp_last_supply}</p>
                <p className="text-2xl font-bold text-foreground">
                  {selectedSupplier === 'all' 
                    ? activeSuppliers 
                    : (selectedSupplierData?.lastPurchaseDate ? formatDate(selectedSupplierData.lastPurchaseDate) : '-')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Details - when specific supplier selected */}
      {selectedSupplier !== 'all' && selectedSupplierData && (
        <Card>
          <CardHeader>
            <CardTitle>{t.rpt_supp_data}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t.rpt_supp_col_name}</p>
                <p className="font-medium">{selectedSupplierData.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.rpt_supp_col_phone}</p>
                <p className="font-medium">{selectedSupplierData.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.rpt_cust_col_id}</p>
                <p className="font-medium">{selectedSupplierData.id_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.rpt_cust_col_address}</p>
                <p className="font-medium">{selectedSupplierData.address || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">{t.rpt_supp_col_notes}</p>
                <p className="font-medium">{selectedSupplierData.notes || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{availableLabel}</p>
                <p className="font-medium text-green-600">{selectedSupplierData.availableCars}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{soldLabel}</p>
                <p className="font-medium text-blue-600">{selectedSupplierData.soldCars}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Suppliers - when all selected */}
      {selectedSupplier === 'all' && (
        <Card>
          <CardHeader>
            <CardTitle>{t.rpt_supp_all}</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedSuppliers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t.rpt_supp_no_data}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">{t.rpt_supp_col_name}</TableHead>
                    <TableHead className="text-right">{t.rpt_supp_col_phone}</TableHead>
                    <TableHead className="text-right">{t.rpt_supp_items_count}</TableHead>
                    <TableHead className="text-right">{availableLabel}</TableHead>
                    <TableHead className="text-right">{soldLabel}</TableHead>
                    <TableHead className="text-right">{t.rpt_supp_purchases_total}</TableHead>
                    <TableHead className="text-right">{t.rpt_supp_last_supply}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSuppliers.map((supplier) => (
                    <TableRow key={supplier.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedSupplier(supplier.id)}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.phone}</TableCell>
                      <TableCell>{supplier.carsCount}</TableCell>
                      <TableCell className="text-green-600">{supplier.availableCars}</TableCell>
                      <TableCell className="text-blue-600">{supplier.soldCars}</TableCell>
                      <TableCell>{formatCurrency(supplier.totalPurchases)}</TableCell>
                      <TableCell>{supplier.lastPurchaseDate ? formatDate(supplier.lastPurchaseDate) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Supplier Items - when specific supplier selected */}
      {selectedSupplier !== 'all' && (
        <Card>
          <CardHeader>
            <CardTitle>{t.rpt_supp_items}</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t.rpt_supp_no_items}
              </div>
            ) : (
              <Table>
                <TableHeader>
                   <TableRow>
                     <TableHead className="text-right">{isCarDealership ? t.rpt_purch_col_number : (language === 'ar' ? 'المرجع' : 'Ref')}</TableHead>
                     <TableHead className="text-right">{col2Label}</TableHead>
                     <TableHead className="text-right">{col3Label}</TableHead>
                     {!isCarDealership && (
                       <>
                         <TableHead className="text-right">{language === 'ar' ? 'المبلغ قبل الضريبة' : 'Subtotal'}</TableHead>
                         <TableHead className="text-right">{language === 'ar' ? 'الضريبة' : 'VAT'}</TableHead>
                       </>
                     )}
                     <TableHead className="text-right">{isCarDealership ? t.rpt_purch_col_price : (language === 'ar' ? 'الإجمالي مع الضريبة' : 'Total incl. VAT')}</TableHead>
                     <TableHead className="text-right">{t.rpt_purch_col_status}</TableHead>
                     <TableHead className="text-right">{t.rpt_purch_col_date}</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredItems.map((item) => (
                     <TableRow key={item.id}>
                       <TableCell className="font-medium">{item.reference}</TableCell>
                       <TableCell>{item.name}</TableCell>
                       <TableCell>{item.model}</TableCell>
                       {!isCarDealership && (
                         <>
                           <TableCell>{formatCurrency(item.taxable_amount || 0)}</TableCell>
                           <TableCell>{formatCurrency(item.vat_amount || 0)}</TableCell>
                         </>
                       )}
                       <TableCell>{formatCurrency(item.amount)}</TableCell>
                       <TableCell>
                         <Badge variant={isCarDealership ? (item.status === 'available' ? 'default' : 'secondary') : 'default'}>
                           {getStatusText(item.status)}
                         </Badge>
                       </TableCell>
                       <TableCell>{formatDate(item.date)}</TableCell>
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
