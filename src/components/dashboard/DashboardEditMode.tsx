/**
 * Dashboard Edit Mode - Barrel re-export
 * Decomposed into: widgetConfig, EditableWidgetWrapper, useWidgetDragDrop
 */
import { Save, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

// Re-exports
export type { WidgetConfig } from './edit-mode/widgetConfig';
export { DEFAULT_WIDGETS, WIDGET_LABEL_KEYS } from './edit-mode/widgetConfig';
export { EditableWidgetWrapper } from './edit-mode/EditableWidgetWrapper';
export { useWidgetDragDrop } from './edit-mode/useWidgetDragDrop';

import type { WidgetConfig } from './edit-mode/widgetConfig';
import { DEFAULT_WIDGETS, WIDGET_LABEL_KEYS } from './edit-mode/widgetConfig';

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
  const { t } = useLanguage();

  if (!isEditMode) return null;

  const getWidgetLabel = (widget: WidgetConfig) => {
    const key = WIDGET_LABEL_KEYS[widget.id];
    return key ? (t as Record<string, string>)[key] || widget.label : widget.label;
  };

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
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/10 via-background to-primary/10 border-b shadow-lg animate-in slide-in-from-top-2 duration-300 max-h-[60vh] overflow-y-auto">
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="text-center mb-2 sm:mb-3">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t.drag_drop_hint}
          </p>
        </div>

        <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap mb-2 sm:mb-3">
          <span className="text-xs sm:text-sm text-muted-foreground ml-1 sm:ml-2 w-full text-center sm:w-auto">{t.sections_label}</span>
          {sortedWidgets.map(widget => (
            <Badge
              key={widget.id}
              variant={widget.visible ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-all px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-sm",
                widget.visible 
                  ? "bg-primary hover:bg-primary/90" 
                  : "hover:bg-muted"
              )}
              onClick={() => toggleWidget(widget.id)}
            >
              {widget.visible && <Check className="w-3 h-3 ml-1" />}
              {getWidgetLabel(widget)}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <Button variant="outline" size="sm" onClick={onCancel} className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
            {t.cancel}
          </Button>
          <Button variant="outline" size="sm" onClick={resetToDefault} className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {t.restore_default}
          </Button>
          <Button size="sm" onClick={() => onSave(widgets)} className="gap-1 sm:gap-2 bg-primary hover:bg-primary/90 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
            <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {t.save}
          </Button>
        </div>
      </div>
    </div>
  );
}
