/**
 * Dashboard Overview Tab
 * Renders the main KPI widgets grid with edit mode support.
 */
import { Car, ShoppingCart, DollarSign, TrendingUp, Building2, HardHat } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { cn } from '@/lib/utils';
import { ActivePage } from '@/types';
import { EditableWidgetWrapper } from './DashboardEditMode';
import { QuickAccessSection } from './QuickAccessSection';
import { MonthlyExpensesCard } from './MonthlyExpensesCard';
import { RecentInvoicesCard } from './RecentInvoicesCard';
import { SmartAlertsWidget } from './SmartAlertsWidget';
import { SecurityAlertsWidget } from './SecurityAlertsWidget';
import { TransfersWidget } from './widgets/TransfersWidget';
import { QuickActionsWidget } from './widgets/QuickActionsWidget';
import { ReportsWidget } from './widgets/ReportsWidget';
import {
  ActiveInstallmentsCard, OverdueInstallmentsCard,
  UpcomingInstallmentsCard, TotalDueCard, NextPaymentCard,
} from './widgets/InstallmentsWidget';

interface DashboardOverviewTabProps {
  // Data
  stats: any;
  allTimeStats: any;
  installmentStats: any;
  allCars: any[];
  transfers: any[];
  isCarDealership: boolean;
  industryLabels: any;
  t: any;
  // Display
  displaySettings: any;
  monthProgress: number;
  analytics: any;
  canSales: boolean;
  canPurchases: boolean;
  // Loading
  isLoading: boolean;
  isDashboardConfigLoading: boolean;
  // Widget system
  sortedWidgets: any[];
  isEditMode: boolean;
  getWidgetProps: (id: string) => any;
  getCardConfig: (id: string) => any;
  getCardStyleProps: (id: string) => any;
  getCardLabel: (id: string, defaultLabel: string) => string;
  getCardValue: (id: string, defaultValue: number) => number;
  handleCardDimensionResize: (cardId: string, w?: number, h?: number) => void;
  // Formatters
  formatCurrencyWithMode: (v: number) => string;
  getCurrencySubtitle: () => string;
  // Actions
  showStatDetail: (cardId: string) => void;
  setActivePage: (page: ActivePage) => void;
  // Grid events
  handleGridDrop?: (e: React.DragEvent) => void;
  handleGridDragOver?: (e: React.DragEvent) => void;
}

