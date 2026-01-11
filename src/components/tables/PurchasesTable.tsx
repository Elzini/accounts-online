import { ShoppingCart, Car, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Car as CarType, ActivePage } from '@/types';

interface PurchasesTableProps {
  cars: CarType[];
  setActivePage: (page: ActivePage) => void;
}

export function PurchasesTable({ cars, setActivePage }: PurchasesTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA').format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA').format(new Date(date));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">المشتريات</h1>
          <p className="text-muted-foreground mt-1">إدارة مخزون السيارات</p>
        </div>
        <Button 
          onClick={() => setActivePage('add-purchase')}
          className="gradient-primary hover:opacity-90"
        >
          <ShoppingCart className="w-5 h-5 ml-2" />
          إضافة سيارة
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold">رقم المخزون</TableHead>
              <TableHead className="text-right font-bold">اسم السيارة</TableHead>
              <TableHead className="text-right font-bold">الموديل</TableHead>
              <TableHead className="text-right font-bold">اللون</TableHead>
              <TableHead className="text-right font-bold">رقم الهيكل</TableHead>
              <TableHead className="text-right font-bold">سعر الشراء</TableHead>
              <TableHead className="text-right font-bold">تاريخ الشراء</TableHead>
              <TableHead className="text-right font-bold">الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cars.map((car) => (
              <TableRow key={car.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{car.inventoryNumber}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{car.name}</span>
                  </div>
                </TableCell>
                <TableCell>{car.model}</TableCell>
                <TableCell>{car.color}</TableCell>
                <TableCell dir="ltr" className="text-right font-mono text-sm">{car.chassisNumber}</TableCell>
                <TableCell className="font-semibold text-primary">{formatCurrency(car.purchasePrice)} ريال</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{formatDate(car.purchaseDate)}</span>
                  </div>
                </TableCell>
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
        
        {cars.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">لا يوجد سيارات في المخزون</p>
            <Button 
              onClick={() => setActivePage('add-purchase')}
              className="mt-4 gradient-primary"
            >
              إضافة أول سيارة
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
