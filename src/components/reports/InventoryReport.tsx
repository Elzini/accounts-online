import { useState, useMemo } from 'react';
import { Package, Car, CheckCircle, Printer, Search, ArrowRightLeft } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCars } from '@/hooks/useDatabase';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { usePrintReport } from '@/hooks/usePrintReport';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useIndustryLabels } from '@/hooks/useIndustryLabels';
import { useLanguage } from '@/contexts/LanguageContext';

export function InventoryReport() {
  const { data: cars = [], isLoading } = useCars();
  const { selectedFiscalYear } = useFiscalYear();
  const labels = useIndustryLabels();
  const { t, language } = useLanguage();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { printReport } = usePrintReport();

  const locale = language === 'ar' ? 'ar-SA' : 'en-US';
  const formatCurrency = (value: number) => new Intl.NumberFormat(locale).format(value);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(locale);

  const getStatusText = (status: string) => {
    if (status === 'available') return t.rpt_status_available;
    if (status === 'transferred') return t.rpt_status_transferred;
    return t.rpt_status_sold;
  };

  const filteredCars = useMemo(() => {
    let base = cars;
    if (selectedFiscalYear) {
      const fyStart = new Date(selectedFiscalYear.start_date);
      fyStart.setHours(0, 0, 0, 0);
      const fyEnd = new Date(selectedFiscalYear.end_date);
      fyEnd.setHours(23, 59, 59, 999);
      base = base.filter((car) => {
        if (car.fiscal_year_id) return car.fiscal_year_id === selectedFiscalYear.id;
        const purchaseDate = new Date(car.purchase_date);
        return purchaseDate >= fyStart && purchaseDate <= fyEnd;
      });
    }
    return base.filter(car => {
      const purchaseDate = new Date(car.purchase_date);
      if (startDate && purchaseDate < new Date(startDate)) return false;
      if (endDate && purchaseDate > new Date(endDate + 'T23:59:59')) return false;
      if (statusFilter !== 'all' && car.status !== statusFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = car.name.toLowerCase().includes(query);
        const matchesChassis = car.chassis_number.toLowerCase().includes(query);
        if (!matchesName && !matchesChassis) return false;
      }
      return true;
    });
  }, [cars, selectedFiscalYear, startDate, endDate, statusFilter, searchQuery]);
  
  const availableCars = filteredCars.filter(c => c.status === 'available');
  const soldCars = filteredCars.filter(c => c.status === 'sold');
  const transferredCars = filteredCars.filter(c => c.status === 'transferred');
  const totalValue = availableCars.reduce((sum, car) => sum + Number(car.purchase_price), 0);

  const handlePrint = () => {
    printReport({
      title: t.rpt_inv_title,
      subtitle: `${t.rpt_inv_subtitle} - ${labels.itemsName}`,
      columns: [
        { header: t.rpt_inv_col_number, key: 'inventory_number' },
        { header: t.rpt_inv_col_name, key: 'name' },
        { header: t.rpt_inv_col_id, key: 'chassis_number' },
        { header: t.rpt_inv_col_model, key: 'model' },
        { header: t.rpt_inv_col_price, key: 'purchase_price' },
        { header: t.rpt_inv_col_date, key: 'purchase_date' },
        { header: t.rpt_inv_col_status, key: 'status' },
      ],
      data: filteredCars.map(car => ({
        inventory_number: car.inventory_number,
        name: car.name,
        chassis_number: car.chassis_number,
        model: car.model || '-',
        purchase_price: `${formatCurrency(Number(car.purchase_price))} ${t.rpt_currency}`,
        purchase_date: formatDate(car.purchase_date),
        status: getStatusText(car.status),
      })),
      summaryCards: [
        { label: `${t.rpt_inv_total} ${labels.itemsName}`, value: String(filteredCars.length) },
        { label: `${labels.itemsName} ${t.rpt_inv_available}`, value: String(availableCars.length) },
        { label: `${labels.itemsName} ${t.rpt_inv_transferred}`, value: String(transferredCars.length) },
        { label: `${labels.itemsName} ${t.rpt_inv_sold}`, value: String(soldCars.length) },
        { label: t.rpt_inv_stock_value, value: `${formatCurrency(totalValue)} ${t.rpt_currency}` },
      ],
    });
  };

  if (isLoading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.rpt_inv_title}</h1>
          <p className="text-muted-foreground">{t.rpt_inv_subtitle} - {labels.itemsName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t.rpt_inv_search} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 w-[250px]" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder={t.rpt_inv_col_status} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.rpt_inv_filter_all} {labels.itemsName}</SelectItem>
              <SelectItem value="available">{t.rpt_inv_filter_available}</SelectItem>
              <SelectItem value="transferred">{t.rpt_inv_filter_transferred}</SelectItem>
              <SelectItem value="sold">{t.rpt_inv_filter_sold}</SelectItem>
            </SelectContent>
          </Select>
          <DateRangeFilter startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} />
          <Button onClick={handlePrint} className="gap-2"><Printer className="w-4 h-4" />{t.rpt_print_report}</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center"><Package className="w-6 h-6 text-white" /></div>
            <div><p className="text-sm text-muted-foreground">{t.rpt_inv_total} {labels.itemsName}</p><p className="text-2xl font-bold">{filteredCars.length}</p></div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center"><CheckCircle className="w-6 h-6 text-white" /></div>
            <div><p className="text-sm text-muted-foreground">{labels.itemsName} {t.rpt_inv_available}</p><p className="text-2xl font-bold text-success">{availableCars.length}</p></div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center"><ArrowRightLeft className="w-6 h-6 text-white" /></div>
            <div><p className="text-sm text-muted-foreground">{labels.itemsName} {t.rpt_inv_transferred}</p><p className="text-2xl font-bold text-orange-600">{transferredCars.length}</p></div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-500 flex items-center justify-center"><Car className="w-6 h-6 text-white" /></div>
            <div><p className="text-sm text-muted-foreground">{labels.itemsName} {t.rpt_inv_sold}</p><p className="text-2xl font-bold">{soldCars.length}</p></div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-warning flex items-center justify-center"><Car className="w-6 h-6 text-white" /></div>
            <div><p className="text-sm text-muted-foreground">{t.rpt_inv_stock_value}</p><p className="text-2xl font-bold">{formatCurrency(totalValue)} {t.rpt_currency}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <div className="p-4 border-b"><h3 className="font-bold">{t.rpt_inv_details}</h3></div>
        {filteredCars.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">{t.rpt_no_data_period}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-bold">{t.rpt_inv_col_number}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_inv_col_name}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_inv_col_id}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_inv_col_model}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_inv_col_price}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_inv_col_date}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_inv_col_status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCars.map((car) => (
                <TableRow key={car.id}>
                  <TableCell>{car.inventory_number}</TableCell>
                  <TableCell className="font-semibold">{car.name}</TableCell>
                  <TableCell className="font-mono text-sm">{car.chassis_number}</TableCell>
                  <TableCell>{car.model}</TableCell>
                  <TableCell>{formatCurrency(Number(car.purchase_price))} {t.rpt_currency}</TableCell>
                  <TableCell>{formatDate(car.purchase_date)}</TableCell>
                  <TableCell>
                    <Badge className={car.status === 'available' ? 'bg-success' : car.status === 'transferred' ? 'bg-orange-500' : ''}>
                      {getStatusText(car.status)}
                    </Badge>
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
