// Formula Canvas - لوحة بناء المعادلات بالسحب والإفلات
import { useState, useRef } from 'react';
import { X, GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormulaNode, OPERATORS } from '@/services/formulas';
import { cn } from '@/lib/utils';

interface FormulaCanvasProps {
  nodes: FormulaNode[];
  onRemoveNode: (nodeId: string) => void;
  onReorder: (startIndex: number, endIndex: number) => void;
  onClear: () => void;
}

export function FormulaCanvas({ nodes, onRemoveNode, onReorder, onClear }: FormulaCanvasProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorder(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getNodeColor = (node: FormulaNode): string => {
    if (node.type === 'variable') {
      const colors: Record<string, string> = {
        green: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
        red: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
        blue: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
        purple: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
        indigo: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700',
        amber: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
        orange: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
        emerald: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
      };
      return colors[node.color || 'gray'] || 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
    }
    if (node.type === 'operator') {
      return 'bg-slate-200 text-slate-900 border-slate-400 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-500';
    }
    if (node.type === 'number') {
      return 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700';
    }
    if (node.type === 'parenthesis') {
      return 'bg-gray-300 text-gray-900 border-gray-500 dark:bg-gray-600 dark:text-gray-100 dark:border-gray-400';
    }
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const renderNodeContent = (node: FormulaNode) => {
    if (node.type === 'variable') {
      return node.label || node.value;
    }
    if (node.type === 'operator') {
      const op = OPERATORS.find(o => o.value === node.value);
      return op?.label || node.value;
    }
    return node.value;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">المعادلة:</span>
        {nodes.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear} className="text-destructive">
            <Trash2 className="w-4 h-4 ml-1" />
            مسح الكل
          </Button>
        )}
      </div>
      
      <div 
        className={cn(
          "min-h-[120px] p-4 border-2 border-dashed rounded-lg transition-colors",
          nodes.length === 0 ? "border-muted" : "border-primary/30 bg-primary/5"
        )}
      >
        {nodes.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-muted-foreground">
            <p>اسحب المتغيرات هنا لبناء المعادلة</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 items-center" dir="ltr">
            {nodes.map((node, index) => (
              <div
                key={node.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "group relative flex items-center gap-1 px-3 py-2 rounded-lg border cursor-move transition-all",
                  getNodeColor(node),
                  draggedIndex === index && "opacity-50",
                  dragOverIndex === index && "ring-2 ring-primary ring-offset-2"
                )}
              >
                <GripVertical className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                <span className="font-medium text-sm">
                  {renderNodeContent(node)}
                </span>
                <button
                  onClick={() => onRemoveNode(node.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
