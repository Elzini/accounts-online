import { Car, ShoppingCart, DollarSign, TrendingUp, UserPlus, Truck, Package, FileText, Users, ArrowDownLeft, ArrowUpRight, Building2 } from 'lucide-react';
import { StatCard } from './StatCard';
import { Button } from '@/components/ui/button';
import { ActivePage } from '@/types';
import { useMonthlyChartData } from '@/hooks/useDatabase';
import { useAppSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useCarTransfers, usePartnerDealerships } from '@/hooks/useTransfers';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid } from 'recharts';
import { useMemo } from 'react';

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
  const { permissions } = useAuth();
  const { data: transfers } = useCarTransfers();
  const { data: dealerships } = usePartnerDealerships();

  const canSales = permissions.admin || permissions.sales;
  const canPurchases = permissions.admin || permissions.purchases;
  const canReports = permissions.admin || permissions.reports;

  // Calculate transfer stats by dealership
  const transferStats = useMemo(() => {
    if (!transfers || !dealerships) return { incoming: [], outgoing: [] };

    const incomingByDealership = dealerships.map(d => {
      const dealershipTransfers = transfers.filter(
        t => t.partner_dealership_id === d.id && t.transfer_type === 'incoming'
      );
      const pending = dealershipTransfers.filter(t => t.status === 'pending').length;
      const total = dealershipTransfers.length;
      return { id: d.id, name: d.name, pending, total };
    }).filter(d => d.total > 0);

    const outgoingByDealership = dealerships.map(d => {
      const dealershipTransfers = transfers.filter(
        t => t.partner_dealership_id === d.id && t.transfer_type === 'outgoing'
      );
      const pending = dealershipTransfers.filter(t => t.status === 'pending').length;
      const total = dealershipTransfers.length;
      return { id: d.id, name: d.name, pending, total };
    }).filter(d => d.total > 0);

    return { incoming: incomingByDealership, outgoing: outgoingByDealership };
  }, [transfers, dealerships]);

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
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{settings?.dashboard_title || 'لوحة التحكم'}</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">{settings?.welcome_message || 'مرحباً بك في نظام إدارة معرض أشبال النمر للسيارات'}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-6">
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

      {/* Partner Dealership Transfers - Always visible */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Incoming Cars */}
          <div className="bg-card rounded-xl md:rounded-2xl p-4 md:p-6 card-shadow">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-bold text-card-foreground flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-blue-500" />
                السيارات الواردة من المعارض
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setActivePage('car-transfers')}
                className="text-primary"
              >
                عرض الكل
              </Button>
            </div>
            {transferStats.incoming.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد سيارات واردة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transferStats.incoming.map((d) => (
                  <div 
                    key={d.id} 
                    className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50 cursor-pointer transition-colors"
                    onClick={() => setActivePage('partner-report')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{d.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {d.pending > 0 && <span className="text-yellow-600">{d.pending} قيد الانتظار</span>}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-blue-600">{d.total}</p>
                      <p className="text-xs text-muted-foreground">سيارة</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Cars */}
          <div className="bg-card rounded-xl md:rounded-2xl p-4 md:p-6 card-shadow">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-bold text-card-foreground flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-orange-500" />
                السيارات الصادرة للمعارض
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setActivePage('car-transfers')}
                className="text-primary"
              >
                عرض الكل
              </Button>
            </div>
            {transferStats.outgoing.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد سيارات صادرة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transferStats.outgoing.map((d) => (
                  <div 
                    key={d.id} 
                    className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-950/50 cursor-pointer transition-colors"
                    onClick={() => setActivePage('partner-report')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{d.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {d.pending > 0 && <span className="text-yellow-600">{d.pending} قيد الانتظار</span>}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-orange-600">{d.total}</p>
                      <p className="text-xs text-muted-foreground">سيارة</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Sales Chart */}
        <div className="bg-card rounded-xl md:rounded-2xl p-4 md:p-6 card-shadow">
          <h2 className="text-lg md:text-xl font-bold text-card-foreground mb-4 md:mb-6">المبيعات الشهرية</h2>
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
        <div className="bg-card rounded-xl md:rounded-2xl p-4 md:p-6 card-shadow">
          <h2 className="text-lg md:text-xl font-bold text-card-foreground mb-4 md:mb-6">الأرباح الشهرية</h2>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Main Actions */}
        <div className="bg-card rounded-xl md:rounded-2xl p-4 md:p-6 card-shadow">
          <h2 className="text-lg md:text-xl font-bold text-card-foreground mb-4 md:mb-6">الإجراءات السريعة</h2>
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <Button 
              onClick={() => setActivePage('purchases')}
              className="h-auto py-3 md:py-4 flex flex-col items-center gap-1 md:gap-2 gradient-primary hover:opacity-90 text-xs md:text-sm"
              disabled={!canPurchases}
            >
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
              <span>المشتريات</span>
            </Button>
            <Button 
              onClick={() => setActivePage('sales')}
              className="h-auto py-3 md:py-4 flex flex-col items-center gap-1 md:gap-2 gradient-success hover:opacity-90 text-xs md:text-sm"
              disabled={!canSales}
            >
              <DollarSign className="w-5 h-5 md:w-6 md:h-6" />
              <span>المبيعات</span>
            </Button>
            <Button 
              onClick={() => setActivePage('add-customer')}
              variant="outline"
              className="h-auto py-3 md:py-4 flex flex-col items-center gap-1 md:gap-2 border-2 hover:bg-primary hover:text-primary-foreground text-xs md:text-sm"
              disabled={!canSales}
            >
              <UserPlus className="w-5 h-5 md:w-6 md:h-6" />
              <span>إضافة عميل</span>
            </Button>
            <Button 
              onClick={() => setActivePage('add-supplier')}
              variant="outline"
              className="h-auto py-3 md:py-4 flex flex-col items-center gap-1 md:gap-2 border-2 hover:bg-primary hover:text-primary-foreground text-xs md:text-sm"
              disabled={!canPurchases}
            >
              <Truck className="w-5 h-5 md:w-6 md:h-6" />
              <span>إضافة مورد</span>
            </Button>
          </div>
        </div>

        {/* Reports */}
        <div className="bg-card rounded-xl md:rounded-2xl p-4 md:p-6 card-shadow">
          <h2 className="text-lg md:text-xl font-bold text-card-foreground mb-4 md:mb-6">التقارير</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
            <Button 
              onClick={() => setActivePage('inventory-report')}
              variant="ghost"
              className="w-full justify-start gap-2 md:gap-3 h-10 md:h-12 hover:bg-primary/10 text-sm"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <span className="font-medium">تقرير المخزون</span>
            </Button>
            <Button 
              onClick={() => setActivePage('profit-report')}
              variant="ghost"
              className="w-full justify-start gap-2 md:gap-3 h-10 md:h-12 hover:bg-success/10 text-sm"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-success" />
              </div>
              <span className="font-medium">تقرير الأرباح</span>
            </Button>
            <Button 
              onClick={() => setActivePage('purchases-report')}
              variant="ghost"
              className="w-full justify-start gap-2 md:gap-3 h-10 md:h-12 hover:bg-warning/10 text-sm"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 md:w-5 md:h-5 text-warning" />
              </div>
              <span className="font-medium">تقرير المشتريات</span>
            </Button>
            <Button 
              onClick={() => setActivePage('sales-report')}
              variant="ghost"
              className="w-full justify-start gap-2 md:gap-3 h-10 md:h-12 hover:bg-blue-500/10 text-sm"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
              </div>
              <span className="font-medium">تقرير المبيعات</span>
            </Button>
            <Button 
              onClick={() => setActivePage('customers-report')}
              variant="ghost"
              className="w-full justify-start gap-2 md:gap-3 h-10 md:h-12 hover:bg-purple-500/10 text-sm"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
              </div>
              <span className="font-medium">تقرير العملاء</span>
            </Button>
            <Button 
              onClick={() => setActivePage('suppliers-report')}
              variant="ghost"
              className="w-full justify-start gap-2 md:gap-3 h-10 md:h-12 hover:bg-orange-500/10 text-sm"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
              </div>
              <span className="font-medium">تقرير الموردين</span>
            </Button>
            <Button 
              onClick={() => setActivePage('commissions-report')}
              variant="ghost"
              className="w-full justify-start gap-2 md:gap-3 h-10 md:h-12 hover:bg-yellow-500/10 text-sm"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
              </div>
              <span className="font-medium">تقرير العمولات</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
