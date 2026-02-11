import { useState, useEffect, useCallback, useRef } from 'react';
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
  Ruler,
  Box,
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
  textColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  fontSize?: number; // percentage 80-120
  height?: number; // ارتفاع البطاقة بالبكسل
  enable3D?: boolean; // تفعيل التأثير ثلاثي الأبعاد
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

const TEXT_COLORS = [
  { value: '', label: 'افتراضي (أبيض)' },
  { value: '#ffffff', label: 'أبيض' },
  { value: '#000000', label: 'أسود' },
  { value: '#1e293b', label: 'رمادي داكن' },
  { value: '#f1f5f9', label: 'رمادي فاتح' },
  { value: '#fbbf24', label: 'ذهبي' },
  { value: '#34d399', label: 'أخضر' },
  { value: '#60a5fa', label: 'أزرق' },
];

const GRADIENT_PRESETS = [
  { from: '', to: '', label: 'بدون تدرج' },
  { from: 'hsl(220 90% 55%)', to: 'hsl(260 80% 60%)', label: 'أزرق بنفسجي' },
  { from: 'hsl(160 80% 45%)', to: 'hsl(200 85% 50%)', label: 'أخضر سماوي' },
  { from: 'hsl(340 80% 55%)', to: 'hsl(20 90% 55%)', label: 'وردي برتقالي' },
  { from: 'hsl(30 90% 55%)', to: 'hsl(50 95% 55%)', label: 'برتقالي ذهبي' },
  { from: 'hsl(270 80% 55%)', to: 'hsl(320 80% 55%)', label: 'بنفسجي وردي' },
  { from: 'hsl(180 70% 45%)', to: 'hsl(220 80% 55%)', label: 'سماوي أزرق' },
  { from: 'hsl(0 80% 55%)', to: 'hsl(30 90% 55%)', label: 'أحمر برتقالي' },
  { from: 'hsl(200 85% 45%)', to: 'hsl(160 80% 50%)', label: 'أزرق أخضر' },
  { from: 'hsl(250 70% 50%)', to: 'hsl(200 80% 55%)', label: 'نيلي سماوي' },
  { from: 'hsl(45 90% 50%)', to: 'hsl(30 85% 45%)', label: 'ذهبي بني' },
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
  
  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

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

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedId(id);
    dragNode.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    
    // Add drag styling after a tiny delay to avoid immediate visual issues
    setTimeout(() => {
      if (dragNode.current) {
        dragNode.current.classList.add('opacity-50');
      }
    }, 0);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragNode.current) {
      dragNode.current.classList.remove('opacity-50');
    }
    setDraggedId(null);
    setDragOverId(null);
    dragNode.current = null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== draggedId) {
      setDragOverId(id);
    }
  }, [draggedId]);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    
    if (!draggedId || draggedId === targetId) {
      setDragOverId(null);
      return;
    }

    setCards(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const draggedIndex = sorted.findIndex(c => c.id === draggedId);
      const targetIndex = sorted.findIndex(c => c.id === targetId);
      
      if (draggedIndex === -1 || targetIndex === -1) return prev;
      
      // Remove dragged item and insert at target position
      const [draggedItem] = sorted.splice(draggedIndex, 1);
      sorted.splice(targetIndex, 0, draggedItem);
      
      // Reassign orders
      return sorted.map((card, i) => ({ ...card, order: i }));
    });
    
    setHasChanges(true);
    setDragOverId(null);
  }, [draggedId]);

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
              <GripVertical className="w-4 h-4" />
              ترتيب البطاقات (اسحب للترتيب)
            </Label>
            <ScrollArea className="flex-1 border rounded-lg p-2 max-h-[400px]">
              <div className="space-y-2">
                {sortedCards.map((card, index) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, card.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, card.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, card.id)}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing select-none',
                      selectedCard === card.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-primary/50',
                      !card.visible && 'opacity-50',
                      draggedId === card.id && 'opacity-50 scale-95',
                      dragOverId === card.id && draggedId !== card.id && 'border-primary border-2 bg-primary/10 scale-[1.02]'
                    )}
                    onClick={() => setSelectedCard(card.id)}
                  >
                    {/* Drag Handle */}
                    <div className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* Arrow buttons for accessibility */}
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={e => {
                          e.stopPropagation();
                          moveCard(card.id, 'up');
                        }}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={e => {
                          e.stopPropagation();
                          moveCard(card.id, 'down');
                        }}
                        disabled={index === sortedCards.length - 1}
                      >
                        <ChevronDown className="w-3 h-3" />
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
                {/* Editable Card Name */}
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    اسم البطاقة
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={selected.label}
                      onChange={(e) => updateCard(selected.id, { label: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      dir="rtl"
                      placeholder="اسم البطاقة"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        const defaultCard = DEFAULT_STAT_CARDS.find(c => c.id === selected.id);
                        if (defaultCard) {
                          updateCard(selected.id, { label: defaultCard.label });
                        }
                      }}
                      title="استعادة الاسم الافتراضي"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">يمكنك تغيير اسم البطاقة كما تريد</p>
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

                {/* Text Color */}
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    لون الخط
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {TEXT_COLORS.map(color => (
                      <button
                        key={color.value || 'default-text'}
                        onClick={() => updateCard(selected.id, { textColor: color.value })}
                        className={cn(
                          'w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center',
                          (selected.textColor || '') === color.value
                            ? 'ring-2 ring-primary ring-offset-2'
                            : 'border-border hover:border-primary/50'
                        )}
                        style={{
                          backgroundColor: color.value || 'hsl(var(--card))',
                        }}
                        title={color.label}
                      >
                        {(selected.textColor || '') === color.value && (
                          <Check className="w-4 h-4" style={{ color: color.value === '#000000' || color.value === '#1e293b' ? '#fff' : '#000' }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gradient Presets */}
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    ألوان تدريجية
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {GRADIENT_PRESETS.map((preset, i) => {
                      const isSelected = (selected.gradientFrom || '') === preset.from && (selected.gradientTo || '') === preset.to;
                      return (
                        <button
                          key={i}
                          onClick={() => updateCard(selected.id, { 
                            gradientFrom: preset.from, 
                            gradientTo: preset.to,
                            bgColor: preset.from ? '' : selected.bgColor, // clear bgColor when using gradient
                          })}
                          className={cn(
                            'h-8 rounded-lg border-2 transition-all flex items-center justify-center',
                            isSelected
                              ? 'ring-2 ring-primary ring-offset-2'
                              : 'border-border hover:border-primary/50'
                          )}
                          style={{
                            background: preset.from
                              ? `linear-gradient(135deg, ${preset.from}, ${preset.to})`
                              : 'hsl(var(--card))',
                          }}
                          title={preset.label}
                        >
                          {isSelected && (
                            <Check className="w-4 h-4 text-white drop-shadow-md" />
                          )}
                        </button>
                      );
                    })}
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

                {/* Card Height */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm flex items-center gap-2">
                      <Ruler className="w-4 h-4" />
                      ارتفاع البطاقة
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {selected.height ? `${selected.height}px` : 'تلقائي'}
                    </span>
                  </div>
                  <Slider
                    value={[selected.height || 0]}
                    onValueChange={([value]) => updateCard(selected.id, { height: value === 0 ? undefined : value })}
                    min={0}
                    max={200}
                    step={10}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">0 = ارتفاع تلقائي</p>
                </div>

                {/* 3D Effect */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-2">
                    <Box className="w-4 h-4" />
                    تأثير ثلاثي الأبعاد
                  </Label>
                  <Switch
                    checked={selected.enable3D || false}
                    onCheckedChange={(checked) => updateCard(selected.id, { enable3D: checked })}
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
                      'rounded-xl p-4 border transition-all overflow-hidden',
                      selected.size === 'small' && 'text-xs',
                      selected.size === 'large' && 'text-lg'
                    )}
                    style={{
                      background: selected.gradientFrom && selected.gradientTo
                        ? `linear-gradient(135deg, ${selected.gradientFrom}, ${selected.gradientTo})`
                        : selected.bgColor || 'hsl(var(--card))',
                      fontSize: `${(selected.fontSize || 100) / 100}em`,
                      height: selected.height ? `${selected.height}px` : undefined,
                      color: selected.textColor || undefined,
                      transform: selected.enable3D 
                        ? 'perspective(1000px) rotateX(-3deg) rotateY(3deg)'
                        : undefined,
                      boxShadow: selected.enable3D 
                        ? '-4px 8px 25px rgba(0,0,0,0.2), -2px 3px 8px rgba(0,0,0,0.1)'
                        : undefined,
                    }}
                  >
                    <p className="opacity-75 text-[0.75em] mb-1" style={{ color: selected.textColor || undefined }}>{selected.label}</p>
                    <p className="font-bold text-[1.5em]" style={{ color: selected.textColor || undefined }}>123,456</p>
                    <p className="opacity-60 text-[0.7em]" style={{ color: selected.textColor || undefined }}>ريال سعودي</p>
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
