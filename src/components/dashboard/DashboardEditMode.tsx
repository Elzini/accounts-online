import { useState, useCallback, useRef } from 'react';
import { X, GripVertical, Save, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface WidgetConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'welcome', label: 'بطاقة الترحيب', visible: true, order: 0 },
  { id: 'quickAccess', label: 'الوصول السريع', visible: true, order: 1 },
  { id: 'recentInvoices', label: 'أحدث الفواتير', visible: true, order: 2 },
  { id: 'statCards', label: 'بطاقات الإحصائيات', visible: true, order: 3 },
  { id: 'charts', label: 'الرسوم البيانية', visible: true, order: 4 },
  { id: 'analytics', label: 'التحليلات المتقدمة', visible: true, order: 5 },
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

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/10 via-background to-primary/10 border-b shadow-lg animate-in slide-in-from-top-2 duration-300">
      <div className="container mx-auto px-4 py-3">
        {/* Title */}
        <div className="text-center mb-3">
          <p className="text-sm text-muted-foreground">
            قم بسحب وإفلات العناصر لترتيبها، أو قم بإخفائها.
          </p>
        </div>

        {/* Widget toggles */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
          <span className="text-sm text-muted-foreground ml-2">الأدوات المتاحة (اضغط للإضافة/الإزالة)</span>
          {widgets.map(widget => (
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

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefault}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            استعادة الافتراضي
          </Button>
          <Button
            size="sm"
            onClick={() => onSave(widgets)}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
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
  onRemove: (id: string) => void;
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
  onRemove,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging,
  isDragOver,
  children,
  className,
}: EditableWidgetWrapperProps) {
  if (!visible) return null;

  if (!isEditMode) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, id)}
      onDrop={(e) => onDrop(e, id)}
      className={cn(
        "relative group transition-all duration-200",
        isDragging && "opacity-50 scale-[0.98]",
        isDragOver && "ring-2 ring-primary ring-offset-2 scale-[1.01]",
        isEditMode && "cursor-grab active:cursor-grabbing",
        className
      )}
    >
      {/* Edit controls overlay */}
      <div className={cn(
        "absolute -top-2 -right-2 z-10 flex items-center gap-1 transition-opacity",
        "opacity-100"
      )}>
        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(id);
          }}
          className="w-7 h-7 rounded-full bg-destructive text-destructive-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        >
          <X className="w-4 h-4" />
        </button>
        
        {/* Drag handle */}
        <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4" />
        </div>
      </div>

      {/* Widget border indicator */}
      <div className={cn(
        "absolute inset-0 rounded-xl border-2 border-dashed pointer-events-none transition-colors",
        isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30"
      )} />

      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

// Hook for managing edit mode drag and drop
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

  return {
    draggedId,
    dragOverId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    removeWidget,
  };
}
