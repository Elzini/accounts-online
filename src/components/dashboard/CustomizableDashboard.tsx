import { useState, useEffect, useMemo } from 'react';
import { Settings2, GripVertical, Eye, EyeOff, RotateCcw, X, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ActivePage } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const WIDGET_CONFIG_KEY = 'dashboard-widgets-config';

export interface WidgetConfig {
  id: string;
  label: string;
  labelEn: string;
  visible: boolean;
  order: number;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'kpi-cards', label: 'بطاقات المؤشرات', labelEn: 'KPI Cards', visible: true, order: 0 },
  { id: 'quick-actions', label: 'الإجراءات السريعة', labelEn: 'Quick Actions', visible: true, order: 1 },
  { id: 'recent-sales', label: 'آخر المبيعات', labelEn: 'Recent Sales', visible: true, order: 2 },
  { id: 'recent-purchases', label: 'آخر المشتريات', labelEn: 'Recent Purchases', visible: true, order: 3 },
  { id: 'profit-chart', label: 'رسم الأرباح', labelEn: 'Profit Chart', visible: true, order: 4 },
  { id: 'expense-summary', label: 'ملخص المصروفات', labelEn: 'Expense Summary', visible: true, order: 5 },
  { id: 'top-customers', label: 'أفضل العملاء', labelEn: 'Top Customers', visible: true, order: 6 },
  { id: 'inventory-status', label: 'حالة المخزون', labelEn: 'Inventory Status', visible: true, order: 7 },
  { id: 'due-installments', label: 'الأقساط المستحقة', labelEn: 'Due Installments', visible: true, order: 8 },
  { id: 'calendar-events', label: 'أحداث التقويم', labelEn: 'Calendar Events', visible: false, order: 9 },
  { id: 'tasks-widget', label: 'المهام', labelEn: 'Tasks', visible: false, order: 10 },
  { id: 'notifications-widget', label: 'آخر الإشعارات', labelEn: 'Recent Notifications', visible: false, order: 11 },
];

interface DashboardCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: WidgetConfig[];
  onWidgetsChange: (widgets: WidgetConfig[]) => void;
}

export function DashboardCustomizer({ open, onOpenChange, widgets, onWidgetsChange }: DashboardCustomizerProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [localWidgets, setLocalWidgets] = useState<WidgetConfig[]>(widgets);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) setLocalWidgets([...widgets]);
  }, [open, widgets]);

  const handleToggle = (id: string) => {
    setLocalWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    setLocalWidgets(prev => {
      const items = [...prev];
      const from = items.findIndex(i => i.id === draggedId);
      const to = items.findIndex(i => i.id === targetId);
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      return items.map((item, idx) => ({ ...item, order: idx }));
    });
  };

  const handleSave = () => {
    onWidgetsChange(localWidgets);
    localStorage.setItem(WIDGET_CONFIG_KEY, JSON.stringify(localWidgets));
    onOpenChange(false);
    toast.success(isAr ? 'تم حفظ إعدادات لوحة التحكم' : 'Dashboard settings saved');
  };

  const handleReset = () => {
    setLocalWidgets([...DEFAULT_WIDGETS]);
  };

  const visibleCount = localWidgets.filter(w => w.visible).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir={isAr ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            {isAr ? 'تخصيص لوحة التحكم' : 'Customize Dashboard'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 max-h-96 overflow-y-auto">
          <p className="text-xs text-muted-foreground mb-3">
            {isAr ? `${visibleCount} عنصر مرئي — اسحب لإعادة الترتيب` : `${visibleCount} visible — drag to reorder`}
          </p>
          {localWidgets.map(widget => (
            <div
              key={widget.id}
              draggable
              onDragStart={() => handleDragStart(widget.id)}
              onDragOver={(e) => handleDragOver(e, widget.id)}
              onDragEnd={() => setDraggedId(null)}
              className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                draggedId === widget.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'
              }`}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate">
                  {isAr ? widget.label : widget.labelEn}
                </span>
              </div>
              <Switch
                checked={widget.visible}
                onCheckedChange={() => handleToggle(widget.id)}
              />
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            {isAr ? 'استعادة الافتراضي' : 'Reset'}
          </Button>
          <Button onClick={handleSave} size="sm">
            {isAr ? 'حفظ' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useDashboardWidgets() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem(WIDGET_CONFIG_KEY);
      if (saved) {
        const parsed: WidgetConfig[] = JSON.parse(saved);
        // Merge with defaults to include new widgets
        const merged = DEFAULT_WIDGETS.map(dw => {
          const existing = parsed.find(p => p.id === dw.id);
          return existing || dw;
        });
        return merged.sort((a, b) => a.order - b.order);
      }
    } catch {}
    return DEFAULT_WIDGETS;
  });

  const visibleWidgets = useMemo(
    () => widgets.filter(w => w.visible).sort((a, b) => a.order - b.order),
    [widgets]
  );

  return { widgets, setWidgets, visibleWidgets };
}
