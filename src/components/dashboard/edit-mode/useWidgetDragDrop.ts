/**
 * Hook for managing widget drag, drop, and resize in dashboard edit mode
 */
import { useState, useCallback, useRef } from 'react';
import type { WidgetConfig } from './widgetConfig';

export function useWidgetDragDrop(
  widgets: WidgetConfig[],
  onWidgetsChange: (widgets: WidgetConfig[]) => void
) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const draggedIdRef = useRef<string | null>(null);
  const widgetsRef = useRef(widgets);
  widgetsRef.current = widgets;

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
    if (id !== draggedIdRef.current) {
      setDragOverId(id);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const currentDraggedId = draggedIdRef.current;
    if (!currentDraggedId || currentDraggedId === targetId) {
      setDragOverId(null);
      return;
    }

    const currentWidgets = widgetsRef.current;
    const sorted = [...currentWidgets].sort((a, b) => a.order - b.order);
    const draggedIndex = sorted.findIndex(w => w.id === currentDraggedId);
    const targetIndex = sorted.findIndex(w => w.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDragOverId(null);
      return;
    }

    const [draggedItem] = sorted.splice(draggedIndex, 1);
    sorted.splice(targetIndex, 0, draggedItem);

    onWidgetsChange(sorted.map((w, i) => ({ ...w, order: i })));
    setDragOverId(null);
    draggedIdRef.current = null;
    setDraggedId(null);
  }, [onWidgetsChange]);

  const removeWidget = useCallback((id: string) => {
    onWidgetsChange(widgets.map(w => w.id === id ? { ...w, visible: false } : w));
  }, [widgets, onWidgetsChange]);

  const resizeWidget = useCallback((id: string, colSpan: number) => {
    onWidgetsChange(widgets.map(w => w.id === id ? { ...w, colSpan } : w));
  }, [widgets, onWidgetsChange]);

  const moveWidgetUp = useCallback((id: string) => {
    const sorted = [...widgets].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex(w => w.id === id);
    if (index <= 0) return;
    const temp = sorted[index].order;
    sorted[index] = { ...sorted[index], order: sorted[index - 1].order };
    sorted[index - 1] = { ...sorted[index - 1], order: temp };
    onWidgetsChange(sorted);
  }, [widgets, onWidgetsChange]);

  const moveWidgetDown = useCallback((id: string) => {
    const sorted = [...widgets].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex(w => w.id === id);
    if (index === -1 || index >= sorted.length - 1) return;
    const temp = sorted[index].order;
    sorted[index] = { ...sorted[index], order: sorted[index + 1].order };
    sorted[index + 1] = { ...sorted[index + 1], order: temp };
    onWidgetsChange(sorted);
  }, [widgets, onWidgetsChange]);

  const handleGridDrop = useCallback((e: React.DragEvent) => {
    const currentDraggedId = draggedIdRef.current;
    if (!currentDraggedId) return;
    e.preventDefault();
    
    const currentWidgets = widgetsRef.current;
    const sorted = [...currentWidgets].sort((a, b) => a.order - b.order);
    const draggedIndex = sorted.findIndex(w => w.id === currentDraggedId);
    if (draggedIndex === -1) return;

    const dropX = e.clientX;
    const dropY = e.clientY;
    const container = (e.currentTarget as HTMLElement);
    const children = Array.from(container.children) as HTMLElement[];
    
    let insertIndex = sorted.length;
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      if (dropY < centerY || (dropY < rect.bottom && dropX < centerX)) {
        const childId = children[i].getAttribute('data-widget-id');
        const widgetIdx = sorted.findIndex(w => w.id === childId);
        if (widgetIdx !== -1) {
          insertIndex = widgetIdx;
        } else {
          insertIndex = i;
        }
        break;
      }
    }

    const [draggedItem] = sorted.splice(draggedIndex, 1);
    const adjustedIndex = draggedIndex < insertIndex ? insertIndex - 1 : insertIndex;
    sorted.splice(Math.min(adjustedIndex, sorted.length), 0, draggedItem);
    
    onWidgetsChange(sorted.map((w, i) => ({ ...w, order: i })));
    setDragOverId(null);
    draggedIdRef.current = null;
    setDraggedId(null);
  }, [onWidgetsChange]);

  const handleGridDragOver = useCallback((e: React.DragEvent) => {
    if (draggedIdRef.current) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  }, []);

  return {
    draggedId,
    dragOverId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    handleGridDrop,
    handleGridDragOver,
    removeWidget,
    resizeWidget,
    moveWidgetUp,
    moveWidgetDown,
  };
}
