import { useState, useCallback, useRef } from 'react';
import { X, GripVertical, Save, RotateCcw, Check, Maximize2, Minimize2, ArrowUp, ArrowDown, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface LauncherModuleConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  size: 'normal' | 'large'; // large = wider card
}

interface LauncherEditToolbarProps {
  isEditMode: boolean;
  onSave: (modules: LauncherModuleConfig[]) => void;
  onCancel: () => void;
  modules: LauncherModuleConfig[];
  onModulesChange: (modules: LauncherModuleConfig[]) => void;
  defaultModules: LauncherModuleConfig[];
}

export function LauncherEditToolbar({
  isEditMode,
  onSave,
  onCancel,
  modules,
  onModulesChange,
  defaultModules,
}: LauncherEditToolbarProps) {
  if (!isEditMode) return null;

  const toggleModule = (id: string) => {
    onModulesChange(
      modules.map(m => m.id === id ? { ...m, visible: !m.visible } : m)
    );
  };

  const resetToDefault = () => {
    onModulesChange(defaultModules.map((m, i) => ({ ...m, order: i })));
  };

  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/10 via-background to-primary/10 border-b shadow-lg animate-in slide-in-from-top-2 duration-300 max-h-[50vh] overflow-y-auto">
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="text-center mb-2 sm:mb-3">
          <p className="text-xs sm:text-sm text-muted-foreground">
            اسحب وأفلت الوحدات لترتيبها • اضغط لإظهار/إخفاء • استخدم أيقونة التحجيم لتغيير الحجم
          </p>
        </div>

        <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap mb-2 sm:mb-3">
          <span className="text-xs sm:text-sm text-muted-foreground ml-1 sm:ml-2 w-full text-center sm:w-auto">الوحدات</span>
          {sortedModules.map(mod => (
            <Badge
              key={mod.id}
              variant={mod.visible ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-all px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-sm",
                mod.visible
                  ? "bg-primary hover:bg-primary/90"
                  : "hover:bg-muted"
              )}
              onClick={() => toggleModule(mod.id)}
            >
              {mod.visible && <Check className="w-3 h-3 ml-1" />}
              {mod.label}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <Button variant="outline" size="sm" onClick={onCancel} className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
            إلغاء
          </Button>
          <Button variant="outline" size="sm" onClick={resetToDefault} className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            استعادة الافتراضي
          </Button>
          <Button size="sm" onClick={() => onSave(modules)} className="gap-1 sm:gap-2 bg-primary hover:bg-primary/90 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
            <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            حفظ
          </Button>
        </div>
      </div>
    </div>
  );
}

interface EditableModuleCardProps {
  id: string;
  isEditMode: boolean;
  visible: boolean;
  size: 'normal' | 'large';
  onRemove: (id: string) => void;
  onResize: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  isDragging: boolean;
  isDragOver: boolean;
  children: React.ReactNode;
}

export function EditableModuleCard({
  id,
  isEditMode,
  visible,
  size,
  onRemove,
  onResize,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging,
  isDragOver,
  children,
}: EditableModuleCardProps) {
  if (!visible) return null;

  if (!isEditMode) {
    return <>{children}</>;
  }

  return (
    <div
      data-module-id={id}
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, id)}
      onDrop={(e) => onDrop(e, id)}
      className={cn(
        'relative group transition-all duration-200',
        isDragging && 'opacity-50 scale-[0.96]',
        isDragOver && 'ring-2 ring-primary ring-offset-2 scale-[1.02]',
        'cursor-grab active:cursor-grabbing',
      )}
    >
      {/* Controls */}
      <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(id); }}
          className="w-6 h-6 rounded-full bg-destructive text-destructive-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveUp(id); }}
          className="w-6 h-6 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveDown(id); }}
          className="w-6 h-6 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onResize(id); }}
          className="w-6 h-6 rounded-full bg-accent text-accent-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          title={size === 'large' ? 'تصغير' : 'تكبير'}
        >
          {size === 'large' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
        <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing hidden sm:flex">
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Border */}
      <div className={cn(
        'absolute inset-0 rounded-2xl border-2 border-dashed pointer-events-none transition-colors',
        isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/30',
      )} />

      <div className="relative select-none" style={{ pointerEvents: 'none' }}>
        {children}
      </div>
    </div>
  );
}

// Hook for launcher module drag-drop
export function useLauncherDragDrop(
  modules: LauncherModuleConfig[],
  onModulesChange: (modules: LauncherModuleConfig[]) => void
) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const draggedIdRef = useRef<string | null>(null);
  const modulesRef = useRef(modules);
  modulesRef.current = modules;

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    draggedIdRef.current = id;
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragEnd = useCallback(() => {
    draggedIdRef.current = null;
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== draggedIdRef.current) setDragOverId(id);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const currentDraggedId = draggedIdRef.current;
    if (!currentDraggedId || currentDraggedId === targetId) {
      setDragOverId(null);
      return;
    }
    const sorted = [...modulesRef.current].sort((a, b) => a.order - b.order);
    const draggedIndex = sorted.findIndex(m => m.id === currentDraggedId);
    const targetIndex = sorted.findIndex(m => m.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) { setDragOverId(null); return; }
    const [draggedItem] = sorted.splice(draggedIndex, 1);
    sorted.splice(targetIndex, 0, draggedItem);
    onModulesChange(sorted.map((m, i) => ({ ...m, order: i })));
    setDragOverId(null);
    draggedIdRef.current = null;
    setDraggedId(null);
  }, [onModulesChange]);

  const removeModule = useCallback((id: string) => {
    onModulesChange(modules.map(m => m.id === id ? { ...m, visible: false } : m));
  }, [modules, onModulesChange]);

  const resizeModule = useCallback((id: string) => {
    onModulesChange(modules.map(m => m.id === id ? { ...m, size: m.size === 'large' ? 'normal' : 'large' } : m));
  }, [modules, onModulesChange]);

  const moveUp = useCallback((id: string) => {
    const sorted = [...modules].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(m => m.id === id);
    if (idx <= 0) return;
    const temp = sorted[idx].order;
    sorted[idx] = { ...sorted[idx], order: sorted[idx - 1].order };
    sorted[idx - 1] = { ...sorted[idx - 1], order: temp };
    onModulesChange(sorted);
  }, [modules, onModulesChange]);

  const moveDown = useCallback((id: string) => {
    const sorted = [...modules].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(m => m.id === id);
    if (idx === -1 || idx >= sorted.length - 1) return;
    const temp = sorted[idx].order;
    sorted[idx] = { ...sorted[idx], order: sorted[idx + 1].order };
    sorted[idx + 1] = { ...sorted[idx + 1], order: temp };
    onModulesChange(sorted);
  }, [modules, onModulesChange]);

  return {
    draggedId,
    dragOverId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    removeModule,
    resizeModule,
    moveUp,
    moveDown,
  };
}
