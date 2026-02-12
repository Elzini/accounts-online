import { ShoppingCart, DollarSign, UserPlus, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivePage } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuickActionsWidgetProps {
  setActivePage: (page: ActivePage) => void;
  canSales: boolean;
  canPurchases: boolean;
}

export function QuickActionsWidget({ setActivePage, canSales, canPurchases }: QuickActionsWidgetProps) {
  const { t } = useLanguage();
  return (
    <div className="bg-card rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 lg:p-6 shadow-sm border border-border">
      <h2 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-card-foreground mb-2 sm:mb-3 md:mb-4">{t.quick_actions}</h2>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
        <Button 
          onClick={() => setActivePage('purchases')}
          className="h-auto py-2.5 sm:py-3 md:py-4 flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2 gradient-primary hover:opacity-90 text-[11px] sm:text-xs md:text-sm"
          disabled={!canPurchases}
        >
          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          <span>{t.nav_purchases}</span>
        </Button>
        <Button 
          onClick={() => setActivePage('sales')}
          className="h-auto py-2.5 sm:py-3 md:py-4 flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2 gradient-success hover:opacity-90 text-[11px] sm:text-xs md:text-sm"
          disabled={!canSales}
        >
          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          <span>{t.nav_sales}</span>
        </Button>
        <Button 
          onClick={() => setActivePage('add-customer')}
          variant="outline"
          className="h-auto py-2.5 sm:py-3 md:py-4 flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2 border-2 hover:bg-primary hover:text-primary-foreground text-[11px] sm:text-xs md:text-sm"
          disabled={!canSales}
        >
          <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          <span>{t.add_customer}</span>
        </Button>
        <Button 
          onClick={() => setActivePage('add-supplier')}
          variant="outline"
          className="h-auto py-2.5 sm:py-3 md:py-4 flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2 border-2 hover:bg-primary hover:text-primary-foreground text-[11px] sm:text-xs md:text-sm"
          disabled={!canPurchases}
        >
          <Truck className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          <span>{t.add_supplier}</span>
        </Button>
      </div>
    </div>
  );
}
