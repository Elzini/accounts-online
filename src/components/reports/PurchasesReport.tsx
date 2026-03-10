import { useState, useMemo } from 'react';
import { FileText, ShoppingCart, Truck, Printer, RefreshCw, Filter } from 'lucide-react';
import { useCars, useSuppliers } from '@/hooks/useDatabase';
import { useExpenses } from '@/hooks/useExpenses';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function PurchasesReport() {
  const { data: cars = [], isLoading, refetch } = useCars();
  const { data: suppliers = [] } = useSuppliers();
  const { data: allExpenses = [] } = useExpenses();
  const { filterByFiscalYear } = useFiscalYearFilter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'sold'>('all');
  const { printReport } = usePrintReport();
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  const { t, language } = useLanguage();

  const locale = language === 'ar' ? 'ar-SA' : 'en-US';
  const formatCurrency = (value: number) => new Intl.NumberFormat(locale).format(value);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(locale);
  const getStatusText = (status: string) => status === 'available' ? t.rpt_status_available : status === 'transferred' ? t.rpt_status_transferred : t.rpt_status_sold;

  const suppliersMap = useMemo(() => {
    return suppliers.reduce((acc, supplier) => {
      acc[supplier.id] = supplier;
      return acc;
    }, {} as Record<string, typeof suppliers[0]>);
  }, [suppliers]);

  const carExpensesMap = useMemo(() => {
    const map: Record<string, { description: string; amount: number }[]> = {};
    allExpenses.forEach(exp => {
      if (exp.car_id) {
        if (!map[exp.car_id]) map[exp.car_id] = [];
        map[exp.car_id].push({ description: exp.description, amount: Number(exp.amount) });
      }
    });
    return map;
  }, [allExpenses]);

  const getCarExpensesTotal = (carId: string) =>
    (carExpensesMap[carId] || []).reduce((sum, e) => sum + e.amount, 0);

  const carsWithSuppliers = useMemo(() => {
    return cars.map(car => ({
      ...car,
      supplier: car.supplier_id ? suppliersMap[car.supplier_id] : null,
    }));
  }, [cars, suppliersMap]);

  const filteredCars = useMemo(() => {
    let result = filterByFiscalYear(carsWithSuppliers, 'purchase_date');
    
    result = result.filter(car => {
      const purchaseDate = new Date(car.purchase_date);
      if (startDate && purchaseDate < new Date(startDate)) return false;
      if (endDate && purchaseDate > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });

    if (statusFilter === 'available') {
      result = result.filter(car => car.status === 'available');
    } else if (statusFilter === 'sold') {
      result = result.filter(car => car.status === 'sold');
    }

    return result;
  }, [carsWithSuppliers, startDate, endDate, filterByFiscalYear, statusFilter]);

  const totalPurchases = filteredCars.reduce((sum, car) => sum + Number(car.purchase_price), 0);
  const totalExpenses = filteredCars.reduce((sum, car) => sum + getCarExpensesTotal(car.id), 0);
  const grandTotal = totalPurchases + totalExpenses;

  const getFilterLabel = () => {
    if (statusFilter === 'available') return 'السيارات المتاحة';
    if (statusFilter === 'sold') return 'السيارات المباعة';
    return t.rpt_purch_title;
  };

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
    queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
    queryClient.invalidateQueries({ queryKey: ['advanced-analytics', companyId] });
    queryClient.invalidateQueries({ queryKey: ['monthly-chart-data', companyId] });
  };

  const handlePrint = () => {
    const printTitle = statusFilter === 'available' 
      ? 'تقرير مشتريات السيارات المتاحة' 
      : statusFilter === 'sold' 
        ? 'تقرير مشتريات السيارات المباعة' 
        : t.rpt_purch_title;

    printReport({
      title: printTitle,
      subtitle: t.rpt_purch_subtitle,
      columns: [
        { header: t.rpt_purch_col_number, key: 'inventory_number' },
        { header: t.rpt_purch_col_item, key: 'name' },
        { header: t.rpt_purch_col_model, key: 'model' },
        { header: 'رقم اللوحة', key: 'plate_number' },
        { header: t.rpt_purch_col_chassis, key: 'chassis_number' },
        { header: t.rpt_purch_col_price, key: 'purchase_price' },
        { header: 'المصروفات', key: 'expenses' },
        { header: 'الإجمالي', key: 'total_cost' },
        { header: t.rpt_purch_col_date, key: 'purchase_date' },
        { header: t.rpt_purch_col_status, key: 'status' },
      ],
      data: filteredCars.map(car => {
        const expTotal = getCarExpensesTotal(car.id);
        const total = Number(car.purchase_price) + expTotal;
        return {
          inventory_number: car.inventory_number,
          name: car.name,
          model: car.model || '-',
          plate_number: car.plate_number || '-',
          chassis_number: car.chassis_number,
          purchase_price: `${formatCurrency(Number(car.purchase_price))} ${t.rpt_currency}`,
          expenses: `${formatCurrency(expTotal)} ${t.rpt_currency}`,
          total_cost: `${formatCurrency(total)} ${t.rpt_currency}`,
          purchase_date: formatDate(car.purchase_date),
          status: getStatusText(car.status),
        };
      }),
      summaryCards: [
        { label: `عدد ${getFilterLabel()}`, value: String(filteredCars.length) },
        { label: `إجمالي مشتريات ${getFilterLabel()}`, value: `${formatCurrency(totalPurchases)} ${t.rpt_currency}` },
        { label: 'إجمالي المصروفات', value: `${formatCurrency(totalExpenses)} ${t.rpt_currency}` },
        { label: 'الإجمالي الكلي', value: `${formatCurrency(grandTotal)} ${t.rpt_currency}` },
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
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'available' | 'sold')}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 ml-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="available">المتاحة</SelectItem>
              <SelectItem value="sold">المباعة</SelectItem>
            </SelectContent>
          </Select>
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
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">عدد {getFilterLabel()}</p>
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
              <p className="text-sm text-muted-foreground">إجمالي المشتريات</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPurchases)} {t.rpt_currency}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
              <p className="text-2xl font-bold">{formatCurrency(totalExpenses)} {t.rpt_currency}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الإجمالي الكلي</p>
              <p className="text-2xl font-bold">{formatCurrency(grandTotal)} {t.rpt_currency}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold">{t.rpt_purch_details} - {getFilterLabel()}</h3>
          {statusFilter !== 'all' && (
            <Badge variant="secondary">{getFilterLabel()} ({filteredCars.length})</Badge>
          )}
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
                <TableHead className="text-right font-bold">رقم اللوحة</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_purch_col_chassis}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_purch_col_price}</TableHead>
                <TableHead className="text-right font-bold">المصروفات</TableHead>
                <TableHead className="text-right font-bold">الإجمالي</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_purch_col_date}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_purch_col_status}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_purch_col_actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCars.map((car) => {
                const expTotal = getCarExpensesTotal(car.id);
                const expDetails = carExpensesMap[car.id] || [];
                const total = Number(car.purchase_price) + expTotal;
                return (
                <TableRow key={car.id}>
                  <TableCell>{car.inventory_number}</TableCell>
                  <TableCell className="font-semibold">{car.name}</TableCell>
                  <TableCell>{car.model || '-'}</TableCell>
                  <TableCell>{car.plate_number || '-'}</TableCell>
                  <TableCell className="font-mono text-sm">{car.chassis_number}</TableCell>
                  <TableCell>{formatCurrency(Number(car.purchase_price))} {t.rpt_currency}</TableCell>
                  <TableCell>
                    {expTotal > 0 ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="cursor-help underline decoration-dotted">
                            {formatCurrency(expTotal)} {t.rpt_currency}
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1 text-sm">
                              {expDetails.map((e, i) => (
                                <div key={i} className="flex justify-between gap-4">
                                  <span>{e.description}</span>
                                  <span>{formatCurrency(e.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="font-bold">{formatCurrency(total)} {t.rpt_currency}</TableCell>
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
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
