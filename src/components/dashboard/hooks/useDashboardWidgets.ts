/**
 * Dashboard Widget Configuration Hook
 * Manages widget visibility, ordering, drag-drop, card configs, and edit mode.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { calcStandardVAT } from '@/utils/vatCalculator';
import { toast } from 'sonner';
import { useDashboardConfig, useSaveDashboardConfig } from '@/hooks/useSystemControl';
import { CardConfig, DEFAULT_STAT_CARDS } from '@/components/dashboard/DashboardCustomizer';
import { useWidgetDragDrop, WidgetConfig, DEFAULT_WIDGETS } from '@/components/dashboard/DashboardEditMode';
import { useCardAccountBalances } from '@/hooks/useAccountBalances';
import { useCardFormulas, buildFormulaVariables, evaluateFormula } from '@/hooks/useCardFormulas';
import { useLanguage } from '@/contexts/LanguageContext';

interface UseDashboardWidgetsOptions {
  stats: any;
  projectCostAccountId: string | null;
  isCarDealership: boolean;
  accountBalancesIds?: string[];
}

export function useDashboardWidgets({ stats, projectCostAccountId, isCarDealership }: UseDashboardWidgetsOptions) {
  const { t, language } = useLanguage();
  const { data: dashboardConfig, isLoading: isDashboardConfigLoading } = useDashboardConfig();
  const saveDashboardConfig = useSaveDashboardConfig();
  const { getFormula } = useCardFormulas();
  const formulaVariables = useMemo(() => buildFormulaVariables(stats), [stats]);

  // Card configs
  const [cardConfigs, setCardConfigs] = useState<CardConfig[]>(DEFAULT_STAT_CARDS);

  // Collect account IDs for batch fetching
  const accountIdsForCards = useMemo(() => {
    const ids = new Set<string>();
    cardConfigs.forEach(c => {
      if (c.dataSource === 'account' && c.accountId) ids.add(c.accountId);
      if (c.dataSource === 'formula' && c.formulaAccounts) {
        c.formulaAccounts.forEach(fa => ids.add(fa.accountId));
      }
      if (!c.dataSource && c.accountId) ids.add(c.accountId);
      if (!c.dataSource && c.formulaAccounts) {
        c.formulaAccounts.forEach(fa => ids.add(fa.accountId));
      }
    });
    if (projectCostAccountId) ids.add(projectCostAccountId);
    return Array.from(ids);
  }, [cardConfigs, projectCostAccountId]);

  const { data: accountBalances = {} } = useCardAccountBalances(accountIdsForCards);

  // Get card value with account/formula override support
  const getCardValue = useCallback((cardId: string, defaultValue: number): number => {
    const cfg = cardConfigs.find(c => c.id === cardId);
    const industryAdaptiveCards = ['availableCars', 'totalPurchases'];
    const isIndustryAdaptive = industryAdaptiveCards.includes(cardId);

    if (!isIndustryAdaptive) {
      const accountIdToUse = cfg?.dataSource === 'account'
        ? cfg.accountId
        : (!cfg?.dataSource ? cfg?.accountId : undefined);

      if (accountIdToUse && accountBalances[accountIdToUse] !== undefined) {
        return accountBalances[accountIdToUse];
      }

      const formulaItems = cfg?.dataSource === 'formula'
        ? cfg.formulaAccounts
        : (!cfg?.dataSource && cfg?.formulaAccounts?.length ? cfg.formulaAccounts : undefined);

      if (formulaItems && formulaItems.length > 0) {
        let total = 0;
        formulaItems.forEach(item => {
          const bal = accountBalances[item.accountId] || 0;
          total += item.operator === '+' ? bal : -bal;
        });
        return total;
      }
    }

    if (cardId === 'totalPurchases' && !isCarDealership && projectCostAccountId && accountBalances[projectCostAccountId] !== undefined) {
      return accountBalances[projectCostAccountId];
    }

    const formulaConfig = getFormula(cardId);
    if (!formulaConfig || !formulaConfig.isCustom) return defaultValue;
    const { result, error } = evaluateFormula(formulaConfig.formula, formulaVariables);
    if (error) return defaultValue;
    return formulaConfig.includeVAT ? result * 1.15 : result;
  }, [getFormula, formulaVariables, cardConfigs, accountBalances, isCarDealership, projectCostAccountId]);

  // Widget edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgetConfigs, setWidgetConfigs] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);

  const dragDrop = useWidgetDragDrop(widgetConfigs, setWidgetConfigs);

  // Load card configs from saved dashboard config
  useEffect(() => {
    if (dashboardConfig?.stat_cards && dashboardConfig.stat_cards.length > 0) {
      const savedIds = new Set(dashboardConfig.stat_cards.map((c: any) => c.id));
      const mergedCards = [
        ...dashboardConfig.stat_cards.map((c: any) => ({
          id: c.id, type: c.type || 'stat', label: c.label, visible: c.visible ?? true,
          order: c.order ?? 0, size: c.size || 'medium',
          bgColor: c.bgColor || '', textColor: c.textColor || '',
          gradientFrom: c.gradientFrom || '', gradientTo: c.gradientTo || '',
          fontSize: c.fontSize || 100, height: c.height, width: c.width,
          enable3D: c.enable3D || false, showTrend: c.showTrend ?? true, trendColor: c.trendColor || '',
          dataSource: c.dataSource, accountId: c.accountId, formulaAccounts: c.formulaAccounts,
        })),
        ...DEFAULT_STAT_CARDS.filter(dc => !savedIds.has(dc.id)).map((dc, i) => ({
          ...dc, order: dashboardConfig.stat_cards.length + i, fontSize: 100, bgColor: '',
        })),
      ].sort((a, b) => a.order - b.order);
      setCardConfigs(mergedCards);
    }
  }, [dashboardConfig]);

  const handleCardsConfigChange = useCallback((cards: CardConfig[]) => {
    setCardConfigs(cards);
    setWidgetConfigs(prev => prev.map(w => {
      const matched = cards.find(c => c.id === w.id);
      return matched ? { ...w, visible: matched.visible, label: matched.label || w.label } : w;
    }));
  }, []);

  // Load widget configs - skip during edit mode
  useEffect(() => {
    if (isEditMode) return;
    if (dashboardConfig?.layout_settings?.widgets) {
      const savedWidgets = dashboardConfig.layout_settings.widgets as WidgetConfig[];
      const validDefaultIds = new Set(DEFAULT_WIDGETS.map(dw => dw.id));
      const validSavedWidgets = savedWidgets.filter((w: any) => validDefaultIds.has(w.id));
      const savedIds = new Set(validSavedWidgets.map((w: any) => w.id));
      const merged = [
        ...validSavedWidgets.map((w: any) => ({
          ...w, colSpan: w.colSpan ?? DEFAULT_WIDGETS.find(dw => dw.id === w.id)?.colSpan ?? 2,
        })),
        ...DEFAULT_WIDGETS.filter(dw => !savedIds.has(dw.id)).map((dw, i) => ({
          ...dw, order: validSavedWidgets.length + i,
        })),
      ].sort((a, b) => a.order - b.order);

      const statCardVisibility = new Map(
        (dashboardConfig.stat_cards || []).map((c: any) => [c.id, c.visible ?? true])
      );
      const reconciled = merged.map(w => {
        if (!statCardVisibility.has(w.id)) return w;
        return { ...w, visible: Boolean(statCardVisibility.get(w.id)) };
      });
      setWidgetConfigs(reconciled);
    }
  }, [dashboardConfig, isEditMode]);

  const enterEditMode = useCallback(() => setIsEditMode(true), []);

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
  }, [saveDashboardConfig, cardConfigs, t]);

  const cancelEditMode = useCallback(() => {
    if (dashboardConfig?.layout_settings?.widgets) {
      const savedWidgets = dashboardConfig.layout_settings.widgets as WidgetConfig[];
      const validDefaultIds = new Set(DEFAULT_WIDGETS.map(dw => dw.id));
      const validSavedWidgets = savedWidgets.filter((w: any) => validDefaultIds.has(w.id));
      const savedIds = new Set(validSavedWidgets.map((w: any) => w.id));
      const merged = [
        ...validSavedWidgets.map((w: any) => ({
          ...w, colSpan: w.colSpan ?? DEFAULT_WIDGETS.find(dw => dw.id === w.id)?.colSpan ?? 2,
        })),
        ...DEFAULT_WIDGETS.filter(dw => !savedIds.has(dw.id)).map((dw, i) => ({
          ...dw, order: validSavedWidgets.length + i,
        })),
      ].sort((a, b) => a.order - b.order);

      const statCardVisibility = new Map(
        (dashboardConfig.stat_cards || []).map((c: any) => [c.id, c.visible ?? true])
      );
      const reconciled = merged.map(w => {
        if (!statCardVisibility.has(w.id)) return w;
        return { ...w, visible: Boolean(statCardVisibility.get(w.id)) };
      });
      setWidgetConfigs(reconciled);
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

  const getCardConfig = useCallback((id: string): CardConfig => {
    return cardConfigs.find(c => c.id === id) || {
      id, type: 'stat', label: '', visible: true, order: 999, size: 'medium',
      bgColor: '', textColor: '', gradientFrom: '', gradientTo: '', fontSize: 100,
      height: undefined, width: undefined, enable3D: false, showTrend: true, trendColor: '',
      dataSource: 'default', accountId: undefined, formulaAccounts: undefined,
    };
  }, [cardConfigs]);

  const getCardStyleProps = useCallback((id: string) => {
    const cfg = getCardConfig(id);
    return {
      size: cfg.size,
      bgColor: cfg.bgColor || undefined, textColor: cfg.textColor || undefined,
      gradientFrom: cfg.gradientFrom || undefined, gradientTo: cfg.gradientTo || undefined,
      fontSize: cfg.fontSize, height: cfg.height, width: cfg.width,
      enable3D: cfg.enable3D, showTrend: cfg.showTrend ?? true, trendColor: cfg.trendColor || undefined,
    };
  }, [getCardConfig]);

  const getCardLabel = useCallback((id: string, defaultLabel: string) => {
    if (language !== 'ar') return defaultLabel;
    const cfg = cardConfigs.find(c => c.id === id);
    const industryAdaptiveCards = ['availableCars', 'totalPurchases'];
    if (industryAdaptiveCards.includes(id)) return defaultLabel;
    return cfg?.label || defaultLabel;
  }, [cardConfigs, language]);

  const visibleCardIds = useMemo(() => {
    return cardConfigs.filter(c => c.visible).sort((a, b) => a.order - b.order).map(c => c.id);
  }, [cardConfigs]);

  const handleCardDimensionResize = useCallback((cardId: string, newWidth?: number, newHeight?: number) => {
    setCardConfigs(prev => prev.map(c =>
      c.id === cardId ? { ...c, width: newWidth, height: newHeight } : c
    ));
  }, []);

  const getWidgetProps = useCallback((id: string) => ({
    id, isEditMode,
    visible: isWidgetVisible(id),
    order: widgetConfigs.find(w => w.id === id)?.order ?? 999,
    colSpan: widgetConfigs.find(w => w.id === id)?.colSpan ?? 2,
    onRemove: dragDrop.removeWidget,
    onResize: dragDrop.resizeWidget,
    onMoveUp: dragDrop.moveWidgetUp,
    onMoveDown: dragDrop.moveWidgetDown,
    onDragStart: dragDrop.handleDragStart,
    onDragEnd: dragDrop.handleDragEnd,
    onDragOver: dragDrop.handleDragOver,
    onDrop: dragDrop.handleDrop,
    isDragging: dragDrop.draggedId === id,
    isDragOver: dragDrop.dragOverId === id,
    onDimensionResize: handleCardDimensionResize,
    cardConfig: getCardConfig(id),
  }), [isEditMode, isWidgetVisible, widgetConfigs, dragDrop, handleCardDimensionResize, getCardConfig]);

  // Check if onboarding should be skipped
  const skipOnboarding = useMemo(() => {
    return !!(dashboardConfig?.layout_settings as any)?.skip_onboarding;
  }, [dashboardConfig]);

  return {
    // Config state
    cardConfigs, setCardConfigs,
    widgetConfigs, setWidgetConfigs,
    isEditMode, isDashboardConfigLoading,
    dashboardConfig,
    accountBalances,
    skipOnboarding,
    // Actions
    enterEditMode, saveWidgetConfig, cancelEditMode,
    handleCardsConfigChange,
    // Helpers
    getCardValue, getCardConfig, getCardStyleProps, getCardLabel,
    visibleCardIds, sortedWidgets, isWidgetVisible,
    getWidgetProps, handleCardDimensionResize,
    // Drag drop
    ...dragDrop,
  };
}
