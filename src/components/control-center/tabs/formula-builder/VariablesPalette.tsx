// Variables Palette - لوحة المتغيرات المتاحة
import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FormulaVariable } from '@/services/formulas';
import { cn } from '@/lib/utils';

interface VariablesPaletteProps {
  variablesByCategory: Record<string, FormulaVariable[]>;
  onAddVariable: (variable: FormulaVariable) => void;
  isLoading: boolean;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  revenue: { label: 'الإيرادات', color: 'green' },
  expense: { label: 'المصروفات', color: 'red' },
  asset: { label: 'الأصول', color: 'blue' },
  liability: { label: 'الالتزامات', color: 'purple' },
  equity: { label: 'حقوق الملكية', color: 'indigo' },
  zakat: { label: 'الزكاة', color: 'amber' },
  calculated: { label: 'قيم محسوبة', color: 'emerald' },
  custom: { label: 'مخصص', color: 'gray' },
};

export function VariablesPalette({ variablesByCategory, onAddVariable, isLoading }: VariablesPaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(CATEGORY_LABELS))
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const filteredCategories = Object.entries(variablesByCategory).reduce((acc, [category, variables]) => {
    const filtered = variables.filter(v => 
      v.variable_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.variable_key.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, FormulaVariable[]>);

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      green: 'bg-green-500',
      red: 'bg-red-500',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      indigo: 'bg-indigo-500',
      amber: 'bg-amber-500',
      emerald: 'bg-emerald-500',
      gray: 'bg-gray-500',
    };
    const config = CATEGORY_LABELS[category];
    return colors[config?.color || 'gray'] || 'bg-gray-500';
  };

  const getVariableColor = (color?: string): string => {
    const colors: Record<string, string> = {
      green: 'bg-green-100 hover:bg-green-200 border-green-300 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:border-green-700',
      red: 'bg-red-100 hover:bg-red-200 border-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:border-red-700',
      blue: 'bg-blue-100 hover:bg-blue-200 border-blue-300 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:border-blue-700',
      purple: 'bg-purple-100 hover:bg-purple-200 border-purple-300 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 dark:border-purple-700',
      indigo: 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 dark:border-indigo-700',
      amber: 'bg-amber-100 hover:bg-amber-200 border-amber-300 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 dark:border-amber-700',
      orange: 'bg-orange-100 hover:bg-orange-200 border-orange-300 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 dark:border-orange-700',
      emerald: 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 dark:border-emerald-700',
    };
    return colors[color || 'gray'] || 'bg-gray-100 hover:bg-gray-200 border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600';
  };

  return (
    <div className="space-y-3">
      <Label className="text-lg font-semibold">المتغيرات المتاحة</Label>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="بحث..."
          className="pr-9"
        />
      </div>

      <ScrollArea className="h-[450px] border rounded-lg">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : Object.keys(filteredCategories).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>لا توجد متغيرات</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {Object.entries(filteredCategories).map(([category, variables]) => {
              const config = CATEGORY_LABELS[category] || { label: category, color: 'gray' };
              const isExpanded = expandedCategories.has(category);

              return (
                <Collapsible key={category} open={isExpanded} onOpenChange={() => toggleCategory(category)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-2 h-auto"
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", getCategoryColor(category))} />
                        <span className="font-medium">{config.label}</span>
                        <Badge variant="secondary" className="text-xs">
                          {variables.length}
                        </Badge>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-1 pr-4 pb-2">
                      {variables.map((variable) => (
                        <button
                          key={variable.id}
                          onClick={() => onAddVariable(variable)}
                          className={cn(
                            "w-full text-right p-2 rounded-lg border transition-all flex items-center justify-between group",
                            getVariableColor(variable.color)
                          )}
                        >
                          <span className="text-sm font-medium">{variable.variable_name}</span>
                          <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
