import { useState, useCallback, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  GripVertical, Eye, EyeOff, Palette, Move, ChevronUp, ChevronDown,
  Save, RotateCcw, Maximize2, Minimize2, Check, Type, LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { LauncherModuleConfig } from './LauncherEditMode';

const BG_COLORS = [
  { value: '', label: 'افتراضي' },
  { value: 'hsl(350 80% 92%)', label: 'وردي' },
  { value: 'hsl(190 80% 90%)', label: 'سماوي' },
  { value: 'hsl(270 70% 92%)', label: 'بنفسجي' },
  { value: 'hsl(330 70% 90%)', label: 'فوشيا' },
  { value: 'hsl(40 90% 88%)', label: 'ذهبي' },
  { value: 'hsl(140 60% 90%)', label: 'أخضر' },
  { value: 'hsl(0 0% 96%)', label: 'رمادي' },
  { value: 'hsl(200 30% 94%)', label: 'أزرق فاتح' },
];

const TEXT_COLORS = [
  { value: '', label: 'افتراضي' },
  { value: 'hsl(210 90% 50%)', label: 'أزرق' },
  { value: 'hsl(160 80% 40%)', label: 'أخضر' },
  { value: 'hsl(40 90% 50%)', label: 'ذهبي' },
  { value: 'hsl(0 0% 95%)', label: 'أبيض' },
  { value: 'hsl(220 15% 30%)', label: 'رمادي غامق' },
  { value: 'hsl(220 15% 15%)', label: 'أسود' },
  { value: 'hsl(0 0% 60%)', label: 'رمادي' },
  { value: 'hsl(0 0% 100%)', label: 'أبيض نقي' },
];

const GRADIENT_PRESETS = [
  { value: '', label: 'افتراضي' },
  { value: 'from-blue-400 to-blue-600', colors: ['#60a5fa', '#2563eb'] },
  { value: 'from-emerald-400 to-emerald-600', colors: ['#34d399', '#059669'] },
  { value: 'from-violet-400 to-violet-600', colors: ['#a78bfa', '#7c3aed'] },
  { value: 'from-amber-400 to-amber-600', colors: ['#fbbf24', '#d97706'] },
  { value: 'from-rose-400 to-rose-600', colors: ['#fb7185', '#e11d48'] },
  { value: 'from-cyan-400 to-cyan-600', colors: ['#22d3ee', '#0891b2'] },
  { value: 'from-pink-400 to-pink-600', colors: ['#f472b6', '#db2777'] },
  { value: 'from-teal-400 to-teal-600', colors: ['#2dd4bf', '#0d9488'] },
  { value: 'from-indigo-400 to-indigo-600', colors: ['#818cf8', '#4f46e5'] },
  { value: 'from-orange-400 to-orange-600', colors: ['#fb923c', '#ea580c'] },
  { value: 'from-lime-400 to-lime-600', colors: ['#a3e635', '#65a30d'] },
  { value: 'from-slate-500 to-slate-700', colors: ['#64748b', '#334155'] },
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

  const prevOpen = useRef(false);
  if (open && !prevOpen.current) {
    setCards([...modules]);
    setSelectedCard(null);
    setHasChanges(false);
  }
  prevOpen.current = open;

  const updateCard = useCallback((id: string, updates: Partial<LauncherModuleConfig>) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    setHasChanges(true);
  }, []);

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

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);
  const handleDragEnd = useCallback(() => { setDraggedId(null); setDragOverId(null); }, []);
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
      const di = sorted.findIndex(c => c.id === draggedId);
      const ti = sorted.findIndex(c => c.id === targetId);
      if (di === -1 || ti === -1) return prev;
      const [item] = sorted.splice(di, 1);
      sorted.splice(ti, 0, item);
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
      id: m.id, label: m.label, visible: true, order: i, size: 'normal' as const,
    }));
    setCards(defaultConfigs);
    setSelectedCard(null);
    setHasChanges(true);
  };

  const selected = cards.find(c => c.id === selectedCard);
  const sortedCards = [...cards].sort((a, b) => a.order - b.order);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            تخصيص لوحة التحكم
          </DialogTitle>
          <DialogDescription>
            قم بترتيب البطاقات وتخصيص ألوانها وأحجامها وخطوطها
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Right: Card List */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <GripVertical className="w-4 h-4" />
              ترتيب البطاقات (اسحب للترتيب)
            </Label>
            <ScrollArea className="flex-1 border rounded-lg p-2 max-h-[450px]">
              <div className="space-y-1.5">
                {sortedCards.map((card, index) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, card.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, card.id)}
                    onDrop={(e) => handleDrop(e, card.id)}
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-lg border transition-all cursor-grab active:cursor-grabbing select-none',
                      selectedCard === card.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50',
                      !card.visible && 'opacity-50',
                      draggedId === card.id && 'opacity-50 scale-95',
                      dragOverId === card.id && draggedId !== card.id && 'border-primary border-2 bg-primary/10 scale-[1.02]'
                    )}
                    onClick={() => setSelectedCard(card.id)}
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex flex-col gap-0.5">
                      <Button variant="ghost" size="icon" className="h-4 w-4" onClick={e => { e.stopPropagation(); moveCard(card.id, 'up'); }} disabled={index === 0}>
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-4 w-4" onClick={e => { e.stopPropagation(); moveCard(card.id, 'down'); }} disabled={index === sortedCards.length - 1}>
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{card.label}</p>
                      <Badge variant="secondary" className="text-[10px] mt-0.5">
                        {card.size === 'large' ? 'كبير' : card.size === 'small' ? 'صغير' : 'متوسط'}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); updateCard(card.id, { visible: !card.visible }); }}>
                      {card.visible ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Left: Settings Panel */}
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Palette className="w-4 h-4" />
              إعدادات البطاقة المحددة
            </Label>

            {selected ? (
              <ScrollArea className="border rounded-lg p-4 max-h-[450px]">
                <div className="space-y-5">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1"><Type className="w-3.5 h-3.5" /> اسم البطاقة</Label>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => {
                        const orig = visibleModules.find(m => m.id === selected.id);
                        if (orig) updateCard(selected.id, { label: orig.label });
                      }}>
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                      <input
                        type="text" value={selected.label} dir="rtl"
                        onChange={(e) => updateCard(selected.id, { label: e.target.value })}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">يمكنك تغيير اسم البطاقة كما تريد</p>
                  </div>

                  {/* Size */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">الحجم</Label>
                    <div className="flex gap-1.5">
                      {(['large', 'normal', 'small'] as const).map(s => (
                        <Button key={s} variant={selected.size === s ? 'default' : 'outline'} size="sm" className="flex-1 text-xs"
                          onClick={() => updateCard(selected.id, { size: s })}>
                          {s === 'large' ? 'كبير' : s === 'normal' ? 'متوسط' : 'صغير'}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Background Color */}
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1"><Palette className="w-3.5 h-3.5" /> لون الخلفية</Label>
                    <div className="flex flex-wrap gap-2">
                      {BG_COLORS.map((c, i) => (
                        <button key={i} onClick={() => updateCard(selected.id, { bgColor: c.value })}
                          className={cn('w-8 h-8 rounded-full border-2 transition-all hover:scale-110', selected.bgColor === c.value ? 'border-primary ring-2 ring-primary/30' : 'border-border')}
                          style={{ background: c.value || 'hsl(var(--card))' }}
                          title={c.label}>
                          {selected.bgColor === c.value && <Check className="w-4 h-4 mx-auto text-primary" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Color */}
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1"><Type className="w-3.5 h-3.5" /> لون الخط</Label>
                    <div className="flex flex-wrap gap-2">
                      {TEXT_COLORS.map((c, i) => (
                        <button key={i} onClick={() => updateCard(selected.id, { textColor: c.value })}
                          className={cn('w-8 h-8 rounded-full border-2 transition-all hover:scale-110', selected.textColor === c.value ? 'border-primary ring-2 ring-primary/30' : 'border-border')}
                          style={{ background: c.value || 'hsl(var(--foreground))' }}
                          title={c.label}>
                          {selected.textColor === c.value && <Check className="w-4 h-4 mx-auto" style={{ color: c.value && parseFloat(c.value.split(' ')[2]) > 60 ? '#333' : '#fff' }} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gradient */}
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1"><Palette className="w-3.5 h-3.5" /> ألوان تدريجية</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {GRADIENT_PRESETS.map((g, i) => (
                        <button key={i} onClick={() => updateCard(selected.id, { gradient: g.value })}
                          className={cn('h-8 rounded-lg border-2 transition-all hover:scale-105',
                            selected.gradient === g.value ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                          )}
                          style={g.colors ? { background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]})` } : { background: 'hsl(var(--muted))' }}>
                          {selected.gradient === g.value && <Check className="w-4 h-4 mx-auto text-white drop-shadow" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visibility */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Label className="text-xs">إظهار البطاقة</Label>
                    <Switch checked={selected.visible} onCheckedChange={() => updateCard(selected.id, { visible: !selected.visible })} />
                  </div>

                  {/* Preview */}
                  <div className="pt-3 border-t">
                    <Label className="text-xs mb-2 block">معاينة</Label>
                    <div className={cn(
                      'rounded-2xl p-5 flex flex-col items-center gap-3 transition-all shadow-sm border border-border/40',
                      !selected.visible && 'opacity-40',
                    )} style={{ background: selected.bgColor || undefined }}>
                      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shadow-md bg-gradient-to-br',
                        selected.gradient || 'from-primary to-primary/70'
                      )}>
                        <LayoutGrid className="w-7 h-7 text-white" />
                      </div>
                      <span className="text-sm font-semibold" style={{ color: selected.textColor || undefined }}>
                        {selected.label}
                      </span>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="border rounded-lg p-8 flex flex-col items-center justify-center text-center text-muted-foreground h-full">
                <Palette className="w-12 h-12 mb-3 opacity-30" />
                <p>اختر بطاقة من القائمة</p>
                <p className="text-xs mt-1">لتخصيص مظهرها</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 flex items-center justify-between gap-2 border-t pt-4 mt-2">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            استعادة الافتراضي
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
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
