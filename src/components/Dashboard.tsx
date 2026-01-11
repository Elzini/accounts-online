import { Car, ShoppingCart, DollarSign, TrendingUp, UserPlus, Truck, Package, FileText } from 'lucide-react';
import { StatCard } from './StatCard';
import { Button } from '@/components/ui/button';
import { ActivePage } from '@/types';

interface DashboardProps {
  stats: {
    availableCars: number;
    todaySales: number;
    totalProfit: number;
    monthSales: number;
  };
  setActivePage: (page: ActivePage) => void;
}

export function Dashboard({ stats, setActivePage }: DashboardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">لوحة التحكم</h1>
        <p className="text-muted-foreground mt-1">مرحباً بك في نظام إدارة معرض أشبال النمر للسيارات</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="السيارات المتاحة"
          value={stats.availableCars}
          icon={Car}
          gradient="primary"
          subtitle="سيارة في المخزون"
        />
        <StatCard
          title="مبيعات اليوم"
          value={stats.todaySales}
          icon={ShoppingCart}
          gradient="success"
          subtitle="عملية بيع"
        />
        <StatCard
          title="إجمالي الأرباح"
          value={formatCurrency(stats.totalProfit)}
          icon={DollarSign}
          gradient="warning"
          subtitle="ريال سعودي"
        />
        <StatCard
          title="مبيعات الشهر"
          value={stats.monthSales}
          icon={TrendingUp}
          gradient="danger"
          subtitle="عملية بيع"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Actions */}
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <h2 className="text-xl font-bold text-card-foreground mb-6">الإجراءات السريعة</h2>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => setActivePage('purchases')}
              className="h-auto py-4 flex flex-col items-center gap-2 gradient-primary hover:opacity-90"
            >
              <ShoppingCart className="w-6 h-6" />
              <span>المشتريات</span>
            </Button>
            <Button 
              onClick={() => setActivePage('sales')}
              className="h-auto py-4 flex flex-col items-center gap-2 gradient-success hover:opacity-90"
            >
              <DollarSign className="w-6 h-6" />
              <span>المبيعات</span>
            </Button>
            <Button 
              onClick={() => setActivePage('add-customer')}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-2 hover:bg-primary hover:text-primary-foreground"
            >
              <UserPlus className="w-6 h-6" />
              <span>إضافة عميل</span>
            </Button>
            <Button 
              onClick={() => setActivePage('add-supplier')}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-2 hover:bg-primary hover:text-primary-foreground"
            >
              <Truck className="w-6 h-6" />
              <span>إضافة مورد</span>
            </Button>
          </div>
        </div>

        {/* Reports */}
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <h2 className="text-xl font-bold text-card-foreground mb-6">التقارير</h2>
          <div className="space-y-3">
            <Button 
              onClick={() => setActivePage('inventory-report')}
              variant="ghost"
              className="w-full justify-start gap-3 h-12 hover:bg-primary/10"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium">تقرير المخزون</span>
            </Button>
            <Button 
              onClick={() => setActivePage('profit-report')}
              variant="ghost"
              className="w-full justify-start gap-3 h-12 hover:bg-success/10"
            >
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <span className="font-medium">تقرير الأرباح</span>
            </Button>
            <Button 
              onClick={() => setActivePage('purchases-report')}
              variant="ghost"
              className="w-full justify-start gap-3 h-12 hover:bg-warning/10"
            >
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-warning" />
              </div>
              <span className="font-medium">تقرير المشتريات</span>
            </Button>
            <Button 
              onClick={() => setActivePage('sales-report')}
              variant="ghost"
              className="w-full justify-start gap-3 h-12 hover:bg-blue-500/10"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-500" />
              </div>
              <span className="font-medium">تقرير المبيعات</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
