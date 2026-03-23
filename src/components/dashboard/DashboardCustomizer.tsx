/**
 * DashboardCustomizer - Main Component (Orchestrator)
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Move, RotateCcw, Save } from 'lucide-react';
import { useDashboardConfig, useSaveDashboardConfig } from '@/hooks/useSystemControl';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAccounts } from '@/hooks/useAccounting';
import { useIndustryLabels } from '@/hooks/useIndustryLabels';
import { CardListPanel } from './customizer/CardListPanel';
import { CardSettingsPanel } from './customizer/CardSettingsPanel';
import type { CardConfig } from './customizer/types';
import { DEFAULT_STAT_CARDS } from './customizer/types';

// Re-export for backward compatibility
export type { CardConfig, FormulaAccountItem } from './customizer/types';
export { DEFAULT_STAT_CARDS } from './customizer/types';

interface DashboardCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigChange?: (cards: CardConfig[]) => void;
}

export function DashboardCustomizer({ open, onOpenChange, onConfigChange }: DashboardCustomizerProps) {
  const { data: savedConfig, isLoading } = useDashboardConfig();
  const saveConfig = useSaveDashboardConfig();
  const { t } = useLanguage();
  const industryLabels = useIndustryLabels();

  const [cards, setCards] = useState<CardConfig[]>(DEFAULT_STAT_CARDS);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: accounts = [] } = useAccounts();

  const industryLabelsRef = useRef(industryLabels);
  industryLabelsRef.current = industryLabels;
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => { if (open) setConfigLoaded(false); }, [open]);

  useEffect(() => {
    if (configLoaded) return;
    const labels = industryLabelsRef.current;
    if (savedConfig?.stat_cards && savedConfig.stat_cards.length > 0) {
      const savedIds = new Set(savedConfig.stat_cards.map((c: any) => c.id));
      const mergedCards = [
        ...savedConfig.stat_cards.map((c: any) => ({ ...c, fontSize: c.fontSize || 100, bgColor: c.bgColor || '' })),
        ...DEFAULT_STAT_CARDS.filter(dc => !savedIds.has(dc.id)).map(dc => ({ ...dc, fontSize: 100, bgColor: '' })),
      ].sort((a, b) => a.order - b.order);
      setCards(mergedCards);
      setConfigLoaded(true);
    } else if (savedConfig !== undefined) {
      setCards(DEFAULT_STAT_CARDS.map((c, i) => ({
        ...c,
        label: c.id === 'availableCars' ? labels.availableItems : c.id === 'totalPurchases' ? labels.totalPurchasesLabel : c.label,
        order: i, fontSize: 100, bgColor: '',
      })));
      setConfigLoaded(true);
    }
  }, [savedConfig, configLoaded]);

  const moveCard = useCallback((id: string, direction: 'up' | 'down') => {
    setCards(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex(c => c.id === id);
      if (index === -1) return prev;
      const newIndex = direction === 'up' ? Math.max(0, index - 1) : Math.min(sorted.length - 1, index + 1);
      if (newIndex === index) return prev;
      const temp = sorted[index];
      sorted[index] = sorted[newIndex];
      sorted[newIndex] = temp;
      return sorted.map((card, i) => ({ ...card, order: i }));
    });
    setHasChanges(true);
  }, []);

  const toggleVisibility = useCallback((id: string) => {
    setCards(prev => prev.map(c => (c.id === id ? { ...c, visible: !c.visible } : c)));
    setHasChanges(true);
  }, []);

  const updateCard = useCallback((id: string, updates: Partial<CardConfig>) => {
    setCards(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    setHasChanges(true);
  }, []);

  const applyStyleToAll = useCallback((sourceId: string) => {
    setCards(prev => {
      const source = prev.find(c => c.id === sourceId);
      if (!source) return prev;
      return prev.map(c => ({
        ...c, size: source.size, bgColor: source.bgColor, textColor: source.textColor,
        gradientFrom: source.gradientFrom, gradientTo: source.gradientTo, fontSize: source.fontSize,
        height: source.height, width: source.width, enable3D: source.enable3D,
        showTrend: source.showTrend, trendColor: source.trendColor,
      }));
    });
    setHasChanges(true);
    toast.success(t.style_applied_all);
  }, [t]);

  const handleReorder = useCallback((draggedId: string, targetId: string) => {
    setCards(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const draggedIndex = sorted.findIndex(c => c.id === draggedId);
      const targetIndex = sorted.findIndex(c => c.id === targetId);
      if (draggedIndex === -1 || targetIndex === -1) return prev;
      const [draggedItem] = sorted.splice(draggedIndex, 1);
      sorted.splice(targetIndex, 0, draggedItem);
      return sorted.map((card, i) => ({ ...card, order: i }));
    });
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    try {
      await saveConfig.mutateAsync({ stat_cards: cards as any });
      onConfigChange?.(cards);
      setHasChanges(false);
      toast.success(t.dashboard_saved);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving dashboard config:', error);
      toast.error(t.save_error_text);
    }
  };

  const handleReset = () => {
    setCards(DEFAULT_STAT_CARDS.map((c, i) => ({
      ...c,
      label: c.id === 'availableCars' ? industryLabels.availableItems : c.id === 'totalPurchases' ? industryLabels.totalPurchasesLabel : c.label,
      order: i, fontSize: 100, bgColor: '',
    })));
    setSelectedCard(null);
    setHasChanges(true);
  };

  const selected = cards.find(c => c.id === selectedCard);
  const sortedCards = [...cards].sort((a, b) => a.order - b.order);

  const getCardPrimaryLabel = useCallback((card: CardConfig) => {
    if (card.id === 'availableCars') return industryLabels.availableItems;
    if (card.id === 'totalPurchases') return industryLabels.totalPurchasesLabel;
    return card.label;
  }, [industryLabels]);

  const getCardSecondaryLabel = useCallback((card: CardConfig) => {
    const primary = getCardPrimaryLabel(card);
    return card.label && card.label !== primary ? card.label : null;
  }, [getCardPrimaryLabel]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Move className="w-5 h-5 text-primary" />{t.customize_dashboard}</DialogTitle>
          <DialogDescription>{t.customize_dashboard_desc}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardListPanel
            sortedCards={sortedCards}
            selectedCard={selectedCard}
            onSelectCard={setSelectedCard}
            onToggleVisibility={toggleVisibility}
            onMoveCard={moveCard}
            onReorder={handleReorder}
            getCardPrimaryLabel={getCardPrimaryLabel}
            getCardSecondaryLabel={getCardSecondaryLabel}
            t={t}
          />
          <CardSettingsPanel
            selected={selected}
            accounts={accounts}
            industryLabels={industryLabels}
            onUpdateCard={updateCard}
            onToggleVisibility={toggleVisibility}
            onApplyStyleToAll={applyStyleToAll}
            t={t}
          />
        </div>

        <DialogFooter className="flex-shrink-0 flex items-center justify-between gap-2 border-t pt-4 mt-4">
          <Button variant="outline" onClick={handleReset} className="gap-2"><RotateCcw className="w-4 h-4" />{t.restore_default}</Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t.cancel}</Button>
            <Button onClick={handleSave} disabled={!hasChanges || saveConfig.isPending} className="gap-2"><Save className="w-4 h-4" />{saveConfig.isPending ? t.saving_text : t.save_changes_text}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
