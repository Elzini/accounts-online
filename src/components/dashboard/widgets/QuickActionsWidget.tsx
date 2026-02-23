import { ShoppingCart, DollarSign, UserPlus, Truck, Receipt, HandCoins, Calculator, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivePage } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface QuickActionsWidgetProps {
  setActivePage: (page: ActivePage) => void;
  canSales: boolean;
  canPurchases: boolean;
}

export function QuickActionsWidget({ setActivePage, canSales, canPurchases }: QuickActionsWidgetProps) {
  const { t } = useLanguage();
  const { permissions } = useAuth();
  const canAccounting = permissions.admin || permissions.reports;

  const actions = [
    { id: 'sales', label: t.nav_sales || 'فاتورة مبيعات', icon: DollarSign, page: 'sales' as ActivePage, enabled: canSales, gradient: 'from-emerald-500 to-emerald-600' },
    { id: 'purchases', label: t.nav_purchases || 'فاتورة مشتريات', icon: ShoppingCart, page: 'purchases' as ActivePage, enabled: canPurchases, gradient: 'from-blue-500 to-blue-600' },
    { id: 'vouchers', label: 'سند قبض/صرف', icon: Receipt, page: 'vouchers' as ActivePage, enabled: canAccounting, gradient: 'from-purple-500 to-purple-600' },
    { id: 'journal', label: 'قيد يومية', icon: Calculator, page: 'journal-entries' as ActivePage, enabled: canAccounting, gradient: 'from-indigo-500 to-indigo-600' },
    { id: 'custody', label: 'عهدة جديدة', icon: HandCoins, page: 'custody' as ActivePage, enabled: canAccounting, gradient: 'from-amber-500 to-amber-600' },
    { id: 'quotation', label: 'عرض سعر', icon: FileCheck, page: 'quotations' as ActivePage, enabled: canSales, gradient: 'from-cyan-500 to-cyan-600' },
    { id: 'add-customer', label: t.add_customer || 'عميل جديد', icon: UserPlus, page: 'add-customer' as ActivePage, enabled: canSales, gradient: 'from-teal-500 to-teal-600' },
    { id: 'add-supplier', label: t.add_supplier || 'مورد جديد', icon: Truck, page: 'add-supplier' as ActivePage, enabled: canPurchases, gradient: 'from-orange-500 to-orange-600' },
  ].filter(a => a.enabled);

  return (
    <div className="bg-card rounded-xl p-4 sm:p-6 shadow-sm border border-border">
      <h2 className="text-sm sm:text-base font-bold text-card-foreground mb-3 flex items-center gap-2">
        🚀 {t.quick_actions || 'إجراءات سريعة'}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {actions.map(action => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              onClick={() => setActivePage(action.page)}
              variant="ghost"
              className="h-auto py-3 flex flex-col items-center gap-1.5 hover:bg-muted/60 border border-transparent hover:border-border/50 rounded-lg transition-all"
            >
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-[11px] font-medium text-foreground/80 leading-tight text-center">{action.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
