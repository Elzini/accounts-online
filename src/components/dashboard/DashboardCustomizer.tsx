import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  GripVertical,
  Eye,
  EyeOff,
  Palette,
  Type,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Check,
  Move,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardConfig, useSaveDashboardConfig } from '@/hooks/useSystemControl';
import { toast } from 'sonner';

// Card configuration interface
export interface CardConfig {
  id: string;
  type: string;
  label: string;
  visible: boolean;
  order: number;
  size: 'small' | 'medium' | 'large';
  bgColor?: string;
  fontSize?: number; // percentage 80-120
}

// Default stat cards
const DEFAULT_STAT_CARDS: CardConfig[] = [
  { id: 'availableCars', type: 'stat', label: 'السيارات المتاحة', visible: true, order: 0, size: 'medium' },
  { id: 'totalPurchases', type: 'stat', label: 'إجمالي المشتريات', visible: true, order: 1, size: 'medium' },
  { id: 'monthSales', type: 'stat', label: 'مبيعات الشهر', visible: true, order: 2, size: 'medium' },
  { id: 'totalProfit', type: 'stat', label: 'إجمالي الأرباح', visible: true, order: 3, size: 'medium' },
  { id: 'todaySales', type: 'stat', label: 'مبيعات اليوم', visible: true, order: 4, size: 'medium' },
  { id: 'monthSalesCount', type: 'stat', label: 'عدد مبيعات الشهر', visible: true, order: 5, size: 'medium' },
  { id: 'allTimePurchases', type: 'stat', label: 'إجمالي مشتريات الشركة', visible: true, order: 6, size: 'medium' },
  { id: 'allTimeSales', type: 'stat', label: 'إجمالي مبيعات الشركة', visible: true, order: 7, size: 'medium' },
  { id: 'activeInstallments', type: 'stat', label: 'عقود التقسيط النشطة', visible: true, order: 8, size: 'medium' },
  { id: 'overdueInstallments', type: 'stat', label: 'الأقساط المتأخرة', visible: true, order: 9, size: 'medium' },
  { id: 'upcomingInstallments', type: 'stat', label: 'أقساط الشهر الحالي', visible: true, order: 10, size: 'medium' },
  { id: 'totalDue', type: 'stat', label: 'إجمالي المستحق', visible: true, order: 11, size: 'medium' },
];

// Predefined colors
const CARD_COLORS = [
  { value: '', label: 'افتراضي' },
  { value: 'hsl(var(--primary) / 0.1)', label: 'أزرق' },
  { value: 'hsl(var(--success) / 0.1)', label: 'أخضر' },
  { value: 'hsl(var(--warning) / 0.1)', label: 'برتقالي' },
  { value: 'hsl(var(--destructive) / 0.1)', label: 'أحمر' },
  { value: 'hsl(262 83% 58% / 0.1)', label: 'بنفسجي' },
  { value: 'hsl(190 90% 50% / 0.1)', label: 'سماوي' },
  { value: 'hsl(330 80% 60% / 0.1)', label: 'وردي' },
  { value: 'hsl(45 90% 55% / 0.1)', label: 'ذهبي' },
];

interface DashboardCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigChange?: (cards: CardConfig[]) => void;
}

