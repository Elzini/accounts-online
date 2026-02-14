import { Car, ShoppingCart, DollarSign, TrendingUp, Package, BarChart3, RefreshCw, HardHat, Building2 } from 'lucide-react';
import { AnimatedDashboardBackground } from './dashboard/AnimatedDashboardBackground';
import { StatCard } from './StatCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActivePage } from '@/types';
import { useMonthlyChartData, useStats, useSales, useCars, useAllTimeStats } from '@/hooks/useDatabase';
import { useAdvancedAnalytics } from '@/hooks/useAnalytics';
import { useAppSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany, CompanyActivityType } from '@/contexts/CompanyContext';
import { useCarTransfers, usePartnerDealerships } from '@/hooks/useTransfers';
import { useInstallmentSales } from '@/hooks/useInstallments';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useDashboardConfig, useSaveDashboardConfig } from '@/hooks/useSystemControl';
import { CardConfig, DEFAULT_STAT_CARDS } from './dashboard/DashboardCustomizer';

// Dashboard Components
import { TrendCard } from './dashboard/TrendCard';
import { InventoryPieChart } from './dashboard/InventoryPieChart';
import { RevenueAreaChart } from './dashboard/RevenueAreaChart';
import { SalesPurchasesBarChart } from './dashboard/SalesPurchasesBarChart';
import { TopPerformersCard } from './dashboard/TopPerformersCard';
import { PerformanceMetrics } from './dashboard/PerformanceMetrics';
import { RecentActivityCard } from './dashboard/RecentActivityCard';
import { FinancialKPICards } from './dashboard/FinancialKPICards';
import { ExpenseDistributionChart } from './dashboard/ExpenseDistributionChart';
import { StatCardDetailDialog, StatDetailData, CarDetailItem } from './dashboard/StatCardDetailDialog';
import { AmountDisplaySelector, AmountDisplayMode, calculateDisplayAmount, getDisplayModeLabel } from './dashboard/AmountDisplaySelector';
import { WelcomeHeader } from './dashboard/WelcomeHeader';
import { QuickAccessSection } from './dashboard/QuickAccessSection';
import { RecentInvoicesCard } from './dashboard/RecentInvoicesCard';
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
import { useCardFormulas, buildFormulaVariables, evaluateFormula } from '@/hooks/useCardFormulas';
import { MonthlyExpensesCard } from './dashboard/MonthlyExpensesCard';
import { useMonthlyExpenseBreakdown } from '@/hooks/useMonthlyExpenseBreakdown';
import { useIndustryLabels } from '@/hooks/useIndustryLabels';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInstallmentStats, ActiveInstallmentsCard, OverdueInstallmentsCard, UpcomingInstallmentsCard, TotalDueCard, NextPaymentCard } from './dashboard/widgets/InstallmentsWidget';
import { TransfersWidget } from './dashboard/widgets/TransfersWidget';
import { QuickActionsWidget } from './dashboard/widgets/QuickActionsWidget';
import { ReportsWidget } from './dashboard/widgets/ReportsWidget';

interface DashboardProps {
  stats: any;
  setActivePage: (page: ActivePage) => void;
  isLoading?: boolean;
}


