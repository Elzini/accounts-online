import { FileText, ShoppingCart, Truck, Calendar } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Car } from '@/types';

interface PurchasesReportProps {
  cars: Car[];
}

export function PurchasesReport({ cars }: PurchasesReportProps) {
  const totalPurchases = cars.reduce((sum, car) => sum + car.purchasePrice, 0);
  const supplierStats = cars.reduce((acc, car) => {
    if (!acc[car.supplierName]) {
      acc[car.supplierName] = { count: 0, total: 0 };
    }
    acc[car.supplierName].count++;
    acc[car.supplierName].total += car.purchasePrice;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA').format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA').format(new Date(date));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">تقرير المشتريات</h1>
        <p className="text-muted-foreground mt-1">تحليل شامل لعمليات الشراء</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">عدد المشتريات</p>
              <p className="text-2xl font-bold text-foreground">{cars.length}</p>
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
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalPurchases)} ريال</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">عدد الموردين</p>
              <p className="text-2xl font-bold text-foreground">{Object.keys(supplierStats).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Summary */}
      <div className="bg-card rounded-2xl p-6 card-shadow">
        <h2 className="text-lg font-bold mb-4">ملخص الموردين</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(supplierStats).map(([name, stats]) => (
            <div key={name} className="p-4 rounded-xl bg-muted/50">
              <p className="font-semibold text-foreground">{name}</p>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-muted-foreground">{stats.count} سيارة</span>
                <span className="font-medium">{formatCurrency(stats.total)} ريال</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold">تفاصيل المشتريات</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold">رقم المخزون</TableHead>
              <TableHead className="text-right font-bold">اسم السيارة</TableHead>
              <TableHead className="text-right font-bold">الموديل</TableHead>
              <TableHead className="text-right font-bold">المورد</TableHead>
              <TableHead className="text-right font-bold">سعر الشراء</TableHead>
              <TableHead className="text-right font-bold">تاريخ الشراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cars.map((car) => (
              <TableRow key={car.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{car.inventoryNumber}</TableCell>
                <TableCell className="font-semibold">{car.name}</TableCell>
                <TableCell>{car.model}</TableCell>
                <TableCell>{car.supplierName}</TableCell>
                <TableCell className="font-semibold text-primary">{formatCurrency(car.purchasePrice)} ريال</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{formatDate(car.purchaseDate)}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
