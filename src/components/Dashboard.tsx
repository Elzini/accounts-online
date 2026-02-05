import { Car, ShoppingCart, DollarSign, TrendingUp, UserPlus, Truck, Package, FileText, Users, ArrowDownLeft, ArrowUpRight, Building2, BarChart3, RefreshCw, CreditCard, Calendar, AlertTriangle } from 'lucide-react';
import { StatCard } from './StatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActivePage } from '@/types';
import { useMonthlyChartData, useStats, useSales, useCars, useAllTimeStats } from '@/hooks/useDatabase';
import { useAdvancedAnalytics } from '@/hooks/useAnalytics';
import { useAppSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useCarTransfers, usePartnerDealerships } from '@/hooks/useTransfers';
import { useInstallmentSales } from '@/hooks/useInstallments';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid } from 'recharts';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useDashboardConfig, useSaveDashboardConfig } from '@/hooks/useSystemControl';
import { CardConfig, DEFAULT_STAT_CARDS } from './dashboard/DashboardCustomizer';

// Advanced Dashboard Components
import { TrendCard } from './dashboard/TrendCard';
import { InventoryPieChart } from './dashboard/InventoryPieChart';
import { RevenueAreaChart } from './dashboard/RevenueAreaChart';
import { TopPerformersCard } from './dashboard/TopPerformersCard';
import { PerformanceMetrics } from './dashboard/PerformanceMetrics';
import { RecentActivityCard } from './dashboard/RecentActivityCard';
import { StatCardDetailDialog, StatDetailData, CarDetailItem } from './dashboard/StatCardDetailDialog';
import { AmountDisplaySelector, AmountDisplayMode, calculateDisplayAmount, getDisplayModeLabel } from './dashboard/AmountDisplaySelector';
import { WelcomeHeader } from './dashboard/WelcomeHeader';
import { QuickAccessSection } from './dashboard/QuickAccessSection';
import { RecentInvoicesCard } from './dashboard/RecentInvoicesCard';
import { OnlineUsersCard } from './dashboard/OnlineUsersCard';
import { PaymentRemindersCard } from './dashboard/PaymentRemindersCard';
import { CustomizeInterfaceButton } from './dashboard/CustomizeInterfaceButton';
import { OnlineUsersPopover } from './dashboard/OnlineUsersPopover';
import { PaymentRemindersPopover } from './dashboard/PaymentRemindersPopover';
import { 
  DashboardEditToolbar, 
  EditableWidgetWrapper, 
  useWidgetDragDrop, 
  WidgetConfig, 
  DEFAULT_WIDGETS 
} from './dashboard/DashboardEditMode';

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
    // Detailed expense breakdown
    payrollExpenses?: number;
    prepaidExpensesDue?: number;
    otherGeneralExpenses?: number;
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
  const { data: installmentSales = [] } = useInstallmentSales();
  const { data: allSales = [] } = useSales();
  const { data: allCars = [] } = useCars();
  const { data: allTimeStats } = useAllTimeStats();
  const { selectedFiscalYear } = useFiscalYear();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailData, setDetailData] = useState<StatDetailData | null>(null);
  const [amountDisplayMode, setAmountDisplayMode] = useState<AmountDisplayMode>('total');
  
  // Dashboard customization
  const { data: dashboardConfig } = useDashboardConfig();
  const saveDashboardConfig = useSaveDashboardConfig();
  const [cardConfigs, setCardConfigs] = useState<CardConfig[]>(DEFAULT_STAT_CARDS);
  
  // Widget-level edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgetConfigs, setWidgetConfigs] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  
  // Widget drag and drop
  const {
    draggedId,
    dragOverId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    removeWidget,
  } = useWidgetDragDrop(widgetConfigs, setWidgetConfigs);
  
  // Load card configs from saved dashboard config
  useEffect(() => {
    if (dashboardConfig?.stat_cards && dashboardConfig.stat_cards.length > 0) {
      const savedIds = new Set(dashboardConfig.stat_cards.map((c: any) => c.id));
      const mergedCards = [
        ...dashboardConfig.stat_cards.map((c: any) => ({
          id: c.id,
          type: c.type || 'stat',
          label: c.label,
          visible: c.visible ?? true,
          order: c.order ?? 0,
          size: c.size || 'medium',
          bgColor: c.bgColor || '',
          fontSize: c.fontSize || 100,
        })),
        ...DEFAULT_STAT_CARDS.filter(dc => !savedIds.has(dc.id)).map((dc, i) => ({
          ...dc,
          order: dashboardConfig.stat_cards.length + i,
          fontSize: 100,
          bgColor: '',
        })),
      ].sort((a, b) => a.order - b.order);
      setCardConfigs(mergedCards);
    }
  }, [dashboardConfig]);

  const handleCardsConfigChange = useCallback((cards: CardConfig[]) => {
    setCardConfigs(cards);
  }, []);

  // Load widget configs from saved dashboard config
  useEffect(() => {
    if (dashboardConfig?.layout_settings?.widgets) {
      setWidgetConfigs(dashboardConfig.layout_settings.widgets);
    }
  }, [dashboardConfig]);

  // Enter edit mode
  const enterEditMode = useCallback(() => {
    setIsEditMode(true);
  }, []);

  // Save widget config
  const saveWidgetConfig = useCallback(async (widgets: WidgetConfig[]) => {
    try {
      await saveDashboardConfig.mutateAsync({
        layout_settings: { widgets } as any,
      });
      setIsEditMode(false);
      toast.success('تم حفظ ترتيب لوحة التحكم');
    } catch (error) {
      console.error('Error saving widget config:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    }
  }, [saveDashboardConfig]);

  // Cancel edit mode
  const cancelEditMode = useCallback(() => {
    // Reset to saved config
    if (dashboardConfig?.layout_settings?.widgets) {
      setWidgetConfigs(dashboardConfig.layout_settings.widgets);
    } else {
      setWidgetConfigs(DEFAULT_WIDGETS);
    }
    setIsEditMode(false);
  }, [dashboardConfig]);

  // Check if widget is visible
  const isWidgetVisible = useCallback((id: string) => {
    const widget = widgetConfigs.find(w => w.id === id);
    return widget?.visible ?? true;
  }, [widgetConfigs]);

  // Get sorted widgets
  const sortedWidgets = useMemo(() => {
    return [...widgetConfigs].sort((a, b) => a.order - b.order).filter(w => w.visible);
  }, [widgetConfigs]);

  // Helper to get card config by id
  const getCardConfig = useCallback((id: string) => {
    return cardConfigs.find(c => c.id === id) || { visible: true, size: 'medium' as const, bgColor: '', fontSize: 100 };
  }, [cardConfigs]);

  // Get visible cards sorted by order
  const visibleCardIds = useMemo(() => {
    return cardConfigs.filter(c => c.visible).sort((a, b) => a.order - b.order).map(c => c.id);
  }, [cardConfigs]);

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

  // Format currency with display mode applied
  const formatCurrencyWithMode = (value: number) => {
    const displayValue = calculateDisplayAmount(value, amountDisplayMode);
    return formatCurrency(displayValue);
  };

  // Get subtitle with mode indicator
  const getCurrencySubtitle = () => {
    return `ريال سعودي (${getDisplayModeLabel(amountDisplayMode)})`;
  };

  const formatChartValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}م`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}ك`;
    }
    return value.toString();
  };

  // Helper: filter sales by fiscal year
  const fiscalYearSales = useMemo(() => {
    if (!selectedFiscalYear) return allSales;
    const startDate = new Date(selectedFiscalYear.start_date);
    const endDate = new Date(selectedFiscalYear.end_date);
    return allSales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      return saleDate >= startDate && saleDate <= endDate;
    });
  }, [allSales, selectedFiscalYear]);

  // Helper: filter cars by fiscal year
  const fiscalYearCars = useMemo(() => {
    if (!selectedFiscalYear) return allCars;
    return allCars.filter(car => {
      if (car.fiscal_year_id) return car.fiscal_year_id === selectedFiscalYear.id;
      const purchaseDate = new Date(car.purchase_date);
      const startDate = new Date(selectedFiscalYear.start_date);
      const endDate = new Date(selectedFiscalYear.end_date);
      return purchaseDate >= startDate && purchaseDate <= endDate;
    });
  }, [allCars, selectedFiscalYear]);

  // Helper: build car detail items from sales
  const buildSalesCarDetails = (sales: typeof fiscalYearSales): CarDetailItem[] => {
    const items: CarDetailItem[] = [];
    for (const sale of sales) {
      const saleItems = (sale as any).sale_items || [];
      if (saleItems.length > 0) {
        for (const item of saleItems) {
          items.push({
            id: item.id,
            name: item.car?.name || 'سيارة',
            model: item.car?.model || '',
            chassisNumber: item.car?.chassis_number || '',
            purchasePrice: Number(item.car?.purchase_price) || 0,
            salePrice: Number(item.sale_price) || 0,
            profit: Number(item.profit) || 0,
            saleDate: sale.sale_date,
          });
        }
      } else {
        items.push({
          id: sale.id,
          name: sale.car?.name || 'سيارة',
          model: sale.car?.model || '',
          chassisNumber: sale.car?.chassis_number || '',
          purchasePrice: Number(sale.car?.purchase_price) || 0,
          salePrice: Number(sale.sale_price) || 0,
          profit: Number(sale.profit) || 0,
          saleDate: sale.sale_date,
        });
      }
    }
    return items;
  };

  // Helper: build car detail items from cars (for purchases)
  const buildPurchaseCarDetails = (cars: typeof fiscalYearCars): CarDetailItem[] => {
    return cars.map(car => ({
      id: car.id,
      name: car.name,
      model: car.model || '',
      chassisNumber: car.chassis_number,
      purchasePrice: Number(car.purchase_price),
      status: car.status,
    }));
  };

  // Handler to show stat detail dialog
  const showStatDetail = (type: 'availableCars' | 'totalPurchases' | 'monthSales' | 'totalProfit' | 'todaySales' | 'monthSalesCount' | 'allTimePurchases' | 'allTimeSales') => {
    let data: StatDetailData;
    
    const now = new Date();
    // Use local date formatting to avoid timezone issues
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const today = formatLocalDate(now);
    const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfMonth = formatLocalDate(startOfMonthDate);
    const endOfMonth = formatLocalDate(endOfMonthDate);
    
    switch (type) {
      case 'availableCars': {
        const availableCars = fiscalYearCars.filter(c => c.status === 'available');
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
          showCarsTable: true,
          cars: buildPurchaseCarDetails(availableCars),
        };
        break;
      }
      
      case 'totalPurchases': {
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
          showCarsTable: true,
          cars: buildPurchaseCarDetails(fiscalYearCars),
        };
        break;
      }
      
      case 'monthSales': {
        const monthSales = fiscalYearSales.filter(s => s.sale_date >= startOfMonth && s.sale_date <= endOfMonth);
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
          showCarsTable: true,
          cars: buildSalesCarDetails(monthSales),
        };
        break;
      }
      
      case 'totalProfit': {
        data = {
          title: 'إجمالي الأرباح',
          value: formatCurrency(stats.totalProfit),
          subtitle: 'ريال سعودي',
          breakdown: [
            { label: 'إجمالي الربح من المبيعات', value: stats.totalGrossProfit || 0, type: 'add' },
            { label: 'مصاريف مرتبطة بالسيارات المباعة', value: stats.totalCarExpenses || 0, type: 'subtract' },
            { label: 'مصاريف الرواتب والأجور', value: stats.payrollExpenses || 0, type: 'subtract' },
            { label: 'الإيجار والمصاريف المقدمة المستحقة', value: stats.prepaidExpensesDue || 0, type: 'subtract' },
            { label: 'مصاريف تشغيلية أخرى', value: stats.otherGeneralExpenses || 0, type: 'subtract' },
            { label: 'صافي الربح', value: stats.totalProfit, type: 'total' },
          ],
          formula: 'صافي الربح = إجمالي الربح - مصاريف السيارات - الرواتب - الإيجار - المصاريف الأخرى',
          notes: [
            'الربح الإجمالي = سعر البيع - سعر الشراء - العمولة - مصاريف أخرى',
            'المصاريف المرتبطة بالسيارات تُخصم فقط عند بيع السيارة',
            'مصاريف الرواتب تشمل جميع مسيرات الرواتب المعتمدة',
            'الإيجار يشمل أقساط المصاريف المقدمة المستحقة حتى اليوم',
          ],
          showCarsTable: true,
          cars: buildSalesCarDetails(fiscalYearSales),
        };
        break;
      }
      
      case 'todaySales': {
        const todaySales = fiscalYearSales.filter(s => s.sale_date === today);
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
          showCarsTable: todaySales.length > 0,
          cars: buildSalesCarDetails(todaySales),
        };
        break;
      }
      
      case 'monthSalesCount': {
        const monthSales = fiscalYearSales.filter(s => s.sale_date >= startOfMonth && s.sale_date <= endOfMonth);
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
          showCarsTable: monthSales.length > 0,
          cars: buildSalesCarDetails(monthSales),
        };
        break;
      }
      
      case 'allTimePurchases': {
        data = {
          title: 'إجمالي مشتريات الشركة (كل السنين)',
          value: formatCurrency(allTimeStats?.allTimePurchases || 0),
          subtitle: 'ريال سعودي',
          breakdown: [
            { label: 'عدد السيارات المشتراة', value: allTimeStats?.totalCarsCount || 0 },
            { label: 'إجمالي قيمة المشتريات', value: allTimeStats?.allTimePurchases || 0, type: 'total' },
          ],
          formula: 'مجموع أسعار شراء جميع السيارات في جميع السنوات المالية',
          notes: [
            'يشمل جميع السنوات المالية',
            'القيمة تمثل إجمالي رأس المال المستثمر تاريخياً',
          ],
          showCarsTable: true,
          cars: buildPurchaseCarDetails(allCars),
        };
        break;
      }
      
      case 'allTimeSales': {
        data = {
          title: 'إجمالي مبيعات الشركة (كل السنين)',
          value: formatCurrency(allTimeStats?.allTimeSales || 0),
          subtitle: 'ريال سعودي',
          breakdown: [
            { label: 'عدد عمليات البيع', value: allTimeStats?.allTimeSalesCount || 0 },
            { label: 'إجمالي قيمة المبيعات', value: allTimeStats?.allTimeSales || 0, type: 'add' },
            { label: 'إجمالي الأرباح', value: allTimeStats?.allTimeProfit || 0, type: 'total' },
          ],
          formula: 'مجموع أسعار البيع لجميع المبيعات في جميع السنوات المالية',
          notes: [
            'يشمل جميع السنوات المالية',
            'يعكس حجم النشاط التجاري الإجمالي للشركة',
          ],
          showCarsTable: true,
          cars: buildSalesCarDetails(allSales),
        };
        break;
      }
      
      default:
        return;
    }
    
    setDetailData(data);
    setDetailDialogOpen(true);
  };


  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <WelcomeHeader
        amountDisplayMode={amountDisplayMode}
        onAmountDisplayModeChange={setAmountDisplayMode}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

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
        <TabsContent value="overview" className={cn("mt-4 sm:mt-6 space-y-4 sm:space-y-6", isEditMode && "pt-28")}>
          {/* Edit Mode Toolbar */}
          <DashboardEditToolbar
            isEditMode={isEditMode}
            onSave={saveWidgetConfig}
            onCancel={cancelEditMode}
            widgets={widgetConfigs}
            onWidgetsChange={setWidgetConfigs}
          />

          {/* Top Toolbar with Users & Notifications */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CustomizeInterfaceButton 
              setActivePage={setActivePage} 
              onCardsConfigChange={handleCardsConfigChange}
              onEnterEditMode={enterEditMode}
              isEditMode={isEditMode}
            />
            
            <div className="flex items-center gap-3">
              {/* Online Users Popover */}
              <OnlineUsersPopover />
              
              {/* Payment Notifications Popover */}
              <PaymentRemindersPopover setActivePage={setActivePage} />
              
              <div className="h-6 w-px bg-border hidden sm:block" />
              
              <div className="flex items-center gap-2 p-2 bg-card rounded-lg border border-border">
                <span className="text-sm text-muted-foreground hidden sm:block">عرض المبالغ:</span>
                <AmountDisplaySelector value={amountDisplayMode} onChange={setAmountDisplayMode} />
              </div>
            </div>
          </div>

          {/* Quick Access Section - Editable */}
          <EditableWidgetWrapper
            id="quickAccess"
            isEditMode={isEditMode}
            visible={isWidgetVisible('quickAccess')}
            onRemove={removeWidget}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            isDragging={draggedId === 'quickAccess'}
            isDragOver={dragOverId === 'quickAccess'}
          >
            <QuickAccessSection setActivePage={setActivePage} />
          </EditableWidgetWrapper>
          
          {/* Stats Grid - Editable */}
          <EditableWidgetWrapper
            id="statCards"
            isEditMode={isEditMode}
            visible={isWidgetVisible('statCards')}
            onRemove={removeWidget}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            isDragging={draggedId === 'statCards'}
            isDragOver={dragOverId === 'statCards'}
          >
          {/* Stats Grid - Dynamic based on config */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
            {visibleCardIds.slice(0, 6).map(cardId => {
              const cfg = getCardConfig(cardId);
              const cardProps = {
                size: cfg.size,
                bgColor: cfg.bgColor,
                fontSize: cfg.fontSize,
              };

              switch (cardId) {
                case 'availableCars':
                  return (
                    <StatCard
                      key={cardId}
                      title="السيارات المتاحة"
                      value={stats.availableCars}
                      icon={Car}
                      gradient="primary"
                      subtitle="سيارة في المخزون"
                      onClick={() => showStatDetail('availableCars')}
                      {...cardProps}
                    />
                  );
                case 'totalPurchases':
                  return (
                    <StatCard
                      key={cardId}
                      title="إجمالي المشتريات"
                      value={formatCurrencyWithMode(stats.totalPurchases)}
                      icon={ShoppingCart}
                      gradient="danger"
                      subtitle={getCurrencySubtitle()}
                      onClick={() => showStatDetail('totalPurchases')}
                      {...cardProps}
                    />
                  );
                case 'monthSales':
                  return (
                    <StatCard
                      key={cardId}
                      title="مبيعات الشهر"
                      value={formatCurrencyWithMode(stats.monthSalesAmount)}
                      icon={TrendingUp}
                      gradient="success"
                      subtitle={getCurrencySubtitle()}
                      onClick={() => showStatDetail('monthSales')}
                      {...cardProps}
                    />
                  );
                case 'totalProfit':
                  return (
                    <StatCard
                      key={cardId}
                      title="إجمالي الأرباح"
                      value={formatCurrencyWithMode(stats.totalProfit)}
                      icon={DollarSign}
                      gradient="warning"
                      subtitle={getCurrencySubtitle()}
                      onClick={() => showStatDetail('totalProfit')}
                      {...cardProps}
                    />
                  );
                case 'todaySales':
                  return (
                    <StatCard
                      key={cardId}
                      title="مبيعات اليوم"
                      value={stats.todaySales}
                      icon={ShoppingCart}
                      gradient="primary"
                      subtitle="عملية بيع"
                      onClick={() => showStatDetail('todaySales')}
                      {...cardProps}
                    />
                  );
                case 'monthSalesCount':
                  return (
                    <StatCard
                      key={cardId}
                      title="عدد مبيعات الشهر"
                      value={stats.monthSales}
                      icon={TrendingUp}
                      gradient="success"
                      subtitle="عملية بيع"
                      onClick={() => showStatDetail('monthSalesCount')}
                      {...cardProps}
                    />
                  );
                default:
                  return null;
              }
            })}
          </div>
          </EditableWidgetWrapper>

          {/* All-Time Company Stats - Dynamic */}
          {allTimeStats && (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
              {getCardConfig('allTimePurchases').visible && (
                <StatCard
                  title="إجمالي مشتريات الشركة (كل السنين)"
                  value={formatCurrencyWithMode(allTimeStats.allTimePurchases)}
                  icon={Building2}
                  gradient="danger"
                  subtitle={`${allTimeStats.totalCarsCount} سيارة - ${getDisplayModeLabel(amountDisplayMode)}`}
                  onClick={() => showStatDetail('allTimePurchases')}
                  size={getCardConfig('allTimePurchases').size}
                  bgColor={getCardConfig('allTimePurchases').bgColor}
                  fontSize={getCardConfig('allTimePurchases').fontSize}
                />
              )}
              {getCardConfig('allTimeSales').visible && (
                <StatCard
                  title="إجمالي مبيعات الشركة (كل السنين)"
                  value={formatCurrencyWithMode(allTimeStats.allTimeSales)}
                  icon={TrendingUp}
                  gradient="success"
                  subtitle={`${allTimeStats.allTimeSalesCount} عملية بيع - ${getDisplayModeLabel(amountDisplayMode)}`}
                  onClick={() => showStatDetail('allTimeSales')}
                  size={getCardConfig('allTimeSales').size}
                  bgColor={getCardConfig('allTimeSales').bgColor}
                  fontSize={getCardConfig('allTimeSales').fontSize}
                />
              )}
            </div>
          )}

          {/* Installments Stats Cards - Right below main stats */}
          {(() => {
            const activeInstallments = installmentSales.filter(s => s.status === 'active');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Calculate installment stats
            let totalDueAmount = 0;
            let overdueCount = 0;
            let overdueAmount = 0;
            let upcomingThisMonth = 0;
            
            // Get next payment info for the main card
            let nextPaymentInfo: { customerName: string; amount: number; dueDate: string; isOverdue: boolean } | null = null;
            
            activeInstallments.forEach(installment => {
              const unpaidPayments = installment.payments?.filter(p => p.status !== 'paid') || [];
              unpaidPayments.forEach(payment => {
                const dueDate = new Date(payment.due_date);
                dueDate.setHours(0, 0, 0, 0);
                totalDueAmount += payment.amount - (payment.paid_amount || 0);
                
                if (dueDate < today) {
                  overdueCount++;
                  overdueAmount += payment.amount - (payment.paid_amount || 0);
                } else {
                  const thisMonth = new Date();
                  const endOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0);
                  if (dueDate <= endOfMonth) {
                    upcomingThisMonth++;
                  }
                }
              });
              
              // Find next payment for the info card
              const nextPayment = unpaidPayments
                .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
              
              if (nextPayment && !nextPaymentInfo) {
                const paymentDueDate = new Date(nextPayment.due_date);
                paymentDueDate.setHours(0, 0, 0, 0);
                nextPaymentInfo = {
                  customerName: installment.sale?.customer?.name || 'عميل غير محدد',
                  amount: nextPayment.amount - (nextPayment.paid_amount || 0),
                  dueDate: nextPayment.due_date,
                  isOverdue: paymentDueDate < today
                };
              }
            });
            
            if (activeInstallments.length === 0 && installmentSales.length === 0) return null;
            
            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                {getCardConfig('activeInstallments').visible && (
                  <StatCard
                    title="عقود التقسيط النشطة"
                    value={activeInstallments.length}
                    icon={CreditCard}
                    gradient="primary"
                    subtitle="عقد نشط"
                    onClick={() => setActivePage('installments')}
                    size={getCardConfig('activeInstallments').size}
                    bgColor={getCardConfig('activeInstallments').bgColor}
                    fontSize={getCardConfig('activeInstallments').fontSize}
                  />
                )}
                {getCardConfig('overdueInstallments').visible && (
                  <StatCard
                    title="الأقساط المتأخرة"
                    value={overdueCount}
                    icon={AlertTriangle}
                    gradient="danger"
                    subtitle={`${new Intl.NumberFormat('ar-SA').format(overdueAmount)} ر.س`}
                    onClick={() => setActivePage('installments')}
                    size={getCardConfig('overdueInstallments').size}
                    bgColor={getCardConfig('overdueInstallments').bgColor}
                    fontSize={getCardConfig('overdueInstallments').fontSize}
                  />
                )}
                {getCardConfig('upcomingInstallments').visible && (
                  <StatCard
                    title="أقساط الشهر الحالي"
                    value={upcomingThisMonth}
                    icon={Calendar}
                    gradient="warning"
                    subtitle="قسط مستحق"
                    onClick={() => setActivePage('installments')}
                    size={getCardConfig('upcomingInstallments').size}
                    bgColor={getCardConfig('upcomingInstallments').bgColor}
                    fontSize={getCardConfig('upcomingInstallments').fontSize}
                  />
                )}
                {getCardConfig('totalDue').visible && (
                  <StatCard
                    title="إجمالي المستحق"
                    value={`${new Intl.NumberFormat('ar-SA').format(totalDueAmount)} ر.س`}
                    icon={DollarSign}
                    gradient="success"
                    subtitle="ريال سعودي"
                    onClick={() => setActivePage('installments')}
                    size={getCardConfig('totalDue').size}
                    bgColor={getCardConfig('totalDue').bgColor}
                    fontSize={getCardConfig('totalDue').fontSize}
                  />
                )}
                
                {/* Customer Installment Info Card */}
                {nextPaymentInfo && (
                  <div 
                    className="col-span-2 lg:col-span-4 bg-card rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 shadow-sm border border-border hover-lift animate-fade-in cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setActivePage('installments')}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0 ${
                          nextPaymentInfo.isOverdue ? 'gradient-danger' : 'gradient-primary'
                        }`}>
                          <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">القسط القادم</p>
                          <p className="text-lg sm:text-xl md:text-2xl font-bold text-card-foreground">
                            {nextPaymentInfo.customerName}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 sm:gap-8">
                        <div className="text-center">
                          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">المبلغ</p>
                          <p className="text-base sm:text-lg md:text-xl font-bold text-card-foreground">
                            {new Intl.NumberFormat('ar-SA').format(nextPaymentInfo.amount)} ر.س
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">تاريخ الاستحقاق</p>
                          <p className={`text-base sm:text-lg md:text-xl font-bold ${
                            nextPaymentInfo.isOverdue ? 'text-destructive' : 'text-card-foreground'
                          }`}>
                            {new Date(nextPaymentInfo.dueDate).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                        {nextPaymentInfo.isOverdue && (
                          <Badge variant="destructive" className="text-xs sm:text-sm px-3 py-1">
                            متأخر
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

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

          {/* Online Users & Payment Reminders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            <OnlineUsersCard />
            <PaymentRemindersCard setActivePage={setActivePage} />
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

          {/* Recent Invoices */}
          <RecentInvoicesCard setActivePage={setActivePage} />
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
