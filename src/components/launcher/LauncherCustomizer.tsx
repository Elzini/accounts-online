import { useState, useCallback, useRef } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  GripVertical,
  Eye,
  EyeOff,
  Palette,
  Move,
  ChevronUp,
  ChevronDown,
  Save,
  RotateCcw,
  Maximize2,
  Minimize2,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { LauncherModuleConfig } from './LauncherEditMode';

// Gradient presets for modules
const MODULE_GRADIENTS = [
  { from: '', to: '', label: 'افتراضي' },
  { from: 'hsl(160 80% 45%)', to: 'hsl(200 85% 50%)', label: 'أخضر سماوي' },
  { from: 'hsl(220 90% 55%)', to: 'hsl(260 80% 60%)', label: 'أزرق بنفسجي' },
  { from: 'hsl(30 90% 55%)', to: 'hsl(50 95% 55%)', label: 'برتقالي ذهبي' },
  { from: 'hsl(340 80% 55%)', to: 'hsl(20 90% 55%)', label: 'وردي برتقالي' },
  { from: 'hsl(270 80% 55%)', to: 'hsl(320 80% 55%)', label: 'بنفسجي وردي' },
  { from: 'hsl(200 95% 50%)', to: 'hsl(180 90% 45%)', label: 'سماوي فيروزي' },
  { from: 'hsl(0 80% 55%)', to: 'hsl(30 90% 55%)', label: 'أحمر برتقالي' },
  { from: 'hsl(240 80% 45%)', to: 'hsl(280 75% 55%)', label: 'منتصف الليل' },
];

interface LauncherCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modules: LauncherModuleConfig[];
  onModulesChange: (modules: LauncherModuleConfig[]) => void;
  visibleModules: { id: string; label: string; labelEn: string }[];
}

export function LauncherCustomizer({ open, onOpenChange, modules, onModulesChange, visibleModules }: LauncherCustomizerProps) {
  const [cards, setCards] = useState<LauncherModuleConfig[]>(modules);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Sync when dialog opens
  const prevOpen = useRef(false);
  if (open && !prevOpen.current) {
    setCards([...modules]);
    setSelectedCard(null);
    setHasChanges(false);
  }
  prevOpen.current = open;

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

  const toggleSize = useCallback((id: string) => {
    setCards(prev => prev.map(c => (c.id === id ? { ...c, size: c.size === 'large' ? 'normal' : 'large' } : c)));
    setHasChanges(true);
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== draggedId) setDragOverId(id);
  }, [draggedId]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) { setDragOverId(null); return; }
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
    setDragOverId(null);
  }, [draggedId]);

  const handleSave = () => {
    onModulesChange(cards);
    setHasChanges(false);
    toast.success('تم حفظ إعدادات الواجهة');
    onOpenChange(false);
  };

  const handleReset = () => {
    const defaultConfigs = visibleModules.map((m, i) => ({
      id: m.id,
      label: m.label,
      visible: true,
      order: i,
      size: 'normal' as const,
    }));
    setCards(defaultConfigs);
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
            تخصيص واجهة الوحدات
          </DialogTitle>
          <DialogDescription>
            قم بترتيب الوحدات وتخصيص إظهارها وأحجامها
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Modules List */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <GripVertical className="w-4 h-4" />
              ترتيب الوحدات (اسحب للترتيب)
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
                    <div className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                      <GripVertical className="w-5 h-5" />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <Button variant="ghost" size="icon" className="h-5 w-5"
                        onClick={e => { e.stopPropagation(); moveCard(card.id, 'up'); }}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5"
                        onClick={e => { e.stopPropagation(); moveCard(card.id, 'down'); }}
                        disabled={index === sortedCards.length - 1}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{card.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {card.size === 'large' ? 'كبير' : 'عادي'}
                        </Badge>
                      </div>
                    </div>

                    <Button variant="ghost" size="icon" className="h-8 w-8"
                      onClick={e => { e.stopPropagation(); toggleVisibility(card.id); }}
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

          {/* Settings Panel */}
          <div className="flex flex-col gap-4">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Palette className="w-4 h-4" />
              إعدادات الوحدة المحددة
            </Label>

            {selected ? (
              <div className="border rounded-lg p-4 space-y-5">
                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-sm">اسم الوحدة</Label>
                  <input
                    type="text"
                    value={selected.label}
                    onChange={(e) => {
                      setCards(prev => prev.map(c => c.id === selected.id ? { ...c, label: e.target.value } : c));
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    dir="rtl"
                  />
                </div>

                {/* Size */}
                <div className="space-y-2">
                  <Label className="text-sm">الحجم</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={selected.size === 'normal' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => { toggleSize(selected.id); }}
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                      عادي
                    </Button>
                    <Button
                      variant={selected.size === 'large' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => { toggleSize(selected.id); }}
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      كبير (عمودين)
                    </Button>
                  </div>
                </div>

                {/* Visibility */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm">إظهار الوحدة</Label>
                  <Switch
                    checked={selected.visible}
                    onCheckedChange={() => toggleVisibility(selected.id)}
                  />
                </div>

                {/* Preview */}
                <div className="pt-3 border-t">
                  <Label className="text-sm mb-2 block">معاينة</Label>
                  <div className={cn(
                    'rounded-2xl p-6 bg-card shadow-sm border border-border/40 flex flex-col items-center gap-3 transition-all',
                    !selected.visible && 'opacity-40',
                  )}>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
                      <Move className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-foreground/80">{selected.label}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-8 flex flex-col items-center justify-center text-center text-muted-foreground">
                <Palette className="w-12 h-12 mb-3 opacity-30" />
                <p>اختر وحدة من القائمة</p>
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
            <Button onClick={handleSave} disabled={!hasChanges} className="gap-2">
              <Save className="w-4 h-4" />
              حفظ التغييرات
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
