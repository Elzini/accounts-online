import { ShoppingCart, DollarSign, UserPlus, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivePage } from '@/types';

interface QuickActionsWidgetProps {
  setActivePage: (page: ActivePage) => void;
  canSales: boolean;
  canPurchases: boolean;
}

export function QuickActionsWidget({ setActivePage, canSales, canPurchases }: QuickActionsWidgetProps) {
  return (
    <div className="bg-card rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm border border-border">
      <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-card-foreground mb-3 sm:mb-4 md:mb-6">الإجراءات السريعة</h2>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
        <Button 
          onClick={() => setActivePage('purchases')}
          className="h-auto py-2.5 sm:py-3 md:py-4 flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2 gradient-primary hover:opacity-90 text-[11px] sm:text-xs md:text-sm"
          disabled={!canPurchases}
        >
          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          <span>المشتريات</span>
        </Button>
        <Button 
          onClick={() => setActivePage('sales')}
          className="h-auto py-2.5 sm:py-3 md:py-4 flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2 gradient-success hover:opacity-90 text-[11px] sm:text-xs md:text-sm"
          disabled={!canSales}
        >
          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          <span>المبيعات</span>
        </Button>
        <Button 
          onClick={() => setActivePage('add-customer')}
          variant="outline"
          className="h-auto py-2.5 sm:py-3 md:py-4 flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2 border-2 hover:bg-primary hover:text-primary-foreground text-[11px] sm:text-xs md:text-sm"
          disabled={!canSales}
        >
          <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          <span>إضافة عميل</span>
        </Button>
        <Button 
          onClick={() => setActivePage('add-supplier')}
          variant="outline"
          className="h-auto py-2.5 sm:py-3 md:py-4 flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2 border-2 hover:bg-primary hover:text-primary-foreground text-[11px] sm:text-xs md:text-sm"
          disabled={!canPurchases}
        >
          <Truck className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          <span>إضافة مورد</span>
        </Button>
      </div>
    </div>
  );
}
