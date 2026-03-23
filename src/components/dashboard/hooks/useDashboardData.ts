/**
 * Dashboard Data Hook
 * Centralizes all data fetching and computed values for the dashboard.
 */
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useMonthlyChartData, useStats, useSales, useCars, useAllTimeStats, useCustomers, useSuppliers } from '@/hooks/useDatabase';
import { useAdvancedAnalytics } from '@/hooks/useAnalytics';
import { useAppSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany, CompanyActivityType } from '@/contexts/CompanyContext';
import { useCarTransfers, usePartnerDealerships } from '@/hooks/useTransfers';
import { useInstallmentSales } from '@/hooks/useInstallments';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useFiscalYears } from '@/hooks/useFiscalYears';
import { useTaxSettings, useAccounts } from '@/hooks/useAccounting';
import { useCardFormulas, buildFormulaVariables, evaluateFormula } from '@/hooks/useCardFormulas';
import { useMonthlyExpenseBreakdown } from '@/hooks/useMonthlyExpenseBreakdown';
import { useIndustryLabels } from '@/hooks/useIndustryLabels';
import { getIndustryFeatures } from '@/core/engine/industryFeatures';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInstallmentStats } from '@/components/dashboard/widgets/InstallmentsWidget';
import { useDashboardDisplay } from '@/hooks/useUserPreferences';
import { useCardAccountBalances } from '@/hooks/useAccountBalances';
import { CardConfig, DEFAULT_STAT_CARDS } from '@/components/dashboard/DashboardCustomizer';
import { AmountDisplayMode } from '@/components/dashboard/AmountDisplaySelector';
import { CarDetailItem } from '@/components/dashboard/StatCardDetailDialog';

export function useDashboardData() {
  const queryClient = useQueryClient();
  const { data: chartData, isLoading: chartLoading } = useMonthlyChartData();
  const { data: analytics, isLoading: analyticsLoading } = useAdvancedAnalytics();
  const { data: settings } = useAppSettings();
  const { permissions } = useAuth();
  const { company, companyId } = useCompany();
  const companyType: CompanyActivityType = company?.company_type || 'general_trading';
  const { hasCarInventory: isCarDealership } = getIndustryFeatures(companyType);
  const industryLabels = useIndustryLabels();
  const { t, language } = useLanguage();
  const { data: transfers } = useCarTransfers();
  const { data: dealerships } = usePartnerDealerships();
  const { data: installmentSales = [] } = useInstallmentSales();
  const { data: rawSales = [] } = useSales();
  const { data: rawCars = [] } = useCars();
  const allSales = isCarDealership ? rawSales : [];
  const allCars = isCarDealership ? rawCars : [];
  const { data: allTimeStats } = useAllTimeStats();
  const { selectedFiscalYear } = useFiscalYear();
  const { data: fiscalYears = [] } = useFiscalYears();
  const { data: taxSettings } = useTaxSettings();
  const { data: accountsList = [] } = useAccounts();
  const { data: customers = [] } = useCustomers();
  const { data: suppliers = [] } = useSuppliers();
  const { data: expenseBreakdown } = useMonthlyExpenseBreakdown();
  const { settings: displaySettings, updateSettings: updateDisplaySettings } = useDashboardDisplay();
  const { getFormula } = useCardFormulas();
  const installmentStats = useInstallmentStats(installmentSales);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [amountDisplayMode, setAmountDisplayMode] = useState<AmountDisplayMode>('total');

  const formulaVariables = useMemo(() => buildFormulaVariables(undefined), []);

  // Project cost account for non-car companies
  const projectCostAccountId = useMemo(() => {
    if (isCarDealership) return null;
    const projectAccount = accountsList.find(a => a.code === '1301')
      || accountsList.find(a => a.code === '130')
      || accountsList.find(a => a.code === '13');
    return projectAccount?.id || null;
  }, [isCarDealership, accountsList]);

  // Fiscal year filtered data
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

  // Month progress
  const monthProgress = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Math.round((now.getDate() / daysInMonth) * 100);
  }, []);

  // Formatters
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0,
      notation: 'standard',
    }).format(value);
  }, []);

  const formatCurrencyWithMode = useCallback((value: number) => formatCurrency(value), [formatCurrency]);
  const getCurrencySubtitle = useCallback(() => t.currency_sar_label, [t]);
  const formatChartValue = useCallback((value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  }, []);

  // Detail builders
  const buildSalesCarDetails = useCallback((): CarDetailItem[] => {
    if (!isCarDealership) return [];
    return fiscalYearSales.map(sale => ({
      id: sale.id,
      name: sale.car?.name || t.not_specified,
      model: sale.car?.model || '',
      purchasePrice: sale.car?.purchase_price || 0,
      salePrice: sale.sale_price,
      profit: sale.profit,
      saleDate: sale.sale_date,
    }));
  }, [fiscalYearSales, isCarDealership, t]);

  const buildPurchaseCarDetails = useCallback((): CarDetailItem[] => {
    if (!isCarDealership) return [];
    return fiscalYearCars.map(car => ({
      id: car.id,
      name: car.name,
      model: car.model || '',
      purchasePrice: car.purchase_price,
      chassisNumber: car.chassis_number,
      status: car.status,
    }));
  }, [fiscalYearCars, isCarDealership]);

  // Refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['stats'] });
      await queryClient.invalidateQueries({ queryKey: ['analytics'] });
      await queryClient.invalidateQueries({ queryKey: ['monthlyChartData'] });
      toast.success(t.data_updated);
    } catch {
      toast.error(t.data_update_failed);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, t]);

  // Auto-refresh
  useEffect(() => {
    if (!displaySettings.autoRefreshInterval) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyChartData'] });
    }, displaySettings.autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [displaySettings.autoRefreshInterval, queryClient]);

  // New system detection
  const isNewSystem = useMemo(() => {
    // relies on dashboardConfig which is in widgets hook - we check basic conditions here
    const hasFiscalYear = fiscalYears.length > 0;
    const hasTaxSettings = !!taxSettings?.is_active;
    const hasAccounts = accountsList.length > 0;
    return !(hasFiscalYear && hasTaxSettings && hasAccounts);
  }, [fiscalYears, taxSettings, accountsList]);

  const canSales = permissions.admin || permissions.sales;
  const canPurchases = permissions.admin || permissions.purchases;
  const canReports = permissions.admin || permissions.reports;

  return {
    // Raw data
    analytics, analyticsLoading,
    chartData, chartLoading,
    allSales, allCars,
    allTimeStats,
    transfers,
    installmentStats,
    expenseBreakdown,
    accountsList,
    fiscalYears, taxSettings,
    // Computed
    isCarDealership, companyId, companyType,
    industryLabels,
    t, language,
    permissions, canSales, canPurchases, canReports,
    monthProgress,
    isNewSystem,
    isRefreshing,
    amountDisplayMode, setAmountDisplayMode,
    displaySettings, updateDisplaySettings,
    projectCostAccountId,
    selectedFiscalYear,
    // Formatters
    formatCurrency, formatCurrencyWithMode, getCurrencySubtitle, formatChartValue,
    // Builders
    buildSalesCarDetails, buildPurchaseCarDetails,
    // Actions
    handleRefresh,
  };
}