export function DashboardCustomizer({ open, onOpenChange, onConfigChange }: DashboardCustomizerProps) {
  const { data: savedConfig, isLoading } = useDashboardConfig();
  const saveConfig = useSaveDashboardConfig();

  const [cards, setCards] = useState<CardConfig[]>(DEFAULT_STAT_CARDS);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load saved config
  useEffect(() => {
    if (savedConfig?.stat_cards && savedConfig.stat_cards.length > 0) {
      // Merge saved config with defaults to ensure new cards are included
      const savedIds = new Set(savedConfig.stat_cards.map((c: any) => c.id));
      const mergedCards = [
        ...savedConfig.stat_cards.map((c: any) => ({
          ...c,
          fontSize: c.fontSize || 100,
          bgColor: c.bgColor || '',
        })),
        ...DEFAULT_STAT_CARDS.filter(dc => !savedIds.has(dc.id)).map(dc => ({
          ...dc,
          fontSize: 100,
          bgColor: '',
        })),
      ].sort((a, b) => a.order - b.order);
      setCards(mergedCards);
    } else {
      setCards(DEFAULT_STAT_CARDS.map((c, i) => ({ ...c, order: i, fontSize: 100, bgColor: '' })));
    }
  }, [savedConfig]);

  const moveCard = useCallback((id: string, direction: 'up' | 'down') => {
    setCards(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex(c => c.id === id);
      if (index === -1) return prev;

      const newIndex = direction === 'up' ? Math.max(0, index - 1) : Math.min(sorted.length - 1, index + 1);
      if (newIndex === index) return prev;

      // Swap orders
      const temp = sorted[index];
      sorted[index] = sorted[newIndex];
      sorted[newIndex] = temp;

      // Reassign orders
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

  const handleSave = async () => {
    try {
      await saveConfig.mutateAsync({
        stat_cards: cards as any,
      });
      onConfigChange?.(cards);
      setHasChanges(false);
      toast.success('تم حفظ إعدادات لوحة التحكم');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving dashboard config:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleReset = () => {
    setCards(DEFAULT_STAT_CARDS.map((c, i) => ({ ...c, order: i, fontSize: 100, bgColor: '' })));
    setSelectedCard(null);
    setHasChanges(true);
  };

  const selected = cards.find(c => c.id === selectedCard);
  const sortedCards = [...cards].sort((a, b) => a.order - b.order);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Move className="w-5 h-5 text-primary" />
            تخصيص لوحة التحكم
          </DialogTitle>
          <DialogDescription>
            قم بترتيب البطاقات وتخصيص ألوانها وأحجامها وخطوطها
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cards List */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" />
              ترتيب البطاقات
            </Label>
            <ScrollArea className="flex-1 border rounded-lg p-2 max-h-[400px]">
              <div className="space-y-2">
                {sortedCards.map((card, index) => (
                  <div
                    key={card.id}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer',
                      selectedCard === card.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-primary/50',
                      !card.visible && 'opacity-50'
                    )}
                    onClick={() => setSelectedCard(card.id)}
                  >
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={e => {
                          e.stopPropagation();
                          moveCard(card.id, 'up');
                        }}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={e => {
                          e.stopPropagation();
                          moveCard(card.id, 'down');
                        }}
                        disabled={index === sortedCards.length - 1}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{card.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {card.size === 'small' ? 'صغير' : card.size === 'large' ? 'كبير' : 'متوسط'}
                        </Badge>
                        {card.bgColor && (
                          <span
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: card.bgColor }}
                          />
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={e => {
                        e.stopPropagation();
                        toggleVisibility(card.id);
                      }}
                    >
                      {card.visible ? (
                        <Eye className="w-4 h-4 text-primary" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Card Settings Panel */}
          <div className="flex flex-col gap-4">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Palette className="w-4 h-4" />
              إعدادات البطاقة المحددة
            </Label>

            {selected ? (
              <div className="border rounded-lg p-4 space-y-5">
                <div>
                  <p className="font-semibold mb-1">{selected.label}</p>
                  <p className="text-xs text-muted-foreground">تخصيص مظهر هذه البطاقة</p>
                </div>

                {/* Size */}
                <div className="space-y-2">
                  <Label className="text-sm">الحجم</Label>
                  <div className="flex gap-2">
                    {(['small', 'medium', 'large'] as const).map(size => (
                      <Button
                        key={size}
                        variant={selected.size === size ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => updateCard(selected.id, { size })}
                      >
                        {size === 'small' ? 'صغير' : size === 'large' ? 'كبير' : 'متوسط'}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Background Color */}
                <div className="space-y-2">
                  <Label className="text-sm">لون الخلفية</Label>
                  <div className="flex flex-wrap gap-2">
                    {CARD_COLORS.map(color => (
                      <button
                        key={color.value || 'default'}
                        onClick={() => updateCard(selected.id, { bgColor: color.value })}
                        className={cn(
                          'w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center',
                          (selected.bgColor || '') === color.value
                            ? 'ring-2 ring-primary ring-offset-2'
                            : 'border-border hover:border-primary/50'
                        )}
                        style={{
                          backgroundColor: color.value || 'hsl(var(--card))',
                        }}
                        title={color.label}
                      >
                        {(selected.bgColor || '') === color.value && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      حجم الخط
                    </Label>
                    <span className="text-sm text-muted-foreground">{selected.fontSize || 100}%</span>
                  </div>
                  <Slider
                    value={[selected.fontSize || 100]}
                    onValueChange={([value]) => updateCard(selected.id, { fontSize: value })}
                    min={70}
                    max={130}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Visibility */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm">إظهار البطاقة</Label>
                  <Switch
                    checked={selected.visible}
                    onCheckedChange={() => toggleVisibility(selected.id)}
                  />
                </div>

                {/* Preview */}
                <div className="pt-3 border-t">
                  <Label className="text-sm mb-2 block">معاينة</Label>
                  <div
                    className={cn(
                      'rounded-xl p-4 border shadow-sm transition-all',
                      selected.size === 'small' && 'text-xs',
                      selected.size === 'large' && 'text-lg'
                    )}
                    style={{
                      backgroundColor: selected.bgColor || 'hsl(var(--card))',
                      fontSize: `${(selected.fontSize || 100) / 100}em`,
                    }}
                  >
                    <p className="text-muted-foreground text-[0.75em] mb-1">{selected.label}</p>
                    <p className="font-bold text-[1.5em]">123,456</p>
                    <p className="text-muted-foreground text-[0.7em]">ريال سعودي</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-8 flex flex-col items-center justify-center text-center text-muted-foreground">
                <Palette className="w-12 h-12 mb-3 opacity-30" />
                <p>اختر بطاقة من القائمة</p>
                <p className="text-xs mt-1">لتخصيص مظهرها</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 flex items-center justify-between gap-2 border-t pt-4 mt-4">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            استعادة الافتراضي
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || saveConfig.isPending} className="gap-2">
              <Save className="w-4 h-4" />
              {saveConfig.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Export card config for use in Dashboard
export { DEFAULT_STAT_CARDS };
