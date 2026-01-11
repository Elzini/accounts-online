import { TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import { useSales } from '@/hooks/useDatabase';

export function ProfitReport() {
  const { data: sales = [], isLoading } = useSales();
  const totalProfit = sales.reduce((sum, sale) => sum + Number(sale.profit), 0);
  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.sale_price), 0);
  const formatCurrency = (value: number) => new Intl.NumberFormat('ar-SA').format(value);

  if (isLoading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-3xl font-bold text-foreground">تقرير الأرباح</h1></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl p-6 card-shadow"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center"><TrendingUp className="w-6 h-6 text-white" /></div><div><p className="text-sm text-muted-foreground">إجمالي الأرباح</p><p className="text-2xl font-bold text-success">{formatCurrency(totalProfit)} ريال</p></div></div></div>
        <div className="bg-card rounded-2xl p-6 card-shadow"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center"><DollarSign className="w-6 h-6 text-white" /></div><div><p className="text-sm text-muted-foreground">إجمالي المبيعات</p><p className="text-2xl font-bold">{formatCurrency(totalSales)} ريال</p></div></div></div>
        <div className="bg-card rounded-2xl p-6 card-shadow"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl gradient-warning flex items-center justify-center"><ShoppingCart className="w-6 h-6 text-white" /></div><div><p className="text-sm text-muted-foreground">عدد المبيعات</p><p className="text-2xl font-bold">{sales.length}</p></div></div></div>
      </div>
    </div>
  );
}
