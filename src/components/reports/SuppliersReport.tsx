import { useState, useMemo } from 'react';
import { useSuppliers, useCars } from '@/hooks/useDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Truck, Package, DollarSign, Calendar, Printer, FileSpreadsheet } from 'lucide-react';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { Button } from '@/components/ui/button';
import { usePrintReport } from '@/hooks/usePrintReport';
import { useExcelExport } from '@/hooks/useExcelExport';

export function SuppliersReport() {
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { data: cars, isLoading: carsLoading } = useCars();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { printReport } = usePrintReport();
  const { exportToExcel } = useExcelExport();

  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    
    return suppliers.filter(supplier => {
      const createdAt = new Date(supplier.created_at);
      if (startDate && createdAt < new Date(startDate)) return false;
      if (endDate && createdAt > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });
  }, [suppliers, startDate, endDate]);

  // Calculate purchases per supplier
  const supplierStats = useMemo(() => {
    if (!filteredSuppliers || !cars) return [];

    return filteredSuppliers.map(supplier => {
      const supplierCars = cars.filter(car => car.supplier_id === supplier.id);
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
    });
  }, [filteredSuppliers, cars]);

  if (suppliersLoading || carsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalSuppliers = supplierStats.length;
  const activeSuppliers = supplierStats.filter(s => s.carsCount > 0).length;
  const totalPurchasesAmount = supplierStats.reduce((sum, s) => sum + s.totalPurchases, 0);
  const totalCarsCount = supplierStats.reduce((sum, s) => sum + s.carsCount, 0);

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

  const handlePrint = () => {
    printReport({
      title: 'تقرير الموردين',
      subtitle: 'إحصائيات وتفاصيل الموردين',
      columns: [
        { header: 'الاسم', key: 'name' },
        { header: 'رقم الهوية', key: 'id_number' },
        { header: 'رقم الهاتف', key: 'phone' },
        { header: 'العنوان', key: 'address' },
        { header: 'عدد السيارات', key: 'cars_count' },
        { header: 'إجمالي المشتريات', key: 'total_purchases' },
        { header: 'تاريخ التسجيل', key: 'created_at' },
      ],
      data: supplierStats.map(supplier => ({
        name: supplier.name,
        id_number: supplier.id_number || '-',
        phone: supplier.phone,
        address: supplier.address || '-',
        cars_count: supplier.carsCount,
        total_purchases: `${formatCurrencySimple(supplier.totalPurchases)} ريال`,
        created_at: formatDate(supplier.created_at),
      })),
      summaryCards: [
        { label: 'إجمالي الموردين', value: String(totalSuppliers) },
        { label: 'الموردين النشطين', value: String(activeSuppliers) },
        { label: 'إجمالي المشتريات', value: `${formatCurrencySimple(totalPurchasesAmount)} ريال` },
        { label: 'عدد السيارات', value: String(totalCarsCount) },
      ],
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: 'تقرير الموردين',
      columns: [
        { header: 'الاسم', key: 'name' },
        { header: 'رقم الهوية', key: 'id_number' },
        { header: 'رقم السجل', key: 'registration_number' },
        { header: 'رقم الهاتف', key: 'phone' },
        { header: 'العنوان', key: 'address' },
        { header: 'عدد السيارات', key: 'cars_count' },
        { header: 'السيارات المتاحة', key: 'available_cars' },
        { header: 'السيارات المباعة', key: 'sold_cars' },
        { header: 'إجمالي المشتريات', key: 'total_purchases' },
        { header: 'ملاحظات', key: 'notes' },
        { header: 'تاريخ التسجيل', key: 'created_at' },
      ],
      data: supplierStats.map(supplier => ({
        name: supplier.name,
        id_number: supplier.id_number || '-',
        registration_number: supplier.registration_number || '-',
        phone: supplier.phone,
        address: supplier.address || '-',
        cars_count: supplier.carsCount,
        available_cars: supplier.availableCars,
        sold_cars: supplier.soldCars,
        total_purchases: supplier.totalPurchases,
        notes: supplier.notes || '-',
        created_at: formatDate(supplier.created_at),
      })),
      summaryData: [
        { label: 'إجمالي الموردين', value: totalSuppliers },
        { label: 'الموردين النشطين', value: activeSuppliers },
        { label: 'إجمالي المشتريات', value: totalPurchasesAmount },
        { label: 'عدد السيارات', value: totalCarsCount },
      ],
      fileName: `تقرير_الموردين_${new Date().toLocaleDateString('ar-SA')}`,
    });
  };

  // Sort suppliers by total purchases (top suppliers first)
  const sortedSuppliers = [...supplierStats].sort((a, b) => b.totalPurchases - a.totalPurchases);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">تقرير الموردين</h2>
          <p className="text-muted-foreground">إحصائيات وتفاصيل الموردين</p>
        </div>
        <div className="flex items-center gap-4">
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
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الموردين</p>
                <p className="text-2xl font-bold text-foreground">{totalSuppliers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Truck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الموردين النشطين</p>
                <p className="text-2xl font-bold text-foreground">{activeSuppliers}</p>
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
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalPurchasesAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي السيارات</p>
                <p className="text-2xl font-bold text-foreground">{totalCarsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Suppliers */}
      <Card>
        <CardHeader>
          <CardTitle>أفضل الموردين</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedSuppliers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا يوجد موردين مسجلين
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">رقم الهاتف</TableHead>
                  <TableHead className="text-right">عدد السيارات</TableHead>
                  <TableHead className="text-right">المتاحة</TableHead>
                  <TableHead className="text-right">المباعة</TableHead>
                  <TableHead className="text-right">إجمالي المشتريات</TableHead>
                  <TableHead className="text-right">آخر توريد</TableHead>
                  <TableHead className="text-right">تاريخ التسجيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.phone}</TableCell>
                    <TableCell>{supplier.carsCount}</TableCell>
                    <TableCell className="text-green-600">{supplier.availableCars}</TableCell>
                    <TableCell className="text-blue-600">{supplier.soldCars}</TableCell>
                    <TableCell>{formatCurrency(supplier.totalPurchases)}</TableCell>
                    <TableCell>{supplier.lastPurchaseDate ? formatDate(supplier.lastPurchaseDate) : '-'}</TableCell>
                    <TableCell>{formatDate(supplier.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
