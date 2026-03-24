/**
 * Wrapper component for dashboard widgets in edit mode
 * Handles drag, resize, and remove controls
 */
import { useState, useRef } from 'react';
import { X, GripVertical, Maximize2, Minimize2, ArrowUp, ArrowDown, Move } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableWidgetWrapperProps {
  id: string;
  isEditMode: boolean;
  visible: boolean;
  order?: number;
  colSpan?: number;
  onRemove: (id: string) => void;
  onResize?: (id: string, colSpan: number) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  isDragging: boolean;
  isDragOver: boolean;
  children: React.ReactNode;
  className?: string;
  onDimensionResize?: (cardId: string, width?: number, height?: number) => void;
  cardConfig?: { width?: number; height?: number };
}

export function EditableWidgetWrapper({
  id,
  isEditMode,
  visible,
  colSpan = 2,
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
  className,
  onDimensionResize,
  cardConfig,
}: EditableWidgetWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeInfo, setResizeInfo] = useState<{ w: number; h: number } | null>(null);

  if (!visible) return null;

  const colSpanClass = colSpan === 1 
    ? 'col-span-1' 
    : 'col-span-1 xs:col-span-2';

  const dimensionStyle: React.CSSProperties = {};
  if (cardConfig?.height) dimensionStyle.minHeight = cardConfig.height;
  if (cardConfig?.width) {
    dimensionStyle.width = cardConfig.width;
    dimensionStyle.maxWidth = '100%';
  }

  if (!isEditMode) {
    return (
      <div data-widget-id={id} className={cn(colSpanClass, 'h-fit', className)} style={dimensionStyle}>
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
      data-widget-id={id}
      ref={containerRef}
      draggable={!isResizing}
      onDragStart={(e) => {
        if (isResizing) { e.preventDefault(); return; }
        onDragStart(e, id);
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, id)}
      onDrop={(e) => onDrop(e, id)}
      className={cn(
        'relative group transition-all duration-200',
        colSpanClass,
        isDragging && 'opacity-50 scale-[0.98]',
        isDragOver && 'ring-2 ring-primary ring-offset-2 scale-[1.01]',
        !isResizing && 'cursor-grab active:cursor-grabbing',
        className
      )}
      style={dimensionStyle}
    >
      {/* Top controls */}
      <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(id); }}
          className="w-7 h-7 rounded-full bg-destructive text-destructive-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        >
          <X className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveUp?.(id); }}
          className="w-7 h-7 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          title="تحريك لأعلى"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveDown?.(id); }}
          className="w-7 h-7 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          title="تحريك لأسفل"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
        <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing hidden sm:flex">
          <GripVertical className="w-4 h-4" />
        </div>
      </div>

      {/* Col-span resize handle */}
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

      {/* Right edge resize handle (width only) */}
      {onDimensionResize && (
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 z-10 w-2 h-12 rounded-full bg-primary/40 hover:bg-primary/70 cursor-ew-resize transition-colors opacity-0 group-hover:opacity-100"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const startX = e.clientX;
            const el = containerRef.current;
            if (!el) return;
            const startW = cardConfig?.width || el.offsetWidth;
            setIsResizing(true);

            const onMove = (me: MouseEvent) => {
              const deltaX = startX - me.clientX;
              const newW = Math.max(150, Math.round((startW + deltaX) / 10) * 10);
              const h = cardConfig?.height || el.offsetHeight;
              setResizeInfo({ w: newW, h });
              onDimensionResize(id, newW, cardConfig?.height);
            };
            const onUp = () => {
              setIsResizing(false);
              setResizeInfo(null);
              document.removeEventListener('mousemove', onMove);
              document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
          }}
          title="اسحب لتغيير العرض"
        />
      )}

      {/* Bottom edge resize handle (height only) */}
      {onDimensionResize && (
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10 w-12 h-2 rounded-full bg-primary/40 hover:bg-primary/70 cursor-ns-resize transition-colors opacity-0 group-hover:opacity-100"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const startY = e.clientY;
            const el = containerRef.current;
            if (!el) return;
            const startH = cardConfig?.height || el.offsetHeight;
            setIsResizing(true);

            const onMove = (me: MouseEvent) => {
              const deltaY = me.clientY - startY;
              const newH = Math.max(80, Math.round((startH + deltaY) / 10) * 10);
              const w = cardConfig?.width || el.offsetWidth;
              setResizeInfo({ w, h: newH });
              onDimensionResize(id, cardConfig?.width, newH);
            };
            const onUp = () => {
              setIsResizing(false);
              setResizeInfo(null);
              document.removeEventListener('mousemove', onMove);
              document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
          }}
          title="اسحب لتغيير الارتفاع"
        />
      )}

      {/* Corner dimension resize handle */}
      {onDimensionResize && (
        <div
          className="absolute bottom-0 left-0 z-10 w-6 h-6 rounded-tl-lg bg-primary/60 hover:bg-primary cursor-nwse-resize flex items-center justify-center transition-colors shadow-md group-hover:opacity-100 opacity-60"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const startX = e.clientX;
            const startY = e.clientY;
            const el = containerRef.current;
            if (!el) return;
            const startW = cardConfig?.width || el.offsetWidth;
            const startH = cardConfig?.height || el.offsetHeight;
            setIsResizing(true);

            const handleMouseMove = (me: MouseEvent) => {
              const deltaX = startX - me.clientX;
              const deltaY = me.clientY - startY;
              const newW = Math.max(150, Math.round((startW + deltaX) / 10) * 10);
              const newH = Math.max(80, Math.round((startH + deltaY) / 10) * 10);
              setResizeInfo({ w: newW, h: newH });
              onDimensionResize(id, newW, newH);
            };

            const handleMouseUp = () => {
              setIsResizing(false);
              setResizeInfo(null);
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
          title="اسحب لتغيير الحجم"
        >
          <Move className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
      )}

      {/* Size indicator during resize */}
      {isResizing && resizeInfo && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-foreground text-background text-xs font-mono px-2 py-1 rounded shadow-lg">
          {resizeInfo.w} × {resizeInfo.h}
        </div>
      )}

      {/* Border indicator */}
      <div className={cn(
        'absolute inset-0 rounded-xl border-2 border-dashed pointer-events-none transition-colors',
        isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/30',
        isResizing && 'border-accent border-solid'
      )} />

      <div className="relative select-none h-full" style={{ pointerEvents: 'none' }}>{children}</div>
    </div>
  );
}
