import { FileText, ShoppingCart, Truck } from 'lucide-react';
import { useCars } from '@/hooks/useDatabase';

export function PurchasesReport() {
  const { data: cars = [], isLoading } = useCars();
  const totalPurchases = cars.reduce((sum, car) => sum + Number(car.purchase_price), 0);
  const formatCurrency = (value: number) => new Intl.NumberFormat('ar-SA').format(value);

  if (isLoading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-3xl font-bold text-foreground">تقرير المشتريات</h1></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl p-6 card-shadow"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center"><ShoppingCart className="w-6 h-6 text-white" /></div><div><p className="text-sm text-muted-foreground">عدد المشتريات</p><p className="text-2xl font-bold">{cars.length}</p></div></div></div>
        <div className="bg-card rounded-2xl p-6 card-shadow"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl gradient-warning flex items-center justify-center"><FileText className="w-6 h-6 text-white" /></div><div><p className="text-sm text-muted-foreground">إجمالي المشتريات</p><p className="text-2xl font-bold">{formatCurrency(totalPurchases)} ريال</p></div></div></div>
        <div className="bg-card rounded-2xl p-6 card-shadow"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center"><Truck className="w-6 h-6 text-white" /></div><div><p className="text-sm text-muted-foreground">السيارات المتاحة</p><p className="text-2xl font-bold">{cars.filter(c => c.status === 'available').length}</p></div></div></div>
      </div>
    </div>
  );
}
