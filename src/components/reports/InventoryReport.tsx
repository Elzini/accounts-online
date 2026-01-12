import { useState, useMemo } from 'react';
import { Package, Car, CheckCircle, FileDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCars } from '@/hooks/useDatabase';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { usePdfExport } from '@/hooks/usePdfExport';

export function InventoryReport() {
  const { data: cars = [], isLoading } = useCars();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { exportToPdf } = usePdfExport();

  const filteredCars = useMemo(() => {
    return cars.filter(car => {
      const purchaseDate = new Date(car.purchase_date);
      if (startDate && purchaseDate < new Date(startDate)) return false;
      if (endDate && purchaseDate > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });
  }, [cars, startDate, endDate]);
  
  const availableCars = filteredCars.filter(c => c.status === 'available');
  const soldCars = filteredCars.filter(c => c.status === 'sold');
  const totalValue = availableCars.reduce((sum, car) => sum + Number(car.purchase_price), 0);

  const formatCurrency = (value: number) => new Intl.NumberFormat('ar-SA').format(value);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ar-SA');

  const handleExportPdf = () => {
    exportToPdf({
      title: 'تقرير المخزون',
      subtitle: 'حالة السيارات في المخزون',
      columns: [
        { header: 'رقم المخزون', key: 'inventory_number' },
        { header: 'اسم السيارة', key: 'name' },
        { header: 'الموديل', key: 'model' },
        { header: 'سعر الشراء', key: 'purchase_price' },
        { header: 'تاريخ الشراء', key: 'purchase_date' },
        { header: 'الحالة', key: 'status' },
      ],
      data: filteredCars.map(car => ({
        inventory_number: car.inventory_number,
        name: car.name,
        model: car.model || '-',
        purchase_price: `${formatCurrency(Number(car.purchase_price))} ريال`,
        purchase_date: formatDate(car.purchase_date),
        status: car.status === 'available' ? 'متاحة' : 'مباعة',
      })),
      summaryCards: [
        { label: 'إجمالي السيارات', value: String(filteredCars.length) },
        { label: 'سيارات متاحة', value: String(availableCars.length) },
        { label: 'سيارات مباعة', value: String(soldCars.length) },
        { label: 'قيمة المخزون', value: `${formatCurrency(totalValue)} ريال` },
      ],
      fileName: `تقرير_المخزون_${new Date().toLocaleDateString('ar-SA')}`,
    });
  };

  if (isLoading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">تقرير المخزون</h1>
          <p className="text-muted-foreground">حالة السيارات في المخزون</p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
          <Button onClick={handleExportPdf} className="gap-2">
            <FileDown className="w-4 h-4" />
            تصدير PDF
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي السيارات</p>
              <p className="text-2xl font-bold">{filteredCars.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">سيارات متاحة</p>
              <p className="text-2xl font-bold text-success">{availableCars.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-500 flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">سيارات مباعة</p>
              <p className="text-2xl font-bold">{soldCars.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-warning flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">قيمة المخزون</p>
              <p className="text-2xl font-bold">{formatCurrency(totalValue)} ريال</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-bold">تفاصيل المخزون</h3>
        </div>
        {filteredCars.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد سيارات في هذه الفترة
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-bold">رقم المخزون</TableHead>
                <TableHead className="text-right font-bold">اسم السيارة</TableHead>
                <TableHead className="text-right font-bold">الموديل</TableHead>
                <TableHead className="text-right font-bold">سعر الشراء</TableHead>
                <TableHead className="text-right font-bold">تاريخ الشراء</TableHead>
                <TableHead className="text-right font-bold">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCars.map((car) => (
                <TableRow key={car.id}>
                  <TableCell>{car.inventory_number}</TableCell>
                  <TableCell className="font-semibold">{car.name}</TableCell>
                  <TableCell>{car.model}</TableCell>
                  <TableCell>{formatCurrency(Number(car.purchase_price))} ريال</TableCell>
                  <TableCell>{formatDate(car.purchase_date)}</TableCell>
                  <TableCell>
                    <Badge className={car.status === 'available' ? 'bg-success' : ''}>
                      {car.status === 'available' ? 'متاحة' : 'مباعة'}
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
