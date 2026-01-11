import { Package, Car, CheckCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCars } from '@/hooks/useDatabase';

export function InventoryReport() {
  const { data: cars = [], isLoading } = useCars();
  
  const availableCars = cars.filter(c => c.status === 'available');
  const totalValue = availableCars.reduce((sum, car) => sum + Number(car.purchase_price), 0);

  const formatCurrency = (value: number) => new Intl.NumberFormat('ar-SA').format(value);

  if (isLoading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-3xl font-bold text-foreground">تقرير المخزون</h1></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl p-6 card-shadow"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center"><Package className="w-6 h-6 text-white" /></div><div><p className="text-sm text-muted-foreground">إجمالي السيارات</p><p className="text-2xl font-bold">{cars.length}</p></div></div></div>
        <div className="bg-card rounded-2xl p-6 card-shadow"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center"><CheckCircle className="w-6 h-6 text-white" /></div><div><p className="text-sm text-muted-foreground">سيارات متاحة</p><p className="text-2xl font-bold text-success">{availableCars.length}</p></div></div></div>
        <div className="bg-card rounded-2xl p-6 card-shadow"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl gradient-warning flex items-center justify-center"><Car className="w-6 h-6 text-white" /></div><div><p className="text-sm text-muted-foreground">قيمة المخزون</p><p className="text-2xl font-bold">{formatCurrency(totalValue)} ريال</p></div></div></div>
      </div>
      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <Table><TableHeader><TableRow className="bg-muted/50"><TableHead className="text-right font-bold">رقم المخزون</TableHead><TableHead className="text-right font-bold">اسم السيارة</TableHead><TableHead className="text-right font-bold">الموديل</TableHead><TableHead className="text-right font-bold">سعر الشراء</TableHead><TableHead className="text-right font-bold">الحالة</TableHead></TableRow></TableHeader>
        <TableBody>{cars.map((car) => (<TableRow key={car.id}><TableCell>{car.inventory_number}</TableCell><TableCell className="font-semibold">{car.name}</TableCell><TableCell>{car.model}</TableCell><TableCell>{formatCurrency(Number(car.purchase_price))} ريال</TableCell><TableCell><Badge className={car.status === 'available' ? 'bg-success' : ''}>{car.status === 'available' ? 'متاحة' : 'مباعة'}</Badge></TableCell></TableRow>))}</TableBody></Table>
      </div>
    </div>
  );
}
