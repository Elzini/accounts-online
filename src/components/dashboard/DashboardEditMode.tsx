import { useState, useCallback, useRef } from 'react';
import { X, GripVertical, Save, RotateCcw, Check, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface WidgetConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  colSpan: number;
}

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'quickAccess', label: 'الوصول السريع', visible: true, order: 0, colSpan: 2 },
  { id: 'statCards', label: 'بطاقات الإحصائيات', visible: true, order: 1, colSpan: 2 },
  { id: 'allTimeStats', label: 'إجمالي الشركة', visible: true, order: 2, colSpan: 2 },
  { id: 'installmentStats', label: 'بطاقات التقسيط', visible: true, order: 3, colSpan: 2 },
  { id: 'monthlyExpenses', label: 'المصروفات الشهرية', visible: true, order: 4, colSpan: 2 },
  { id: 'transfers', label: 'السيارات الوارد والصادر', visible: true, order: 5, colSpan: 2 },
  { id: 'quickActions', label: 'الإجراءات السريعة', visible: true, order: 6, colSpan: 1 },
  { id: 'reports', label: 'التقارير', visible: true, order: 7, colSpan: 1 },
  { id: 'recentInvoices', label: 'أحدث الفواتير', visible: true, order: 8, colSpan: 2 },
];

interface DashboardEditModeProps {
  isEditMode: boolean;
  onSave: (widgets: WidgetConfig[]) => void;
  onCancel: () => void;
  widgets: WidgetConfig[];
  onWidgetsChange: (widgets: WidgetConfig[]) => void;
}

export function DashboardEditToolbar({ 
  isEditMode, 
  onSave, 
  onCancel, 
  widgets, 
  onWidgetsChange 
}: DashboardEditModeProps) {
  if (!isEditMode) return null;

  const toggleWidget = (id: string) => {
    onWidgetsChange(
      widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w)
    );
  };

  const resetToDefault = () => {
    onWidgetsChange(DEFAULT_WIDGETS.map((w, i) => ({ ...w, order: i })));
  };

  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/10 via-background to-primary/10 border-b shadow-lg animate-in slide-in-from-top-2 duration-300">
      <div className="container mx-auto px-4 py-3">
        <div className="text-center mb-3">
          <p className="text-sm text-muted-foreground">
            اسحب وأفلت الأقسام لترتيبها • اسحب الحافة أو اضغط أيقونة التحجيم لتغيير العرض
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
          <span className="text-sm text-muted-foreground ml-2">الأقسام (اضغط للإظهار/الإخفاء)</span>
          {sortedWidgets.map(widget => (
            <Badge
              key={widget.id}
              variant={widget.visible ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-all px-3 py-1.5 text-sm",
                widget.visible 
                  ? "bg-primary hover:bg-primary/90" 
                  : "hover:bg-muted"
              )}
              onClick={() => toggleWidget(widget.id)}
            >
              {widget.visible && <Check className="w-3 h-3 ml-1" />}
              {widget.label}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={onCancel} className="gap-2">
            إلغاء
          </Button>
          <Button variant="outline" size="sm" onClick={resetToDefault} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            استعادة الافتراضي
          </Button>
          <Button size="sm" onClick={() => onSave(widgets)} className="gap-2 bg-primary hover:bg-primary/90">
            <Save className="w-4 h-4" />
            حفظ الترتيب
          </Button>
        </div>
      </div>
    </div>
  );
}

interface EditableWidgetWrapperProps {
  id: string;
  isEditMode: boolean;
  visible: boolean;
  order?: number;
  colSpan?: number;
  onRemove: (id: string) => void;
  onResize?: (id: string, colSpan: number) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  isDragging: boolean;
  isDragOver: boolean;
  children: React.ReactNode;
  className?: string;
}

export function EditableWidgetWrapper({
  id,
  isEditMode,
  visible,
  order,
  colSpan = 2,
  onRemove,
  onResize,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging,
  isDragOver,
  children,
  className,
}: EditableWidgetWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!visible) return null;

  const gridStyle: React.CSSProperties = {
    order: order ?? 0,
  };

  const colSpanClass = colSpan === 1 ? 'lg:col-span-1' : 'col-span-1 lg:col-span-2';

  if (!isEditMode) {
    return (
      <div className={cn(colSpanClass, className)} style={gridStyle}>
        {children}
      </div>
    );
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const currentSpan = colSpan;
    let resized = false;
    
    const handleMouseMove = (me: MouseEvent) => {
      const delta = me.clientX - startX;
      if (!resized && delta < -80 && currentSpan === 1) {
        onResize?.(id, 2);
        resized = true;
      } else if (!resized && delta > 80 && currentSpan === 2) {
        onResize?.(id, 1);
        resized = true;
      }
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={containerRef}
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, id)}
      onDrop={(e) => onDrop(e, id)}
      className={cn(
        'relative group transition-all duration-200',
        colSpanClass,
        isDragging && 'opacity-50 scale-[0.98]',
        isDragOver && 'ring-2 ring-primary ring-offset-2 scale-[1.01]',
        'cursor-grab active:cursor-grabbing',
        className
      )}
      style={gridStyle}
    >
      {/* Top controls */}
      <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(id); }}
          className="w-7 h-7 rounded-full bg-destructive text-destructive-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4" />
        </div>
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-2 left-2 z-10 w-8 h-8 rounded-lg bg-primary/20 hover:bg-primary/40 cursor-ew-resize flex items-center justify-center transition-colors shadow-md opacity-0 group-hover:opacity-100"
        onMouseDown={handleResizeMouseDown}
        onClick={(e) => {
          e.stopPropagation();
          onResize?.(id, colSpan === 2 ? 1 : 2);
        }}
        title={colSpan === 2 ? 'تصغير العرض' : 'تكبير العرض'}
      >
        {colSpan === 2 ? <Minimize2 className="w-4 h-4 text-primary" /> : <Maximize2 className="w-4 h-4 text-primary" />}
      </div>

      {/* Border indicator */}
      <div className={cn(
        'absolute inset-0 rounded-xl border-2 border-dashed pointer-events-none transition-colors',
        isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
      )} />

      <div className="relative">{children}</div>
    </div>
  );
}

// Hook for managing widget drag, drop, and resize
export function useWidgetDragDrop(
  widgets: WidgetConfig[],
  onWidgetsChange: (widgets: WidgetConfig[]) => void
) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== draggedId) {
      setDragOverId(id);
    }
  }, [draggedId]);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();

    if (!draggedId || draggedId === targetId) {
      setDragOverId(null);
      return;
    }

    const sorted = [...widgets].sort((a, b) => a.order - b.order);
    const draggedIndex = sorted.findIndex(w => w.id === draggedId);
    const targetIndex = sorted.findIndex(w => w.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDragOverId(null);
      return;
    }

    const [draggedItem] = sorted.splice(draggedIndex, 1);
    sorted.splice(targetIndex, 0, draggedItem);

    onWidgetsChange(sorted.map((w, i) => ({ ...w, order: i })));
    setDragOverId(null);
  }, [draggedId, widgets, onWidgetsChange]);

  const removeWidget = useCallback((id: string) => {
    onWidgetsChange(widgets.map(w => w.id === id ? { ...w, visible: false } : w));
  }, [widgets, onWidgetsChange]);

  const resizeWidget = useCallback((id: string, colSpan: number) => {
    onWidgetsChange(widgets.map(w => w.id === id ? { ...w, colSpan } : w));
  }, [widgets, onWidgetsChange]);

  return {
    draggedId,
    dragOverId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    removeWidget,
    resizeWidget,
  };
}
