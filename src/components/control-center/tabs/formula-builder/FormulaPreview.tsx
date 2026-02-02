// Formula Preview - معاينة المعادلة
import { FormulaNode, FormulaVariable, OPERATORS, formulaToString } from '@/services/formulas';
import { cn } from '@/lib/utils';

interface FormulaPreviewProps {
  nodes: FormulaNode[];
  variables: FormulaVariable[];
}

export function FormulaPreview({ nodes, variables }: FormulaPreviewProps) {
  if (nodes.length === 0) return null;

  const getNodeDisplay = (node: FormulaNode): { text: string; className: string } => {
    if (node.type === 'variable') {
      const colors: Record<string, string> = {
        green: 'text-green-600 dark:text-green-400',
        red: 'text-red-600 dark:text-red-400',
        blue: 'text-blue-600 dark:text-blue-400',
        purple: 'text-purple-600 dark:text-purple-400',
        indigo: 'text-indigo-600 dark:text-indigo-400',
        amber: 'text-amber-600 dark:text-amber-400',
        orange: 'text-orange-600 dark:text-orange-400',
        emerald: 'text-emerald-600 dark:text-emerald-400',
      };
      return {
        text: node.label || node.value,
        className: colors[node.color || 'gray'] || 'text-gray-600 dark:text-gray-400',
      };
    }
    if (node.type === 'operator') {
      const op = OPERATORS.find(o => o.value === node.value);
      return {
        text: ` ${op?.label || node.value} `,
        className: 'text-slate-600 dark:text-slate-400 font-bold',
      };
    }
    if (node.type === 'number') {
      return {
        text: node.value,
        className: 'text-cyan-600 dark:text-cyan-400',
      };
    }
    if (node.type === 'parenthesis') {
      return {
        text: node.value,
        className: 'text-gray-500 font-bold',
      };
    }
    return { text: node.value, className: '' };
  };

  return (
    <div className="p-4 bg-muted/30 rounded-lg space-y-2">
      <div className="text-sm font-medium text-muted-foreground">المعادلة بالصيغة المقروءة:</div>
      <div className="text-lg font-mono bg-background p-3 rounded border" dir="ltr">
        {nodes.map((node, index) => {
          const { text, className } = getNodeDisplay(node);
          return (
            <span key={node.id} className={cn("font-medium", className)}>
              {text}
            </span>
          );
        })}
      </div>
      
      {/* Mathematical representation */}
      <div className="text-sm text-muted-foreground mt-2">
        <span className="font-medium">الصيغة الرياضية: </span>
        <code className="bg-muted px-2 py-1 rounded text-xs" dir="ltr">
          {nodes.map(node => {
            if (node.type === 'variable') return `[${node.value}]`;
            return node.value;
          }).join(' ')}
        </code>
      </div>
    </div>
  );
}