export function DashboardOverviewTab(props: DashboardOverviewTabProps) {
  const {
    stats, allTimeStats, installmentStats, allCars, transfers,
    isCarDealership, industryLabels, t,
    displaySettings, monthProgress, analytics,
    canSales, canPurchases,
    isLoading, isDashboardConfigLoading,
    sortedWidgets, isEditMode,
    getWidgetProps, getCardConfig, getCardStyleProps, getCardLabel, getCardValue,
    formatCurrencyWithMode, getCurrencySubtitle,
    showStatDetail, setActivePage,
    handleGridDrop, handleGridDragOver,
  } = props;

  const showAmountAsWords = true;
  let statCardIndex = 0;
  const getNextAnimIndex = () => statCardIndex++;

  if (isLoading || isDashboardConfigLoading) {
    return (
      <div className={cn(
        "grid grid-cols-1 xs:grid-cols-2 gap-2.5 sm:gap-3 md:gap-5",
        displaySettings.kpiColumns === 2 && 'md:grid-cols-2',
        displaySettings.kpiColumns === 3 && 'md:grid-cols-3',
        displaySettings.kpiColumns === 4 && 'md:grid-cols-4',
        displaySettings.kpiColumns === 5 && 'md:grid-cols-5',
        displaySettings.kpiColumns === 6 && 'md:grid-cols-6',
      )}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 overflow-hidden animate-pulse">
            <div className="h-9 bg-muted/60" />
            <div className={cn("space-y-3", displaySettings.density === 'compact' ? 'p-2' : displaySettings.density === 'spacious' ? 'p-6' : 'p-4')}>
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
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 xs:grid-cols-2",
        displaySettings.density === 'compact' ? 'gap-2' : displaySettings.density === 'spacious' ? 'gap-4 sm:gap-6' : 'gap-2.5 sm:gap-3 md:gap-5',
        displaySettings.kpiColumns === 2 && 'md:grid-cols-2',
        displaySettings.kpiColumns === 3 && 'md:grid-cols-3',
        displaySettings.kpiColumns === 4 && 'md:grid-cols-4',
        displaySettings.kpiColumns === 5 && 'md:grid-cols-5',
        displaySettings.kpiColumns === 6 && 'md:grid-cols-6',
      )}
      onDrop={isEditMode ? handleGridDrop : undefined}
      onDragOver={isEditMode ? handleGridDragOver : undefined}
    >
      {sortedWidgets.map(widget => {
        const widgetProps = getWidgetProps(widget.id);
        const cardCfg = getCardConfig(widget.id);
        const hasAccountOverride = Boolean(
          (cardCfg.dataSource === 'account' && cardCfg.accountId) ||
          (cardCfg.dataSource === 'formula' && cardCfg.formulaAccounts?.length) ||
          (!cardCfg.dataSource && (cardCfg.accountId || cardCfg.formulaAccounts?.length))
        );
        const nativeStatCardIds = [
          'availableCars', 'totalPurchases', 'monthSales', 'totalProfit',
          'todaySales', 'monthSalesCount', 'allTimePurchases', 'allTimeSales',
        ];

        if (hasAccountOverride && !nativeStatCardIds.includes(widget.id)) {
          return (
            <EditableWidgetWrapper key={widget.id} {...widgetProps}>
              <StatCard
                title={getCardLabel(widget.id, cardCfg.label || widget.label)}
                value={formatCurrencyWithMode(getCardValue(widget.id, 0))}
                icon={DollarSign} gradient="primary"
                subtitle={getCurrencySubtitle()}
                showAsWords={showAmountAsWords}
                onClick={() => showStatDetail(widget.id)}
                {...getCardStyleProps(widget.id)}
                animationIndex={getNextAnimIndex()}
              />
            </EditableWidgetWrapper>
          );
        }

        switch (widget.id) {
          case 'quickAccess':
            return <EditableWidgetWrapper key={widget.id} {...widgetProps}><QuickAccessSection setActivePage={setActivePage} /></EditableWidgetWrapper>;
          case 'availableCars':
            return (
              <EditableWidgetWrapper key={widget.id} {...widgetProps}>
                <StatCard title={getCardLabel('availableCars', industryLabels.availableItems)} value={getCardValue('availableCars', stats.availableCars)} icon={isCarDealership ? Car : HardHat} gradient="primary" subtitle={!isCarDealership && stats.activeProjectNames?.length > 0 ? stats.activeProjectNames.join(' • ') : industryLabels.availableSubtitle} onClick={() => showStatDetail('availableCars')} {...getCardStyleProps('availableCars')} animationIndex={getNextAnimIndex()} />
              </EditableWidgetWrapper>
            );
          case 'totalPurchases':
            return (
              <EditableWidgetWrapper key={widget.id} {...widgetProps}>
                <StatCard title={getCardLabel('totalPurchases', industryLabels.totalPurchasesLabel)} value={formatCurrencyWithMode(getCardValue('totalPurchases', stats.totalPurchases))} icon={ShoppingCart} gradient="danger" subtitle={getCurrencySubtitle()} onClick={() => showStatDetail('totalPurchases')} showAsWords={showAmountAsWords} {...getCardStyleProps('totalPurchases')} animationIndex={getNextAnimIndex()} progress={monthProgress} trend={analytics?.purchasesTrend?.percentChange} badge={`${stats.availableCars} ${industryLabels.availableItems}`} />
              </EditableWidgetWrapper>
            );
          case 'monthSales':
            return (
              <EditableWidgetWrapper key={widget.id} {...widgetProps}>
                <StatCard title={getCardLabel('monthSales', t.dashboard_month_sales)} value={formatCurrencyWithMode(getCardValue('monthSales', stats.monthSalesAmount))} icon={TrendingUp} gradient="success" subtitle={getCurrencySubtitle()} onClick={() => showStatDetail('monthSales')} showAsWords={showAmountAsWords} {...getCardStyleProps('monthSales')} animationIndex={getNextAnimIndex()} progress={monthProgress} trend={analytics?.salesTrend?.percentChange} />
              </EditableWidgetWrapper>
            );
          case 'totalProfit':
            return (
              <EditableWidgetWrapper key={widget.id} {...widgetProps}>
                <StatCard title={getCardLabel('totalProfit', t.dashboard_total_profit)} value={formatCurrencyWithMode(getCardValue('totalProfit', stats.totalProfit))} icon={DollarSign} gradient="warning" subtitle={getCurrencySubtitle()} onClick={() => showStatDetail('totalProfit')} showAsWords={showAmountAsWords} {...getCardStyleProps('totalProfit')} animationIndex={getNextAnimIndex()} progress={monthProgress} trend={analytics?.profitTrend?.percentChange} badge={stats.totalPurchases > 0 ? `${t.margin} ${((stats.totalProfit / stats.totalPurchases) * 100).toFixed(1)}%` : undefined} />
              </EditableWidgetWrapper>
            );
          case 'todaySales':
            return (
              <EditableWidgetWrapper key={widget.id} {...widgetProps}>
                <StatCard title={getCardLabel('todaySales', t.dashboard_today_sales)} value={getCardValue('todaySales', stats.todaySales)} icon={ShoppingCart} gradient="primary" subtitle={t.sale_operation} onClick={() => showStatDetail('todaySales')} showAsWords={showAmountAsWords} {...getCardStyleProps('todaySales')} animationIndex={getNextAnimIndex()} progress={monthProgress} />
              </EditableWidgetWrapper>
            );
          case 'monthSalesCount':
            return (
              <EditableWidgetWrapper key={widget.id} {...widgetProps}>
                <StatCard title={getCardLabel('monthSalesCount', t.dashboard_month_sales_count)} value={getCardValue('monthSalesCount', stats.monthSales)} icon={TrendingUp} gradient="success" subtitle={t.sale_operation} onClick={() => showStatDetail('monthSalesCount')} showAsWords={showAmountAsWords} {...getCardStyleProps('monthSalesCount')} animationIndex={getNextAnimIndex()} progress={monthProgress} />
              </EditableWidgetWrapper>
            );
          case 'allTimePurchases':
            if (!allTimeStats) return null;
            return (
              <EditableWidgetWrapper key={widget.id} {...widgetProps}>
                <StatCard title={getCardLabel('allTimePurchases', t.all_time_company_purchases)} value={formatCurrencyWithMode(getCardValue('allTimePurchases', allTimeStats.allTimePurchases))} icon={Building2} gradient="danger" subtitle={getCurrencySubtitle()} onClick={() => showStatDetail('allTimePurchases')} showAsWords={showAmountAsWords} {...getCardStyleProps('allTimePurchases')} animationIndex={getNextAnimIndex()} progress={monthProgress} trend={analytics?.purchasesTrend?.percentChange} badge={`${allTimeStats.totalCarsCount} ${industryLabels.allTimePurchasesSubUnit}`} />
              </EditableWidgetWrapper>
            );
          case 'allTimeSales':
            if (!allTimeStats) return null;
            return (
              <EditableWidgetWrapper key={widget.id} {...widgetProps}>
                <StatCard title={getCardLabel('allTimeSales', t.all_time_company_sales)} value={formatCurrencyWithMode(getCardValue('allTimeSales', allTimeStats.allTimeSales))} icon={TrendingUp} gradient="success" subtitle={getCurrencySubtitle()} onClick={() => showStatDetail('allTimeSales')} showAsWords={showAmountAsWords} {...getCardStyleProps('allTimeSales')} animationIndex={getNextAnimIndex()} progress={monthProgress} trend={analytics?.salesTrend?.percentChange} badge={`${allTimeStats.allTimeSalesCount} ${industryLabels.allTimeSalesSubUnit}`} />
              </EditableWidgetWrapper>
            );
          case 'activeInstallments':
            if (!installmentStats.hasData) return null;
            return <EditableWidgetWrapper key={widget.id} {...widgetProps}><ActiveInstallmentsCard stats={installmentStats} setActivePage={setActivePage} getCardLabel={getCardLabel} getCardConfig={getCardConfig} /></EditableWidgetWrapper>;
          case 'overdueInstallments':
            if (!installmentStats.hasData) return null;
            return <EditableWidgetWrapper key={widget.id} {...widgetProps}><OverdueInstallmentsCard stats={installmentStats} setActivePage={setActivePage} getCardLabel={getCardLabel} getCardConfig={getCardConfig} /></EditableWidgetWrapper>;
          case 'upcomingInstallments':
            if (!installmentStats.hasData) return null;
            return <EditableWidgetWrapper key={widget.id} {...widgetProps}><UpcomingInstallmentsCard stats={installmentStats} setActivePage={setActivePage} getCardLabel={getCardLabel} getCardConfig={getCardConfig} /></EditableWidgetWrapper>;
          case 'totalDue':
            if (!installmentStats.hasData) return null;
            return <EditableWidgetWrapper key={widget.id} {...widgetProps}><TotalDueCard stats={installmentStats} setActivePage={setActivePage} getCardLabel={getCardLabel} getCardConfig={getCardConfig} /></EditableWidgetWrapper>;
          case 'nextPayment':
            if (!installmentStats.hasData || !installmentStats.nextPaymentInfo) return null;
            return <EditableWidgetWrapper key={widget.id} {...widgetProps}><NextPaymentCard stats={installmentStats} setActivePage={setActivePage} /></EditableWidgetWrapper>;
          case 'monthlyExpenses':
            return <EditableWidgetWrapper key={widget.id} {...widgetProps}><MonthlyExpensesCard /></EditableWidgetWrapper>;
          case 'transfers':
            if (!isCarDealership) return null;
            return <EditableWidgetWrapper key={widget.id} {...widgetProps}><TransfersWidget transfers={transfers || []} transferredCars={allCars.filter((c: any) => c.status === 'transferred')} setActivePage={setActivePage} /></EditableWidgetWrapper>;
          case 'quickActions':
            return <EditableWidgetWrapper key={widget.id} {...widgetProps}><QuickActionsWidget setActivePage={setActivePage} canSales={canSales} canPurchases={canPurchases} gridColumns={displaySettings.gridColumns} density={displaySettings.density} /></EditableWidgetWrapper>;
          case 'reports':
            return <EditableWidgetWrapper key={widget.id} {...widgetProps}><ReportsWidget setActivePage={setActivePage} /></EditableWidgetWrapper>;
          case 'recentInvoices':
            return <EditableWidgetWrapper key={widget.id} {...widgetProps}><RecentInvoicesCard setActivePage={setActivePage} /></EditableWidgetWrapper>;
          case 'smartAlerts':
            return <EditableWidgetWrapper key={widget.id} {...widgetProps}><SmartAlertsWidget setActivePage={setActivePage} /></EditableWidgetWrapper>;
          case 'securityAlerts':
            return <EditableWidgetWrapper key={widget.id} {...widgetProps}><SecurityAlertsWidget /></EditableWidgetWrapper>;
          default:
            return null;
        }
      })}
    </div>
  );
}
