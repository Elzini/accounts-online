import { useState, useRef, useCallback, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDraggableOptions {
  initialPosition?: Position;
  storageKey?: string;
}

export function useDraggable({ initialPosition, storageKey }: UseDraggableOptions = {}) {
  const [position, setPosition] = useState<Position>(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return initialPosition ?? { x: 0, y: 0 };
  });

  const isDragging = useRef(false);
  const hasMoved = useRef(false);
  const dragStart = useRef<Position>({ x: 0, y: 0 });
  const posStart = useRef<Position>({ x: 0, y: 0 });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    hasMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { ...position };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [position]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMoved.current = true;
    }
    const newX = Math.max(0, Math.min(window.innerWidth - 60, posStart.current.x + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 60, posStart.current.y + dy));
    setPosition({ x: newX, y: newY });
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    isDragging.current = false;
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(position));
      } catch {}
    }
  }, [position, storageKey]);

  // Save position when it changes
  useEffect(() => {
    if (storageKey && !isDragging.current) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(position));
      } catch {}
    }
  }, [position, storageKey]);

  return {
    position,
    dragHandleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
    wasDragged: () => hasMoved.current,
    setPosition,
  };
}
