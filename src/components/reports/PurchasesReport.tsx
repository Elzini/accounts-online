import { useState, useMemo } from 'react';
import { FileText, ShoppingCart, Truck, Printer, RefreshCw } from 'lucide-react';
import { useCars, useSuppliers } from '@/hooks/useDatabase';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePrintReport } from '@/hooks/usePrintReport';
import { useFiscalYearFilter } from '@/hooks/useFiscalYearFilter';
import { PurchaseActions } from '@/components/actions/PurchaseActions';
import { useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { useLanguage } from '@/contexts/LanguageContext';

export function PurchasesReport() {
  const { data: cars = [], isLoading, refetch } = useCars();
  const { data: suppliers = [] } = useSuppliers();
  const { filterByFiscalYear } = useFiscalYearFilter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { printReport } = usePrintReport();
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  const { t, language } = useLanguage();

  const locale = language === 'ar' ? 'ar-SA' : 'en-US';
  const formatCurrency = (value: number) => new Intl.NumberFormat(locale).format(value);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(locale);
  const getStatusText = (status: string) => status === 'available' ? t.rpt_status_available : status === 'transferred' ? t.rpt_status_transferred : t.rpt_status_sold;

  // Map suppliers by ID for quick lookup
  const suppliersMap = useMemo(() => {
    return suppliers.reduce((acc, supplier) => {
      acc[supplier.id] = supplier;
      return acc;
    }, {} as Record<string, typeof suppliers[0]>);
  }, [suppliers]);

  // Enrich cars with supplier data
  const carsWithSuppliers = useMemo(() => {
    return cars.map(car => ({
      ...car,
      supplier: car.supplier_id ? suppliersMap[car.supplier_id] : null,
    }));
  }, [cars, suppliersMap]);

  const filteredCars = useMemo(() => {
    // First filter by fiscal year
    let result = filterByFiscalYear(carsWithSuppliers, 'purchase_date');
    
    // Then apply date range filter within fiscal year
    return result.filter(car => {
      const purchaseDate = new Date(car.purchase_date);
      if (startDate && purchaseDate < new Date(startDate)) return false;
      if (endDate && purchaseDate > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });
  }, [carsWithSuppliers, startDate, endDate, filterByFiscalYear]);

  const totalPurchases = filteredCars.reduce((sum, car) => sum + Number(car.purchase_price), 0);

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
    queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
    queryClient.invalidateQueries({ queryKey: ['advanced-analytics', companyId] });
    queryClient.invalidateQueries({ queryKey: ['monthly-chart-data', companyId] });
  };

  const handlePrint = () => {
    printReport({
      title: t.rpt_purch_title,
      subtitle: t.rpt_purch_subtitle,
      columns: [
        { header: t.rpt_purch_col_number, key: 'inventory_number' },
        { header: t.rpt_purch_col_item, key: 'name' },
        { header: t.rpt_purch_col_model, key: 'model' },
        { header: t.rpt_purch_col_chassis, key: 'chassis_number' },
        { header: t.rpt_purch_col_price, key: 'purchase_price' },
        { header: t.rpt_purch_col_date, key: 'purchase_date' },
        { header: t.rpt_purch_col_status, key: 'status' },
      ],
      data: filteredCars.map(car => ({
        inventory_number: car.inventory_number,
        name: car.name,
        model: car.model || '-',
        chassis_number: car.chassis_number,
        purchase_price: `${formatCurrency(Number(car.purchase_price))} ${t.rpt_currency}`,
        purchase_date: formatDate(car.purchase_date),
        status: getStatusText(car.status),
      })),
      summaryCards: [
        { label: t.rpt_purch_count, value: String(filteredCars.length) },
        { label: t.rpt_purch_total, value: `${formatCurrency(totalPurchases)} ${t.rpt_currency}` },
        { label: t.rpt_purch_available, value: String(filteredCars.filter(c => c.status === 'available').length) },
      ],
    });
  };

  if (isLoading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.rpt_purch_title}</h1>
          <p className="text-muted-foreground">{t.rpt_purch_subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {t.rpt_refresh}
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            {t.rpt_print_report}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.rpt_purch_count}</p>
              <p className="text-2xl font-bold">{filteredCars.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-warning flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.rpt_purch_total}</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPurchases)} {t.rpt_currency}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.rpt_purch_available}</p>
              <p className="text-2xl font-bold">{filteredCars.filter(c => c.status === 'available').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-bold">{t.rpt_purch_details}</h3>
        </div>
        {filteredCars.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t.rpt_purch_no_data}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-bold">{t.rpt_purch_col_number}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_purch_col_item}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_purch_col_model}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_purch_col_chassis}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_purch_col_price}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_purch_col_date}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_purch_col_status}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_purch_col_actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCars.map((car) => (
                <TableRow key={car.id}>
                  <TableCell>{car.inventory_number}</TableCell>
                  <TableCell className="font-semibold">{car.name}</TableCell>
                  <TableCell>{car.model || '-'}</TableCell>
                  <TableCell className="font-mono text-sm">{car.chassis_number}</TableCell>
                  <TableCell>{formatCurrency(Number(car.purchase_price))} {t.rpt_currency}</TableCell>
                  <TableCell>{formatDate(car.purchase_date)}</TableCell>
                  <TableCell>
                    <Badge className={car.status === 'available' ? 'bg-success' : car.status === 'transferred' ? 'bg-orange-500' : ''}>
                      {getStatusText(car.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <PurchaseActions car={car} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
