import { Package, TrendingUp, FileText, DollarSign, Users, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivePage } from '@/types';

interface ReportsWidgetProps {
  setActivePage: (page: ActivePage) => void;
}

export function ReportsWidget({ setActivePage }: ReportsWidgetProps) {
  return (
    <div className="bg-card rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm border border-border">
      <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-card-foreground mb-3 sm:mb-4 md:mb-6">التقارير</h2>
      <div className="grid grid-cols-1 gap-1">
        {[
          { page: 'inventory-report' as ActivePage, icon: Package, label: 'تقرير المخزون', color: 'text-primary', bg: 'bg-primary/10' },
          { page: 'profit-report' as ActivePage, icon: TrendingUp, label: 'تقرير الأرباح', color: 'text-success', bg: 'bg-success/10' },
          { page: 'purchases-report' as ActivePage, icon: FileText, label: 'تقرير المشتريات', color: 'text-warning', bg: 'bg-warning/10' },
          { page: 'sales-report' as ActivePage, icon: DollarSign, label: 'تقرير المبيعات', color: 'text-primary', bg: 'bg-primary/10' },
          { page: 'customers-report' as ActivePage, icon: Users, label: 'تقرير العملاء', color: 'text-accent-foreground', bg: 'bg-accent' },
          { page: 'suppliers-report' as ActivePage, icon: Truck, label: 'تقرير الموردين', color: 'text-accent-foreground', bg: 'bg-accent' },
          { page: 'commissions-report' as ActivePage, icon: DollarSign, label: 'تقرير العمولات', color: 'text-accent-foreground', bg: 'bg-accent' },
        ].map(({ page, icon: Icon, label, color, bg }) => (
          <Button
            key={page}
            onClick={() => setActivePage(page)}
            variant="ghost"
            className="w-full justify-start gap-2 sm:gap-3 h-9 sm:h-10 hover:bg-muted text-xs sm:text-sm"
          >
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${color}`} />
            </div>
            <span className="font-medium">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
