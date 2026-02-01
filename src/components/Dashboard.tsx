import { Car, ShoppingCart, DollarSign, TrendingUp, UserPlus, Truck, Package, FileText, Users, ArrowDownLeft, ArrowUpRight, Building2, BarChart3, RefreshCw } from 'lucide-react';
import { StatCard } from './StatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActivePage } from '@/types';
import { useMonthlyChartData, useStats } from '@/hooks/useDatabase';
import { useAdvancedAnalytics } from '@/hooks/useAnalytics';
import { useAppSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useCarTransfers, usePartnerDealerships } from '@/hooks/useTransfers';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid } from 'recharts';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Advanced Dashboard Components
import { TrendCard } from './dashboard/TrendCard';
import { InventoryPieChart } from './dashboard/InventoryPieChart';
import { RevenueAreaChart } from './dashboard/RevenueAreaChart';
import { TopPerformersCard } from './dashboard/TopPerformersCard';
import { PerformanceMetrics } from './dashboard/PerformanceMetrics';
import { RecentActivityCard } from './dashboard/RecentActivityCard';
import { StatCardDetailDialog, StatDetailData } from './dashboard/StatCardDetailDialog';

interface DashboardProps {
  stats: {
    availableCars: number;
    todaySales: number;
    totalProfit: number;
    monthSales: number;
    totalPurchases: number;
    monthSalesAmount: number;
    // Extended breakdown
    totalGrossProfit?: number;
    totalCarExpenses?: number;
    totalGeneralExpenses?: number;
    purchasesCount?: number;
    monthSalesProfit?: number;
    totalSalesCount?: number;
    totalSalesAmount?: number;
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
  const queryClient = useQueryClient();
  const { data: chartData, isLoading: chartLoading } = useMonthlyChartData();
  const { data: analytics, isLoading: analyticsLoading } = useAdvancedAnalytics();
  const { data: settings } = useAppSettings();
  const { permissions } = useAuth();
  const { data: transfers } = useCarTransfers();
  const { data: dealerships } = usePartnerDealerships();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailData, setDetailData] = useState<StatDetailData | null>(null);

