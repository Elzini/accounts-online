/**
 * DashboardCustomizer - Card List Panel (left side)
 */
import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { GripVertical, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CardConfig } from './constants';

interface CardListPanelProps {
  sortedCards: CardConfig[];
  selectedCard: string | null;
  onSelectCard: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onMoveCard: (id: string, direction: 'up' | 'down') => void;
  onReorder: (draggedId: string, targetId: string) => void;
  getCardPrimaryLabel: (card: CardConfig) => string;
  getCardSecondaryLabel: (card: CardConfig) => string | null;
  t: any;
}

export function CardListPanel({
  sortedCards,
  selectedCard,
  onSelectCard,
  onToggleVisibility,
  onMoveCard,
  onReorder,
  getCardPrimaryLabel,
  getCardSecondaryLabel,
  t,
}: CardListPanelProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedId(id);
    dragNode.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    setTimeout(() => { dragNode.current?.classList.add('opacity-50'); }, 0);
  }, []);

  const handleDragEnd = useCallback(() => {
    dragNode.current?.classList.remove('opacity-50');
    setDraggedId(null);
    setDragOverId(null);
    dragNode.current = null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== draggedId) setDragOverId(id);
  }, [draggedId]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== targetId) {
      onReorder(draggedId, targetId);
    }
    setDragOverId(null);
  }, [draggedId, onReorder]);

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <GripVertical className="w-4 h-4" />
        {t.card_order_drag}
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
              onDragLeave={() => setDragOverId(null)}
              onDrop={(e) => handleDrop(e, card.id)}
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing select-none',
                selectedCard === card.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50',
                !card.visible && 'opacity-50',
                draggedId === card.id && 'opacity-50 scale-95',
                dragOverId === card.id && draggedId !== card.id && 'border-primary border-2 bg-primary/10 scale-[1.02]'
              )}
              onClick={() => onSelectCard(card.id)}
            >
              <div className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); onMoveCard(card.id, 'up'); }} disabled={index === 0}>
                  <ChevronUp className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); onMoveCard(card.id, 'down'); }} disabled={index === sortedCards.length - 1}>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{getCardPrimaryLabel(card)}</p>
                {getCardSecondaryLabel(card) && (
                  <p className="text-[11px] text-muted-foreground truncate">{getCardSecondaryLabel(card)}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {card.size === 'small' ? t.size_small : card.size === 'large' ? t.size_large : t.size_medium}
                  </Badge>
                  {card.bgColor && <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: card.bgColor }} />}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); onToggleVisibility(card.id); }}>
                {card.visible ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
