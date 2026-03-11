import { useState } from 'react';
import { Plus, X, DollarSign, ShoppingCart, Receipt, Users, Truck, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivePage } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface FloatingQuickActionsProps {
  setActivePage: (page: ActivePage) => void;
}

const actions = [
  { id: 'add-sale-invoice' as ActivePage, icon: DollarSign, labelAr: 'فاتورة مبيعات', labelEn: 'New Sale', color: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
  { id: 'add-purchase-invoice' as ActivePage, icon: ShoppingCart, labelAr: 'فاتورة مشتريات', labelEn: 'New Purchase', color: 'bg-blue-500 hover:bg-blue-600 text-white' },
  { id: 'vouchers' as ActivePage, icon: Receipt, labelAr: 'سند قبض / صرف', labelEn: 'Voucher', color: 'bg-amber-500 hover:bg-amber-600 text-white' },
  { id: 'quotations' as ActivePage, icon: FileCheck, labelAr: 'عرض سعر', labelEn: 'Quotation', color: 'bg-violet-500 hover:bg-violet-600 text-white' },
  { id: 'add-customer' as ActivePage, icon: Users, labelAr: 'عميل جديد', labelEn: 'New Customer', color: 'bg-cyan-500 hover:bg-cyan-600 text-white' },
  { id: 'add-supplier' as ActivePage, icon: Truck, labelAr: 'مورد جديد', labelEn: 'New Supplier', color: 'bg-orange-500 hover:bg-orange-600 text-white' },
];

export function FloatingQuickActions({ setActivePage }: FloatingQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const handleAction = (page: ActivePage) => {
    setActivePage(page);
    setIsOpen(false);
  };

  return (
    <div className={cn("fixed z-50", isAr ? "left-5 bottom-20 md:bottom-6" : "right-5 bottom-20 md:bottom-6")}>
      {/* Action buttons */}
      <div className={cn(
        "flex flex-col-reverse gap-2 mb-3 transition-all duration-300",
        isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <div
              key={action.id}
              className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Label */}
              <span className={cn(
                "text-xs font-medium bg-card text-card-foreground px-3 py-1.5 rounded-full shadow-lg border border-border whitespace-nowrap",
                isAr ? "order-2" : "order-1"
              )}>
                {isAr ? action.labelAr : action.labelEn}
              </span>
              {/* Button */}
              <Button
                size="icon"
                className={cn("w-10 h-10 rounded-full shadow-lg", action.color, isAr ? "order-1" : "order-2")}
                onClick={() => handleAction(action.id)}
              >
                <Icon className="w-4.5 h-4.5" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* Main FAB */}
      <Button
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full shadow-xl transition-all duration-300",
          isOpen
            ? "bg-destructive hover:bg-destructive/90 rotate-45"
            : "bg-primary hover:bg-primary/90"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
