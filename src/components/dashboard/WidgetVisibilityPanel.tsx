import { useState } from 'react';
import { LayoutGrid, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { WidgetConfig, DEFAULT_WIDGETS } from './DashboardEditMode';

interface WidgetVisibilityPanelProps {
  widgets: WidgetConfig[];
  onToggle: (id: string) => void;
  onReset: () => void;
}

const WIDGET_LABELS: Record<string, { ar: string; en: string }> = {
  quickAccess: { ar: 'الوصول السريع', en: 'Quick Access' },
  availableCars: { ar: 'المتاح', en: 'Available' },
  totalPurchases: { ar: 'المشتريات', en: 'Purchases' },
  monthSales: { ar: 'مبيعات الشهر', en: 'Month Sales' },
  totalProfit: { ar: 'الأرباح', en: 'Profit' },
  todaySales: { ar: 'مبيعات اليوم', en: 'Today Sales' },
  monthSalesCount: { ar: 'عدد المبيعات', en: 'Sales Count' },
  allTimePurchases: { ar: 'إجمالي المشتريات', en: 'All Purchases' },
  allTimeSales: { ar: 'إجمالي المبيعات', en: 'All Sales' },
  activeInstallments: { ar: 'الأقساط النشطة', en: 'Active Installments' },
  overdueInstallments: { ar: 'أقساط متأخرة', en: 'Overdue' },
  upcomingInstallments: { ar: 'أقساط قادمة', en: 'Upcoming' },
  totalDue: { ar: 'المستحق', en: 'Total Due' },
  nextPayment: { ar: 'القسط القادم', en: 'Next Payment' },
  monthlyExpenses: { ar: 'المصروفات', en: 'Expenses' },
  transfers: { ar: 'التحويلات', en: 'Transfers' },
  quickActions: { ar: 'إجراءات سريعة', en: 'Quick Actions' },
  reports: { ar: 'التقارير', en: 'Reports' },
  recentInvoices: { ar: 'الفواتير', en: 'Invoices' },
  smartAlerts: { ar: 'التنبيهات', en: 'Alerts' },
};

export function WidgetVisibilityPanel({ widgets, onToggle, onReset }: WidgetVisibilityPanelProps) {
  const { language } = useLanguage();
  const isRtl = language === 'ar';
  const [open, setOpen] = useState(false);

  const visibleCount = widgets.filter(w => w.visible).length;
  const totalCount = widgets.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs">
          <LayoutGrid className="w-3.5 h-3.5" />
          {isRtl ? 'الأقسام' : 'Sections'}
          <Badge variant="secondary" className="text-[10px] px-1 h-4">
            {visibleCount}/{totalCount}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" dir={isRtl ? 'rtl' : 'ltr'} align="end">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold">
            {isRtl ? 'إظهار/إخفاء الأقسام' : 'Show/Hide Sections'}
          </h4>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={onReset}>
            <RotateCcw className="w-3 h-3 me-1" />
            {isRtl ? 'إعادة' : 'Reset'}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-1.5 max-h-[300px] overflow-y-auto">
          {[...widgets].sort((a, b) => a.order - b.order).map(widget => {
            const labels = WIDGET_LABELS[widget.id];
            return (
              <button
                key={widget.id}
                onClick={() => onToggle(widget.id)}
                className={cn(
                  'flex items-center gap-1.5 p-2 rounded-md border text-start transition-all text-[11px]',
                  widget.visible
                    ? 'border-primary/30 bg-primary/5 text-foreground'
                    : 'border-border bg-muted/30 text-muted-foreground'
                )}
              >
                {widget.visible ? (
                  <Eye className="w-3 h-3 text-primary shrink-0" />
                ) : (
                  <EyeOff className="w-3 h-3 shrink-0" />
                )}
                <span className="truncate">
                  {isRtl ? labels?.ar || widget.label : labels?.en || widget.id}
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
