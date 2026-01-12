import { Car, ShoppingCart, DollarSign, TrendingUp, UserPlus, Truck, Package, FileText } from 'lucide-react';
import { StatCard } from './StatCard';
import { Button } from '@/components/ui/button';
import { ActivePage } from '@/types';
import { useMonthlyChartData } from '@/hooks/useDatabase';
import { useAppSettings } from '@/hooks/useSettings';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid } from 'recharts';

interface DashboardProps {
  stats: {
    availableCars: number;
    todaySales: number;
    totalProfit: number;
    monthSales: number;
    totalPurchases: number;
    monthSalesAmount: number;
  };
  setActivePage: (page: ActivePage) => void;
}

const chartConfig = {
  sales: {
    label: 'المبيعات',
    color: 'hsl(var(--primary))',
  },
  profit: {
    label: 'الأرباح',
    color: 'hsl(var(--success))',
  },
};

export function Dashboard({ stats, setActivePage }: DashboardProps) {
  const { data: chartData, isLoading: chartLoading } = useMonthlyChartData();
  const { data: settings } = useAppSettings();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatChartValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}م`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}ك`;
    }
    return value.toString();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{settings?.dashboard_title || 'لوحة التحكم'}</h1>
        <p className="text-muted-foreground mt-1">{settings?.welcome_message || 'مرحباً بك في نظام إدارة معرض أشبال النمر للسيارات'}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="السيارات المتاحة"
          value={stats.availableCars}
          icon={Car}
          gradient="primary"
          subtitle="سيارة في المخزون"
        />
        <StatCard
          title="إجمالي المشتريات"
          value={formatCurrency(stats.totalPurchases)}
          icon={ShoppingCart}
          gradient="danger"
          subtitle="ريال سعودي"
        />
        <StatCard
          title="مبيعات الشهر"
          value={formatCurrency(stats.monthSalesAmount)}
          icon={TrendingUp}
          gradient="success"
          subtitle="ريال سعودي"
        />
        <StatCard
          title="إجمالي الأرباح"
          value={formatCurrency(stats.totalProfit)}
          icon={DollarSign}
          gradient="warning"
          subtitle="ريال سعودي"
        />
        <StatCard
          title="مبيعات اليوم"
          value={stats.todaySales}
          icon={ShoppingCart}
          gradient="primary"
          subtitle="عملية بيع"
        />
        <StatCard
          title="عدد مبيعات الشهر"
          value={stats.monthSales}
          icon={TrendingUp}
          gradient="success"
          subtitle="عملية بيع"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <h2 className="text-xl font-bold text-card-foreground mb-6">المبيعات الشهرية</h2>
          {chartLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <BarChart data={chartData || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tickFormatter={formatChartValue}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} 
                />
                <Bar 
                  dataKey="sales" 
                  name="المبيعات"
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </div>

        {/* Profit Chart */}
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <h2 className="text-xl font-bold text-card-foreground mb-6">الأرباح الشهرية</h2>
          {chartLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-success border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <LineChart data={chartData || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tickFormatter={formatChartValue}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} 
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  name="الأرباح"
                  stroke="hsl(var(--success))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--success))' }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </div>
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