  const canSales = permissions.admin || permissions.sales;
  const canPurchases = permissions.admin || permissions.purchases;
  const canReports = permissions.admin || permissions.reports;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['stats'] }),
        queryClient.invalidateQueries({ queryKey: ['monthly-chart-data'] }),
        queryClient.invalidateQueries({ queryKey: ['advanced-analytics'] }),
        queryClient.invalidateQueries({ queryKey: ['car-transfers'] }),
        queryClient.invalidateQueries({ queryKey: ['cars'] }),
        queryClient.invalidateQueries({ queryKey: ['sales'] }),
        queryClient.invalidateQueries({ queryKey: ['customers'] }),
        queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
      ]);
      toast.success('تم تحديث البيانات بنجاح');
    } catch (error) {
      toast.error('فشل تحديث البيانات');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate transfer stats by dealership - with car details
  const transferStats = useMemo(() => {
    if (!transfers || !dealerships) return { incoming: [], outgoing: [], incomingCars: [], outgoingCars: [] };

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

    // Get pending incoming cars with details
    const incomingCars = transfers
      .filter(t => t.transfer_type === 'incoming' && t.status === 'pending')
      .map(t => ({
        id: t.id,
        dealershipName: t.partner_dealership?.name || '',
        carName: t.car?.name || '',
        model: t.car?.model || '',
        chassisNumber: t.car?.chassis_number || '',
        status: t.status,
      }));

    // Get pending outgoing cars with details
    const outgoingCars = transfers
      .filter(t => t.transfer_type === 'outgoing' && t.status === 'pending')
      .map(t => ({
        id: t.id,
        dealershipName: t.partner_dealership?.name || '',
        carName: t.car?.name || '',
        model: t.car?.model || '',
        chassisNumber: t.car?.chassis_number || '',
        status: t.status,
      }));

    return { incoming: incomingByDealership, outgoing: outgoingByDealership, incomingCars, outgoingCars };
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

  // Handler to show stat detail dialog
  const showStatDetail = (type: 'availableCars' | 'totalPurchases' | 'monthSales' | 'totalProfit' | 'todaySales' | 'monthSalesCount') => {
    let data: StatDetailData;
    
    switch (type) {
      case 'availableCars':
        data = {
          title: 'السيارات المتاحة',
          value: stats.availableCars,
          subtitle: 'سيارة في المخزون',
          breakdown: [
            { label: 'عدد السيارات المتاحة للبيع', value: stats.availableCars, type: 'total' },
          ],
          formula: 'عدد السيارات بحالة "متاحة" ضمن السنة المالية المحددة',
          notes: [
            'يشمل السيارات المرحّلة من السنة السابقة',
            'لا يشمل السيارات المباعة أو المحوّلة',
          ],
        };
        break;
      
      case 'totalPurchases':
        data = {
          title: 'إجمالي المشتريات',
          value: formatCurrency(stats.totalPurchases),
          subtitle: 'ريال سعودي',
          breakdown: [
            { label: 'عدد السيارات المشتراة', value: stats.purchasesCount || 0 },
            { label: 'إجمالي قيمة المشتريات', value: stats.totalPurchases, type: 'total' },
          ],
          formula: 'مجموع أسعار شراء جميع السيارات ضمن السنة المالية',
          notes: [
            'يشمل السيارات المرحّلة من السنة السابقة',
            'القيمة تمثل رأس المال المستثمر في المخزون',
          ],
        };
        break;
      
      case 'monthSales':
        data = {
          title: 'مبيعات الشهر',
          value: formatCurrency(stats.monthSalesAmount),
          subtitle: 'ريال سعودي',
          breakdown: [
            { label: 'عدد عمليات البيع هذا الشهر', value: stats.monthSales },
            { label: 'إجمالي قيمة المبيعات', value: stats.monthSalesAmount, type: 'add' },
            { label: 'أرباح مبيعات الشهر', value: stats.monthSalesProfit || 0, type: 'total' },
          ],
          formula: 'مجموع أسعار البيع للمبيعات خلال الشهر الحالي',
          notes: [
            'يحتسب من أول يوم في الشهر حتى آخره',
            'محدد بنطاق السنة المالية المختارة',
          ],
        };
        break;
      
      case 'totalProfit':
        data = {
          title: 'إجمالي الأرباح',
          value: formatCurrency(stats.totalProfit),
          subtitle: 'ريال سعودي',
          breakdown: [
            { label: 'إجمالي الربح من المبيعات', value: stats.totalGrossProfit || 0, type: 'add' },
            { label: 'مصاريف مرتبطة بالسيارات المباعة', value: stats.totalCarExpenses || 0, type: 'subtract' },
            { label: 'مصاريف عامة', value: stats.totalGeneralExpenses || 0, type: 'subtract' },
            { label: 'صافي الربح', value: stats.totalProfit, type: 'total' },
          ],
          formula: 'صافي الربح = إجمالي الربح - مصاريف السيارات - المصاريف العامة',
          notes: [
            'الربح الإجمالي = سعر البيع - سعر الشراء - العمولة - مصاريف أخرى',
            'المصاريف المرتبطة بالسيارات تُخصم فقط عند بيع السيارة',
          ],
        };
        break;
      
      case 'todaySales':
        data = {
          title: 'مبيعات اليوم',
          value: stats.todaySales,
          subtitle: 'عملية بيع',
          breakdown: [
            { label: 'عدد عمليات البيع اليوم', value: stats.todaySales, type: 'total' },
          ],
          formula: 'عدد المبيعات بتاريخ اليوم',
          notes: [
            'يتم احتسابها بناءً على تاريخ البيع المسجل',
          ],
        };
        break;
      
      case 'monthSalesCount':
        data = {
          title: 'عدد مبيعات الشهر',
          value: stats.monthSales,
          subtitle: 'عملية بيع',
          breakdown: [
            { label: 'عدد عمليات البيع هذا الشهر', value: stats.monthSales, type: 'total' },
            { label: 'إجمالي قيمة المبيعات', value: stats.monthSalesAmount },
          ],
          formula: 'عدد عمليات البيع خلال الشهر الحالي',
          notes: [
            'يحتسب من أول يوم في الشهر حتى آخره',
          ],
        };
        break;
      
      default:
        return;
    }
    
    setDetailData(data);
    setDetailDialogOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{settings?.dashboard_title || 'لوحة التحكم'}</h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-0.5 sm:mt-1">
            {settings?.welcome_message || 'مرحباً بك في منصة إدارة المعارض للسيارات'}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">تحديث</span>
        </Button>
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full max-w-md grid grid-cols-2 h-9 sm:h-10">
          <TabsTrigger value="overview" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            التحليلات المتقدمة
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
            <StatCard
              title="السيارات المتاحة"
              value={stats.availableCars}
              icon={Car}
              gradient="primary"
              subtitle="سيارة في المخزون"
              onClick={() => showStatDetail('availableCars')}
            />
            <StatCard
              title="إجمالي المشتريات"
              value={formatCurrency(stats.totalPurchases)}
              icon={ShoppingCart}
              gradient="danger"
              subtitle="ريال سعودي"
              onClick={() => showStatDetail('totalPurchases')}
            />
            <StatCard
              title="مبيعات الشهر"
              value={formatCurrency(stats.monthSalesAmount)}
              icon={TrendingUp}
              gradient="success"
              subtitle="ريال سعودي"
              onClick={() => showStatDetail('monthSales')}
            />
            <StatCard
              title="إجمالي الأرباح"
              value={formatCurrency(stats.totalProfit)}
              icon={DollarSign}
              gradient="warning"
              subtitle="ريال سعودي"
              onClick={() => showStatDetail('totalProfit')}
            />
            <StatCard
              title="مبيعات اليوم"
              value={stats.todaySales}
              icon={ShoppingCart}
              gradient="primary"
              subtitle="عملية بيع"
              onClick={() => showStatDetail('todaySales')}
            />
            <StatCard
              title="عدد مبيعات الشهر"
              value={stats.monthSales}
              icon={TrendingUp}
              gradient="success"
              subtitle="عملية بيع"
              onClick={() => showStatDetail('monthSalesCount')}
            />
          </div>

          {/* Partner Dealership Transfers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {/* Incoming Cars */}
            <div className="bg-card rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
                <div>
                  <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-card-foreground flex items-center gap-1.5 sm:gap-2">
                    <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    السيارات الواردة من المعارض
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                    <span className="font-semibold text-primary">{transferStats.incomingCars.length}</span> سيارة قيد الانتظار
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setActivePage('car-transfers')}
                  className="text-primary h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  عرض الكل
                </Button>
              </div>
              {transferStats.incomingCars.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <Building2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-xs sm:text-sm">لا توجد سيارات واردة قيد الانتظار</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                  {transferStats.incomingCars.map((car) => (
                    <div 
                      key={car.id} 
                      className="p-2.5 sm:p-3 bg-primary/5 dark:bg-primary/10 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 cursor-pointer transition-colors"
                      onClick={() => setActivePage('car-transfers')}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <Car className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs sm:text-sm truncate">{car.carName} {car.model}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">شاسيه: {car.chassisNumber}</p>
                          </div>
                        </div>
                        <div className="text-left shrink-0">
                          <p className="text-[10px] sm:text-xs font-medium text-primary truncate max-w-[80px] sm:max-w-none">{car.dealershipName}</p>
                          <Badge variant="outline" className="text-[10px] sm:text-xs h-5">قيد الانتظار</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing Cars */}
            <div className="bg-card rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
                <div>
                  <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-card-foreground flex items-center gap-1.5 sm:gap-2">
                    <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
                    السيارات الصادرة للمعارض
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                    <span className="font-semibold text-warning">{transferStats.outgoingCars.length}</span> سيارة قيد الانتظار
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setActivePage('car-transfers')}
                  className="text-primary h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  عرض الكل
                </Button>
              </div>
              {transferStats.outgoingCars.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <Building2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-xs sm:text-sm">لا توجد سيارات صادرة قيد الانتظار</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                  {transferStats.outgoingCars.map((car) => (
                    <div 
                      key={car.id} 
                      className="p-2.5 sm:p-3 bg-warning/5 dark:bg-warning/10 rounded-lg hover:bg-warning/10 dark:hover:bg-warning/20 cursor-pointer transition-colors"
                      onClick={() => setActivePage('car-transfers')}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                            <Car className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs sm:text-sm truncate">{car.carName} {car.model}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">شاسيه: {car.chassisNumber}</p>
                          </div>
                        </div>
                        <div className="text-left shrink-0">
                          <p className="text-[10px] sm:text-xs font-medium text-warning truncate max-w-[80px] sm:max-w-none">{car.dealershipName}</p>
                          <Badge variant="outline" className="text-[10px] sm:text-xs h-5">قيد الانتظار</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {/* Sales Chart */}
            <div className="bg-card rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm border border-border">
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-card-foreground mb-3 sm:mb-4 md:mb-6">المبيعات الشهرية</h2>
              {chartLoading ? (
                <div className="h-48 sm:h-56 md:h-64 flex items-center justify-center">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-48 sm:h-56 md:h-64 w-full">
                  <BarChart data={(chartData as any[] | undefined) || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      tickFormatter={formatChartValue}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      width={40}
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
            <div className="bg-card rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm border border-border">
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-card-foreground mb-3 sm:mb-4 md:mb-6">الأرباح الشهرية</h2>
              {chartLoading ? (
                <div className="h-48 sm:h-56 md:h-64 flex items-center justify-center">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-success border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-48 sm:h-56 md:h-64 w-full">
                  <LineChart data={(chartData as any[] | undefined) || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      tickFormatter={formatChartValue}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      width={40}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      name="الأرباح"
                      stroke="hsl(var(--success))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5, fill: 'hsl(var(--success))' }}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {/* Main Actions */}
            <div className="bg-card rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm border border-border">
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-card-foreground mb-3 sm:mb-4 md:mb-6">الإجراءات السريعة</h2>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                <Button 
                  onClick={() => setActivePage('purchases')}
                  className="h-auto py-2.5 sm:py-3 md:py-4 flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2 gradient-primary hover:opacity-90 text-[11px] sm:text-xs md:text-sm"
                  disabled={!canPurchases}
                >
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  <span>المشتريات</span>
                </Button>
                <Button 
                  onClick={() => setActivePage('sales')}
                  className="h-auto py-2.5 sm:py-3 md:py-4 flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2 gradient-success hover:opacity-90 text-[11px] sm:text-xs md:text-sm"
                  disabled={!canSales}
                >
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  <span>المبيعات</span>
                </Button>
                <Button 
                  onClick={() => setActivePage('add-customer')}
                  variant="outline"
                  className="h-auto py-2.5 sm:py-3 md:py-4 flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2 border-2 hover:bg-primary hover:text-primary-foreground text-[11px] sm:text-xs md:text-sm"
                  disabled={!canSales}
                >
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  <span>إضافة عميل</span>
                </Button>
                <Button 
                  onClick={() => setActivePage('add-supplier')}
                  variant="outline"
                  className="h-auto py-2.5 sm:py-3 md:py-4 flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2 border-2 hover:bg-primary hover:text-primary-foreground text-[11px] sm:text-xs md:text-sm"
                  disabled={!canPurchases}
                >
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  <span>إضافة مورد</span>
                </Button>
              </div>
            </div>

            {/* Reports */}
            <div className="bg-card rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm border border-border">
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-card-foreground mb-3 sm:mb-4 md:mb-6">التقارير</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 md:gap-3">
                <Button 
                  onClick={() => setActivePage('inventory-report')}
                  variant="ghost"
                  className="w-full justify-start gap-2 md:gap-3 h-9 sm:h-10 md:h-12 hover:bg-primary/10 text-xs sm:text-sm"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <span className="font-medium truncate">تقرير المخزون</span>
                </Button>
                <Button 
                  onClick={() => setActivePage('profit-report')}
                  variant="ghost"
                  className="w-full justify-start gap-2 md:gap-3 h-9 sm:h-10 md:h-12 hover:bg-success/10 text-xs sm:text-sm"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-success" />
                  </div>
                  <span className="font-medium truncate">تقرير الأرباح</span>
                </Button>
                <Button 
                  onClick={() => setActivePage('purchases-report')}
                  variant="ghost"
                  className="w-full justify-start gap-2 md:gap-3 h-9 sm:h-10 md:h-12 hover:bg-warning/10 text-xs sm:text-sm"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-warning" />
                  </div>
                  <span className="font-medium truncate">تقرير المشتريات</span>
                </Button>
                <Button 
                  onClick={() => setActivePage('sales-report')}
                  variant="ghost"
                  className="w-full justify-start gap-2 md:gap-3 h-9 sm:h-10 md:h-12 hover:bg-primary/10 text-xs sm:text-sm"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <span className="font-medium truncate">تقرير المبيعات</span>
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
        </TabsContent>

        {/* Advanced Analytics Tab */}
        <TabsContent value="analytics" className="mt-6 space-y-6">
          {analyticsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : analytics ? (
            <>
              {/* Trend Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TrendCard
                  title="مبيعات هذا الشهر"
                  value={formatCurrency(analytics.salesTrend.thisMonth)}
                  trend={analytics.salesTrend.percentChange}
                  icon={DollarSign}
                  gradient="success"
                />
                <TrendCard
                  title="أرباح هذا الشهر"
                  value={formatCurrency(analytics.profitTrend.thisMonth)}
                  trend={analytics.profitTrend.percentChange}
                  icon={TrendingUp}
                  gradient="primary"
                />
                <TrendCard
                  title="مشتريات هذا الشهر"
                  value={formatCurrency(analytics.purchasesTrend.thisMonth)}
                  trend={analytics.purchasesTrend.percentChange}
                  icon={ShoppingCart}
                  gradient="warning"
                />
              </div>

              {/* Revenue Area Chart & Inventory Pie Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="lg:col-span-2 bg-card rounded-xl md:rounded-2xl p-4 md:p-6 card-shadow">
                  <h3 className="text-lg font-bold text-card-foreground mb-4">تحليل الإيرادات والأرباح</h3>
                  <RevenueAreaChart data={analytics.revenueByMonth} />
                </div>
                <div className="bg-card rounded-xl md:rounded-2xl p-4 md:p-6 card-shadow">
                  <h3 className="text-lg font-bold text-card-foreground mb-4">توزيع المخزون</h3>
                  <InventoryPieChart data={analytics.inventoryByStatus} />
                </div>
              </div>

              {/* Performance Metrics & Top Performers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <PerformanceMetrics
                  averageSalePrice={analytics.averageSalePrice}
                  averageProfitMargin={analytics.averageProfitMargin}
                  inventoryTurnover={analytics.inventoryTurnover}
                  averageDaysToSell={analytics.averageDaysToSell}
                />
                <TopPerformersCard
                  topCustomers={analytics.topCustomers}
                  topSuppliers={analytics.topSuppliers}
                  topCars={analytics.topSellingCars}
                />
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <RecentActivityCard recentSales={analytics.recentSales} />
                
                {/* Summary Stats */}
                <div className="bg-card rounded-xl md:rounded-2xl p-4 md:p-6 card-shadow">
                  <h3 className="text-lg font-bold text-card-foreground mb-4">ملخص الأداء</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">إجمالي السيارات المتاحة</span>
                      <span className="font-bold text-primary">{analytics.inventoryByStatus.available}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">إجمالي السيارات المباعة</span>
                      <span className="font-bold text-success">{analytics.inventoryByStatus.sold}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">السيارات المحولة</span>
                      <span className="font-bold text-warning">{analytics.inventoryByStatus.transferred}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">عدد أفضل العملاء</span>
                      <span className="font-bold">{analytics.topCustomers.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">عدد الموردين النشطين</span>
                      <span className="font-bold">{analytics.topSuppliers.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد بيانات تحليلية متاحة
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Stat Detail Dialog */}
      <StatCardDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        data={detailData}
      />
    </div>
  );
}
