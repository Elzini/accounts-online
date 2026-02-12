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

export function SuppliersReport() {
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

  // Filter cars by date and supplier
  const filteredCars = useMemo(() => {
    if (!cars) return [];
    
    return cars.filter(car => {
      const purchaseDate = new Date(car.purchase_date);
      if (startDate && purchaseDate < new Date(startDate)) return false;
      if (endDate && purchaseDate > new Date(endDate + 'T23:59:59')) return false;
      if (selectedSupplier !== 'all' && car.supplier_id !== selectedSupplier) return false;
      return true;
    });
  }, [cars, startDate, endDate, selectedSupplier]);

  // Calculate stats per supplier
  const supplierStats = useMemo(() => {
    if (!suppliers || !cars) return [];

    const relevantCars = cars.filter(car => {
      const purchaseDate = new Date(car.purchase_date);
      if (startDate && purchaseDate < new Date(startDate)) return false;
      if (endDate && purchaseDate > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });

    return suppliers.map(supplier => {
      const supplierCars = relevantCars.filter(car => car.supplier_id === supplier.id);
      const totalPurchases = supplierCars.reduce((sum, car) => sum + Number(car.purchase_price), 0);
      const availableCars = supplierCars.filter(car => car.status === 'available').length;
      const soldCars = supplierCars.filter(car => car.status === 'sold').length;
      
      return {
        ...supplier,
        carsCount: supplierCars.length,
        availableCars,
        soldCars,
        totalPurchases,
        lastPurchaseDate: supplierCars.length > 0 
          ? supplierCars.sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime())[0].purchase_date
          : null
      };
    }).filter(s => selectedSupplier === 'all' || s.id === selectedSupplier);
  }, [suppliers, cars, startDate, endDate, selectedSupplier]);

  if (suppliersLoading || carsLoading) {
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

  const formatCurrency = (amount: number) => new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
  }).format(amount);
  const formatCurrencySimple = (value: number) => new Intl.NumberFormat(locale).format(value);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(locale);
  const getStatusText = (status: string) => status === 'available' ? t.rpt_status_available : status === 'transferred' ? t.rpt_status_transferred : t.rpt_status_sold;

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
        { header: `${t.rpt_supp_items_count}`, key: 'cars_count' },
        { header: t.rpt_supp_col_available, key: 'available' },
        { header: t.rpt_supp_col_sold, key: 'sold' },
        { header: t.rpt_supp_purchases_total, key: 'total_purchases' },
      ] : [
        { header: t.rpt_purch_col_number, key: 'inventory_number' },
        { header: labels.itemName, key: 'car' },
        { header: t.rpt_purch_col_model, key: 'model' },
        { header: t.rpt_purch_col_price, key: 'purchase_price' },
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
        : filteredCars.map(car => ({
            inventory_number: car.inventory_number,
            car: car.name,
            model: car.model || '-',
            purchase_price: `${formatCurrencySimple(Number(car.purchase_price))} ${t.rpt_currency}`,
            status: getStatusText(car.status),
            date: formatDate(car.purchase_date),
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
        { header: t.rpt_supp_col_available, key: 'available' },
        { header: t.rpt_supp_col_sold, key: 'sold' },
        { header: t.rpt_supp_purchases_total, key: 'total_purchases' },
        { header: t.rpt_supp_col_notes, key: 'notes' },
      ] : [
        { header: t.rpt_purch_col_number, key: 'inventory_number' },
        { header: labels.itemName, key: 'car' },
        { header: t.rpt_purch_col_model, key: 'model' },
        { header: t.rpt_purch_col_chassis, key: 'chassis' },
        { header: t.rpt_purch_col_price, key: 'purchase_price' },
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
        : filteredCars.map(car => ({
            inventory_number: car.inventory_number,
            car: car.name,
            model: car.model || '-',
            chassis: car.chassis_number,
            purchase_price: Number(car.purchase_price),
            status: getStatusText(car.status),
            date: formatDate(car.purchase_date),
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
                <p className="text-sm text-muted-foreground">{t.rpt_supp_col_available}</p>
                <p className="font-medium text-green-600">{selectedSupplierData.availableCars}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.rpt_supp_col_sold}</p>
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
                    <TableHead className="text-right">{t.rpt_supp_col_available}</TableHead>
                    <TableHead className="text-right">{t.rpt_supp_col_sold}</TableHead>
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

      {/* Supplier Cars - when specific supplier selected */}
      {selectedSupplier !== 'all' && (
        <Card>
          <CardHeader>
            <CardTitle>{t.rpt_supp_items}</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCars.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t.rpt_supp_no_items}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">{t.rpt_purch_col_number}</TableHead>
                    <TableHead className="text-right">{labels.itemName}</TableHead>
                    <TableHead className="text-right">{t.rpt_purch_col_model}</TableHead>
                    <TableHead className="text-right">{t.rpt_purch_col_price}</TableHead>
                    <TableHead className="text-right">{t.rpt_purch_col_status}</TableHead>
                    <TableHead className="text-right">{t.rpt_purch_col_date}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCars.map((car) => (
                    <TableRow key={car.id}>
                      <TableCell className="font-medium">{car.inventory_number}</TableCell>
                      <TableCell>{car.name}</TableCell>
                      <TableCell>{car.model || '-'}</TableCell>
                      <TableCell>{formatCurrency(Number(car.purchase_price))}</TableCell>
                      <TableCell>
                        <Badge variant={car.status === 'available' ? 'default' : car.status === 'transferred' ? 'default' : 'secondary'}
                          className={car.status === 'transferred' ? 'bg-orange-500' : ''}>
                          {getStatusText(car.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(car.purchase_date)}</TableCell>
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
