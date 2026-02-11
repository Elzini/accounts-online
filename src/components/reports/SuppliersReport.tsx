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

export function SuppliersReport() {
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { data: cars, isLoading: carsLoading } = useCars();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const { printReport } = usePrintReport();
  const { exportToExcel } = useExcelExport();
  const labels = useIndustryLabels();

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

  const reportTitle = selectedSupplier === 'all' 
    ? 'تقرير الموردين - إجمالي' 
    : `تقرير المورد: ${selectedSupplierData?.name}`;

  const handlePrint = () => {
    printReport({
      title: reportTitle,
      subtitle: 'إحصائيات وتفاصيل الموردين',
      columns: selectedSupplier === 'all' ? [
        { header: 'الاسم', key: 'name' },
        { header: 'رقم الهاتف', key: 'phone' },
        { header: `عدد ${labels.itemsName}`, key: 'cars_count' },
        { header: 'المتاحة', key: 'available' },
        { header: 'المباعة', key: 'sold' },
        { header: 'إجمالي المشتريات', key: 'total_purchases' },
      ] : [
        { header: 'رقم المخزون', key: 'inventory_number' },
        { header: labels.itemName, key: 'car' },
        { header: 'الموديل', key: 'model' },
        { header: 'اللون', key: 'color' },
        { header: 'سعر الشراء', key: 'purchase_price' },
        { header: 'الحالة', key: 'status' },
        { header: 'التاريخ', key: 'date' },
      ],
      data: selectedSupplier === 'all'
        ? supplierStats.map(supplier => ({
            name: supplier.name,
            phone: supplier.phone,
            cars_count: supplier.carsCount,
            available: supplier.availableCars,
            sold: supplier.soldCars,
            total_purchases: `${formatCurrencySimple(supplier.totalPurchases)} ريال`,
          }))
        : filteredCars.map(car => ({
            inventory_number: car.inventory_number,
            car: car.name,
            model: car.model || '-',
            color: car.color || '-',
            purchase_price: `${formatCurrencySimple(Number(car.purchase_price))} ريال`,
            status: car.status === 'available' ? 'متاحة' : car.status === 'transferred' ? 'محولة' : 'مباعة',
            date: formatDate(car.purchase_date),
          })),
      summaryCards: [
        { label: selectedSupplier === 'all' ? 'إجمالي الموردين' : 'المورد', value: selectedSupplier === 'all' ? String(totalSuppliers) : selectedSupplierData?.name || '' },
        { label: `عدد ${labels.itemsName}`, value: String(totalCarsCount) },
        { label: 'إجمالي المشتريات', value: `${formatCurrencySimple(totalPurchasesAmount)} ريال` },
      ],
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: reportTitle,
      columns: selectedSupplier === 'all' ? [
        { header: 'الاسم', key: 'name' },
        { header: 'رقم الهوية', key: 'id_number' },
        { header: 'رقم السجل', key: 'registration_number' },
        { header: 'رقم الهاتف', key: 'phone' },
        { header: 'العنوان', key: 'address' },
        { header: `عدد ${labels.itemsName}`, key: 'cars_count' },
        { header: 'المتاحة', key: 'available' },
        { header: 'المباعة', key: 'sold' },
        { header: 'إجمالي المشتريات', key: 'total_purchases' },
        { header: 'ملاحظات', key: 'notes' },
      ] : [
        { header: 'رقم المخزون', key: 'inventory_number' },
        { header: labels.itemName, key: 'car' },
        { header: 'الموديل', key: 'model' },
        { header: 'اللون', key: 'color' },
        { header: 'رقم الشاسيه', key: 'chassis' },
        { header: 'سعر الشراء', key: 'purchase_price' },
        { header: 'الحالة', key: 'status' },
        { header: 'التاريخ', key: 'date' },
      ],
      data: selectedSupplier === 'all'
        ? supplierStats.map(supplier => ({
            name: supplier.name,
            id_number: supplier.id_number || '-',
            registration_number: supplier.registration_number || '-',
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
            color: car.color || '-',
            chassis: car.chassis_number,
            purchase_price: Number(car.purchase_price),
            status: car.status === 'available' ? 'متاحة' : car.status === 'transferred' ? 'محولة' : 'مباعة',
            date: formatDate(car.purchase_date),
          })),
      summaryData: [
        { label: selectedSupplier === 'all' ? 'إجمالي الموردين' : 'المورد', value: selectedSupplier === 'all' ? totalSuppliers : selectedSupplierData?.name || '' },
        { label: `عدد ${labels.itemsName}`, value: totalCarsCount },
        { label: 'إجمالي المشتريات', value: totalPurchasesAmount },
      ],
      fileName: `تقرير_الموردين_${selectedSupplier === 'all' ? 'إجمالي' : selectedSupplierData?.name}_${new Date().toLocaleDateString('ar-SA')}`,
    });
  };

  // Sort suppliers by purchases
  const sortedSuppliers = [...supplierStats].sort((a, b) => b.totalPurchases - a.totalPurchases);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">تقرير الموردين</h2>
          <p className="text-muted-foreground">إحصائيات وتفاصيل الموردين</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="اختر المورد" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الموردين (إجمالي)</SelectItem>
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
                <p className="text-sm text-muted-foreground">{selectedSupplier === 'all' ? 'إجمالي الموردين' : 'المورد'}</p>
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
                <p className="text-sm text-muted-foreground">عدد {labels.itemsName}</p>
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
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{selectedSupplier === 'all' ? 'الموردين النشطين' : 'آخر توريد'}</p>
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
            <CardTitle>بيانات المورد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">الاسم</p>
                <p className="font-medium">{selectedSupplierData.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                <p className="font-medium">{selectedSupplierData.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">رقم الهوية</p>
                <p className="font-medium">{selectedSupplierData.id_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">العنوان</p>
                <p className="font-medium">{selectedSupplierData.address || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">ملاحظات</p>
                <p className="font-medium">{selectedSupplierData.notes || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{labels.itemsName} المتاحة</p>
                <p className="font-medium text-green-600">{selectedSupplierData.availableCars}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{labels.itemsName} المباعة</p>
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
            <CardTitle>جميع الموردين</CardTitle>
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
                    <TableHead className="text-right">عدد {labels.itemsName}</TableHead>
                    <TableHead className="text-right">المتاحة</TableHead>
                    <TableHead className="text-right">المباعة</TableHead>
                    <TableHead className="text-right">إجمالي المشتريات</TableHead>
                    <TableHead className="text-right">آخر توريد</TableHead>
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
            <CardTitle>{labels.itemsName} المورد</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCars.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد {labels.itemsName} مسجلة لهذا المورد
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم المخزون</TableHead>
                    <TableHead className="text-right">{labels.itemName}</TableHead>
                    <TableHead className="text-right">الموديل</TableHead>
                    <TableHead className="text-right">اللون</TableHead>
                    <TableHead className="text-right">سعر الشراء</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">تاريخ الشراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCars.map((car) => (
                    <TableRow key={car.id}>
                      <TableCell className="font-medium">{car.inventory_number}</TableCell>
                      <TableCell>{car.name}</TableCell>
                      <TableCell>{car.model || '-'}</TableCell>
                      <TableCell>{car.color || '-'}</TableCell>
                      <TableCell>{formatCurrency(Number(car.purchase_price))}</TableCell>
                      <TableCell>
                        <Badge variant={car.status === 'available' ? 'default' : car.status === 'transferred' ? 'default' : 'secondary'}
                          className={car.status === 'transferred' ? 'bg-orange-500' : ''}>
                          {car.status === 'available' ? 'متاحة' : car.status === 'transferred' ? 'محولة' : 'مباعة'}
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
