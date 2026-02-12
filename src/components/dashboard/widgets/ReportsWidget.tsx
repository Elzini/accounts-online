import { Package, TrendingUp, FileText, DollarSign, Users, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivePage } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReportsWidgetProps {
  setActivePage: (page: ActivePage) => void;
}

export function ReportsWidget({ setActivePage }: ReportsWidgetProps) {
  const { t } = useLanguage();
  return (
    <div className="bg-card rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm border border-border">
      <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-card-foreground mb-3 sm:mb-4 md:mb-6">{t.chart_reports}</h2>
      <div className="grid grid-cols-1 gap-1">
        {[
          { page: 'inventory-report' as ActivePage, icon: Package, label: t.chart_inventory_report, color: 'text-primary', bg: 'bg-primary/10' },
          { page: 'profit-report' as ActivePage, icon: TrendingUp, label: t.chart_profit_report, color: 'text-success', bg: 'bg-success/10' },
          { page: 'purchases-report' as ActivePage, icon: FileText, label: t.chart_purchases_report, color: 'text-warning', bg: 'bg-warning/10' },
          { page: 'sales-report' as ActivePage, icon: DollarSign, label: t.chart_sales_report, color: 'text-primary', bg: 'bg-primary/10' },
          { page: 'customers-report' as ActivePage, icon: Users, label: t.chart_customers_report, color: 'text-accent-foreground', bg: 'bg-accent' },
          { page: 'suppliers-report' as ActivePage, icon: Truck, label: t.chart_suppliers_report, color: 'text-accent-foreground', bg: 'bg-accent' },
          { page: 'commissions-report' as ActivePage, icon: DollarSign, label: t.chart_commissions_report, color: 'text-accent-foreground', bg: 'bg-accent' },
        ].map(({ page, icon: Icon, label, color, bg }) => (
          <Button key={page} onClick={() => setActivePage(page)} variant="ghost" className="w-full justify-start gap-2 sm:gap-3 h-9 sm:h-10 hover:bg-muted text-xs sm:text-sm">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}><Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${color}`} /></div>
            <span className="font-medium">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
