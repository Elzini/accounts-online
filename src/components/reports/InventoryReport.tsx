import { Package, Car, CheckCircle, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Car as CarType } from '@/types';

interface InventoryReportProps {
  cars: CarType[];
}

export function InventoryReport({ cars }: InventoryReportProps) {
  const availableCars = cars.filter(c => c.status === 'available');
  const soldCars = cars.filter(c => c.status === 'sold');
  const totalValue = availableCars.reduce((sum, car) => sum + car.purchasePrice, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA').format(value);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">تقرير المخزون</h1>
        <p className="text-muted-foreground mt-1">نظرة شاملة على مخزون السيارات</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي السيارات</p>
              <p className="text-2xl font-bold text-foreground">{cars.length}</p>
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
            <div className="w-12 h-12 rounded-xl gradient-warning flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">قيمة المخزون</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalValue)} ريال</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold">تفاصيل المخزون</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold">رقم المخزون</TableHead>
              <TableHead className="text-right font-bold">اسم السيارة</TableHead>
              <TableHead className="text-right font-bold">الموديل</TableHead>
              <TableHead className="text-right font-bold">اللون</TableHead>
              <TableHead className="text-right font-bold">سعر الشراء</TableHead>
              <TableHead className="text-right font-bold">المورد</TableHead>
              <TableHead className="text-right font-bold">الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cars.map((car) => (
              <TableRow key={car.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{car.inventoryNumber}</TableCell>
                <TableCell className="font-semibold">{car.name}</TableCell>
                <TableCell>{car.model}</TableCell>
                <TableCell>{car.color}</TableCell>
                <TableCell>{formatCurrency(car.purchasePrice)} ريال</TableCell>
                <TableCell>{car.supplierName}</TableCell>
                <TableCell>
                  <Badge variant={car.status === 'available' ? 'default' : 'secondary'}
                    className={car.status === 'available' ? 'bg-success hover:bg-success/90' : ''}>
                    {car.status === 'available' ? 'متاحة' : 'مباعة'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
