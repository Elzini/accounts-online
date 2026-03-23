/**
 * Dashboard - Slim Orchestrator
 * Composes hooks and tab components. ~150 lines vs original 1,442.
 */
import { useState, useCallback } from 'react';
import { Package, BarChart3 } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActivePage } from '@/types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStats } from '@/hooks/useDatabase';

// Dashboard sub-components
import { AnimatedDashboardBackground } from './dashboard/AnimatedDashboardBackground';
import { WelcomeHeader } from './dashboard/WelcomeHeader';
import { GettingStartedDashboard } from './dashboard/GettingStartedDashboard';
import { CustomizeInterfaceButton } from './dashboard/CustomizeInterfaceButton';
import { OnlineUsersPopover } from './dashboard/OnlineUsersPopover';
import { PaymentRemindersPopover } from './dashboard/PaymentRemindersPopover';
import { DisplaySettingsDialog } from './dashboard/DisplaySettingsDialog';
import { ExportImportSettings } from './dashboard/ExportImportSettings';
import { FloatingPanelToggle } from './dashboard/FloatingMiniDashboard';
import { FocusModeToggle } from './dashboard/FocusMode';
import { WidgetVisibilityPanel } from './dashboard/WidgetVisibilityPanel';
import { DashboardEditToolbar, DEFAULT_WIDGETS } from './dashboard/DashboardEditMode';
import { StatCardDetailDialog, StatDetailData } from './dashboard/StatCardDetailDialog';

// Decomposed modules
import { useDashboardData } from './dashboard/hooks/useDashboardData';
import { useDashboardWidgets } from './dashboard/hooks/useDashboardWidgets';
import { DashboardOverviewTab } from './dashboard/DashboardOverviewTab';
import { DashboardAnalyticsTab } from './dashboard/DashboardAnalyticsTab';

// Stat detail logic (kept inline since it uses many cross-cutting concerns)
import { useShowStatDetail } from './dashboard/hooks/useShowStatDetail';

interface DashboardProps {
  stats: any;
  setActivePage: (page: ActivePage) => void;
  isLoading?: boolean;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export function Dashboard({ stats, setActivePage, isLoading = false, isFocusMode = false, onToggleFocusMode }: DashboardProps) {
  const { t } = useLanguage();
  const data = useDashboardData();
  const widgets = useDashboardWidgets({
    stats,
    projectCostAccountId: data.projectCostAccountId,
    isCarDealership: data.isCarDealership,
  });

  // Stat detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailData, setDetailData] = useState<StatDetailData | null>(null);

  const showStatDetail = useShowStatDetail({
    stats, getCardConfig: widgets.getCardConfig, getCardLabel: widgets.getCardLabel,
    getCardValue: widgets.getCardValue, accountBalances: widgets.accountBalances,
    accountsList: data.accountsList, formatCurrency: data.formatCurrency,
    industryLabels: data.industryLabels, isCarDealership: data.isCarDealership,
    companyId: data.companyId, t: data.t, projectCostAccountId: data.projectCostAccountId,
    selectedFiscalYear: data.selectedFiscalYear,
    buildSalesCarDetails: data.buildSalesCarDetails,
    buildPurchaseCarDetails: data.buildPurchaseCarDetails,
    allTimeStats: data.allTimeStats,
    setDetailData, setDetailDialogOpen,
  });

  // New system check (combines data + widget config)
  const isNewSystem = data.isNewSystem && !widgets.skipOnboarding;

  if (isNewSystem && !isLoading) {
    return (
      <div className="relative space-y-4 sm:space-y-6 md:space-y-8">
        <AnimatedDashboardBackground />
        <WelcomeHeader amountDisplayMode={data.amountDisplayMode} onAmountDisplayModeChange={data.setAmountDisplayMode} onRefresh={data.handleRefresh} isRefreshing={data.isRefreshing} />
        <GettingStartedDashboard setActivePage={setActivePage} hasFiscalYear={data.fiscalYears.length > 0} hasTaxSettings={!!data.taxSettings?.is_active} hasAccounts={data.accountsList.length > 0} />
      </div>
    );
  }

  return (
    <div className="relative space-y-4 sm:space-y-6 md:space-y-8">
      <AnimatedDashboardBackground />
      <WelcomeHeader amountDisplayMode={data.amountDisplayMode} onAmountDisplayModeChange={data.setAmountDisplayMode} onRefresh={data.handleRefresh} isRefreshing={data.isRefreshing} />

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

        <TabsContent value="overview" className={cn("mt-4 sm:mt-6", widgets.isEditMode && "pt-28")}>
          <DashboardEditToolbar isEditMode={widgets.isEditMode} onSave={widgets.saveWidgetConfig} onCancel={widgets.cancelEditMode} widgets={widgets.widgetConfigs} onWidgetsChange={widgets.setWidgetConfigs} />

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
            <CustomizeInterfaceButton setActivePage={setActivePage} onCardsConfigChange={widgets.handleCardsConfigChange} onEnterEditMode={widgets.enterEditMode} isEditMode={widgets.isEditMode} />
            <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap justify-end overflow-x-auto scrollbar-hide">
              <DisplaySettingsDialog settings={data.displaySettings} onUpdate={data.updateDisplaySettings} />
              <WidgetVisibilityPanel widgets={widgets.widgetConfigs} onToggle={(id) => widgets.setWidgetConfigs(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w))} onReset={() => widgets.setWidgetConfigs(DEFAULT_WIDGETS.map((w, i) => ({ ...w, order: i })))} />
              {onToggleFocusMode && <FocusModeToggle isFocusMode={isFocusMode} onToggle={onToggleFocusMode} />}
              <div className="hidden sm:flex items-center gap-1.5">
                <ExportImportSettings />
                <FloatingPanelToggle />
              </div>
              <OnlineUsersPopover />
              <PaymentRemindersPopover setActivePage={setActivePage} />
            </div>
          </div>

          <DashboardOverviewTab
            stats={stats} allTimeStats={data.allTimeStats} installmentStats={data.installmentStats}
            allCars={data.allCars} transfers={data.transfers || []}
            isCarDealership={data.isCarDealership} industryLabels={data.industryLabels} t={data.t}
            displaySettings={data.displaySettings} monthProgress={data.monthProgress} analytics={data.analytics}
            canSales={data.canSales} canPurchases={data.canPurchases}
            isLoading={isLoading} isDashboardConfigLoading={widgets.isDashboardConfigLoading}
            sortedWidgets={widgets.sortedWidgets} isEditMode={widgets.isEditMode}
            getWidgetProps={widgets.getWidgetProps} getCardConfig={widgets.getCardConfig}
            getCardStyleProps={widgets.getCardStyleProps} getCardLabel={widgets.getCardLabel}
            getCardValue={widgets.getCardValue} handleCardDimensionResize={widgets.handleCardDimensionResize}
            formatCurrencyWithMode={data.formatCurrencyWithMode} getCurrencySubtitle={data.getCurrencySubtitle}
            showStatDetail={showStatDetail} setActivePage={setActivePage}
            handleGridDrop={widgets.handleGridDrop} handleGridDragOver={widgets.handleGridDragOver}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          <DashboardAnalyticsTab
            analytics={data.analytics} analyticsLoading={data.analyticsLoading}
            isCarDealership={data.isCarDealership} allSales={data.allSales}
            expenseBreakdown={data.expenseBreakdown} industryLabels={data.industryLabels}
            formatCurrency={data.formatCurrency}
          />
        </TabsContent>
      </Tabs>

      <StatCardDetailDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen} data={detailData} />
    </div>
  );
}