export function Dashboard({ stats, setActivePage, isLoading = false }: DashboardProps) {
  const queryClient = useQueryClient();
  const { data: chartData, isLoading: chartLoading } = useMonthlyChartData();
  const { data: analytics, isLoading: analyticsLoading } = useAdvancedAnalytics();
  const { data: settings } = useAppSettings();
  const { permissions } = useAuth();
  const { company } = useCompany();
  const companyType: CompanyActivityType = (company as any)?.company_type || 'car_dealership';
  const isCarDealership = companyType === 'car_dealership';
  const industryLabels = useIndustryLabels();
  const { t, language } = useLanguage();
  const { data: transfers } = useCarTransfers();
  const { data: dealerships } = usePartnerDealerships();
  const { data: installmentSales = [] } = useInstallmentSales();
  const { data: allSales = [] } = useSales();
  const { data: allCars = [] } = useCars();
  const { data: allTimeStats } = useAllTimeStats();
  const { selectedFiscalYear } = useFiscalYear();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: expenseBreakdown } = useMonthlyExpenseBreakdown();
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailData, setDetailData] = useState<StatDetailData | null>(null);
  const [amountDisplayMode, setAmountDisplayMode] = useState<AmountDisplayMode>('total');
  const showAmountAsWords = true;
  
  // Custom card formulas
  const { getFormula } = useCardFormulas();
  const formulaVariables = useMemo(() => buildFormulaVariables(stats), [stats]);
  
  const getCardValue = useCallback((cardId: string, defaultValue: number): number => {
    const formulaConfig = getFormula(cardId);
    if (!formulaConfig || !formulaConfig.isCustom) return defaultValue;
    const { result, error } = evaluateFormula(formulaConfig.formula, formulaVariables);
    if (error) return defaultValue;
    return formulaConfig.includeVAT ? result * 1.15 : result;
  }, [getFormula, formulaVariables]);
  
  // Dashboard customization
  const { data: dashboardConfig, isLoading: isDashboardConfigLoading } = useDashboardConfig();
  const saveDashboardConfig = useSaveDashboardConfig();
  const [cardConfigs, setCardConfigs] = useState<CardConfig[]>(DEFAULT_STAT_CARDS);
  
  // Widget-level edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgetConfigs, setWidgetConfigs] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  
  // Widget drag, drop, and resize
  const {
    draggedId,
    dragOverId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    handleGridDrop,
    handleGridDragOver,
    removeWidget,
    resizeWidget,
    moveWidgetUp,
    moveWidgetDown,
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
          textColor: c.textColor || '',
          gradientFrom: c.gradientFrom || '',
          gradientTo: c.gradientTo || '',
          fontSize: c.fontSize || 100,
          height: c.height,
          width: c.width,
          enable3D: c.enable3D || false,
          showTrend: c.showTrend ?? true,
          trendColor: c.trendColor || '',
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

  // Load widget configs from saved dashboard config - merge with defaults
  // Skip when in edit mode to prevent overwriting drag-and-drop changes
  useEffect(() => {
    if (isEditMode) return; // Don't reset during editing
    if (dashboardConfig?.layout_settings?.widgets) {
      const savedWidgets = dashboardConfig.layout_settings.widgets as WidgetConfig[];
      // Only keep saved widgets that exist in DEFAULT_WIDGETS (filter out old/removed IDs)
      const validDefaultIds = new Set(DEFAULT_WIDGETS.map(dw => dw.id));
      const validSavedWidgets = savedWidgets.filter((w: any) => validDefaultIds.has(w.id));
      const savedIds = new Set(validSavedWidgets.map((w: any) => w.id));
      const merged = [
        ...validSavedWidgets.map((w: any) => ({
          ...w,
          colSpan: w.colSpan ?? DEFAULT_WIDGETS.find(dw => dw.id === w.id)?.colSpan ?? 2,
        })),
        ...DEFAULT_WIDGETS.filter(dw => !savedIds.has(dw.id)).map((dw, i) => ({
          ...dw,
          order: validSavedWidgets.length + i,
        })),
      ].sort((a, b) => a.order - b.order);
      setWidgetConfigs(merged);
    }
  }, [dashboardConfig, isEditMode]);

  const enterEditMode = useCallback(() => {
    setIsEditMode(true);
  }, []);

  const saveWidgetConfig = useCallback(async (widgets: WidgetConfig[]) => {
    try {
      await saveDashboardConfig.mutateAsync({
        layout_settings: { widgets } as any,
        stat_cards: cardConfigs as any,
      });
      setIsEditMode(false);
      toast.success(t.layout_saved);
    } catch (error) {
      console.error('Error saving widget config:', error);
      toast.error(t.save_error);
    }
  }, [saveDashboardConfig, cardConfigs]);

  const cancelEditMode = useCallback(() => {
    if (dashboardConfig?.layout_settings?.widgets) {
      const savedWidgets = dashboardConfig.layout_settings.widgets as WidgetConfig[];
      const validDefaultIds = new Set(DEFAULT_WIDGETS.map(dw => dw.id));
      const validSavedWidgets = savedWidgets.filter((w: any) => validDefaultIds.has(w.id));
      const savedIds = new Set(validSavedWidgets.map((w: any) => w.id));
      const merged = [
        ...validSavedWidgets.map((w: any) => ({
          ...w,
          colSpan: w.colSpan ?? DEFAULT_WIDGETS.find(dw => dw.id === w.id)?.colSpan ?? 2,
        })),
        ...DEFAULT_WIDGETS.filter(dw => !savedIds.has(dw.id)).map((dw, i) => ({
          ...dw,
          order: validSavedWidgets.length + i,
        })),
      ].sort((a, b) => a.order - b.order);
      setWidgetConfigs(merged);
    } else {
      setWidgetConfigs(DEFAULT_WIDGETS);
    }
    setIsEditMode(false);
  }, [dashboardConfig]);

  const isWidgetVisible = useCallback((id: string) => {
    const widget = widgetConfigs.find(w => w.id === id);
    return widget?.visible ?? true;
  }, [widgetConfigs]);

  const sortedWidgets = useMemo(() => {
    return [...widgetConfigs].sort((a, b) => a.order - b.order).filter(w => w.visible);
  }, [widgetConfigs]);

  // Helper to get card config by id
  const getCardConfig = useCallback((id: string) => {
    return cardConfigs.find(c => c.id === id) || { visible: true, size: 'medium' as const, bgColor: '', textColor: '', gradientFrom: '', gradientTo: '', fontSize: 100, height: undefined, width: undefined, enable3D: false, showTrend: true, trendColor: '', label: '' };
  }, [cardConfigs]);

  // Spread helper for StatCard style props
  const getCardStyleProps = useCallback((id: string) => {
    const cfg = getCardConfig(id);
    return {
      size: cfg.size,
      bgColor: cfg.bgColor,
      textColor: cfg.textColor,
      gradientFrom: cfg.gradientFrom,
      gradientTo: cfg.gradientTo,
      fontSize: cfg.fontSize,
      height: cfg.height,
      width: cfg.width,
      enable3D: cfg.enable3D,
      showTrend: cfg.showTrend ?? true,
      trendColor: cfg.trendColor,
    };
  }, [getCardConfig]);

  const getCardLabel = useCallback((id: string, defaultLabel: string) => {
    if (language !== 'ar') return defaultLabel;
    const cfg = cardConfigs.find(c => c.id === id);
    return cfg?.label || defaultLabel;
  }, [cardConfigs, language]);

  const visibleCardIds = useMemo(() => {
    return cardConfigs.filter(c => c.visible).sort((a, b) => a.order - b.order).map(c => c.id);
  }, [cardConfigs]);

  // Callback for mouse drag resizing stat cards
  const handleCardDimensionResize = useCallback((cardId: string, newWidth?: number, newHeight?: number) => {
    setCardConfigs(prev => prev.map(c => 
      c.id === cardId ? { ...c, width: newWidth, height: newHeight } : c
    ));
  }, []);

  // Widget layout helper - common props for each widget wrapper
  const getWidgetProps = useCallback((id: string) => ({
    id,
    isEditMode,
    visible: isWidgetVisible(id),
    order: widgetConfigs.find(w => w.id === id)?.order ?? 999,
    colSpan: widgetConfigs.find(w => w.id === id)?.colSpan ?? 2,
    onRemove: removeWidget,
    onResize: resizeWidget,
    onMoveUp: moveWidgetUp,
    onMoveDown: moveWidgetDown,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
    isDragging: draggedId === id,
    isDragOver: dragOverId === id,
    onDimensionResize: handleCardDimensionResize,
    cardConfig: getCardConfig(id),
  }), [isEditMode, isWidgetVisible, widgetConfigs, removeWidget, resizeWidget, moveWidgetUp, moveWidgetDown, handleDragStart, handleDragEnd, handleDragOver, handleDrop, draggedId, dragOverId, handleCardDimensionResize, getCardConfig]);

  const canSales = permissions.admin || permissions.sales;
  const canPurchases = permissions.admin || permissions.purchases;
  const canReports = permissions.admin || permissions.reports;

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['stats'] });
      await queryClient.invalidateQueries({ queryKey: ['analytics'] });
      await queryClient.invalidateQueries({ queryKey: ['monthlyChartData'] });
      toast.success(t.data_updated);
    } catch (error) {
      toast.error(t.data_update_failed);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  // Installment stats  
  const installmentStats = useInstallmentStats(installmentSales);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-SA', { 
      style: 'currency', 
      currency: 'SAR',
      maximumFractionDigits: 0,
      notation: 'standard',
    }).format(value);
  }, []);

  const formatCurrencyWithMode = useCallback((value: number) => {
    const displayValue = calculateDisplayAmount(value, amountDisplayMode);
    return formatCurrency(displayValue);
  }, [amountDisplayMode, formatCurrency]);

  const getCurrencySubtitle = useCallback(() => {
    return t.currency_sar_label;
  }, [t]);

  const formatChartValue = useCallback((value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  }, []);

  const fiscalYearSales = useMemo(() => {
    if (!allSales) return [];
    return allSales.filter(sale => {
      if (!selectedFiscalYear) return true;
      const saleDate = new Date(sale.sale_date);
      const start = new Date(selectedFiscalYear.start_date);
      const end = new Date(selectedFiscalYear.end_date);
      return saleDate >= start && saleDate <= end;
    });
  }, [allSales, selectedFiscalYear]);

  const fiscalYearCars = useMemo(() => {
    if (!allCars) return [];
    return allCars.filter(car => {
      if (!selectedFiscalYear) return true;
      const carDate = new Date(car.purchase_date);
      const start = new Date(selectedFiscalYear.start_date);
      const end = new Date(selectedFiscalYear.end_date);
      return carDate >= start && carDate <= end;
    });
  }, [allCars, selectedFiscalYear]);

  const buildSalesCarDetails = useCallback((): CarDetailItem[] => {
    // Build details for sales cars
      return fiscalYearSales.map(sale => ({
      id: sale.id,
      name: sale.car?.name || t.not_specified,
      model: sale.car?.model || '',
      purchasePrice: sale.car?.purchase_price || 0,
      salePrice: sale.sale_price,
      profit: sale.profit,
      saleDate: sale.sale_date,
    }));
  }, [fiscalYearSales]);

  const buildPurchaseCarDetails = useCallback((): CarDetailItem[] => {
    // Build details for purchase cars
    return fiscalYearCars.map(car => ({
      id: car.id,
      name: car.name,
      model: car.model || '',
      purchasePrice: car.purchase_price,
      chassisNumber: car.chassis_number,
      status: car.status,
    }));
  }, [fiscalYearCars]);

  const showStatDetail = useCallback((cardId: string) => {
    // Prepare detail data based on cardId
    let data: StatDetailData | null = null;
    switch (cardId) {
      case 'availableCars':
        data = {
          title: getCardLabel(cardId, industryLabels.availableItems),
          value: stats.availableCars,
          breakdown: [],
          cars: buildPurchaseCarDetails().filter(c => c.status === 'available'),
          showCarsTable: true,
        };
        break;
      case 'totalPurchases':
        data = {
          title: getCardLabel(cardId, industryLabels.totalPurchasesLabel),
          value: formatCurrency(stats.totalPurchases),
          breakdown: [],
          cars: buildPurchaseCarDetails(),
          showCarsTable: true,
        };
        break;
      case 'monthSales':
        data = {
          title: getCardLabel(cardId, t.dashboard_month_sales),
          value: formatCurrency(stats.monthSalesAmount),
          breakdown: [],
          cars: buildSalesCarDetails(),
          showCarsTable: true,
        };
        break;
      case 'totalProfit': {
        const profitCars = buildSalesCarDetails();
        const totalProfitValue = profitCars.reduce((sum, c) => sum + (c.profit || 0), 0);
        const totalRevenueValue = profitCars.reduce((sum, c) => sum + (c.salePrice || 0), 0);
        const totalCostValue = profitCars.reduce((sum, c) => sum + c.purchasePrice, 0);
        data = {
          title: getCardLabel(cardId, t.dashboard_total_profit),
          value: formatCurrency(stats.totalProfit),
          breakdown: [
            { label: t.total_sales_label, value: totalRevenueValue, type: 'add' },
            { label: t.total_purchase_cost, value: totalCostValue, type: 'subtract' },
            { label: t.net_profit, value: totalProfitValue, type: 'total' },
          ],
          cars: profitCars,
          showCarsTable: true,
        };
        break;
      }
      case 'todaySales': {
        const todaySalesCars = buildSalesCarDetails().filter(c => {
          if (!c.saleDate) return false;
          const today = new Date().toISOString().split('T')[0];
          return c.saleDate.startsWith(today);
        });
        data = {
          title: getCardLabel(cardId, t.dashboard_today_sales),
          value: stats.todaySales,
          breakdown: [],
          cars: todaySalesCars,
          showCarsTable: true,
        };
        break;
      }
      case 'monthSalesCount': {
        data = {
          title: getCardLabel(cardId, t.dashboard_month_sales_count),
          value: stats.monthSales,
          breakdown: [],
          cars: buildSalesCarDetails(),
          showCarsTable: true,
        };
        break;
      }
      case 'allTimePurchases': {
        data = {
          title: getCardLabel(cardId, t.all_time_company_purchases),
          value: formatCurrency(allTimeStats?.allTimePurchases || 0),
          subtitle: `${allTimeStats?.totalCarsCount || 0} ${t.unit}`,
          breakdown: [],
          cars: buildPurchaseCarDetails(),
          showCarsTable: true,
        };
        break;
      }
      case 'allTimeSales': {
        data = {
          title: getCardLabel(cardId, t.all_time_company_sales),
          value: formatCurrency(allTimeStats?.allTimeSales || 0),
          subtitle: `${allTimeStats?.allTimeSalesCount || 0} ${t.sale_operation}`,
          breakdown: [],
          cars: buildSalesCarDetails(),
          showCarsTable: true,
        };
        break;
      }
      default:
        data = null;
    }
    setDetailData(data);
    setDetailDialogOpen(true);
  }, [fiscalYearCars, fiscalYearSales, buildPurchaseCarDetails, buildSalesCarDetails, getCardLabel, industryLabels]);

  // Track animation index for staggered entry
  let statCardIndex = 0;
  const getNextAnimIndex = () => statCardIndex++;

  // Simple monthly progress estimator (day of month / days in month)
  const monthProgress = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Math.round((now.getDate() / daysInMonth) * 100);
  }, []);

  return (
    <div className="relative space-y-4 sm:space-y-6 md:space-y-8">
      <AnimatedDashboardBackground />
      {/* Welcome Header */}
      <WelcomeHeader
        amountDisplayMode={amountDisplayMode}
        onAmountDisplayModeChange={setAmountDisplayMode}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Dashboard Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full max-w-xs sm:max-w-md grid grid-cols-2 h-8 sm:h-10">
          <TabsTrigger value="overview" className="gap-1 sm:gap-2 text-[11px] sm:text-sm">
            <Package className="w-3 h-3 sm:w-4 sm:h-4" />
            {t.tab_overview}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1 sm:gap-2 text-[11px] sm:text-sm">
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
            {t.tab_analytics}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className={cn("mt-4 sm:mt-6", isEditMode && "pt-28")}>
          {/* Edit Mode Toolbar */}
          <DashboardEditToolbar
            isEditMode={isEditMode}
            onSave={saveWidgetConfig}
            onCancel={cancelEditMode}
            widgets={widgetConfigs}
            onWidgetsChange={setWidgetConfigs}
          />

          {/* Top Toolbar with Users & Notifications */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3 sm:mb-4">
            <CustomizeInterfaceButton 
              setActivePage={setActivePage} 
              onCardsConfigChange={handleCardsConfigChange}
              onEnterEditMode={enterEditMode}
              isEditMode={isEditMode}
            />
            
            <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap justify-end">
              <OnlineUsersPopover />
              <PaymentRemindersPopover setActivePage={setActivePage} />
              <div className="h-6 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-card rounded-lg border border-border">
                <span className="text-xs sm:text-sm text-muted-foreground hidden md:block">{t.display_amounts}:</span>
                <AmountDisplaySelector value={amountDisplayMode} onChange={setAmountDisplayMode} />
              </div>
            </div>
          </div>

          {isLoading || isDashboardConfigLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border/50 overflow-hidden animate-pulse">
                  <div className="h-9 bg-muted/60" />
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-muted/40" />
                      <div className="flex-1 space-y-2">
                        <div className="h-6 bg-muted/40 rounded w-2/3" />
                        <div className="h-3 bg-muted/30 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-3 bg-muted/20 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5"
            onDrop={isEditMode ? handleGridDrop : undefined}
            onDragOver={isEditMode ? handleGridDragOver : undefined}
          >
            {sortedWidgets.map(widget => {
              const props = getWidgetProps(widget.id);
              
              switch (widget.id) {
                case 'quickAccess':
                  return (
                    <EditableWidgetWrapper key={widget.id} {...props}>
                      <QuickAccessSection setActivePage={setActivePage} />
                    </EditableWidgetWrapper>
                  );
                
                case 'availableCars':
                  return (
                    <EditableWidgetWrapper key={widget.id} {...props}>
                      <StatCard
                        title={getCardLabel('availableCars', industryLabels.availableItems)}
                        value={getCardValue('availableCars', stats.availableCars)}
                        icon={isCarDealership ? Car : HardHat}
                        gradient="primary"
                        subtitle={industryLabels.availableSubtitle}
                        onClick={() => showStatDetail('availableCars')}
                        {...getCardStyleProps('availableCars')}
                        animationIndex={getNextAnimIndex()}
                      />
                    </EditableWidgetWrapper>
                  );
                
                case 'totalPurchases':
                  return (
                    <EditableWidgetWrapper key={widget.id} {...props}>
                      <StatCard
                        title={getCardLabel('totalPurchases', industryLabels.totalPurchasesLabel)}
                        value={formatCurrencyWithMode(getCardValue('totalPurchases', stats.totalPurchases))}
                        icon={ShoppingCart}
                        gradient="danger"
                        subtitle={getCurrencySubtitle()}
                        onClick={() => showStatDetail('totalPurchases')}
                        showAsWords={showAmountAsWords}
                        {...getCardStyleProps('totalPurchases')}
                        animationIndex={getNextAnimIndex()}
                        progress={monthProgress}
                        trend={analytics?.purchasesTrend?.percentChange}
                        badge={`${stats.availableCars} ${industryLabels.availableItems}`}
                      />
                    </EditableWidgetWrapper>
                  );
                
                case 'monthSales':
                  return (
                    <EditableWidgetWrapper key={widget.id} {...props}>
                      <StatCard
                        title={getCardLabel('monthSales', t.dashboard_month_sales)}
                        value={formatCurrencyWithMode(getCardValue('monthSales', stats.monthSalesAmount))}
                        icon={TrendingUp}
                        gradient="success"
                        subtitle={getCurrencySubtitle()}
                        onClick={() => showStatDetail('monthSales')}
                        showAsWords={showAmountAsWords}
                        {...getCardStyleProps('monthSales')}
                        animationIndex={getNextAnimIndex()}
                        progress={monthProgress}
                        trend={analytics?.salesTrend?.percentChange}
                      />
                    </EditableWidgetWrapper>
                  );
                
                case 'totalProfit':
                  return (
                    <EditableWidgetWrapper key={widget.id} {...props}>
                      <StatCard
                        title={getCardLabel('totalProfit', t.dashboard_total_profit)}
                        value={formatCurrencyWithMode(getCardValue('totalProfit', stats.totalProfit))}
                        icon={DollarSign}
                        gradient="warning"
                        subtitle={getCurrencySubtitle()}
                        onClick={() => showStatDetail('totalProfit')}
                        showAsWords={showAmountAsWords}
                        {...getCardStyleProps('totalProfit')}
                        animationIndex={getNextAnimIndex()}
                        progress={monthProgress}
                        trend={analytics?.profitTrend?.percentChange}
                        badge={stats.totalPurchases > 0 ? `${t.margin} ${((stats.totalProfit / stats.totalPurchases) * 100).toFixed(1)}%` : undefined}
                      />
                    </EditableWidgetWrapper>
                  );
                
                case 'todaySales':
                  return (
                    <EditableWidgetWrapper key={widget.id} {...props}>
                      <StatCard
                        title={getCardLabel('todaySales', t.dashboard_today_sales)}
                        value={getCardValue('todaySales', stats.todaySales)}
                        icon={ShoppingCart}
                        gradient="primary"
                        subtitle={t.sale_operation}
                        onClick={() => showStatDetail('todaySales')}
                        showAsWords={showAmountAsWords}
                        {...getCardStyleProps('todaySales')}
                        animationIndex={getNextAnimIndex()}
                        progress={monthProgress}
                      />
                    </EditableWidgetWrapper>
                  );
                
                case 'monthSalesCount':
                  return (
                    <EditableWidgetWrapper key={widget.id} {...props}>
                      <StatCard
                        title={getCardLabel('monthSalesCount', t.dashboard_month_sales_count)}
                        value={getCardValue('monthSalesCount', stats.monthSales)}
                        icon={TrendingUp}
                        gradient="success"
                        subtitle={t.sale_operation}
                        onClick={() => showStatDetail('monthSalesCount')}
                        showAsWords={showAmountAsWords}
                        {...getCardStyleProps('monthSalesCount')}
                        animationIndex={getNextAnimIndex()}
                        progress={monthProgress}
                      />
                    </EditableWidgetWrapper>
                  );
                
                case 'allTimePurchases':
                  if (!allTimeStats) return null;
                  return (
                    <EditableWidgetWrapper key={widget.id} {...props}>
                      <StatCard
                        title={getCardLabel('allTimePurchases', t.all_time_company_purchases)}
                        value={formatCurrencyWithMode(allTimeStats.allTimePurchases)}
                        icon={Building2}
                        gradient="danger"
                        subtitle={getCurrencySubtitle()}
                        onClick={() => showStatDetail('allTimePurchases')}
                        showAsWords={showAmountAsWords}
                        {...getCardStyleProps('allTimePurchases')}
                        animationIndex={getNextAnimIndex()}
                        progress={monthProgress}
                        trend={analytics?.purchasesTrend?.percentChange}
                        badge={`${allTimeStats.totalCarsCount} ${industryLabels.allTimePurchasesSubUnit}`}
                      />
                    </EditableWidgetWrapper>
                  );
                
                case 'allTimeSales':
                  if (!allTimeStats) return null;
                  return (
                    <EditableWidgetWrapper key={widget.id} {...props}>
                      <StatCard
                        title={getCardLabel('allTimeSales', t.all_time_company_sales)}
                        value={formatCurrencyWithMode(allTimeStats.allTimeSales)}
                        icon={TrendingUp}
                        gradient="success"
                        subtitle={getCurrencySubtitle()}
                        onClick={() => showStatDetail('allTimeSales')}
                        showAsWords={showAmountAsWords}
                        {...getCardStyleProps('allTimeSales')}
                        animationIndex={getNextAnimIndex()}
                        progress={monthProgress}
                        trend={analytics?.salesTrend?.percentChange}
                        badge={`${allTimeStats.allTimeSalesCount} ${industryLabels.allTimeSalesSubUnit}`}
                      />
                    </EditableWidgetWrapper>
                  );
                
                case 'activeInstallments':
                  if (!installmentStats.hasData) return null;
                  return (
                    <EditableWidgetWrapper key={widget.id} {...props}>
                      <ActiveInstallmentsCard stats={installmentStats} setActivePage={setActivePage} getCardLabel={getCardLabel} getCardConfig={getCardConfig} />
                    </EditableWidgetWrapper>
                  );
                
                case 'overdueInstallments':
                  if (!installmentStats.hasData) return null;
                  return (
                    <EditableWidgetWrapper key={widget.id} {...props}>
                      <OverdueInstallmentsCard stats={installmentStats} setActivePage={setActivePage} getCardLabel={getCardLabel} getCardConfig={getCardConfig} />
                    </EditableWidgetWrapper>
                  );
                
                case 'upcomingInstallments':
                  if (!installmentStats.hasData) return null;
                  return (
                    <EditableWidgetWrapper key={widget.id} {...props}>
                      <UpcomingInstallmentsCard stats={installmentStats} setActivePage={setActivePage} getCardLabel={getCardLabel} getCardConfig={getCardConfig} />
                    </EditableWidgetWrapper>
                  );
                
                case 'totalDue':
                  if (!installmentStats.hasData) return null;
                  return (
                    <EditableWidgetWrapper key={widget.id} {...props}>
                      <TotalDueCard stats={installmentStats} setActivePage={setActivePage} getCardLabel={getCardLabel} getCardConfig={getCardConfig} />
                    </EditableWidgetWrapper>
                  );
                
                case 'nextPayment':
                  if (!installmentStats.hasData || !installmentStats.nextPaymentInfo) return null;
                  return (
                    <EditableWidgetWrapper key={widget.id} {...props}>
                      <NextPaymentCard stats={installmentStats} setActivePage={setActivePage} />
                    </EditableWidgetWrapper>
                  );
                
                case 'monthlyExpenses':
                  return (
                    <EditableWidgetWrapper key={widget.id} {...props}>
                      <MonthlyExpensesCard />
                    </EditableWidgetWrapper>
                  );
                
                case 'transfers':
                  if (!isCarDealership) return null;
                  return (
                    <EditableWidgetWrapper key={widget.id} {...props}>
                      <TransfersWidget transfers={transfers || []} setActivePage={setActivePage} />
                    </EditableWidgetWrapper>
                  );
                
                case 'quickActions':
                  return (
                    <EditableWidgetWrapper key={widget.id} {...props}>
                      <QuickActionsWidget setActivePage={setActivePage} canSales={canSales} canPurchases={canPurchases} />
                    </EditableWidgetWrapper>
                  );
                
                case 'reports':
                  return (
                    <EditableWidgetWrapper key={widget.id} {...props}>
                      <ReportsWidget setActivePage={setActivePage} />
                    </EditableWidgetWrapper>
                  );
                
                case 'recentInvoices':
                  return (
                    <EditableWidgetWrapper key={widget.id} {...props}>
                      <RecentInvoicesCard setActivePage={setActivePage} />
                    </EditableWidgetWrapper>
                  );
                
                default:
                  return null;
              }
            })}
          </div>
          )}
        </TabsContent>

        {/* Advanced Analytics Tab */}
        <TabsContent value="analytics" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          {analyticsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : analytics ? (
            <>
              {/* Trend Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                <TrendCard
                  title={t.sales_this_month}
                  value={formatCurrency(analytics.salesTrend.thisMonth)}
                  trend={analytics.salesTrend.percentChange}
                  icon={DollarSign}
                  gradient="success"
                />
                <TrendCard
                  title={t.profits_this_month}
                  value={formatCurrency(analytics.profitTrend.thisMonth)}
                  trend={analytics.profitTrend.percentChange}
                  icon={TrendingUp}
                  gradient="primary"
                />
                <TrendCard
                  title={t.purchases_this_month}
                  value={formatCurrency(analytics.purchasesTrend.thisMonth)}
                  trend={analytics.purchasesTrend.percentChange}
                  icon={ShoppingCart}
                  gradient="warning"
                />
              </div>

              {/* Advanced Financial KPIs */}
              <FinancialKPICards
                totalRevenue={(allSales || []).reduce((sum, s) => sum + (s.sale_price || 0), 0)}
                totalCost={(allSales || []).reduce((sum, s) => sum + ((s.sale_price || 0) - (s.profit || 0)), 0)}
                totalProfit={(allSales || []).reduce((sum, s) => sum + (s.profit || 0), 0)}
                totalExpenses={expenseBreakdown?.total || 0}
                averageDaysToSell={analytics.averageDaysToSell}
                inventoryCount={analytics.inventoryByStatus.available}
                soldCount={analytics.inventoryByStatus.sold}
                salesCount={allSales?.length || 0}
                purchasesThisMonth={analytics.purchasesTrend.thisMonth}
                salesThisMonth={analytics.salesTrend.thisMonth}
              />

              {/* Revenue Area Chart & Sales vs Purchases Bar Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                <div className="relative overflow-hidden bg-card rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-border/60">
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl md:rounded-t-2xl" style={{ backgroundColor: 'hsl(var(--primary))' }} />
                  <h3 className="text-sm sm:text-lg font-bold text-card-foreground mb-3 sm:mb-4">{t.revenue_profit_analysis}</h3>
                  <RevenueAreaChart data={analytics.revenueByMonth} />
                </div>
                <div className="relative overflow-hidden bg-card rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-border/60">
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl md:rounded-t-2xl" style={{ backgroundColor: 'hsl(var(--success))' }} />
                  <h3 className="text-sm sm:text-lg font-bold text-card-foreground mb-3 sm:mb-4">{t.sales_vs_purchases}</h3>
                  <SalesPurchasesBarChart data={analytics.revenueByMonth} />
                </div>
              </div>

              {/* Inventory Pie Chart & Expense Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                <div className="relative overflow-hidden bg-card rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-border/60">
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl md:rounded-t-2xl" style={{ backgroundColor: 'hsl(var(--warning))' }} />
                  <h3 className="text-sm sm:text-lg font-bold text-card-foreground mb-3 sm:mb-4">{t.inventory_distribution}</h3>
                  <InventoryPieChart data={analytics.inventoryByStatus} />
                </div>
                <div className="relative overflow-hidden bg-card rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-border/60">
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl md:rounded-t-2xl" style={{ backgroundColor: 'hsl(var(--destructive))' }} />
                  <h3 className="text-sm sm:text-lg font-bold text-card-foreground mb-3 sm:mb-4">{t.expense_distribution}</h3>
                  <ExpenseDistributionChart
                    custodyExpenses={expenseBreakdown?.custodyExpenses || 0}
                    payrollExpenses={expenseBreakdown?.payrollExpenses || 0}
                    rentExpenses={expenseBreakdown?.rentExpenses || 0}
                    otherExpenses={expenseBreakdown?.otherExpenses || 0}
                  />
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
                <div className="relative overflow-hidden bg-card rounded-xl md:rounded-2xl p-4 md:p-6 border border-border/60">
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl md:rounded-t-2xl" style={{ backgroundColor: 'hsl(var(--primary))' }} />
                   <h3 className="text-lg font-bold text-card-foreground mb-4">{t.performance_summary}</h3>
                   <div className="space-y-4">
                     <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                       <span className="text-sm text-muted-foreground">{t.total_available} {industryLabels.itemsName}</span>
                       <span className="font-bold text-primary">{analytics.inventoryByStatus.available}</span>
                     </div>
                     <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                       <span className="text-sm text-muted-foreground">{t.total_sold} {industryLabels.itemsName}</span>
                       <span className="font-bold text-success">{analytics.inventoryByStatus.sold}</span>
                     </div>
                     {isCarDealership && (
                     <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                       <span className="text-sm text-muted-foreground">{industryLabels.itemsName} {t.transferred}</span>
                       <span className="font-bold text-warning">{analytics.inventoryByStatus.transferred}</span>
                     </div>
                     )}
                     <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                       <span className="text-sm text-muted-foreground">{t.top_customers_count}</span>
                       <span className="font-bold">{analytics.topCustomers.length}</span>
                     </div>
                     <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                       <span className="text-sm text-muted-foreground">{t.active_suppliers_count}</span>
                       <span className="font-bold">{analytics.topSuppliers.length}</span>
                     </div>
                   </div>
                </div>
              </div>
            </>
          ) : (
             <div className="text-center py-12 text-muted-foreground">
               {t.no_analytics_data}
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
