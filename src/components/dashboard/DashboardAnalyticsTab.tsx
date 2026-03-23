/**
 * Dashboard Analytics Tab
 * Renders the analytics/charts section of the dashboard.
 */
import { DollarSign, TrendingUp, ShoppingCart } from 'lucide-react';
import { TrendCard } from './TrendCard';
import { InventoryPieChart } from './InventoryPieChart';
import { RevenueAreaChart } from './RevenueAreaChart';
import { SalesPurchasesBarChart } from './SalesPurchasesBarChart';
import { TopPerformersCard } from './TopPerformersCard';
import { PerformanceMetrics } from './PerformanceMetrics';
import { RecentActivityCard } from './RecentActivityCard';
import { FinancialKPICards } from './FinancialKPICards';
import { ExpenseDistributionChart } from './ExpenseDistributionChart';
import { useLanguage } from '@/contexts/LanguageContext';

interface DashboardAnalyticsTabProps {
  analytics: any;
  analyticsLoading: boolean;
  isCarDealership: boolean;
  allSales: any[];
  expenseBreakdown: any;
  industryLabels: any;
  formatCurrency: (value: number) => string;
}

export function DashboardAnalyticsTab({
  analytics, analyticsLoading, isCarDealership, allSales,
  expenseBreakdown, industryLabels, formatCurrency,
}: DashboardAnalyticsTabProps) {
  const { t } = useLanguage();

  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t.no_analytics_data}
      </div>
    );
  }

  return (
    <>
      {/* Trend Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        <TrendCard title={t.sales_this_month} value={formatCurrency(analytics.salesTrend.thisMonth)} trend={analytics.salesTrend.percentChange} icon={DollarSign} gradient="success" />
        <TrendCard title={t.profits_this_month} value={formatCurrency(analytics.profitTrend.thisMonth)} trend={analytics.profitTrend.percentChange} icon={TrendingUp} gradient="primary" />
        <TrendCard title={t.purchases_this_month} value={formatCurrency(analytics.purchasesTrend.thisMonth)} trend={analytics.purchasesTrend.percentChange} icon={ShoppingCart} gradient="warning" />
      </div>

      {/* Financial KPIs */}
      <FinancialKPICards
        totalRevenue={isCarDealership
          ? allSales.reduce((sum, s) => sum + (s.sale_price || 0), 0)
          : analytics.salesTrend.thisMonth + analytics.salesTrend.lastMonth}
        totalCost={isCarDealership
          ? allSales.reduce((sum, s) => sum + ((s.sale_price || 0) - (s.profit || 0)), 0)
          : analytics.purchasesTrend.thisMonth + analytics.purchasesTrend.lastMonth}
        totalProfit={isCarDealership
          ? allSales.reduce((sum, s) => sum + (s.profit || 0), 0)
          : analytics.profitTrend.thisMonth + analytics.profitTrend.lastMonth}
        totalExpenses={expenseBreakdown?.total || 0}
        averageDaysToSell={analytics.averageDaysToSell}
        inventoryCount={analytics.inventoryByStatus.available}
        soldCount={analytics.inventoryByStatus.sold}
        salesCount={isCarDealership ? allSales.length : analytics.inventoryByStatus.sold}
        purchasesThisMonth={analytics.purchasesTrend.thisMonth}
        salesThisMonth={analytics.salesTrend.thisMonth}
      />

      {/* Charts */}
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

      {/* Performance & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <PerformanceMetrics
          averageSalePrice={analytics.averageSalePrice}
          averageProfitMargin={analytics.averageProfitMargin}
          inventoryTurnover={analytics.inventoryTurnover}
          averageDaysToSell={analytics.averageDaysToSell}
        />
        <TopPerformersCard topCustomers={analytics.topCustomers} topSuppliers={analytics.topSuppliers} topCars={analytics.topSellingCars} />
      </div>

      {/* Recent Activity & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <RecentActivityCard recentSales={analytics.recentSales} />
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
  );
}
