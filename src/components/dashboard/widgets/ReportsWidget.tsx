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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 md:gap-3">
        <Button 
          onClick={() => setActivePage('inventory-report')}
          variant="ghost"
          className="w-full justify-start gap-2 md:gap-3 h-9 sm:h-10 md:h-12 hover:bg-primary/10 text-xs sm:text-sm"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
          </div>
          <span className="font-medium truncate">تقرير المخزون</span>
        </Button>
        <Button 
          onClick={() => setActivePage('profit-report')}
          variant="ghost"
          className="w-full justify-start gap-2 md:gap-3 h-9 sm:h-10 md:h-12 hover:bg-success/10 text-xs sm:text-sm"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-success" />
          </div>
          <span className="font-medium truncate">تقرير الأرباح</span>
        </Button>
        <Button 
          onClick={() => setActivePage('purchases-report')}
          variant="ghost"
          className="w-full justify-start gap-2 md:gap-3 h-9 sm:h-10 md:h-12 hover:bg-warning/10 text-xs sm:text-sm"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-warning" />
          </div>
          <span className="font-medium truncate">تقرير المشتريات</span>
        </Button>
        <Button 
          onClick={() => setActivePage('sales-report')}
          variant="ghost"
          className="w-full justify-start gap-2 md:gap-3 h-9 sm:h-10 md:h-12 hover:bg-primary/10 text-xs sm:text-sm"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
          </div>
          <span className="font-medium truncate">تقرير المبيعات</span>
        </Button>
        <Button 
          onClick={() => setActivePage('customers-report')}
          variant="ghost"
          className="w-full justify-start gap-2 md:gap-3 h-10 md:h-12 hover:bg-accent text-sm"
        >
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 md:w-5 md:h-5 text-accent-foreground" />
          </div>
          <span className="font-medium">تقرير العملاء</span>
        </Button>
        <Button 
          onClick={() => setActivePage('suppliers-report')}
          variant="ghost"
          className="w-full justify-start gap-2 md:gap-3 h-10 md:h-12 hover:bg-accent text-sm"
        >
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4 md:w-5 md:h-5 text-accent-foreground" />
          </div>
          <span className="font-medium">تقرير الموردين</span>
        </Button>
        <Button 
          onClick={() => setActivePage('commissions-report')}
          variant="ghost"
          className="w-full justify-start gap-2 md:gap-3 h-10 md:h-12 hover:bg-accent text-sm"
        >
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-accent-foreground" />
          </div>
          <span className="font-medium">تقرير العمولات</span>
        </Button>
      </div>
    </div>
  );
}
